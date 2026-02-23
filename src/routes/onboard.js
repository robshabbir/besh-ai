const express = require('express');
const path = require('path');
const crypto = require('crypto');
const db = require('../db');
const { mergeTemplateWithConfig, listAvailableTemplates, getTemplateVariables } = require('../services/template-loader');
const { provisionPhoneNumberForTenant, searchAvailableNumbers } = require('../services/twilio-provisioning');
const { rateLimit } = require('../middleware/rateLimit');
const { validateOnboardingData } = require('../middleware/validation');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * Sanitize text to prevent XSS attacks
 */
function sanitizeText(text) {
  if (typeof text !== 'string') return text;
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Recursively sanitize all strings in an object
 */
function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') {
    return typeof obj === 'string' ? sanitizeText(obj) : obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = sanitizeObject(value);
  }
  return sanitized;
}

/**
 * Serve onboarding page
 */
router.get('/', async (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/onboard.html'));
});

/**
 * Get available industry templates
 */
router.get('/templates', rateLimit(20, 60000), async (req, res) => {
  try {
    const templates = listAvailableTemplates();
    res.json({ templates });
  } catch (error) {
    logger.error('Failed to list templates', { error: error.message });
    res.status(500).json({ error: 'Failed to load templates' });
  }
});

/**
 * Get template customization variables
 */
router.get('/templates/:name/variables', rateLimit(20, 60000), async (req, res) => {
  try {
    const templateInfo = getTemplateVariables(req.params.name);
    res.json(templateInfo);
  } catch (error) {
    logger.error('Failed to get template variables', { error: error.message });
    res.status(500).json({ error: 'Template not found' });
  }
});

/**
 * Search available phone numbers
 */
router.get('/phone-numbers/search', rateLimit(10, 60000), async (req, res) => {
  try {
    const { areaCode, country = 'US', limit = 5 } = req.query;
    const numbers = await searchAvailableNumbers(areaCode, country, parseInt(limit));
    res.json({ numbers });
  } catch (error) {
    logger.error('Failed to search phone numbers', { error: error.message });
    res.status(500).json({ error: 'Failed to search phone numbers' });
  }
});

/**
 * Create new tenant account with automatic phone number provisioning
 */
router.post('/create', rateLimit(5, 60000), validateOnboardingData, async (req, res) => {
  try {
    let { 
      businessName, 
      industry, 
      templateName,
      businessConfig,
      areaCode,
      contactEmail,
      contactPhone 
    } = req.body;
    
    // Sanitize all user inputs
    businessName = sanitizeText(businessName);
    industry = sanitizeText(industry);
    templateName = sanitizeText(templateName);
    businessConfig = sanitizeObject(businessConfig);
    contactEmail = sanitizeText(contactEmail);
    contactPhone = sanitizeText(contactPhone);

    // Validate required fields
    if (!businessName || !templateName || !businessConfig) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['businessName', 'templateName', 'businessConfig']
      });
    }

    // Merge template with business config
    const processedConfig = mergeTemplateWithConfig(templateName, businessConfig);

    // Check if user already has a tenant from signup (avoid double-creation)
    let tenantId = req.session?.tenantId;
    let apiKey;

    if (tenantId) {
      // Update existing tenant from signup
      const existingTenant = await db.getTenantById(tenantId);
      if (existingTenant) {
        apiKey = existingTenant.api_key;
        await db.updateTenant(tenantId, {
          name: businessName,
          config_json: { ...processedConfig, setupComplete: true }
        });
        // Update industry
        try {
          await db.updateTenant(tenantId, { industry: industry || processedConfig.industry });
        } catch (e) { /* ignore */ }
        logger.info('Existing tenant updated during onboarding', { tenantId, businessName });
      } else {
        tenantId = null; // Fall through to create new
      }
    }

    if (!tenantId) {
      // No session tenant — create new one (legacy/API path)
      apiKey = 'calva_' + crypto.randomBytes(32).toString('hex');
      tenantId = await db.createTenant(
        businessName,
        industry || processedConfig.industry,
        null,
        processedConfig,
        apiKey
      );
      logger.info('New tenant created', { tenantId, businessName, industry: processedConfig.industry });
    }

    // Auto-provision phone number
    let phoneInfo = null;
    try {
      phoneInfo = await provisionPhoneNumberForTenant(tenantId, areaCode);
      logger.info('Phone number auto-provisioned', {
        tenantId,
        phoneNumber: phoneInfo.phoneNumber
      });
    } catch (phoneError) {
      logger.error('Phone provisioning failed during onboarding', {
        error: phoneError.message,
        tenantId
      });
      // Don't fail the whole onboarding - tenant can add phone later
    }

    res.json({
      success: true,
      tenant_id: tenantId,
      api_key: apiKey,
      phone_number: phoneInfo?.phoneNumber || null,
      phone_info: phoneInfo ? {
        phoneNumber: phoneInfo.phoneNumber,
        locality: phoneInfo.locality,
        region: phoneInfo.region,
        voiceUrl: phoneInfo.voiceUrl
      } : null,
      message: phoneInfo 
        ? `Account created successfully! Your phone number is ${phoneInfo.phoneNumber}`
        : 'Account created successfully! Please configure your phone number manually.',
      next_steps: phoneInfo ? [
        'Save your API key (you won\'t see it again)',
        `Your AI receptionist number: ${phoneInfo.phoneNumber}`,
        'Set up call forwarding (see /setup-forwarding)',
        'Test your AI receptionist by calling the number'
      ] : [
        'Save your API key (you won\'t see it again)',
        'Configure your phone number in the dashboard',
        'Test your AI receptionist'
      ]
    });
  } catch (error) {
    logger.error('Onboarding failed', { error: error.message, stack: error.stack });
    res.status(500).json({ 
      error: 'Failed to create account',
      message: error.message 
    });
  }
});

/**
 * Assign phone number to tenant (demo - in production would integrate with Twilio)
 */
router.post('/assign-phone', rateLimit(10, 60000), async (req, res) => {
  try {
    const { api_key, phone_number } = req.body;

    if (!api_key || !phone_number) {
      return res.status(400).json({ 
        error: 'api_key and phone_number required' 
      });
    }

    const tenant = await db.getTenantByApiKey(api_key);
    
    if (!tenant) {
      return res.status(404).json({ error: 'Invalid API key' });
    }

    // Check if phone number already in use
    const existingTenant = await db.getTenantByPhoneNumber(phone_number);
    if (existingTenant && existingTenant.id !== tenant.id) {
      return res.status(400).json({ 
        error: 'Phone number already assigned to another tenant' 
      });
    }

    // Update tenant with phone number
    await db.updateTenant(tenant.id, { phone_number });

    logger.info('Phone number assigned', { tenantId: tenant.id, phone_number });

    res.json({
      success: true,
      message: 'Phone number configured successfully',
      phone_number,
      webhook_url: `${process.env.BASE_URL || 'https://your-domain.com'}/api/voice`
    });
  } catch (error) {
    logger.error('Phone assignment failed', { error: error.message });
    res.status(500).json({ error: 'Failed to assign phone number' });
  }
});

module.exports = router;
