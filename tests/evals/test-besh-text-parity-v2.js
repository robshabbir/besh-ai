/**
 * BESH Text Parity Harness v2
 *
 * Upgrades over v1:
 *   - expect_profile validation (state.profile field assertion)
 *   - task_success taxonomy tagging + per-category pass rates
 *   - Clearer separation of gate categories in exit output
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { nextOnboardingStep } = require('../../src/services/besh-sms');

const datasetPath = path.join(__dirname, '../../evals/dataset/besh_text_goldset_v2.json');
const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));

// ---------------------------------------------------------------------------
// Naturalness heuristic (unchanged from v1 — lexical, not NLP)
// Scores 1–5; penalises leaked internals, rewards human-friendly phrases.
// NOTE: this is a Phase-1 gate only — does NOT replace human spot-check.
// ---------------------------------------------------------------------------
function naturalnessScore(text) {
  const t = String(text || '').toLowerCase();
  let score = 5;
  if (t.includes('goal=')) score -= 1;
  if (t.includes(';')) score -= 0.5;
  if (text.length > 160) score -= 0.5;
  if (/\b(great|perfect|nice to meet you|updated)\b/.test(t)) score += 0.5;
  return Math.max(1, Math.min(5, score));
}

// ---------------------------------------------------------------------------
// Task taxonomy
// ---------------------------------------------------------------------------
const TASK_LABELS = [
  'capture_name',
  'capture_goal',
  'capture_timezone',
  'handle_correction',
  'handle_fallback',
  'provide_summary',
  'complete_onboarding',
];

function runSample(sample) {
  const state = { stage: sample.stage, profile: { ...(sample.profile || {}) } };

  const t0 = process.hrtime.bigint();
  const result = nextOnboardingStep(state, sample.inbound);
  const t1 = process.hrtime.bigint();

  const latencyMs = Number(t1 - t0) / 1_000_000;
  const out = String(result.response || '');
  const lower = out.toLowerCase();
  const errors = [];

  // 1. Phrase presence
  for (const phrase of sample.expects || []) {
    if (!lower.includes(String(phrase).toLowerCase())) {
      errors.push(`missing expected phrase: "${phrase}"`);
    }
  }

  // 2. Forbidden phrases
  for (const forbidden of sample.must_not_contain || []) {
    if (lower.includes(String(forbidden).toLowerCase())) {
      errors.push(`contains forbidden phrase: "${forbidden}"`);
    }
  }

  // 3. Stage transition
  if (sample.expect_stage && result?.state?.stage !== sample.expect_stage) {
    errors.push(`stage: expected "${sample.expect_stage}", got "${result?.state?.stage}"`);
  }

  // 4. Profile field assertions (NEW in v2)
  if (sample.expect_profile) {
    const resultProfile = result?.state?.profile || {};
    for (const [key, expected] of Object.entries(sample.expect_profile)) {
      const actual = resultProfile[key];
      if (actual !== expected) {
        errors.push(`profile.${key}: expected "${expected}", got "${actual}"`);
      }
    }
  }

  return {
    id: sample.id,
    task: sample.task || 'untagged',
    naturalness: naturalnessScore(out),
    latencyMs,
    pass: errors.length === 0,
    errors,
  };
}

// ---------------------------------------------------------------------------
// Run all samples
// ---------------------------------------------------------------------------
const results = dataset.map(runSample);

// ---------------------------------------------------------------------------
// Aggregate metrics
// ---------------------------------------------------------------------------
const naturalnessAvg = results.reduce((s, r) => s + r.naturalness, 0) / results.length;
const maxLatencyMs = results.reduce((m, r) => Math.max(m, r.latencyMs), 0);
const failures = results.filter((r) => !r.pass);

// Per-task breakdown
const byTask = {};
for (const label of TASK_LABELS) byTask[label] = { pass: 0, fail: 0 };
byTask['untagged'] = { pass: 0, fail: 0 };

for (const r of results) {
  const bucket = byTask[r.task] ?? (byTask[r.task] = { pass: 0, fail: 0 });
  r.pass ? bucket.pass++ : bucket.fail++;
}

const taskPassRates = {};
for (const [label, counts] of Object.entries(byTask)) {
  const total = counts.pass + counts.fail;
  if (total === 0) continue;
  taskPassRates[label] = {
    pass: counts.pass,
    total,
    rate: Number(((counts.pass / total) * 100).toFixed(1)) + '%',
  };
}

// ---------------------------------------------------------------------------
// Gate evaluation
// ---------------------------------------------------------------------------
const NATURALNESS_MIN = 4.0;
const MAX_LATENCY_MS = 50;

const gateNaturalness = naturalnessAvg >= NATURALNESS_MIN;
const gateLatency = maxLatencyMs <= MAX_LATENCY_MS;
const gateSamples = failures.length === 0;
const pass = gateSamples && gateNaturalness && gateLatency;

// ---------------------------------------------------------------------------
// Scorecard output
// ---------------------------------------------------------------------------
const scorecard = {
  dataset: path.basename(datasetPath),
  samples: results.length,
  harnessVersion: 2,
  metrics: {
    naturalnessAvg: Number(naturalnessAvg.toFixed(2)),
    maxLatencyMs: Number(maxLatencyMs.toFixed(3)),
  },
  thresholds: {
    naturalnessMin: NATURALNESS_MIN,
    maxLatencyMs: MAX_LATENCY_MS,
  },
  checks: {
    sampleParity: gateSamples,
    naturalness: gateNaturalness,
    latency: gateLatency,
  },
  taskSuccessRates: taskPassRates,
  pass,
};

console.log('\n--- BESH Text Parity Scorecard v2 ---');
console.log(JSON.stringify(scorecard, null, 2));

if (failures.length > 0) {
  console.error(`\n❌ ${failures.length} sample failure(s):`);
  for (const r of failures) {
    console.error(`  [${r.task}] ${r.id}`);
    for (const err of r.errors) {
      console.error(`    • ${err}`);
    }
  }
}

console.log('\nTask breakdown:');
for (const [label, data] of Object.entries(taskPassRates)) {
  const bar = data.pass === data.total ? '✅' : '⚠️ ';
  console.log(`  ${bar} ${label.padEnd(22)} ${data.pass}/${data.total} (${data.rate})`);
}

console.log(pass ? '\n✅ PASS' : '\n❌ FAIL');

if (!pass) {
  process.exit(1);
}
