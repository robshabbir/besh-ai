const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const TEMPLATES_DIR = path.join(__dirname, '../../templates');

/**
 * Load a template JSON file
 * @param {string} templateName - Name of template (without .json extension)
 * @returns {Object} Template object
 */
function loadTemplate(templateName) {
  const templatePath = path.join(TEMPLATES_DIR, `${templateName}.json`);
  
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templateName}`);
  }
  
  try {
    const templateData = fs.readFileSync(templatePath, 'utf8');
    const template = JSON.parse(templateData);
    
    logger.debug('Template loaded', { templateName, industry: template.industry });
    return template;
  } catch (error) {
    logger.error('Failed to parse template', { templateName, error: error.message });
    throw new Error(`Invalid template file: ${templateName}`);
  }
}

/**
 * List all available templates
 * @returns {Array} Array of template metadata
 */
function listAvailableTemplates() {
  try {
    const files = fs.readdirSync(TEMPLATES_DIR);
    
    const templates = files
      .filter(file => file.endsWith('.json'))
      .filter(file => !['package.json', 'config.json'].includes(file))
      .map(file => {
        const name = file.replace('.json', '');
        try {
          const template = loadTemplate(name);
          return {
            name,
            displayName: template.template_name,
            industry: template.industry,
            version: template.template_version,
            description: template.description || `${template.template_name} template`
          };
        } catch (error) {
          logger.warn('Could not load template metadata', { file, error: error.message });
          return null;
        }
      })
      .filter(Boolean); // Remove nulls
    
    logger.info('Templates listed', { count: templates.length });
    return templates;
  } catch (error) {
    logger.error('Failed to list templates', { error: error.message });
    throw error;
  }
}

/**
 * Replace template variables in text
 * @param {string} text - Text with {{VARIABLE}} placeholders
 * @param {Object} replacements - Key-value pairs for replacement
 * @returns {string} Text with variables replaced
 */
function replaceVariables(text, replacements) {
  if (!text || typeof text !== 'string') return text;
  
  let result = text;
  
  Object.keys(replacements).forEach(key => {
    const value = replacements[key] || '';
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, value);
  });
  
  return result;
}

/**
 * Generate list strings for array variables
 * @param {Array} items - Array of items
 * @param {string} format - Format: 'bullet' or 'numbered'
 * @returns {string} Formatted list
 */
function formatList(items, format = 'bullet') {
  if (!Array.isArray(items) || items.length === 0) return '';
  
  if (format === 'numbered') {
    return items.map((item, idx) => `${idx + 1}. ${item}`).join('\n');
  } else {
    return items.map(item => `- ${item}`).join('\n');
  }
}

/**
 * Merge template with business-specific configuration
 * @param {string} templateName - Template name to load
 * @param {Object} businessConfig - Business-specific configuration
 * @returns {Object} Complete configuration with merged system prompt
 */
function mergeTemplateWithConfig(templateName, businessConfig) {
  try {
    const template = loadTemplate(templateName);
    
    logger.info('Merging template with business config', {
      templateName,
      businessName: businessConfig.BUSINESS_NAME || businessConfig.name
    });

    // Build replacement map from business config
    const replacements = {
      BUSINESS_NAME: businessConfig.BUSINESS_NAME || businessConfig.name || 'the business',
      BUSINESS_HOURS: businessConfig.BUSINESS_HOURS || businessConfig.hours || 'Monday-Friday 9am-5pm',
      OWNER_NAME: businessConfig.OWNER_NAME || businessConfig.owner || 'the owner',
      EMERGENCY_PHONE: businessConfig.EMERGENCY_PHONE || businessConfig.emergency_line || businessConfig.ownerPhone || '',
      CITY_STATE: businessConfig.CITY_STATE || businessConfig.location || '',
      SERVICE_AREA: businessConfig.SERVICE_AREA || businessConfig.service_area || businessConfig.CITY_STATE || 'local area',
      LICENSE_NUMBER: businessConfig.LICENSE_NUMBER || businessConfig.license_number || '',
      ADDRESS: businessConfig.ADDRESS || businessConfig.address || '',
      WEBSITE: businessConfig.WEBSITE || businessConfig.website || '',
      EMAIL: businessConfig.EMAIL || businessConfig.email || '',
      PHONE: businessConfig.PHONE || businessConfig.phone || '',
      // Additional common variables
      ...businessConfig.customVariables || {}
    };

    // Process system prompt with variable replacement
    let systemPrompt = template.system_prompt;
    systemPrompt = replaceVariables(systemPrompt, replacements);

    // Handle list variables (services, practice areas, etc.)
    const listReplacements = {};
    
    if (template.business_config?.services || businessConfig.services) {
      const services = businessConfig.services || template.business_config.services;
      listReplacements.SERVICES_LIST = formatList(services);
    }
    
    if (template.business_config?.practice_areas || businessConfig.practice_areas) {
      const areas = businessConfig.practice_areas || template.business_config.practice_areas;
      listReplacements.PRACTICE_AREAS_LIST = formatList(areas);
    }
    
    if (template.business_config?.appointment_types || businessConfig.appointment_types) {
      const types = businessConfig.appointment_types || template.business_config.appointment_types;
      listReplacements.APPOINTMENT_TYPES_LIST = formatList(types);
    }
    
    if (template.business_config?.providers || businessConfig.providers) {
      const providers = businessConfig.providers || template.business_config.providers;
      listReplacements.PROVIDERS_LIST = formatList(providers);
    }

    if (template.business_config?.menu_categories || businessConfig.menu_categories) {
      const categories = businessConfig.menu_categories || template.business_config.menu_categories;
      listReplacements.MENU_CATEGORIES_LIST = formatList(categories);
    }

    // Apply list replacements
    Object.keys(listReplacements).forEach(key => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      systemPrompt = systemPrompt.replace(regex, listReplacements[key]);
    });

    // Merge business config with template defaults
    const mergedBusinessConfig = {
      ...template.business_config,
      ...businessConfig,
      // Override with processed values
      name: replacements.BUSINESS_NAME,
      hours: replacements.BUSINESS_HOURS,
      owner: replacements.OWNER_NAME,
      emergency_line: replacements.EMERGENCY_PHONE,
      location: replacements.CITY_STATE,
      service_area: replacements.SERVICE_AREA,
      license_number: replacements.LICENSE_NUMBER,
      address: replacements.ADDRESS,
      website: replacements.WEBSITE,
      email: replacements.EMAIL,
      phone: replacements.PHONE
    };

    // Build final config object
    const finalConfig = {
      templateName: template.template_name,
      templateVersion: template.template_version,
      industry: template.industry,
      systemPrompt,
      businessConfig: mergedBusinessConfig,
      metadata: {
        templateFile: templateName,
        mergedAt: new Date().toISOString(),
        faqCount: template.faq?.length || 0,
        sampleConversations: template.sample_conversations?.length || 0
      }
    };

    logger.info('Template merged successfully', {
      templateName,
      businessName: mergedBusinessConfig.name,
      systemPromptLength: systemPrompt.length
    });

    return finalConfig;
  } catch (error) {
    logger.error('Failed to merge template with config', {
      error: error.message,
      templateName
    });
    throw error;
  }
}

/**
 * Validate business configuration has required fields
 * @param {string} templateName - Template name
 * @param {Object} businessConfig - Business configuration to validate
 * @returns {Object} Validation result { valid: boolean, missing: [] }
 */
function validateBusinessConfig(templateName, businessConfig) {
  try {
    const template = loadTemplate(templateName);
    const required = template.customization_variables || {};
    const missing = [];

    Object.keys(required).forEach(key => {
      const value = businessConfig[key] || businessConfig[key.toLowerCase()];
      if (!value || value === '') {
        missing.push({
          field: key,
          description: required[key]
        });
      }
    });

    const valid = missing.length === 0;
    
    logger.info('Business config validated', {
      templateName,
      valid,
      missingCount: missing.length
    });

    return {
      valid,
      missing,
      requiredCount: Object.keys(required).length
    };
  } catch (error) {
    logger.error('Failed to validate business config', {
      error: error.message,
      templateName
    });
    throw error;
  }
}

/**
 * Get template customization variables (for UI forms)
 * @param {string} templateName - Template name
 * @returns {Object} Customization variables with descriptions
 */
function getTemplateVariables(templateName) {
  try {
    const template = loadTemplate(templateName);
    return {
      templateName: template.template_name,
      industry: template.industry,
      variables: template.customization_variables || {},
      defaultConfig: template.business_config || {}
    };
  } catch (error) {
    logger.error('Failed to get template variables', {
      error: error.message,
      templateName
    });
    throw error;
  }
}

module.exports = {
  loadTemplate,
  listAvailableTemplates,
  mergeTemplateWithConfig,
  validateBusinessConfig,
  getTemplateVariables,
  replaceVariables,
  formatList
};
