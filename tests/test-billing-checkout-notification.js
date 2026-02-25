/**
 * TDD: billing checkout notification
 *
 * Tests handleCheckoutCompleted sends a welcome SMS to the owner phone
 * (collected via Stripe phone_number_collection) from the provisioned
 * business number once the tenant is set up.
 *
 * Scenarios:
 *  1. Happy path — phone present, provisioning succeeds → SMS sent ✅
 *  2. No customer phone — provisioning succeeds → no SMS, no crash ✅
 *  3. Provisioning fails — phone present → no SMS (no business number yet) ✅
 *  4. Tenant already exists — phone present → no SMS (re-activation only) ✅
 */

const assert = require('assert');

async function run() {
  process.env.STRIPE_SECRET_KEY = 'sk_test_PLACEHOLDER';
  process.env.BASE_URL = 'https://app.calva.ai';

  const dbPath = require.resolve('../src/db');
  const notificationsPath = require.resolve('../src/services/notifications');
  const provisioningPath = require.resolve('../src/services/twilio-provisioning');
  const templatePath = require.resolve('../src/services/template-loader');
  const billingPath = require.resolve('../src/routes/billing');

  const origDb = require.cache[dbPath];
  const origNotifications = require.cache[notificationsPath];
  const origProvisioning = require.cache[provisioningPath];
  const origTemplate = require.cache[templatePath];

  try {
    // -----------------------------------------------------------------------
    // Scenario 1: Happy path — phone present, provisioning succeeds → SMS sent
    // -----------------------------------------------------------------------
    {
      const sentSms = [];

      require.cache[dbPath] = {
        exports: {
          getAllTenants: async () => [],
          createTenant: async () => 99,
          updateTenant: async () => {}
        }
      };
      require.cache[notificationsPath] = {
        exports: {
          sendSMS: async (to, from, body) => {
            sentSms.push({ to, from, body });
            return { success: true, messageSid: 'SM_happy' };
          }
        }
      };
      require.cache[provisioningPath] = {
        exports: {
          provisionPhoneNumberForTenant: async () => ({
            phoneNumber: '+12125559999',
            locality: 'New York',
            region: 'NY'
          })
        }
      };
      require.cache[templatePath] = {
        exports: {
          loadTemplate: () => ({
            systemPrompt: 'You are {businessName}.',
            greeting: 'Hello!',
            knowledgeBase: '',
            businessHours: {}
          })
        }
      };

      delete require.cache[billingPath];
      const { handleCheckoutCompleted } = require(billingPath).__testHooks;

      const session = {
        customer: 'cus_happy',
        subscription: 'sub_happy',
        customer_details: { email: 'owner@acme.com', phone: '+19175550001' },
        customer_email: 'owner@acme.com',
        metadata: { business_name: 'Acme Plumbing', industry: 'plumbing', plan: 'pro' }
      };

      await handleCheckoutCompleted(session);

      assert.strictEqual(sentSms.length, 1, 'Expected 1 SMS to be sent');
      assert.strictEqual(sentSms[0].to, '+19175550001', 'SMS should go to customer phone');
      assert.strictEqual(sentSms[0].from, '+12125559999', 'SMS should come from provisioned number');
      assert.ok(sentSms[0].body.includes('Acme Plumbing'), 'Body should include business name');
      assert.ok(sentSms[0].body.includes('+12125559999'), 'Body should include provisioned number');
      assert.ok(sentSms[0].body.includes('app.calva.ai'), 'Body should include dashboard URL');

      console.log('✅ Scenario 1 passed: happy path SMS sent correctly');
    }

    // -----------------------------------------------------------------------
    // Scenario 2: No customer phone → no SMS, no crash
    // -----------------------------------------------------------------------
    {
      const sentSms = [];

      require.cache[dbPath] = {
        exports: {
          getAllTenants: async () => [],
          createTenant: async () => 100,
          updateTenant: async () => {}
        }
      };
      require.cache[notificationsPath] = {
        exports: {
          sendSMS: async (to, from, body) => {
            sentSms.push({ to, from, body });
          }
        }
      };
      require.cache[provisioningPath] = {
        exports: {
          provisionPhoneNumberForTenant: async () => ({
            phoneNumber: '+12125558888',
            locality: 'New York',
            region: 'NY'
          })
        }
      };
      require.cache[templatePath] = {
        exports: {
          loadTemplate: () => ({
            systemPrompt: 'You are {businessName}.',
            greeting: 'Hello!',
            knowledgeBase: '',
            businessHours: {}
          })
        }
      };

      delete require.cache[billingPath];
      const { handleCheckoutCompleted } = require(billingPath).__testHooks;

      const session = {
        customer: 'cus_nophone',
        subscription: 'sub_nophone',
        customer_details: { email: 'owner@acme.com', phone: null },
        customer_email: 'owner@acme.com',
        metadata: { business_name: 'Silent Corp', industry: 'general', plan: 'starter' }
      };

      await handleCheckoutCompleted(session);

      assert.strictEqual(sentSms.length, 0, 'No SMS should be sent when customer phone is missing');

      console.log('✅ Scenario 2 passed: no phone → no SMS, no crash');
    }

    // -----------------------------------------------------------------------
    // Scenario 3: Provisioning fails → no SMS (no business number to send from)
    // -----------------------------------------------------------------------
    {
      const sentSms = [];

      require.cache[dbPath] = {
        exports: {
          getAllTenants: async () => [],
          createTenant: async () => 101,
          updateTenant: async () => {}
        }
      };
      require.cache[notificationsPath] = {
        exports: {
          sendSMS: async (to, from, body) => {
            sentSms.push({ to, from, body });
          }
        }
      };
      require.cache[provisioningPath] = {
        exports: {
          provisionPhoneNumberForTenant: async () => {
            throw new Error('Twilio provisioning unavailable');
          }
        }
      };
      require.cache[templatePath] = {
        exports: {
          loadTemplate: () => ({
            systemPrompt: 'You are {businessName}.',
            greeting: 'Hello!',
            knowledgeBase: '',
            businessHours: {}
          })
        }
      };

      delete require.cache[billingPath];
      const { handleCheckoutCompleted } = require(billingPath).__testHooks;

      const session = {
        customer: 'cus_noprovision',
        subscription: 'sub_noprovision',
        customer_details: { email: 'owner@corp.com', phone: '+15555550002' },
        customer_email: 'owner@corp.com',
        metadata: { business_name: 'Corp LLC', industry: 'general', plan: 'starter' }
      };

      // Should not throw even though provisioning fails
      await handleCheckoutCompleted(session);

      assert.strictEqual(sentSms.length, 0, 'No SMS should be sent when provisioning fails');

      console.log('✅ Scenario 3 passed: provisioning failure → no SMS, no throw');
    }

    // -----------------------------------------------------------------------
    // Scenario 4: Tenant already exists → re-activate only, no SMS
    // -----------------------------------------------------------------------
    {
      const sentSms = [];
      const updatedTenants = [];

      require.cache[dbPath] = {
        exports: {
          getAllTenants: async () => ([
            {
              id: 77,
              active: false,
              config: { stripeCustomerId: 'cus_returning' }
            }
          ]),
          updateTenant: async (id, patch) => {
            updatedTenants.push({ id, patch });
          }
        }
      };
      require.cache[notificationsPath] = {
        exports: {
          sendSMS: async (to, from, body) => {
            sentSms.push({ to, from, body });
          }
        }
      };
      require.cache[provisioningPath] = {
        exports: {
          provisionPhoneNumberForTenant: async () => ({ phoneNumber: '+12125550000' })
        }
      };
      require.cache[templatePath] = {
        exports: {
          loadTemplate: () => ({
            systemPrompt: '',
            greeting: '',
            knowledgeBase: '',
            businessHours: {}
          })
        }
      };

      delete require.cache[billingPath];
      const { handleCheckoutCompleted } = require(billingPath).__testHooks;

      const session = {
        customer: 'cus_returning',
        subscription: 'sub_returning',
        customer_details: { email: 'owner@returning.com', phone: '+15555550003' },
        customer_email: 'owner@returning.com',
        metadata: { business_name: 'Returning Biz', industry: 'general', plan: 'pro' }
      };

      await handleCheckoutCompleted(session);

      assert.strictEqual(sentSms.length, 0, 'No SMS for re-activating existing tenant');
      assert.strictEqual(updatedTenants.length, 1, 'Existing tenant should be re-activated');
      assert.deepStrictEqual(updatedTenants[0].patch, { active: true });

      console.log('✅ Scenario 4 passed: returning tenant re-activated, no SMS');
    }

    console.log('\n✅ test-billing-checkout-notification: all 4 scenarios passed');

  } finally {
    // Restore all original module cache entries
    if (origDb) require.cache[dbPath] = origDb; else delete require.cache[dbPath];
    if (origNotifications) require.cache[notificationsPath] = origNotifications; else delete require.cache[notificationsPath];
    if (origProvisioning) require.cache[provisioningPath] = origProvisioning; else delete require.cache[provisioningPath];
    if (origTemplate) require.cache[templatePath] = origTemplate; else delete require.cache[templatePath];

    const billingPathResolved = require.resolve('../src/routes/billing');
    delete require.cache[billingPathResolved];
  }
}

run().catch(err => {
  console.error('❌ test-billing-checkout-notification FAILED:', err.message);
  process.exit(1);
});
