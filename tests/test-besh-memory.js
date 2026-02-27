const { createBeshMemory } = require('../src/services/besh-memory');

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
        .sort((a, b) => a.seq - b.seq)
        .slice(-limit);
    },
    async appendConversation({ userId, direction, content, meta }) {
      const id = `conv-${conversations.length}`;
      conversations.push({
        id, user_id: userId, direction, content,
        meta_json: meta || {}, created_at: new Date().toISOString(), seq: seq++
      });
      return id;
    },
    async getUser(userId) { return users.get(userId) || null; },
    async updateUser(userId, updates) {
      const user = users.get(userId) || { id: userId, profile_json: {}, onboarding_complete: true };
      Object.assign(user, updates);
      users.set(userId, user);
      return user;
    },
    _setUser(id, data) { users.set(id, data); }
  };
}

async function runTests() {
  console.log('🧪 Besh Memory Service Tests\n');

  // 1: Build context
  {
    const store = createMockStore();
    const memory = createBeshMemory({ store });
    store._setUser('user-1', {
      id: 'user-1', display_name: 'Alex',
      profile_json: { goal: 'run a marathon', timezone: 'America/New_York' },
      onboarding_complete: true
    });
    await store.appendConversation({ userId: 'user-1', direction: 'inbound', content: 'Hey, how should I train today?' });
    await store.appendConversation({ userId: 'user-1', direction: 'outbound', content: 'Try a 3-mile easy run!' });
    await store.appendConversation({ userId: 'user-1', direction: 'inbound', content: 'Done! Felt great.' });

    const ctx = await memory.buildContext('user-1');
    assert(ctx.userName === 'Alex', 'buildContext returns user name');
    assert(ctx.profile.goal === 'run a marathon', 'buildContext returns profile goal');
    assert(ctx.recentMessages.length === 3, 'buildContext returns recent messages');
    assert(ctx.recentMessages[0].direction === 'inbound', 'messages in chronological order');
    assert(ctx.recentMessages[2].content === 'Done! Felt great.', 'latest message is last');
  }

  // 2: Empty history
  {
    const store = createMockStore();
    const memory = createBeshMemory({ store });
    store._setUser('user-2', { id: 'user-2', display_name: 'Sam', profile_json: { goal: 'learn guitar' }, onboarding_complete: true });
    const ctx = await memory.buildContext('user-2');
    assert(ctx.userName === 'Sam', 'empty history still returns name');
    assert(ctx.recentMessages.length === 0, 'empty history returns empty messages');
    assert(ctx.profile.goal === 'learn guitar', 'profile goal preserved');
  }

  // 3: Format for LLM
  {
    const store = createMockStore();
    const memory = createBeshMemory({ store });
    store._setUser('user-3', { id: 'user-3', display_name: 'Jo', profile_json: {} });
    await store.appendConversation({ userId: 'user-3', direction: 'inbound', content: 'Hi there' });
    await store.appendConversation({ userId: 'user-3', direction: 'outbound', content: 'Hey Jo!' });
    const formatted = await memory.formatForLLM('user-3');
    assert(Array.isArray(formatted), 'formatForLLM returns array');
    assert(formatted.length === 2, 'formatForLLM returns 2 messages');
    assert(formatted[0].role === 'user', 'inbound maps to user role');
    assert(formatted[1].role === 'assistant', 'outbound maps to assistant role');
    assert(formatted[0].content === 'Hi there', 'content preserved');
  }

  // 4: Context window limit
  {
    const store = createMockStore();
    const memory = createBeshMemory({ store, contextWindow: 3 });
    store._setUser('user-4', { id: 'user-4', display_name: 'Pat', profile_json: {} });
    for (let i = 0; i < 10; i++) {
      await store.appendConversation({ userId: 'user-4', direction: 'inbound', content: `Message ${i}` });
    }
    const ctx = await memory.buildContext('user-4');
    assert(ctx.recentMessages.length === 3, 'context window limits messages to 3');
    assert(ctx.recentMessages[2].content === 'Message 9', 'most recent messages kept');
  }

  // 5: Intent detection
  {
    const memory = createBeshMemory({ store: createMockStore() });
    assert(memory.detectIntent('remind me to drink water at 3pm') === 'reminder', 'detects reminder intent');
    assert(memory.detectIntent('set a goal to read 20 pages daily') === 'goal', 'detects goal intent');
    assert(memory.detectIntent('how am I doing this week?') === 'checkin', 'detects checkin intent');
    assert(memory.detectIntent("what's the weather like?") === 'chat', 'defaults to chat');
    assert(memory.detectIntent('my new goal is to meditate') === 'goal', 'detects goal with "my goal"');
    assert(memory.detectIntent('check in on my progress') === 'checkin', 'detects checkin with "check in"');
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
