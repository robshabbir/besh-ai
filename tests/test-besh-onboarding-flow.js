// Path: /Users/rifat/clawd/revenue/ai-receptionist/tests/test-besh-onboarding-flow.js

const { nextOnboardingStep } = require('../src/services/besh-sms');
const assert = require('assert');

let passed = 0, failed = 0;
async function test(name, fn) {
  try {
    await fn(); // Changed to await
    passed++;
    console.log(`✅ ${name}`);
  } catch (e) {
    failed++;
    console.error(`❌ ${name}: ${e.message}`);
  }
}

function createMockUserStore() {
  const users = {};
  return {
    async getOnboardingState(phone) {
      if (!users[phone]) {
        users[phone] = {
          id: `user-${phone}`,
          phone: phone,
          display_name: null,
          onboarding_stage: 'ask_name',
          onboarding_complete: false,
          profile_json: {}
        };
      }
      const user = users[phone];
      return { user, stage: user.onboarding_stage, profile: user.profile_json };
    },
    async saveOnboardingStep({ userId, phone, state, done }) {
      let user = users[phone];
      if (!user) {
        user = { id: userId, phone, display_name: null, onboarding_stage: 'ask_name', onboarding_complete: false, profile_json: {} };
      }
      user.onboarding_stage = state.stage;
      user.onboarding_complete = !!done;
      user.profile_json = state.profile;
      users[phone] = user;
      return user;
    },
    async getUser(phone) {
      return users[phone];
    },
    users: users
  };
}

async function runOnboardingFlow() {
  console.log('🧪 Besh Onboarding Flow Tests\n');

  const mockStore = createMockUserStore();
  const phoneNumber = '+12125551234';
  let userState = { stage: 'ask_name', profile: {} }; // Represents the state of the user in the store
  let response;

  // Get initial state from mock store to ensure user is created
  let onboardingState = await mockStore.getOnboardingState(phoneNumber);
  userState = { stage: onboardingState.stage, profile: onboardingState.profile };

  await test('Initial greeting', async () => {
    response = nextOnboardingStep(userState, 'Hi', phoneNumber);
    assert.strictEqual(response.state.stage, 'ask_name');
    assert.strictEqual(response.done, false);
    assert(response.response.includes('what should i call you?'));
    // Save the new state back to the mock store
    await mockStore.saveOnboardingStep({ userId: onboardingState.user.id, phone: phoneNumber, state: response.state, done: response.done });
    userState = response.state;
  });

  // Step 2: Provide name -> ask goal
  await test('Provide name', async () => {
    response = nextOnboardingStep(userState, 'My name is Alex', phoneNumber);
    assert.strictEqual(response.state.stage, 'ask_goal');
    assert.strictEqual(response.done, false);
    assert.strictEqual(response.state.profile.name, 'Alex');
    assert(response.response.includes('what\'s something you\'re working on right now?'));
    // Verify timezone was auto-detected for US number
    assert(response.state.profile.timezone === 'America/New_York', `Expected timezone America/New_York, got ${response.state.profile.timezone}`);
    await mockStore.saveOnboardingStep({ userId: onboardingState.user.id, phone: phoneNumber, state: response.state, done: response.done });
    userState = response.state;
  });

  // Step 3: Provide goal -> ask birth year
  await test('Provide goal', async () => {
    response = nextOnboardingStep(userState, 'I want to learn to code', phoneNumber);
    assert.strictEqual(response.state.stage, 'ask_age');
    assert.strictEqual(response.done, false);
    assert.strictEqual(response.state.profile.goal, 'I want to learn to code');
    assert(response.response.includes('how old are you?'));
    await mockStore.saveOnboardingStep({ userId: onboardingState.user.id, phone: phoneNumber, state: response.state, done: response.done });
    userState = response.state;
  });

  // Step 4: Provide invalid birth year -> re-ask birth year
  await test('Provide invalid birth year', async () => {
    response = nextOnboardingStep(userState, '1800', phoneNumber); // Invalid year
    assert.strictEqual(response.state.stage, 'ask_age');
    assert.strictEqual(response.done, false);
    assert(response.response.includes('didn\'t catch that. can you tell me your birth year?'));
    await mockStore.saveOnboardingStep({ userId: onboardingState.user.id, phone: phoneNumber, state: response.state, done: response.done });
    userState = response.state;
  });

  // Step 5: Provide valid birth year -> ask communication style
  await test('Provide valid birth year', async () => {
    response = nextOnboardingStep(userState, '1995', phoneNumber);
    assert.strictEqual(response.state.stage, 'ask_comm_style');
    assert.strictEqual(response.done, false);
    assert.strictEqual(response.state.profile.birth_year, 1995);
    assert.strictEqual(response.state.profile.age_group, 'adult');
    assert(response.response.includes('how do you want me to talk?'));
    await mockStore.saveOnboardingStep({ userId: onboardingState.user.id, phone: phoneNumber, state: response.state, done: response.done });
    userState = response.state;
  });

  // Step 6: Provide communication style -> onboarding complete
  await test('Provide communication style', async () => {
    response = nextOnboardingStep(userState, 'casual', phoneNumber);
    assert.strictEqual(response.state.stage, 'complete');
    assert.strictEqual(response.done, true);
    assert.strictEqual(response.state.profile.comm_style, 'casual');
    assert(response.response.includes('all set, Alex!'));
    await mockStore.saveOnboardingStep({ userId: onboardingState.user.id, phone: phoneNumber, state: response.state, done: response.done });
    userState = response.state;
  });

  // Verify final user state in mock store
  await test('Final user state in store', async () => {
    const user = await mockStore.getUser(phoneNumber); // Explicitly fetch user from mock store
    assert.notStrictEqual(user, undefined, 'User should not be undefined in mockStore.users');
    assert.strictEqual(user.onboarding_complete, true, 'onboarding_complete should be true');
    assert.strictEqual(user.profile_json.name, 'Alex');
    assert.strictEqual(user.profile_json.goal, 'I want to learn to code');
    assert.strictEqual(user.profile_json.birth_year, 1995);
    assert.strictEqual(user.profile_json.age_group, 'adult');
    assert.strictEqual(user.profile_json.comm_style, 'casual');
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

runOnboardingFlow();