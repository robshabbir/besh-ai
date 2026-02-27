/**
 * Integration test: full SMS flow — onboard → AI conversation
 */

const { nextOnboardingStep, sanitizeSmsReply } = require('../src/services/besh-sms');
const { createBeshMemory } = require('../src/services/besh-memory');
const { createBeshAI } = require('../src/services/besh-ai');

let passed = 0, failed = 0;
function assert(condition, msg) {
  if (condition) { passed++; console.log(`✅ ${msg}`); }
  else { failed++; console.error(`❌ ${msg}`); }
}

function createMockStore() {
  const conversations = [];
  const users = new Map();
  let seq = 0;
  return {
    async getConversationHistory(userId, limit = 10) {
      return conversations.filter(c => c.user_id === userId)
        .sort((a, b) => a.seq - b.seq).slice(-limit);
    },
    async appendConversation({ userId, direction, content, meta }) {
      conversations.push({ user_id: userId, direction, content, meta_json: meta || {}, seq: seq++ });
      return `conv-${seq}`;
    },
    async getUser(userId) { return users.get(userId) || null; },
    async updateUser(userId, updates) {
      const user = users.get(userId) || { id: userId, profile_json: {} };
      Object.assign(user, updates);
      users.set(userId, user);
      return user;
    },
    _setUser(id, data) { users.set(id, data); }
  };
}

async function runTests() {
  console.log('🧪 Besh AI Integration Tests\n');

  // Full flow: onboard then AI conversation
  {
    const store = createMockStore();
    const memory = createBeshMemory({ store });
    const mockLLM = async (sysPrompt, msgs) => {
      return { text: "Nice work on the 5k! Tomorrow try adding a half mile." };
    };
    const ai = createBeshAI({ llm: mockLLM });

    // Simulate onboarding
    let state = null;
    const step1 = nextOnboardingStep(state, 'Alex');
    assert(step1.state.stage === 'ask_goal', 'onboarding: name collected');

    const step2 = nextOnboardingStep(step1.state, 'train for a 5k');
    assert(step2.state.stage === 'ask_timezone', 'onboarding: goal collected');

    const step3 = nextOnboardingStep(step2.state, 'America/New_York');
    assert(step3.done === true, 'onboarding: complete');

    // Save user as onboarded
    store._setUser('user-alex', {
      id: 'user-alex',
      display_name: step3.state.profile.name,
      profile_json: step3.state.profile,
      onboarding_complete: true
    });

    // Post-onboarding: user texts AI
    await store.appendConversation({ userId: 'user-alex', direction: 'inbound', content: 'Just finished a 5k run!' });

    const ctx = await memory.buildContext('user-alex');
    assert(ctx.userName === 'Alex', 'context has user name from onboarding');
    assert(ctx.profile.goal === 'train for a 5k', 'context has goal from onboarding');

    const intent = memory.detectIntent('Just finished a 5k run!');
    assert(intent === 'chat', 'progress report classified as chat');

    const result = await ai.generateResponse({
      context: ctx,
      userMessage: 'Just finished a 5k run!',
      intent
    });
    assert(result.response.includes('5k'), 'AI response references their activity');
    assert(result.response.length <= 320, 'AI response within SMS limit');
  }

  // Goal intent flow
  {
    const store = createMockStore();
    const memory = createBeshMemory({ store });
    const mockLLM = async (sysPrompt, msgs) => {
      assert(sysPrompt.includes('goal'), 'goal intent prompt includes goal context');
      return { text: "Got it — your new goal is to meditate 10 min daily. I'll check in on you!" };
    };
    const ai = createBeshAI({ llm: mockLLM });

    store._setUser('user-sam', {
      id: 'user-sam', display_name: 'Sam',
      profile_json: { goal: 'be mindful' }, onboarding_complete: true
    });

    const intent = memory.detectIntent('set a goal to meditate 10 minutes every day');
    assert(intent === 'goal', 'goal setting detected');

    const ctx = await memory.buildContext('user-sam');
    const result = await ai.generateResponse({ context: ctx, userMessage: 'set a goal to meditate 10 minutes every day', intent });
    assert(result.response.includes('meditate'), 'AI acknowledges the goal');
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
