const assert = require('assert');
const {
  classifyInboundText,
  nextOnboardingStep,
  sanitizeSmsReply
} = require('../src/services/besh-sms');
const {
  createBeshSmsStore
} = require('../src/services/besh-sms-store');
const {
  createSmsBeshHandler,
  getSmsBeshMetrics
} = require('../src/routes/sms-besh');

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

async function asyncTest(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`✅ ${name}`);
  } catch (err) {
    failed++;
    console.error(`❌ ${name}: ${err.message}`);
  }
}

async function run() {
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

  test('nextOnboardingStep handles goal correction at timezone step', () => {
    const state = {
      stage: 'ask_timezone',
      profile: { name: 'Alex', goal: 'Get fit' }
    };

    const step = nextOnboardingStep(state, 'actually make that build my sales pipeline');
    assert.equal(step.state.stage, 'ask_timezone');
    assert.equal(step.state.profile.goal, 'build my sales pipeline');
    assert.equal(step.done, false);
    assert(step.response.toLowerCase().includes('timezone'));
  });

  test('nextOnboardingStep returns a useful summary after completion', () => {
    const state = {
      stage: 'complete',
      profile: { name: 'Alex', goal: 'Book more appointments', timezone: 'America/New_York' }
    };

    const step = nextOnboardingStep(state, 'summary');
    assert.equal(step.done, true);
    assert(step.response.includes('Alex'));
    assert(step.response.includes('Book more appointments'));
    assert(step.response.includes('America/New_York'));
  });

  test('sanitizeSmsReply keeps responses short', () => {
    const long = 'a'.repeat(400);
    const out = sanitizeSmsReply(long, 160);
    assert(out.length <= 160);
  });

  await asyncTest('createBeshSmsStore persists and reads onboarding state', async () => {
    const calls = [];
    const fakeDb = {
      from(table) {
        const ctx = {
          _table: table,
          _payload: null,
          _filters: [],
          select() { return this; },
          eq(key, value) { this._filters.push([key, value]); return this; },
          single: async function () {
            if (this._table === 'besh_users') {
              const phoneFilter = this._filters.find(([k]) => k === 'phone');
              if (phoneFilter && phoneFilter[1] === '+15550001111') {
                return {
                  data: {
                    id: 'user_1',
                    phone: '+15550001111',
                    onboarding_stage: 'ask_goal',
                    onboarding_complete: false,
                    profile_json: { name: 'Alex' }
                  },
                  error: null
                };
              }
              return { data: null, error: { code: 'PGRST116' } };
            }
            return { data: null, error: null };
          },
          insert(payload) {
            this._payload = payload;
            calls.push({ op: 'insert', table: this._table, payload });
            return {
              select: () => ({
                single: async () => ({ data: { id: 'user_new', ...payload }, error: null })
              })
            };
          },
          upsert(payload) {
            this._payload = payload;
            calls.push({ op: 'upsert', table: this._table, payload });
            return {
              select: () => ({
                single: async () => ({ data: { id: 'user_1', ...payload }, error: null })
              })
            };
          }
        };
        return ctx;
      }
    };

    const store = createBeshSmsStore(fakeDb);
    const user = await store.getOrCreateUserByPhone('+15550001111');
    assert.equal(user.id, 'user_1');
    const state = await store.getOnboardingState('+15550001111');
    assert.equal(state.stage, 'ask_goal');
    assert.equal(state.profile.name, 'Alex');

    await store.saveOnboardingStep({
      userId: 'user_1',
      phone: '+15550001111',
      state: { stage: 'ask_timezone', profile: { name: 'Alex', goal: 'Get fit' } },
      done: false
    });

    assert(calls.some(c => c.op === 'upsert' && c.table === 'besh_users'));
  });

  await asyncTest('sms handler uses store and returns TwiML', async () => {
    const entries = [];
    const fakeStore = {
      async getOnboardingState() {
        return { user: { id: 'user_1', onboarding_complete: false }, stage: 'ask_name', profile: {} };
      },
      async saveOnboardingStep(payload) {
        entries.push({ type: 'save', payload });
        return { id: 'user_1' };
      },
      async findConversationByMessageSid() {
        return null;
      },
      async appendConversation(payload) {
        entries.push({ type: 'conversation', payload });
      }
    };

    const handler = createSmsBeshHandler({ store: fakeStore });

    const req = { body: { MessageSid: 'SM_1', From: '+1 (555) 000-1111', To: '+1 (555) 999-0000', Body: 'Alex' } };
    let contentType = '';
    let body = '';
    const res = {
      type(v) { contentType = v; return this; },
      send(v) { body = v; return this; }
    };

    await handler(req, res);

    assert.equal(contentType, 'text/xml');
    assert(body.includes('<Response>'));
    assert(entries.some(e => e.type === 'save'));
    assert(entries.filter(e => e.type === 'conversation').length >= 2);
  });

  await asyncTest('sms handler ignores duplicate MessageSid', async () => {
    let appendCount = 0;
    const fakeStore = {
      async findConversationByMessageSid() {
        return { id: 'existing' };
      },
      async getOnboardingState() {
        throw new Error('should not be called');
      },
      async saveOnboardingStep() {
        throw new Error('should not be called');
      },
      async appendConversation() {
        appendCount += 1;
      }
    };

    const handler = createSmsBeshHandler({ store: fakeStore });
    let body = '';
    const res = {
      type() { return this; },
      send(v) { body = v; return this; }
    };

    await handler({ body: { MessageSid: 'SM_DUP', From: '+15550001111', To: '+15559990000', Body: 'hi' } }, res);
    assert(body.includes('already processed'));
    assert.equal(appendCount, 0);
  });

  await asyncTest('sms handler exposes metrics shape', async () => {
    const metrics = getSmsBeshMetrics();
    assert.equal(typeof metrics.inbound, 'number');
    assert.equal(typeof metrics.outbound, 'number');
    assert.equal(typeof metrics.duplicatesIgnored, 'number');
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

run();