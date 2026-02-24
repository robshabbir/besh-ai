# Besh Text Parity — Executive Scorecard (2026-02-24)

## Scope
Current BMAD Phase 1 benchmark status for Besh text quality against Tomo-level targets.

## Evidence Run
- `node tests/evals/test-besh-text-parity-report.js`
- `node tests/evals/test-cost-estimator.js`
- `npm test --silent`

## Current Measured Metrics
- **Naturalness Avg:** 4.81 / 5
- **Max Latency (handler):** 0.21 ms
- **Parity Harness:** PASS (mini goldset)
- **Cost Estimator Utility:** PASS

## Cost Snapshot (estimation utility)
- Estimator now exists and is validated for per-turn/per-conversation modeling.
- This enables pricing envelope checks before full production telemetry is wired.

## Confidence Level
- **Medium for deterministic onboarding quality**
- **Low-to-medium for full competitor parity** (dataset still mini; not yet full 30+ scenario gate)

## Gap to Tomo-Level Claim
To claim true top-competitor parity, we still need:
1. Expand goldset from mini set to at least 30 representative SMB scenarios.
2. Add task-success and failure taxonomy scoring.
3. Add production-path latency and token-cost telemetry.
4. Run repeated benchmark cycles and publish trendline.

## Recommendation
- Continue BMAD Phase 1 until 30-sample scorecard is in place.
- Do not publicly claim "Tomo-level" yet; claim "promising benchmark results" with transparent metrics.
