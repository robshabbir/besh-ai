/**
 * Tests for goal persistence — when AI detects goal intent,
 * goals are stored in besh_goals and referenced in conversations
 */

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
  const goals = [];
  let seq = 0;
  return {
    async getConversationHistory(userId, limit = 10) {
      return conversations.filter(c => c.user_id === userId).sort((a,b) => a.seq - b.seq).slice(-limit);
    },
    async appendConversation({ userId, direction, content, meta }) {
      conversations.push({ user_id: userId, direction, content, meta_json: meta || {}, seq: seq++ });
    },
    async getUser(userId) { return users.get(userId) || null; },
    async updateUser(userId, updates) {
      const user = users.get(userId) || { id: userId, profile_json: {} };
      Object.assign(user, updates);
      users.set(userId, user);
      return user;
    },
    // Goal methods
    async createGoal({ userId, title, cadence }) {
      const goal = { id: `goal-${goals.length}`, user_id: userId, title, cadence, status: 'active', created_at: new Date().toISOString() };
      goals.push(goal);
      return goal;
    },
    async getActiveGoals(userId) {
      return goals.filter(g => g.user_id === userId && g.status === 'active');
    },
    async updateGoal(goalId, updates) {
      const goal = goals.find(g => g.id === goalId);
      if (goal) Object.assign(goal, updates);
      return goal;
    },
    async completeGoal(goalId) {
      const goal = goals.find(g => g.id === goalId);
      if (goal) goal.status = 'done';
      return goal;
    },
    _setUser(id, data) { users.set(id, data); },
    _goals: goals
  };
}

async function runTests() {
  console.log('🧪 Besh Goal Tracking Tests\n');

  // 1: Memory service includes active goals in context
  {
    const store = createMockStore();
    const memory = createBeshMemory({ store });
    store._setUser('user-1', {
      id: 'user-1', display_name: 'Alex',
      profile_json: { goal: 'run a marathon' }, onboarding_complete: true
    });
    await store.createGoal({ userId: 'user-1', title: 'Run 3x this week', cadence: 'weekly' });
    await store.createGoal({ userId: 'user-1', title: 'Drink 8 glasses of water', cadence: 'daily' });

    const ctx = await memory.buildContext('user-1');
    assert(ctx.goals && ctx.goals.length === 2, 'context includes active goals');
    assert(ctx.goals[0].title === 'Run 3x this week', 'first goal title correct');
  }

  // 2: AI system prompt includes goals
  {
    const ai = createBeshAI();
    const prompt = ai.buildSystemPrompt({
      userName: 'Alex',
      profile: { goal: 'run a marathon' },
      intent: 'chat',
      goals: [
        { title: 'Run 3x this week', cadence: 'weekly', status: 'active' },
        { title: 'Drink 8 glasses of water', cadence: 'daily', status: 'active' }
      ]
    });
    assert(prompt.includes('Run 3x this week'), 'prompt includes goal 1');
    assert(prompt.includes('Drink 8 glasses'), 'prompt includes goal 2');
  }

  // 3: Goal intent triggers goal creation
  {
    const store = createMockStore();
    const memory = createBeshMemory({ store });

    const intent = memory.detectIntent('set a goal to run 5 miles every day');
    assert(intent === 'goal', 'goal intent detected');

    // Extract goal from message
    const goalText = memory.extractGoalText('set a goal to run 5 miles every day');
    assert(goalText === 'run 5 miles every day', 'extracts goal text');
  }

  // 4: Extract goal from various phrasings
  {
    const memory = createBeshMemory({ store: createMockStore() });

    assert(memory.extractGoalText('my goal is to read 20 pages daily') === 'read 20 pages daily', 'extracts "my goal is to..."');
    assert(memory.extractGoalText('I want to meditate every morning') === 'meditate every morning', 'extracts "I want to..."');
    assert(memory.extractGoalText('set a goal to drink more water') === 'drink more water', 'extracts "set a goal to..."');
    assert(memory.extractGoalText('new goal: exercise 30 min daily') === 'exercise 30 min daily', 'extracts "new goal:..."');
  }

  // 5: Check-in references goals
  {
    const ai = createBeshAI();
    const prompt = ai.buildSystemPrompt({
      userName: 'Alex',
      profile: {},
      intent: 'checkin',
      goals: [{ title: 'Run 3x this week', cadence: 'weekly', status: 'active' }]
    });
    assert(prompt.includes('Run 3x this week'), 'checkin prompt includes goals');
    assert(prompt.includes('checkin') || prompt.includes('check-in') || prompt.includes('progress'), 'checkin prompt has progress context');
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
