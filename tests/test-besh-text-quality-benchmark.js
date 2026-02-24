const assert = require('assert');
const { nextOnboardingStep } = require('../src/services/besh-sms');

const scenarios = [
  {
    name: 'onboarding_flow_clarity',
    steps: ['Alex', 'Book more cleaning appointments', 'America/New_York'],
    mustInclude: ['Nice to meet you', 'main goal', 'timezone', "all set"],
  },
  {
    name: 'goal_correction_handling',
    initial: { stage: 'ask_timezone', profile: { name: 'Alex', goal: 'Get fit' } },
    steps: ['actually make that fill my pipeline', 'America/Chicago'],
    mustInclude: ['Updated', 'timezone', 'all set'],
  },
  {
    name: 'post_onboarding_summary',
    initial: { stage: 'complete', profile: { name: 'Sam', goal: 'Reduce no-shows', timezone: 'America/Los_Angeles' } },
    steps: ['summary'],
    mustInclude: ['Summary for Sam', 'Reduce no-shows', 'America/Los_Angeles'],
  }
];

function runScenario(scenario) {
  let state = scenario.initial || { stage: 'ask_name', profile: {} };
  const replies = [];

  for (const inbound of scenario.steps) {
    const t0 = process.hrtime.bigint();
    const step = nextOnboardingStep(state, inbound);
    const t1 = process.hrtime.bigint();
    const latencyMs = Number(t1 - t0) / 1_000_000;
    replies.push({ text: step.response, latencyMs });
    state = step.state;
  }

  return replies;
}

function scoreNaturalness(text) {
  const t = text.toLowerCase();
  let score = 5;

  if (t.includes('goal=') || t.includes(';')) score -= 1; // robotic formatting
  if (text.length > 150) score -= 1; // too long for SMS UX
  if (/(?:^|\s)(there)(?:[,.!?]|$)/i.test(text)) score -= 1; // generic fallback voice
  if (/\b(your|you)\b/.test(t)) score += 0.5; // direct conversational phrasing
  if (/\b(great|perfect|nice to meet you|updated)\b/.test(t)) score += 0.5;

  return Math.max(1, Math.min(5, score));
}

let failures = 0;
let totalReplies = 0;
let totalNaturalness = 0;
let maxLatency = 0;

for (const scenario of scenarios) {
  const replies = runScenario(scenario);
  const fullText = replies.map(r => r.text).join(' | ');

  for (const phrase of scenario.mustInclude) {
    if (!fullText.toLowerCase().includes(phrase.toLowerCase())) {
      console.error(`❌ ${scenario.name}: missing phrase: ${phrase}`);
      failures++;
    }
  }

  for (const r of replies) {
    totalReplies++;
    totalNaturalness += scoreNaturalness(r.text);
    maxLatency = Math.max(maxLatency, r.latencyMs);

    if (r.latencyMs > 50) {
      console.error(`❌ ${scenario.name}: latency too high (${r.latencyMs.toFixed(2)}ms)`);
      failures++;
    }
  }

  console.log(`✅ ${scenario.name}: ${replies.length} replies`);
}

const avgNaturalness = totalNaturalness / totalReplies;
console.log(`\n--- Benchmark Summary ---`);
console.log(`Scenarios: ${scenarios.length}`);
console.log(`Replies scored: ${totalReplies}`);
console.log(`Avg naturalness (1-5): ${avgNaturalness.toFixed(2)}`);
console.log(`Max handler latency (ms): ${maxLatency.toFixed(2)}`);

// Baseline target for "near top competitor" quality in this project phase
try {
  assert(avgNaturalness >= 3.8, `avg naturalness too low: ${avgNaturalness.toFixed(2)} < 3.8`);
  assert(maxLatency <= 50, `max latency too high: ${maxLatency.toFixed(2)}ms > 50ms`);
} catch (err) {
  console.error(`❌ Quality gate failed: ${err.message}`);
  failures++;
}

if (failures > 0) {
  console.error(`\nFAILED with ${failures} issue(s).`);
  process.exit(1);
}

console.log('\nPASS: Baseline quality gate met.');
