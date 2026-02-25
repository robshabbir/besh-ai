const assert = require('assert');

async function run() {
  process.env.STRIPE_SECRET_KEY = 'sk_test_PLACEHOLDER';

  const dbPath = require.resolve('../src/db');
  const notificationsPath = require.resolve('../src/services/notifications');
  const billingPath = require.resolve('../src/routes/billing');

  const originalDbModule = require.cache[dbPath];
  const originalNotificationsModule = require.cache[notificationsPath];

  const mockDb = {
    exports: {
      getAllTenants: async () => ([
        {
          id: 42,
          phone_number: '+12125550000',
          config: {
            stripeCustomerId: 'cus_123',
            businessConfig: {
              ownerPhone: '+19175551234',
              name: 'Acme Plumbing'
            }
          }
        }
      ])
    }
  };

  const mockNotifications = {
    sentPayload: null,
    exports: {
      sendSMS: async (to, from, body) => {
        mockNotifications.sentPayload = { to, from, body };
        return { success: true, messageSid: 'SM123' };
      }
    }
  };

  try {
    require.cache[dbPath] = mockDb;
    require.cache[notificationsPath] = mockNotifications;
    delete require.cache[billingPath];

    const billingRouter = require(billingPath);

    await billingRouter.__testHooks.handlePaymentFailed({
      id: 'in_1',
      customer: 'cus_123',
      amount_due: 9900,
      hosted_invoice_url: 'https://stripe.test/in_1'
    });

    assert(mockNotifications.sentPayload, 'Expected failed payment SMS to be sent');
    assert.equal(mockNotifications.sentPayload.to, '+19175551234');
    assert.equal(mockNotifications.sentPayload.from, '+12125550000');
    assert(mockNotifications.sentPayload.body.includes('Payment failed'), 'SMS should mention payment failed');
    assert(mockNotifications.sentPayload.body.includes('$99.00'), 'SMS should include amount due');

    mockNotifications.sentPayload = null;
    await billingRouter.__testHooks.handlePaymentFailed({
      id: 'in_2',
      customer: 'cus_does_not_exist',
      amount_due: 4900
    });

    assert.equal(mockNotifications.sentPayload, null, 'Should not send SMS when tenant is not found');
  } finally {
    if (originalDbModule) require.cache[dbPath] = originalDbModule;
    else delete require.cache[dbPath];

    if (originalNotificationsModule) require.cache[notificationsPath] = originalNotificationsModule;
    else delete require.cache[notificationsPath];

    delete require.cache[billingPath];
  }

  console.log('✅ test-billing-payment-failed passed');
}

run().catch((error) => {
  console.error('❌ test-billing-payment-failed failed:', error.message);
  process.exit(1);
});
