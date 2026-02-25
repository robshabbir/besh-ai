const assert = require('assert');

let fetchCalls = 0;

global.fetch = async () => {
  fetchCalls += 1;
  return {
    ok: true,
    json: async () => ({
      candidates: [{ content: { parts: [{ text: 'Yeah, we are open 9 to 5.' }] } }]
    })
  };
};

const { processConversation } = require('../src/services/claude');

async function run() {
  const messages = [];

  // same tenant + same first-turn cacheable question => should only hit fetch once
  await processConversation('Tenant A prompt', messages, 'What are your hours?');
  await processConversation('Tenant A prompt', messages, 'What are your hours?');

  assert.equal(fetchCalls, 1, 'Expected second identical call to be served from cache');

  // different tenant prompt should not share cache
  await processConversation('Tenant B prompt', messages, 'What are your hours?');
  assert.equal(fetchCalls, 2, 'Expected different tenant prompt to bypass cache');

  console.log('✅ claude tenant cache behavior works');
}

run().catch((err) => {
  console.error('❌ claude cache test failed:', err.message);
  process.exit(1);
});
