/**
 * Integration: SMS handler creates goals when goal intent detected
 */

const { createSmsBeshHandler } = require('../src/routes/sms-besh');

let passed = 0, failed = 0;
function assert(condition, msg) {
  if (condition) { passed++; console.log(`✅ ${msg}`); }
  else { failed++; console.error(`❌ ${msg}`); }
}

function createGoalAwareStore() {
  const conversations = [];
  const goals = [];
  let seq = 0;
  const users = {
    '+15551234567': {
      id: 'user-goals', phone: '+15551234567', display_name: 'Alex',
      onboarding_stage: 'complete', onboarding_complete: true,
      profile_json: { name: 'Alex', goal: 'be healthy', timezone: 'America/New_York' }
    }
  };

  return {
    async getOrCreateUserByPhone(phone) {
      const norm = phone.replace(/\D/g, '');
      const key = '+' + (norm.startsWith('1') ? norm : '1' + norm);
      if (users[key]) return users[key];
      users[key] = { id: `user-${key}`, phone: key, onboarding_stage: 'ask_name', onboarding_complete: false, profile_json: {} };
      return users[key];
    },
    async getOnboardingState(phone) {
      const user = await this.getOrCreateUserByPhone(phone);
      return { user, stage: user.onboarding_stage, profile: user.profile_json };
    },
    async saveOnboardingStep({ userId, phone, state, done }) {
      return users[Object.keys(users).find(k => users[k].id === userId)] || {};
    },
    async findConversationByMessageSid() { return null; },
    async appendConversation({ userId, direction, content, meta }) {
      conversations.push({ user_id: userId, direction, content, seq: seq++ });
    },
    async getConversationHistory(userId, limit = 10) {
      return conversations.filter(c => c.user_id === userId).sort((a,b) => a.seq - b.seq).slice(-limit);
    },
    async getUser(userId) {
      return Object.values(users).find(u => u.id === userId) || null;
    },
    async updateUser(userId, updates) {
      const user = Object.values(users).find(u => u.id === userId);
      if (user) Object.assign(user, updates);
      return user;
    },
    async getActiveGoals(userId) {
      return goals.filter(g => g.user_id === userId && g.status === 'active');
    },
    async createGoal({ userId, title, cadence }) {
      const goal = { id: `goal-${goals.length}`, user_id: userId, title, cadence: cadence || null, status: 'active' };
      goals.push(goal);
      return goal;
    },
    _goals: goals,
    _conversations: conversations
  };
}

async function runTests() {
  console.log('🧪 Besh SMS Goal Creation Tests\n');

  // 1: Goal intent creates a goal in the store
  {
    const store = createGoalAwareStore();
    const mockLLM = async (sysPrompt) => {
      assert(sysPrompt.includes('run 5 miles'), 'LLM prompt includes the new goal');
      return { text: "Love that goal! I'll help you stay on track with running 5 miles every day." };
    };
    const handler = createSmsBeshHandler({ store, llm: mockLLM });

    const req = { body: { From: '+15551234567', To: '+18001234567', Body: 'set a goal to run 5 miles every day', MessageSid: 'SM_goal_1' } };
    const res = { type() { return this; }, send() { return this; } };

    await handler(req, res);

    assert(store._goals.length === 1, 'goal was created in store');
    assert(store._goals[0].title === 'run 5 miles every day', 'goal title extracted correctly');
    assert(store._goals[0].user_id === 'user-goals', 'goal linked to correct user');
  }

  // 2: Non-goal messages don't create goals
  {
    const store = createGoalAwareStore();
    const mockLLM = async () => ({ text: "Nice work!" });
    const handler = createSmsBeshHandler({ store, llm: mockLLM });

    const req = { body: { From: '+15551234567', To: '+18001234567', Body: 'I just ran 3 miles today', MessageSid: 'SM_no_goal' } };
    const res = { type() { return this; }, send() { return this; } };

    await handler(req, res);
    assert(store._goals.length === 0, 'no goal created for non-goal message');
  }

  // 3: Multiple goals accumulate
  {
    const store = createGoalAwareStore();
    const mockLLM = async () => ({ text: "Got it!" });
    const handler = createSmsBeshHandler({ store, llm: mockLLM });

    const msgs = [
      'set a goal to run 3 times this week',
      'my goal is to drink 8 glasses of water daily',
      'I want to read 20 pages every night'
    ];

    for (let i = 0; i < msgs.length; i++) {
      const req = { body: { From: '+15551234567', To: '+18001234567', Body: msgs[i], MessageSid: `SM_multi_${i}` } };
      const res = { type() { return this; }, send() { return this; } };
      await handler(req, res);
    }

    assert(store._goals.length === 3, 'all 3 goals created');
    assert(store._goals[0].title === 'run 3 times this week', 'goal 1 correct');
    assert(store._goals[1].title === 'drink 8 glasses of water daily', 'goal 2 correct');
    assert(store._goals[2].title === 'read 20 pages every night', 'goal 3 correct');
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
