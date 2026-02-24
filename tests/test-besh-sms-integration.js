const express = require('express');
const request = require('supertest');
const smsBeshRouter = require('../src/routes/sms-besh');

// Mock store to avoid DB connection
const mockStore = {
  getOnboardingState: async () => ({
    user: { id: 'user_123' },
    stage: 'ask_name',
    profile: {}
  }),
  saveOnboardingStep: async () => ({ id: 'user_123' }),
  appendConversation: async () => 'msg_123',
  getOrCreateUserByPhone: async () => ({ id: 'user_123' })
};

// Create app with router and mock store
const app = express();
app.use(express.urlencoded({ extended: true }));

// Re-create router with mock store
const router = smsBeshRouter.createSmsBeshRouter({ store: mockStore });
app.use('/api', router);

async function runTests() {
  console.log('🧪 Testing Besh SMS Integration');
  let passed = 0;
  let failed = 0;

  try {
    // Test 1: Reject invalid signature in production
    process.env.NODE_ENV = 'production';
    process.env.SKIP_TWILIO_AUTH = 'false';
    process.env.TWILIO_AUTH_TOKEN = 'mock_token';

    const res1 = await request(app)
      .post('/api/sms/besh')
      .send({ From: '+15551234567', Body: 'Hi' })
      .set('X-Twilio-Signature', 'invalid_signature');
    
    if (res1.status === 403) {
      console.log('✅ Validation rejects invalid signature');
      passed++;
    } else {
      console.error(`❌ Validation failed: Expected 403, got ${res1.status}`);
      failed++;
    }
  } catch (err) {
    console.error(`❌ Test 1 error: ${err.message}`);
    failed++;
  }

  try {
    // Test 2: Bypass validation in test mode
    process.env.NODE_ENV = 'test';
    // Reset other env vars just in case, though NODE_ENV=test takes precedence in my code
    process.env.SKIP_TWILIO_AUTH = 'false'; 
    
    const res2 = await request(app)
      .post('/api/sms/besh')
      .send({ From: '+15551234567', Body: 'Hi' });

    if (res2.status === 200 && res2.text.includes('<Response>')) {
      console.log('✅ Validation bypassed in test mode');
      passed++;
    } else {
      console.error(`❌ Test mode failed: Expected 200, got ${res2.status}`);
      failed++;
    }
  } catch (err) {
    console.error(`❌ Test 2 error: ${err.message}`);
    failed++;
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
