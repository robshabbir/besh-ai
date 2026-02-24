# Besh Text Quality Benchmark — BMAD Kickoff (2026-02-24)

## Goal
Determine whether Besh text experience is genuinely competitive with Tomo/top text assistants on:
1. Naturalness
2. Response speed
3. Intelligence/task success
4. Cost effectiveness

## What was done now (Kickoff pass)
- Added baseline benchmark test: `tests/test-besh-text-quality-benchmark.js`
- Ran benchmark against current SMS onboarding logic (`src/services/besh-sms.js`)

### Baseline Results (local synthetic)
- Scenarios: 3
- Replies scored: 6
- Avg naturalness (heuristic): **4.83 / 5**
- Max handler latency: **0.22ms**
- Result: **PASS** for current baseline gate

## Important Caveat
This baseline is **not competitor parity proof**.
It validates deterministic onboarding copy quality and local function speed only.
It does **not** yet validate:
- Real-user conversational quality over 20+ turns
- Real network/API latency under load
- LLM intelligence against difficult SMB intents
- Token-level cost vs benchmark targets

## BMAD Workstream (effective next moves)

### Researcher Track (R)
- Build a 120-message gold dataset across SMB verticals:
  - booking, reschedule, pricing question, objection handling, angry customer, no-context opener
- Define competitor rubric from Tomo/public examples + best-practice SMS UX
- Output: `evals/dataset/besh_text_goldset_v1.json`

### UX Track (U)
- Define text style guide for "human + fast + concise":
  - max 1-2 sentence default
  - no robotic formatting (`goal=...` style)
  - confirm/clarify patterns
- Output: `docs/ux/text-style-guide.md`

### QA Verifier Track (Q)
- Build automated scoring harness:
  - naturalness score
  - task completion rate
  - clarification quality
  - safety/hallucination checks
- Add latency + cost telemetry per conversation
- Output: `tests/evals/test-besh-text-parity.js`

## Success Criteria for "Tomo-level" Claim
We only claim parity when all are true on gold dataset:
- Naturalness >= 4.4/5
- Task success >= 92%
- P95 latency <= 2.5s (production path)
- Cost <= $0.03 per meaningful 2-way exchange (target, tuneable)
- Hallucination/unsafe response rate <= 1%

## Current Product Reality (as of kickoff)
- SMS onboarding flow works and is stable
- Strong deterministic reliability for early funnel
- Full text intelligence parity not yet proven

## Immediate Next Action
Implement Phase 1 eval harness + 30-message mini goldset today, then run first parity report.
