#!/usr/bin/env node

/**
 * Seed script - Creates demo tenant "Mike's Plumbing NYC"
 */

require('dotenv').config();
const crypto = require('crypto');
const db = require('./src/db');
const { migrate } = require('./src/db/migrate');
const { processTemplate } = require('./src/services/template');

console.log('🌱 Seeding database...\n');

// Initialize database
db.init();
migrate();

// Check if demo tenant already exists
const existingTenants = db.getAllTenants();
const demoTenant = existingTenants.find(t => t.name === "Mike's Plumbing NYC");

if (demoTenant) {
  console.log('✅ Demo tenant already exists:');
  console.log(`   Name: ${demoTenant.name}`);
  console.log(`   Phone: ${demoTenant.phone_number || 'Not configured'}`);
  console.log(`   API Key: ${demoTenant.api_key}`);
  console.log(`   ID: ${demoTenant.id}`);
  db.close();
  process.exit(0);
}

// Create demo tenant
try {
  const customizations = {
    BUSINESS_NAME: "Mike's Plumbing NYC",
    OWNER_NAME: "Mike",
    EMERGENCY_PHONE: "+1-917-555-9999",
    CITY_STATE: "New York, NY",
    SERVICE_AREA: "Manhattan, Brooklyn, and Queens",
    BUSINESS_HOURS: "Monday through Saturday, 7am to 6pm",
    LICENSE_NUMBER: "NYC-PLB-12345"
  };

  const config = processTemplate('plumber', customizations);
  const apiKey = 'calva_demo_' + crypto.randomBytes(16).toString('hex');

  // Use existing Twilio phone number from .env
  const phoneNumber = process.env.TWILIO_PHONE_NUMBER || null;

  const tenantId = db.createTenant(
    "Mike's Plumbing NYC",
    'plumbing_services',
    phoneNumber,
    config,
    apiKey
  );

  console.log('✅ Demo tenant created successfully!\n');
  console.log('   Tenant ID:', tenantId);
  console.log('   Business Name: Mike\'s Plumbing NYC');
  console.log('   Industry: Plumbing Services');
  console.log('   Phone Number:', phoneNumber || 'Not configured (set in .env)');
  console.log('   API Key:', apiKey);
  console.log('\n📋 Save this API key to access the dashboard!');
  console.log('\n🎯 Next steps:');
  console.log('   1. Start server: npm start');
  console.log('   2. Visit: http://localhost:3000/admin/dashboard');
  console.log('   3. Login with API key above');
  console.log('   4. Configure Twilio webhook: http://your-domain.com/api/voice');

} catch (error) {
  console.error('❌ Seed failed:', error.message);
  process.exit(1);
} finally {
  db.close();
}
