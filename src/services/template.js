const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

/**
 * Load a template by name
 */
function loadTemplate(templateName) {
  const templatePath = path.join(__dirname, '../../templates', `${templateName}.json`);
  
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templateName}`);
  }
  
  const templateData = fs.readFileSync(templatePath, 'utf8');
  return JSON.parse(templateData);
}

/**
 * Replace template variables in a string
 */
function replaceVariables(text, customizations) {
  let result = text;
  
  Object.keys(customizations).forEach(key => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, customizations[key]);
  });
  
  return result;
}

/**
 * Process a template with customizations
 */
function processTemplate(templateName, customizations) {
  const template = loadTemplate(templateName);
  
  logger.info('Processing template', { templateName, customizations });
  
  // Process system prompt
  let systemPrompt = template.system_prompt;
  
  // Replace simple variables
  systemPrompt = replaceVariables(systemPrompt, customizations);
  
  // Handle list variables (auto-generated from config)
  if (template.business_config.practice_areas) {
    const practiceAreasList = template.business_config.practice_areas
      .map(area => `- ${area}`)
      .join('\n');
    systemPrompt = systemPrompt.replace(/\{\{PRACTICE_AREAS_LIST\}\}/g, practiceAreasList);
  }
  
  if (template.business_config.services) {
    const servicesList = template.business_config.services
      .map(service => `- ${service}`)
      .join('\n');
    systemPrompt = systemPrompt.replace(/\{\{SERVICES_LIST\}\}/g, servicesList);
  }
  
  if (template.business_config.appointment_types) {
    const appointmentTypesList = template.business_config.appointment_types
      .map(type => `- ${type}`)
      .join('\n');
    systemPrompt = systemPrompt.replace(/\{\{APPOINTMENT_TYPES_LIST\}\}/g, appointmentTypesList);
  }
  
  if (template.business_config.providers) {
    const providersList = template.business_config.providers
      .map(provider => `- ${provider}`)
      .join('\n');
    systemPrompt = systemPrompt.replace(/\{\{PROVIDERS_LIST\}\}/g, providersList);
  }
  
  // Process business config
  const processedBusinessConfig = JSON.parse(
    replaceVariables(JSON.stringify(template.business_config), customizations)
  );
  
  return {
    templateName: template.template_name,
    templateVersion: template.template_version,
    industry: template.industry,
    businessConfig: processedBusinessConfig,
    systemPrompt: systemPrompt
  };
}

/**
 * List available templates
 */
function listTemplates() {
  const templatesDir = path.join(__dirname, '../../templates');
  const files = fs.readdirSync(templatesDir);
  return files
    .filter(file => file.endsWith('.json') && file !== 'package.json')
    .map(file => {
      const name = file.replace('.json', '');
      const template = loadTemplate(name);
      return {
        name,
        displayName: template.template_name,
        industry: template.industry
      };
    });
}

module.exports = {
  loadTemplate,
  processTemplate,
  listTemplates,
  replaceVariables
};
