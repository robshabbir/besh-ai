# Calva AI — Product Brief (BMAD)
**Created:** 2026-02-20
**Author:** Dev2 (Business Analyst role)
**Status:** Draft

---

## 1. Executive Summary

Calva AI is a multi-tenant AI receptionist platform targeting small businesses (plumbers, law firms, salons, restaurants, medical offices, auto repair). It answers phone calls 24/7 using AI that sounds human, books appointments, captures leads, and handles emergencies.

**Current state:** ~90% built. Core voice AI, signup, onboarding, dashboard, and billing routes exist. Key gaps remain vs. market leader Synthflow.

---

## 2. Competitive Gap Analysis: Calva vs Synthflow

### What Synthflow Has (That We Need)

| Feature | Synthflow | Calva | Gap |
|---------|-----------|-------|-----|
| Voice conversation (phone) | ✅ End-to-end ElevenLabs pipeline | ✅ Working (Chirp3-HD/Polly) | Parity — different voice, similar quality |
| Website voice demo | ✅ Proper embedded widget with flow preview | ⚠️ Just fixed — ElevenLabs embed | Minor polish needed |
| Industry templates | ✅ Structured prompts (Who You Are → Discovery → Qualification → Booking → Objections → Knowledge Base) | ✅ 9 templates restructured to same framework | Parity |
| Real-time booking | ✅ Integrated calendar scheduling | ❌ Deferred (capture-only for launch) | Acceptable for MVP |
| Multi-tenant SaaS | ✅ Full platform | ✅ Working (signup → onboard → dashboard) | Parity |
| Flow builder (visual) | ✅ Visual flow editor + prompt editor | ❌ Not built | Phase 2 |
| Pay-as-you-go pricing | ✅ $0.15-0.24/min usage-based | ❌ Fixed tiers ($49/$99/$199) | Different model — OK for SMB |
| White-label / reseller | ✅ $2K/mo add-on | ❌ Not built | Phase 2 |
| Concurrent call scaling | ✅ $20/reserved concurrency | ❌ Not built | Phase 2 |
| SOC2/GDPR compliance | ✅ Enterprise | ❌ Not built | Phase 2 |
| Billing (Stripe) | ✅ Working | ❌ **BLOCKED — need Stripe keys** | Blocker |
| Email (transactional) | ✅ Working | ❌ **BLOCKED — need SMTP** | Blocker |
| Custom domain | ✅ calva.ai | ❌ **BLOCKED — need domain** | Blocker |

### What Calva Has (That Synthflow Charges Extra For)
- **Fixed simple pricing** — SMBs prefer predictable $49/mo vs per-minute billing
- **Industry-specific onboarding** — guided wizard, not a blank canvas
- **Emergency handling** — prioritizes urgent calls (pipe burst, etc.)
- **SMS notifications** — instant alerts to business owner

### Verdict
Calva is **launch-ready for SMB market** once 3 blockers are resolved (Stripe, SMTP, domain). We compete on simplicity and price, not on enterprise features.

---

## 3. Target Users

### Primary: Small Business Owner (1-20 employees)
- **Pain:** Missing calls → losing customers. Can't afford $300-800/mo answering service.
- **Need:** Something that answers the phone 24/7, sounds professional, captures leads.
- **Budget:** $49-199/mo — predictable, not usage-based.
- **Tech level:** Low. Needs guided setup, not a flow builder.

### Secondary: Agency / Reseller (Phase 2)
- Buys white-label to resell to their SMB clients.

---

## 4. MVP Scope (Launch)

### Must-Have (Before Launch)
1. ~~Voice demo on website~~ ✅ Fixed
2. ~~Industry selector feedback~~ ✅ Fixed
3. ~~Test suite port~~ ✅ Fixed
4. **Stripe billing integration** — BLOCKED on keys
5. **Transactional email** — BLOCKED on SMTP
6. **Domain + deployment** — BLOCKED on domain
7. Appointment capture → SMS/email to owner (no calendar integration)
8. Remove/stub calendar OAuth dependency
9. Full E2E test pass (all flows verified)
10. Production environment variables + deployment config

### Deferred (Phase 2)
- Google Calendar real-time booking
- Visual flow builder
- White-label / reseller
- Concurrent call scaling
- SOC2/GDPR compliance
- Usage-based pricing option

---

## 5. Success Metrics

| Metric | Target |
|--------|--------|
| Signup → Active (makes first call) | > 40% |
| Call answer rate | 99.9% |
| Caller satisfaction (sounds human) | > 4.5/5 |
| Monthly churn | < 5% |
| Time to onboard | < 5 min |

---

## 6. Next Steps (BMAD Flow)

1. ✅ Product Brief (this document)
2. → **Architect** — Technical spec for remaining launch work
3. → **Scrum Master** — Epics + stories for launch sprint
4. → **Dev** — Execute stories with TDD
5. → **QA** — E2E verification before launch
