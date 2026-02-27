/**
 * Tests for SMS handler wired to AI engine (post-onboarding)
 * Phase 2: After onboarding completes, messages go through besh-ai
 */

const { createSmsBeshHandler } = require('../src/routes/sms-besh');

let passed = 0, failed = 0;
function assert(condition, msg) {
  if (condition) { passed++; console.log(`✅ ${msg}`); }
  else { failed++; console.error(`❌ ${msg}`); }
}

// Mock store that simulates a fully onboarded user
function createOnboardedMockStore() {
  const conversations = [];
  let seq = 0;
  const users = {
    '+15551234567': {
      id: 'user-onboarded',
      phone: '+15551234567',
      display_name: 'Alex',
      onboarding_stage: 'complete',
      onboarding_complete: true,
      profile_json: { name: 'Alex', goal: 'run a marathon', timezone: 'America/New_York' }
    }
  };

  return {
    async getOrCreateUserByPhone(phone) {
      if (users[phone]) return users[phone];
      const newUser = {
        id: `user-${phone}`, phone, display_name: null,
        onboarding_stage: 'ask_name', onboarding_complete: false, profile_json: {}
      };
      users[phone] = newUser;
      return newUser;
    },
    async getOnboardingState(phone) {
      const user = users[phone] || await this.getOrCreateUserByPhone(phone);
      return { user, stage: user.onboarding_stage, profile: user.profile_json };
    },
    async saveOnboardingStep({ userId, phone, state, done }) {
      const user = users[phone] || { id: userId, phone };
      user.onboarding_stage = state.stage;
      user.onboarding_complete = !!done;
      user.profile_json = state.profile || {};
      users[phone] = user;
      return user;
    },
    async findConversationByMessageSid(sid) { return null; },
    async appendConversation({ userId, direction, content, meta }) {
      conversations.push({ user_id: userId, direction, content, seq: seq++ });
      return `conv-${seq}`;
    },
    // Memory store interface
    async getConversationHistory(userId, limit = 10) {
      return conversations.filter(c => c.user_id === userId).sort((a, b) => a.seq - b.seq).slice(-limit);
    },
    async getUser(userId) {
      return Object.values(users).find(u => u.id === userId) || null;
    },
    async updateUser(userId, updates) {
      const user = Object.values(users).find(u => u.id === userId);
      if (user) Object.assign(user, updates);
      return user;
    },
    _conversations: conversations
  };
}

async function runTests() {
  console.log('🧪 Besh SMS → AI Flow Tests\n');

  // 1: Onboarded user gets AI response (not onboarding flow)
  {
    const store = createOnboardedMockStore();
    const mockLLM = async (sysPrompt, msgs) => {
      return { text: "Nice work on the run! How far did you go?" };
    };

    const handler = createSmsBeshHandler({ store, llm: mockLLM });

    let responseXml = '';
    const req = {
      body: { From: '+15551234567', To: '+18001234567', Body: 'Just finished my run!', MessageSid: 'SM_ai_test_1' }
    };
    const res = {
      type: function(t) { this._type = t; return this; },
      send: function(body) { responseXml = body; return this; }
    };

    await handler(req, res);
    assert(responseXml.includes('Nice work'), 'onboarded user gets AI-generated response');
    assert(responseXml.includes('</Message>'), 'response is valid TwiML');
    assert(!responseXml.includes('Nice to meet you'), 'does NOT get onboarding greeting');
  }

  // 2: New user still gets onboarding flow
  {
    const store = createOnboardedMockStore();
    const handler = createSmsBeshHandler({ store });

    let responseXml = '';
    const req = {
      body: { From: '+15559999999', To: '+18001234567', Body: 'Hi', MessageSid: 'SM_new_user_1' }
    };
    const res = {
      type: function(t) { this._type = t; return this; },
      send: function(body) { responseXml = body; return this; }
    };

    await handler(req, res);
    assert(responseXml.includes('Nice to meet you'), 'new user gets onboarding flow');
  }

  // 3: AI response is stored in conversation history
  {
    const store = createOnboardedMockStore();
    const mockLLM = async () => ({ text: "Keep it up!" });
    const handler = createSmsBeshHandler({ store, llm: mockLLM });

    const req = {
      body: { From: '+15551234567', To: '+18001234567', Body: 'Did 5 miles today', MessageSid: 'SM_hist_1' }
    };
    const res = {
      type: function(t) { return this; },
      send: function() { return this; }
    };

    await handler(req, res);

    const history = store._conversations.filter(c => c.user_id === 'user-onboarded');
    assert(history.length >= 2, 'both inbound and outbound stored');
    const inbound = history.find(c => c.direction === 'inbound');
    const outbound = history.find(c => c.direction === 'outbound');
    assert(inbound && inbound.content === 'Did 5 miles today', 'inbound message stored');
    assert(outbound && outbound.content.includes('Keep it up'), 'AI response stored');
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
