const fs = require('fs');
const path = require('path');
const { nextOnboardingStep } = require('../../src/services/besh-sms');

const NATURALNESS_MIN = 4.0;
const MAX_LATENCY_MS = 50;

const datasetPath = path.join(__dirname, '../../evals/dataset/besh_text_goldset_mini_v1.json');
const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));

function naturalnessScore(text) {
  const t = String(text || '').toLowerCase();
  let score = 5;

  if (t.includes('goal=')) score -= 1;
  if (t.includes(';')) score -= 0.5;
  if (t.length > 160) score -= 0.5;
  if (/\b(great|perfect|nice to meet you|updated)\b/.test(t)) score += 0.5;

  return Math.max(1, Math.min(5, score));
}

function runSample(sample) {
  const state = { stage: sample.stage, profile: sample.profile || {} };

  const t0 = process.hrtime.bigint();
  const result = nextOnboardingStep(state, sample.inbound);
  const t1 = process.hrtime.bigint();

  const latencyMs = Number(t1 - t0) / 1_000_000;
  const out = String(result.response || '');
  const lower = out.toLowerCase();

  const errors = [];

  for (const phrase of sample.expects || []) {
    if (!lower.includes(String(phrase).toLowerCase())) {
      errors.push(`missing expected phrase: ${phrase}`);
    }
  }

  for (const forbidden of sample.must_not_contain || []) {
    if (lower.includes(String(forbidden).toLowerCase())) {
      errors.push(`contains forbidden phrase: ${forbidden}`);
    }
  }

  if (sample.expect_stage && result?.state?.stage !== sample.expect_stage) {
    errors.push(`expected stage ${sample.expect_stage}, got ${result?.state?.stage}`);
  }

  return {
    id: sample.id,
    naturalness: naturalnessScore(out),
    latencyMs,
    pass: errors.length === 0,
    errors,
  };
}

const sampleResults = dataset.map(runSample);
const naturalnessAvg = sampleResults.reduce((sum, item) => sum + item.naturalness, 0) / sampleResults.length;
const maxLatencyMs = sampleResults.reduce((max, item) => Math.max(max, item.latencyMs), 0);
const failures = sampleResults.filter((r) => !r.pass);

const gateNaturalness = naturalnessAvg >= NATURALNESS_MIN;
const gateLatency = maxLatencyMs <= MAX_LATENCY_MS;
const pass = failures.length === 0 && gateNaturalness && gateLatency;

const scorecard = {
  dataset: path.basename(datasetPath),
  samples: sampleResults.length,
  metrics: {
    naturalnessAvg: Number(naturalnessAvg.toFixed(2)),
    maxLatencyMs: Number(maxLatencyMs.toFixed(2)),
  },
  thresholds: {
    naturalnessMin: NATURALNESS_MIN,
    maxLatencyMs: MAX_LATENCY_MS,
  },
  checks: {
    sampleParity: failures.length === 0,
    naturalness: gateNaturalness,
    latency: gateLatency,
  },
  pass,
};

console.log('--- BESH Text Parity Scorecard ---');
console.log(JSON.stringify(scorecard, null, 2));

if (failures.length > 0) {
  console.error('\nSample failures:');
  for (const failure of failures) {
    console.error(`- ${failure.id}`);
    for (const err of failure.errors) {
      console.error(`  • ${err}`);
    }
  }
}

if (!pass) {
  process.exit(1);
}
