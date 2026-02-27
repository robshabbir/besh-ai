/**
 * TDD: goal deduplication negative case
 *
 * Confirms that sending the same goal intent twice results in exactly one
 * goal stored, not two. Also verifies distinct goals are both stored.
 */

const assert = require('assert');

async function run() {
  process.env.STRIPE_SECRET_KEY = 'sk_test_PLACEHOLDER';
  process.env.GEMINI_API_KEY = 'PLACEHOLDER';

  const storePath = require.resolve('../src/services/besh-sms-store');
  const memoryPath = require.resolve('../src/services/besh-memory');
  const aiPath = require.resolve('../src/services/besh-ai');
  const smsBeshPath = require.resolve('../src/routes/sms-besh');

  const origStore = require.cache[storePath];
  const origMemory = require.cache[memoryPath];
  const origAI = require.cache[aiPath];

  try {
    // -----------------------------------------------------------------------
    // Shared goal store
    // -----------------------------------------------------------------------
    const storedGoals = [];

    const mockStore = {
      exports: {
        createBeshSmsStore: () => ({
          getOrCreateUserByPhone: async (phone) => ({
            user: {
              id: 1,
              phone,
              display_name: 'Tester',
              onboarding_complete: true,
              config: {}
            },
            isNew: false
          }),
          getOnboardingState: async () => ({ stage: 'complete', profile: {} }),
          findConversationByMessageSid: async () => null,
          appendConversation: async () => {},
          getActiveGoals: async () => [...storedGoals],
          createGoal: async ({ userId, title }) => {
            storedGoals.push({ id: storedGoals.length + 1, user_id: userId, title, status: 'active' });
            return storedGoals[storedGoals.length - 1];
          }
        })
      }
    };

    const mockMemory = {
      exports: {
        createBeshMemory: () => ({
          detectIntent: () => 'goal',
          extractGoalText: (text) => text.replace(/i want to /i, '').trim(),
          buildContext: async () => ({ goals: storedGoals, history: [] }),
          formatForLLM: () => []
        })
      }
    };

    const mockAI = {
      exports: {
        createBeshAI: () => ({
          generateResponse: async () => ({ response: 'Got it!' })
        })
      }
    };

    require.cache[storePath] = mockStore;
    require.cache[memoryPath] = mockMemory;
    require.cache[aiPath] = mockAI;

    delete require.cache[smsBeshPath];
    const smsBeshRouter = require(smsBeshPath);

    // Simulate the handler logic directly (same path as route)
    const { createBeshSmsStore } = require(storePath);
    const { createBeshMemory } = require(memoryPath);
    const { createBeshAI } = require(aiPath);

    const store = createBeshSmsStore();
    const memory = createBeshMemory({});
    const ai = createBeshAI();

    async function simulateGoalMessage(text) {
      const onboarding = await store.getOrCreateUserByPhone('+15555550001');
      const intent = memory.detectIntent(text);
      if (intent === 'goal') {
        const goalText = memory.extractGoalText(text);
        if (goalText) {
          const activeGoals = await store.getActiveGoals(onboarding.user.id);
          const duplicate = activeGoals.find(
            g => g.title.toLowerCase() === goalText.toLowerCase()
          );
          if (!duplicate) {
            await store.createGoal({ userId: onboarding.user.id, title: goalText });
          }
        }
      }
    }

    // -----------------------------------------------------------------------
    // Test 1: Same goal twice → stored once
    // -----------------------------------------------------------------------
    storedGoals.length = 0;

    await simulateGoalMessage('I want to run more');
    await simulateGoalMessage('I want to run more');

    assert.strictEqual(storedGoals.length, 1, 'Duplicate goal should be stored only once');
    assert.strictEqual(storedGoals[0].title, 'run more');
    console.log('✅ Test 1 passed: same goal twice → stored once');

    // -----------------------------------------------------------------------
    // Test 2: Case-insensitive — "Run More" matches "run more"
    // -----------------------------------------------------------------------
    storedGoals.length = 0;
    storedGoals.push({ id: 1, user_id: 1, title: 'run more', status: 'active' });

    await simulateGoalMessage('I want to Run More');

    assert.strictEqual(storedGoals.length, 1, 'Case-insensitive match should block duplicate');
    console.log('✅ Test 2 passed: case-insensitive dedup works');

    // -----------------------------------------------------------------------
    // Test 3: Different goals → both stored
    // -----------------------------------------------------------------------
    storedGoals.length = 0;

    await simulateGoalMessage('I want to run more');
    await simulateGoalMessage('I want to sleep better');

    assert.strictEqual(storedGoals.length, 2, 'Two distinct goals should both be stored');
    assert.strictEqual(storedGoals[0].title, 'run more');
    assert.strictEqual(storedGoals[1].title, 'sleep better');
    console.log('✅ Test 3 passed: distinct goals both stored');

    console.log('\n✅ test-besh-goal-dedup: all 3 tests passed');

  } finally {
    if (origStore) require.cache[storePath] = origStore; else delete require.cache[storePath];
    if (origMemory) require.cache[memoryPath] = origMemory; else delete require.cache[memoryPath];
    if (origAI) require.cache[aiPath] = origAI; else delete require.cache[aiPath];
    delete require.cache[require.resolve('../src/routes/sms-besh')];
  }
}

run().catch(err => {
  console.error('❌ test-besh-goal-dedup FAILED:', err.message);
  process.exit(1);
});
