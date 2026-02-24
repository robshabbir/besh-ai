const assert = require('assert');
const {
  classifyInboundText,
  nextOnboardingStep,
  sanitizeSmsReply
} = require('../src/services/besh-sms');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`✅ ${name}`);
  } catch (err) {
    failed++;
    console.error(`❌ ${name}: ${err.message}`);
  }
}

test('classifyInboundText returns owner when sender is owner', () => {
  const result = classifyInboundText({
    from: '+15550001111',
    to: '+15559990000',
    knownOwnerPhones: new Set(['+15550001111']),
    businessByNumber: { '+15559990000': { id: 'biz_1' } }
  });
  assert.equal(result.kind, 'owner');
});

test('classifyInboundText returns customer when texting known business number', () => {
  const result = classifyInboundText({
    from: '+15550002222',
    to: '+15559990000',
    knownOwnerPhones: new Set(),
    businessByNumber: { '+15559990000': { id: 'biz_1' } }
  });
  assert.equal(result.kind, 'customer');
  assert.equal(result.businessId, 'biz_1');
});

test('classifyInboundText returns new_user when unknown', () => {
  const result = classifyInboundText({
    from: '+15550003333',
    to: '+15558887777',
    knownOwnerPhones: new Set(),
    businessByNumber: {}
  });
  assert.equal(result.kind, 'new_user');
});

test('nextOnboardingStep moves through stages', () => {
  let state = { stage: 'ask_name', profile: {} };
  let step = nextOnboardingStep(state, 'Alex');
  assert.equal(step.state.stage, 'ask_goal');
  assert.equal(step.state.profile.name, 'Alex');

  step = nextOnboardingStep(step.state, 'Get fit');
  assert.equal(step.state.stage, 'ask_timezone');
  assert.equal(step.state.profile.goal, 'Get fit');

  step = nextOnboardingStep(step.state, 'America/New_York');
  assert.equal(step.state.stage, 'complete');
  assert.equal(step.done, true);
});

test('sanitizeSmsReply keeps responses short', () => {
  const long = 'a'.repeat(400);
  const out = sanitizeSmsReply(long, 160);
  assert(out.length <= 160);
});

console.log(`\nResults: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
