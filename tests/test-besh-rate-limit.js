/**
 * Rate Limiting Tests — Besh SMS Handler
 * Verifies: daily/monthly limits enforced for free tier, bypassed for paid
 */
const assert = require('assert');
const { createSmsBeshHandler } = require('../src/routes/sms-besh');

function createMockStore(overrides = {}) {
  const defaultUser = {
    id: 'u1',
    phone: '+15551234567',
    display_name: 'Test',
    onboarding_complete: true,
    subscription_tier: 'free',
    subscription_status: 'active',
    messages_today: 0,
    last_message_date: new Date().toISOString().split('T')[0],
    messages_this_month: 0,
    profile_json: { name: 'Test', goal: 'grow', timezone: 'UTC' },
    ...overrides
  };

  return {
    findConversationByMessageSid: async () => null,
    getOnboardingState: async () => ({
      user: defaultUser,
      stage: 'complete',
      profile: defaultUser.profile_json
    }),
    getOrCreateUserByPhone: async () => defaultUser,
    appendConversation: async () => {},
    getActiveGoals: async () => [],
    getRecentConversations: async () => [],
    getUserPreferences: async () => ({}),
    updateUserMessageCount: async () => {},
    createGoal: async () => {},
    getUser: async () => ({ id: "u1", display_name: "Test", profile_json: { name: "Test", goal: "grow", timezone: "UTC" } }),
    getConversationHistory: async () => [],
  };
}

function createMockReqRes(body = 'hello') {
  const req = {
    body: { From: '+15551234567', To: '+19297557288', Body: body, MessageSid: 'SM' + Date.now() }
  };
  let sentXml = '';
  const res = {
    type: () => res,
    send: (xml) => { sentXml = xml; return res; },
    getSentXml: () => sentXml
  };
  return { req, res };
}

async function testDailyLimitBlocked() {
  const store = createMockStore({ messages_today: 30, last_message_date: new Date().toISOString().split('T')[0] });
  const handler = createSmsBeshHandler({ store, llm: {} });
  const { req, res } = createMockReqRes('hey there');
  await handler(req, res);
  const xml = res.getSentXml();
  assert(xml.includes('daily limit'), `Expected daily limit message, got: ${xml}`);
  assert(!xml.includes('hiccup'), 'Should not be error response');
  console.log('✅ test_daily_limit_blocked');
}

async function testMonthlyLimitBlocked() {
  const store = createMockStore({ messages_today: 5, messages_this_month: 300 });
  const handler = createSmsBeshHandler({ store, llm: {} });
  const { req, res } = createMockReqRes('hey');
  await handler(req, res);
  const xml = res.getSentXml();
  assert(xml.includes('monthly limit'), `Expected monthly limit message, got: ${xml}`);
  console.log('✅ test_monthly_limit_blocked');
}

async function testPaidUserBypassesLimit() {
  const store = createMockStore({
    messages_today: 30,
    last_message_date: new Date().toISOString().split('T')[0],
    subscription_tier: 'pro'
  });
  // Need a mock AI that returns something
  const mockLlm = async () => ({ text: "AI reply" });
  const handler = createSmsBeshHandler({ store, llm: mockLlm });
  const { req, res } = createMockReqRes('hey');
  await handler(req, res);
  const xml = res.getSentXml();
  assert(!xml.includes('daily limit'), `Paid user should bypass limit, got: ${xml}`);
  assert(!xml.includes('monthly limit'), `Paid user should bypass limit, got: ${xml}`);
  console.log('✅ test_paid_user_bypasses_limit');
}

async function testFreeUserUnderLimitAllowed() {
  const store = createMockStore({ messages_today: 5, messages_this_month: 10 });
  const mockLlm = async () => ({ text: "AI reply here" });
  const handler = createSmsBeshHandler({ store, llm: mockLlm });
  const { req, res } = createMockReqRes('hey');
  await handler(req, res);
  const xml = res.getSentXml();
  assert(!xml.includes('daily limit'), `Under-limit user should not be blocked, got: ${xml}`);
  assert(!xml.includes('monthly limit'), `Under-limit user should not be blocked, got: ${xml}`);
  console.log('✅ test_free_user_under_limit_allowed');
}

async function testCounterIncrement() {
  let updatedWith = null;
  const store = createMockStore({ messages_today: 5, messages_this_month: 50 });
  store.updateUserMessageCount = async (id, data) => { updatedWith = data; };
  const mockLlm = async () => ({ text: "reply" });
  const handler = createSmsBeshHandler({ store, llm: mockLlm });
  const { req, res } = createMockReqRes('hey');
  await handler(req, res);
  // Give background update a tick
  await new Promise(r => setTimeout(r, 50));
  assert(updatedWith !== null, 'updateUserMessageCount should have been called');
  assert.strictEqual(updatedWith.messages_today, 6, `Expected 6, got ${updatedWith.messages_today}`);
  assert.strictEqual(updatedWith.messages_this_month, 51, `Expected 51, got ${updatedWith.messages_this_month}`);
  console.log('✅ test_counter_increment');
}

async function testDayResetCounter() {
  const store = createMockStore({ messages_today: 25, last_message_date: '2025-01-01' }); // old date
  const mockLlm = async () => ({ text: "reply" });
  const handler = createSmsBeshHandler({ store, llm: mockLlm });
  const { req, res } = createMockReqRes('hey');
  await handler(req, res);
  const xml = res.getSentXml();
  assert(!xml.includes('daily limit'), 'Day should have reset, not blocked');
  console.log('✅ test_day_reset_counter');
}

(async () => {
  try {
    await testDailyLimitBlocked();
    await testMonthlyLimitBlocked();
    await testPaidUserBypassesLimit();
    await testFreeUserUnderLimitAllowed();
    await testCounterIncrement();
    await testDayResetCounter();
    console.log('\n✅ All rate limit tests passed (6/6)');
  } catch (err) {
    console.error('❌ FAIL:', err.message);
    process.exit(1);
  }
})();
