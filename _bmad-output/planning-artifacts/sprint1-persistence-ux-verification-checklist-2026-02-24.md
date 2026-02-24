# Sprint 1 Verification Checklist — Persistence + UX Quality Bar

**Track:** BMAD Track C (Verify/QA)  
**Date:** 2026-02-24  
**Scope:** Sprint 1 SMS onboarding + persistence foundations (personal-first Besh v2)  
**Purpose:** Define a clear go/no-go verification gate for Sprint 1 before merge/release.

---

## 1) Sprint 1 Quality Bar (What must be true)

### Persistence bar (must-have)
- All inbound and outbound SMS messages are persisted with user linkage and timestamps.
- Onboarding state survives process restart (no in-memory-only state in release build).
- User profile/goals/reminder preferences persist and are reloadable by phone identity.
- Data model aligns to v2 personal schema (`users`, `goals`, `reminders`, `conversations`, `memory_facts`, optional `actions`).
- Idempotency/duplication controls exist for webhook retries.

### UX bar (must-have)
- New user gets value in <=5 messages (clear, concise prompts).
- Returning user is recognized and receives contextual response (no repeated onboarding unless requested).
- Replies are concise (SMS-friendly length), human-readable, and action-oriented.
- Error/fallback messages are graceful and never expose internal errors.

### Security bar (must-have)
- Twilio webhook signature validation enforced.
- Phone verification on bootstrap path enforced (or explicit verified trust policy documented and tested).
- PII-safe logging (no raw sensitive content in error logs without masking).

---

## 2) Functional Verification Checklist

## A. Inbound Webhook + Identity
- [ ] **F-01** Valid Twilio signed request accepted (200 + TwiML response).
- [ ] **F-02** Invalid/missing signature rejected (401/403), no DB writes.
- [ ] **F-03** Unknown phone starts bootstrap flow (new `users` row created once).
- [ ] **F-04** Existing phone resolves to same `user_id` consistently.
- [ ] **F-05** Duplicate webhook delivery (same message SID) does not create duplicate conversation rows.

## B. Persistence (core)
- [ ] **F-06** Inbound SMS persisted (`conversations`, direction=inbound, channel=sms, external_id/message_sid).
- [ ] **F-07** Outbound AI reply persisted (`conversations`, direction=outbound) and linked to inbound exchange.
- [ ] **F-08** Onboarding stage persisted in durable storage (DB), not volatile memory.
- [ ] **F-09** Process restart test: onboarding resumes at correct stage for same phone.
- [ ] **F-10** Goals captured during onboarding are written to `goals` with active status.
- [ ] **F-11** Reminder cadence/timezone preference persisted to `reminders`/profile fields.
- [ ] **F-12** Basic memory facts extracted and persisted to `memory_facts` with confidence.

## C. Onboarding State Machine UX
- [ ] **F-13** Step sequence follows expected flow (name → goal → timezone/cadence → confirmation).
- [ ] **F-14** Each prompt is unambiguous, <=160 chars target (single SMS where possible).
- [ ] **F-15** User can correct previous answer (“actually…”) before completion.
- [ ] **F-16** Completion message confirms what was saved and next expected behavior.
- [ ] **F-17** Returning complete user skips onboarding and receives normal assistant mode.

## D. Reply Quality + Boundaries
- [ ] **F-18** SMS reply sanitizer enforces max length safely (no broken UTF-8 / partial emojis).
- [ ] **F-19** Tone remains consistent, concise, and non-robotic across onboarding prompts.
- [ ] **F-20** Unsupported requests get graceful fallback + next step suggestion.

## E. Observability + Operations
- [ ] **F-21** Structured logs include request IDs/message IDs for traceability.
- [ ] **F-22** Failures are surfaced with actionable errors (signature fail, DB fail, Twilio fail).
- [ ] **F-23** Metrics counters present for inbound, outbound, onboarding_started, onboarding_completed, failures.

---

## 3) Edge Case & Negative Test Matrix

## Identity/Data Integrity
- [ ] **E-01** Non-E.164 or malformed `From/To` numbers are normalized or rejected predictably.
- [ ] **E-02** Empty body / whitespace-only SMS handled without crash.
- [ ] **E-03** Very long body (e.g., 2,000+ chars) handled safely.
- [ ] **E-04** Rapid multi-message burst from same sender preserves order and stage consistency.
- [ ] **E-05** Two users with same local number format but different country code do not collide.

## Retry/Concurrency
- [ ] **E-06** Twilio retry after timeout does not duplicate user/onboarding transitions.
- [ ] **E-07** Concurrent requests for same user are transactionally safe (no stage regression).

## Security/Abuse
- [ ] **E-08** Forged webhook with valid payload but invalid signature blocked.
- [ ] **E-09** Replay attack attempt using old signed request outside accepted timestamp window blocked.
- [ ] **E-10** Injection-like input in body (`<script>`, SQL fragments) stored/handled as plain text safely.

## UX Resilience
- [ ] **E-11** Confused user replies (“what do you mean?”) trigger clarification, not hard failure.
- [ ] **E-12** User asks to stop during onboarding (“stop”, “unsubscribe”) respects opt-out behavior.
- [ ] **E-13** Non-English/emoji-heavy replies do not break state machine.

---

## 4) Test Execution Plan

- **Unit tests:** classifier, state transitions, sanitization, phone normalization, signature validator.
- **Integration tests:** webhook endpoint + DB persistence + idempotency + restart recovery.
- **E2E tests:** scripted Twilio-style webhook sequence for new and returning users.
- **Manual QA pass (UX):** review message clarity, pacing, and perceived usefulness in first 5 texts.

**Minimum pass thresholds**
- Unit: 100% pass.
- Integration: 100% pass on required Sprint 1 scenarios.
- E2E critical path: 100% pass for new-user onboarding and returning-user continuity.
- No P0/P1 open defects.

---

## 5) Release Gate Criteria (Go / No-Go)

## GO only if ALL are true
- [ ] G-01 Security blockers closed: signature validation + bootstrap phone verification.
- [ ] G-02 Persistence is durable across restart (no in-memory-only onboarding in release config).
- [ ] G-03 v2 schema alignment confirmed; no legacy business/customer-only schema dependency for Sprint 1 core path.
- [ ] G-04 New-user onboarding happy path validated end-to-end in staging.
- [ ] G-05 Returning-user continuity validated end-to-end in staging.
- [ ] G-06 Idempotency under webhook retries validated.
- [ ] G-07 UX quality bar met: concise, clear, actionable responses; no dead-end prompts.
- [ ] G-08 Observability available for debugging production incidents.

## Automatic NO-GO triggers
- Any missing webhook signature validation.
- Any inability to resume onboarding after process restart.
- Any duplicate message persistence under normal Twilio retry behavior.
- Any onboarding flow that cannot complete in <=5 exchanges for standard user input.
- Any P0/P1 defect in identity, security, persistence, or core UX path.

---

## 6) Exit Artifacts Required for Verify Sign-off

- Test report (unit/integration/E2E) with run timestamp and commit SHA.
- Evidence screenshots/log snippets for:
  - valid signature accept + invalid signature reject,
  - restart recovery,
  - duplicate retry protection,
  - returning-user recognition.
- Defect log with severity and disposition.
- Final Verify verdict: **GO** or **NO-GO** with explicit rationale.

---

## 7) Notes for Current Repo State

- Existing `plans/sprint1-sms-engine.md` is marked stale versus v2 personal schema and should not be sole acceptance source.
- Current route implementation using in-memory onboarding map is acceptable only for prototype; fails Sprint 1 release durability gate.
- Intent extraction complexity should remain scoped carefully (Sprint 1: minimal useful extraction only).
