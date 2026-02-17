#!/usr/bin/env node

/**
 * AI Receptionist Template Processor
 * 
 * Loads industry templates and replaces customization variables
 * with business-specific values.
 * 
 * Usage:
 *   const { processTemplate } = require('./template-processor');
 *   const config = processTemplate('law-firm', {
 *     FIRM_NAME: 'Smith & Associates',
 *     BUSINESS_HOURS: 'Monday-Friday 9am-5pm',
 *     ...
 *   });
 */

const fs = require('fs');
const path = require('path');

/**
 * Load a template by name
 * @param {string} templateName - Template filename without .json extension
 * @returns {object} Template object
 */
function loadTemplate(templateName) {
  const templatePath = path.join(__dirname, `${templateName}.json`);
  
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }
  
  const templateData = fs.readFileSync(templatePath, 'utf8');
  return JSON.parse(templateData);
}

/**
 * Replace template variables in a string
 * @param {string} text - Text containing {{VARIABLES}}
 * @param {object} customizations - Key-value pairs for replacement
 * @returns {string} Processed text
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
 * @param {string} templateName - Template name (e.g., 'law-firm', 'medical-office')
 * @param {object} customizations - Business-specific values
 * @returns {object} Processed configuration ready for server
 */
function processTemplate(templateName, customizations) {
  const template = loadTemplate(templateName);
  
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
  
  if (template.business_config.languages) {
    const languagesList = template.business_config.languages.join(', ');
    systemPrompt = systemPrompt.replace(/\{\{LANGUAGES_LIST\}\}/g, languagesList);
  }
  
  // Process FAQ
  const processedFaq = template.faq.map(item => ({
    question: item.question,
    answer: replaceVariables(item.answer, customizations)
  }));
  
  // Process business config
  const processedBusinessConfig = JSON.parse(
    replaceVariables(JSON.stringify(template.business_config), customizations)
  );
  
  return {
    templateName: template.template_name,
    templateVersion: template.template_version,
    industry: template.industry,
    businessConfig: processedBusinessConfig,
    systemPrompt: systemPrompt,
    sampleConversations: template.sample_conversations,
    faq: processedFaq,
    integrationNotes: template.integration_notes,
    compliance: template.industry_compliance
  };
}

/**
 * Validate that all required variables are provided
 * @param {string} templateName - Template name
 * @param {object} customizations - Provided customizations
 * @returns {object} { valid: boolean, missing: string[] }
 */
function validateCustomizations(templateName, customizations) {
  const template = loadTemplate(templateName);
  const requiredVars = Object.keys(template.customization_variables || {});
  
  const providedVars = Object.keys(customizations);
  const missing = requiredVars.filter(varName => {
    // Skip auto-generated list variables
    if (varName.endsWith('_LIST')) return false;
    return !providedVars.includes(varName);
  });
  
  return {
    valid: missing.length === 0,
    missing: missing,
    required: requiredVars
  };
}

/**
 * List available templates
 * @returns {string[]} Array of template names
 */
function listTemplates() {
  const files = fs.readdirSync(__dirname);
  return files
    .filter(file => file.endsWith('.json') && file !== 'package.json')
    .map(file => file.replace('.json', ''));
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--help') {
    console.log(`
AI Receptionist Template Processor

Usage:
  node template-processor.js list
  node template-processor.js validate <template-name>
  node template-processor.js process <template-name> <customizations.json>

Examples:
  # List available templates
  node template-processor.js list
  
  # Validate template structure
  node template-processor.js validate law-firm
  
  # Process template with customizations
  node template-processor.js process law-firm ./my-firm-config.json
`);
    process.exit(0);
  }
  
  const command = args[0];
  
  switch (command) {
    case 'list':
      console.log('Available templates:');
      listTemplates().forEach(name => {
        const template = loadTemplate(name);
        console.log(`  - ${name} (${template.template_name})`);
      });
      break;
      
    case 'validate':
      if (args.length < 2) {
        console.error('Error: Template name required');
        process.exit(1);
      }
      const templateName = args[1];
      try {
        const template = loadTemplate(templateName);
        console.log(`✅ Template '${templateName}' is valid JSON`);
        console.log(`   Name: ${template.template_name}`);
        console.log(`   Version: ${template.template_version}`);
        console.log(`   Industry: ${template.industry}`);
        console.log(`   Required variables:`, Object.keys(template.customization_variables || {}).length);
      } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
      }
      break;
      
    case 'process':
      if (args.length < 3) {
        console.error('Error: Template name and customizations file required');
        process.exit(1);
      }
      const tplName = args[1];
      const customFile = args[2];
      
      try {
        const customizations = JSON.parse(fs.readFileSync(customFile, 'utf8'));
        const validation = validateCustomizations(tplName, customizations);
        
        if (!validation.valid) {
          console.error('❌ Missing required variables:', validation.missing);
          console.error('   Required:', validation.required);
          process.exit(1);
        }
        
        const result = processTemplate(tplName, customizations);
        console.log(JSON.stringify(result, null, 2));
      } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
      }
      break;
      
    default:
      console.error(`Unknown command: ${command}`);
      console.error('Run with --help for usage information');
      process.exit(1);
  }
}

// Export for use as module
module.exports = {
  loadTemplate,
  processTemplate,
  validateCustomizations,
  listTemplates,
  replaceVariables
};
