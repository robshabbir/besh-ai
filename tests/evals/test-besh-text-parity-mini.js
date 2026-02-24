const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { nextOnboardingStep } = require('../../src/services/besh-sms');

const datasetPath = path.join(__dirname, '../../evals/dataset/besh_text_goldset_mini_v1.json');
const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));

function naturalnessScore(text) {
  const t = String(text || '').toLowerCase();
  let score = 5;
  if (t.includes('goal=')) score -= 1;
  if (t.includes(';')) score -= 0.5;
  if (text.length > 160) score -= 0.5;
  if (/\b(great|perfect|nice to meet you|updated)\b/.test(t)) score += 0.5;
  return Math.max(1, Math.min(5, score));
}

let failures = 0;
let totalNaturalness = 0;
let maxLatencyMs = 0;

for (const sample of dataset) {
  const state = { stage: sample.stage, profile: sample.profile || {} };

  const t0 = process.hrtime.bigint();
  const result = nextOnboardingStep(state, sample.inbound);
  const t1 = process.hrtime.bigint();
  const latencyMs = Number(t1 - t0) / 1_000_000;

  maxLatencyMs = Math.max(maxLatencyMs, latencyMs);

  const out = String(result.response || '');
  const lower = out.toLowerCase();

  for (const phrase of sample.expects || []) {
    if (!lower.includes(String(phrase).toLowerCase())) {
      console.error(`❌ ${sample.id}: missing expected phrase: ${phrase}`);
      failures++;
    }
  }

  for (const forbidden of sample.must_not_contain || []) {
    if (lower.includes(String(forbidden).toLowerCase())) {
      console.error(`❌ ${sample.id}: contains forbidden phrase: ${forbidden}`);
      failures++;
    }
  }

  totalNaturalness += naturalnessScore(out);
  console.log(`✅ ${sample.id}`);
}

const avgNaturalness = totalNaturalness / dataset.length;
console.log('\n--- Mini Parity Report ---');
console.log(`Samples: ${dataset.length}`);
console.log(`Avg naturalness: ${avgNaturalness.toFixed(2)}/5`);
console.log(`Max latency: ${maxLatencyMs.toFixed(2)}ms`);

try {
  assert(avgNaturalness >= 4.0, `avg naturalness ${avgNaturalness.toFixed(2)} < 4.0`);
  assert(maxLatencyMs <= 50, `max latency ${maxLatencyMs.toFixed(2)}ms > 50ms`);
} catch (err) {
  console.error(`❌ Quality gate failed: ${err.message}`);
  failures++;
}

if (failures > 0) {
  console.error(`\nFAILED with ${failures} issue(s).`);
  process.exit(1);
}

console.log('\nPASS: Mini parity gate met.');
