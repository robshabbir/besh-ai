const validator = require('validator');
const logger = require('../utils/logger');

// Maximum lengths for various fields
const MAX_LENGTHS = {
  message: 2000,
  businessName: 200,
  greeting: 500,
  knowledgeBase: 50000, // 50KB max
  contactEmail: 254,
  contactPhone: 20,
  address: 500,
  notes: 2000
};

/**
 * Sanitize text input to prevent XSS
 * Escapes HTML special characters
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
 * Sanitize an object recursively
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
 * Validate string length
 */
function validateLength(value, maxLength, fieldName) {
  if (typeof value !== 'string') {
    return { valid: true };
  }
  
  if (value.length > maxLength) {
    return {
      valid: false,
      error: `${fieldName} exceeds maximum length of ${maxLength} characters`
    };
  }
  
  return { valid: true };
}

/**
 * Validate email
 */
function validateEmail(email) {
  if (!email) return { valid: true }; // Optional field
  
  if (!validator.isEmail(email)) {
    return {
      valid: false,
      error: 'Invalid email format'
    };
  }
  
  return { valid: true };
}

/**
 * Validate phone number (basic)
 */
function validatePhone(phone) {
  if (!phone) return { valid: true }; // Optional field
  
  // Basic validation: allow +, digits, spaces, hyphens, parentheses
  if (!/^[\d\s\-\+\(\)]+$/.test(phone)) {
    return {
      valid: false,
      error: 'Invalid phone number format'
    };
  }
  
  const digits = phone.replace(/[\s\-\(\)]/g, '');
  if (digits.length < 10 || digits.length > 15) {
    return {
      valid: false,
      error: 'Phone number must be 10-15 digits'
    };
  }
  
  return { valid: true };
}

/**
 * Middleware: Validate and sanitize chat message
 */
function validateChatMessage(req, res, next) {
  const { message } = req.body;
  
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'Message required' });
  }
  
  const lengthCheck = validateLength(message, MAX_LENGTHS.message, 'Message');
  if (!lengthCheck.valid) {
    return res.status(400).json({ error: lengthCheck.error });
  }
  
  // Sanitize message
  req.body.message = sanitizeText(message);
  
  next();
}

/**
 * Middleware: Validate and sanitize knowledge base update
 */
function validateKnowledgeBase(req, res, next) {
  const { knowledgeBase } = req.body;
  
  console.log('[VALIDATION] validateKnowledgeBase called, input:', knowledgeBase?.substring(0, 50));
  
  if (knowledgeBase !== undefined) {
    const lengthCheck = validateLength(knowledgeBase, MAX_LENGTHS.knowledgeBase, 'Knowledge base');
    if (!lengthCheck.valid) {
      return res.status(400).json({ error: lengthCheck.error });
    }
    
    // Sanitize
    const sanitized = sanitizeText(knowledgeBase);
    console.log('[VALIDATION] Sanitized:', sanitized.substring(0, 50));
    req.body.knowledgeBase = sanitized;
  }
  
  next();
}

/**
 * Middleware: Validate and sanitize tenant settings
 */
function validateTenantSettings(req, res, next) {
  const { settings } = req.body;
  
  if (!settings) {
    return res.status(400).json({ error: 'Settings required' });
  }
  
  // Validate greeting length
  if (settings.greeting !== undefined) {
    const lengthCheck = validateLength(settings.greeting, MAX_LENGTHS.greeting, 'Greeting');
    if (!lengthCheck.valid) {
      return res.status(400).json({ error: lengthCheck.error });
    }
  }
  
  // Validate business name
  if (settings.businessConfig?.name) {
    const lengthCheck = validateLength(settings.businessConfig.name, MAX_LENGTHS.businessName, 'Business name');
    if (!lengthCheck.valid) {
      return res.status(400).json({ error: lengthCheck.error });
    }
  }
  
  // Sanitize all string fields recursively
  req.body.settings = sanitizeObject(settings);
  
  next();
}

/**
 * Middleware: Validate onboarding data
 */
function validateOnboardingData(req, res, next) {
  const { businessName, contactEmail, contactPhone } = req.body;
  
  // Validate business name
  if (!businessName || typeof businessName !== 'string' || businessName.trim().length === 0) {
    return res.status(400).json({ error: 'Business name required' });
  }
  
  const nameCheck = validateLength(businessName, MAX_LENGTHS.businessName, 'Business name');
  if (!nameCheck.valid) {
    return res.status(400).json({ error: nameCheck.error });
  }
  
  // Validate email if provided
  if (contactEmail) {
    const emailCheck = validateEmail(contactEmail);
    if (!emailCheck.valid) {
      return res.status(400).json({ error: emailCheck.error });
    }
  }
  
  // Validate phone if provided
  if (contactPhone) {
    const phoneCheck = validatePhone(contactPhone);
    if (!phoneCheck.valid) {
      return res.status(400).json({ error: phoneCheck.error });
    }
  }
  
  // Sanitize business name
  req.body.businessName = sanitizeText(businessName);
  
  // Sanitize business config
  if (req.body.businessConfig) {
    req.body.businessConfig = sanitizeObject(req.body.businessConfig);
  }
  
  next();
}

module.exports = {
  sanitizeText,
  sanitizeObject,
  validateLength,
  validateEmail,
  validatePhone,
  validateChatMessage,
  validateKnowledgeBase,
  validateTenantSettings,
  validateOnboardingData,
  MAX_LENGTHS
};
