/**
 * Live Gemini smoke test — confirms the API key is valid and the model
 * responds. NOT a unit test; requires a real GEMINI_API_KEY.
 *
 * Usage:
 *   node tests/test-besh-live.js
 *   npm run test:live
 *
 * CI: set SKIP_LIVE_TESTS=true to skip automatically.
 */

if (process.env.SKIP_LIVE_TESTS === 'true') {
  console.log('⏭️  SKIP_LIVE_TESTS=true — live Gemini test skipped.');
  process.exit(0);
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

if (!GEMINI_API_KEY || GEMINI_API_KEY.includes('PLACEHOLDER')) {
  console.error('❌ GEMINI_API_KEY is missing or placeholder. Cannot run live test.');
  process.exit(1);
}

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

async function run() {
  console.log(`🔌 Calling Gemini (${GEMINI_MODEL}) with live key...`);

  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: 'You are a helpful assistant. Reply briefly.' }] },
      contents: [{ role: 'user', parts: [{ text: 'Reply with exactly: OK' }] }],
      generationConfig: { maxOutputTokens: 10, temperature: 0 }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('❌ Gemini API error ' + response.status + ': ' + errText);
    process.exit(1);
  }

  const data = await response.json();
  const text = (data.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();

  if (!text) {
    console.error('❌ Gemini returned empty response. Check key permissions or quota.');
    console.error('Raw response:', JSON.stringify(data, null, 2));
    process.exit(1);
  }

  console.log('✅ Gemini responded: "' + text + '"');
  console.log('✅ test-besh-live: PASS — API key valid, model reachable');
}

run().catch(err => {
  console.error('❌ test-besh-live FAILED:', err.message);
  process.exit(1);
});
