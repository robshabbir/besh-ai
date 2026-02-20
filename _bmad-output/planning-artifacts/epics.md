# Calva AI — Launch Sprint Epics
**Created:** 2026-02-20 | **Sprint Goal:** Launch-ready product

---

## Epic 1: Appointment Capture (No Calendar)
**Status:** BACKLOG
**Estimate:** 2-3 hours
**Dependency:** None (can start now)

### Story 1.1: AI Appointment Detail Extraction
Extract name, phone, preferred time, and service from conversation when booking intent detected.
- Modify Claude system prompt to output structured appointment data
- Parse appointment fields from AI response
- Store in call record

### Story 1.2: SMS Notification to Business Owner
Send SMS via Twilio to business owner when appointment is requested.
- Use existing sms-notify service
- Format: "New appointment request: [name] wants [service] at [time]. Call back: [phone]"

### Story 1.3: Email Notification to Business Owner
Send email notification (when SMTP available, log otherwise).
- Use existing email service with fallback
- Include all appointment details

### Story 1.4: Calendar Graceful Degradation
Stub calendar routes, show "Coming Soon" in dashboard.
- Calendar settings → informational page
- Remove OAuth redirect errors
- No crash on any calendar-related route

---

## Epic 2: Stripe Billing (BLOCKED — needs keys)
**Status:** BLOCKED
**Estimate:** 1-2 hours once keys available
**Dependency:** Stripe test/live keys from Rifat

### Story 2.1: Wire Stripe Checkout
Connect existing billing routes to real Stripe keys. Test checkout flow.

### Story 2.2: Webhook + Subscription Management
Verify webhook handles payment events. Test portal access.

### Story 2.3: Trial Enforcement
14-day trial period. Graceful upgrade prompt after trial.

---

## Epic 3: Transactional Email (BLOCKED — needs SMTP)
**Status:** BLOCKED
**Estimate:** 1 hour once SMTP available
**Dependency:** SMTP credentials from Rifat

### Story 3.1: Wire Email Service
Configure SMTP in email service. Test verification + password reset emails.

---

## Epic 4: E2E Verification + Polish
**Status:** BACKLOG
**Estimate:** 2-3 hours
**Dependency:** None (can start now)

### Story 4.1: Full User Journey Test
Walk through every flow: signup → verify → login → onboard → dashboard → settings.
Document and fix any broken steps.

### Story 4.2: Test Suite Green
Run test.sh + test-core.js + test-production-ready.js. Fix all failures.

### Story 4.3: Mobile Responsiveness Audit
Check all pages on mobile viewport. Fix layout breaks.

### Story 4.4: Console Error Cleanup
Load every page, check for JS errors, fix them all.

---

## Epic 5: Production Deployment (BLOCKED — needs domain)
**Status:** BLOCKED
**Estimate:** 1-2 hours once domain available
**Dependency:** Domain + hosting decision from Rifat

### Story 5.1: Deploy to Railway/Fly
Set env vars, deploy, verify health check.

### Story 5.2: Domain + SSL
Configure custom domain, verify SSL, update Twilio webhooks.

---

## Execution Order (What I Can Do NOW)

| Priority | Story | Blocked? | Est. |
|----------|-------|----------|------|
| 1 | 1.4 Calendar Graceful Degradation | No | 30min |
| 2 | 1.1 Appointment Detail Extraction | No | 1hr |
| 3 | 1.2 SMS Notification | No | 30min |
| 4 | 1.3 Email Notification (with fallback) | No | 30min |
| 5 | 4.2 Test Suite Green | No | 1hr |
| 6 | 4.1 Full User Journey Test | No | 1hr |
| 7 | 4.4 Console Error Cleanup | No | 30min |
| 8 | 4.3 Mobile Responsiveness | No | 30min |
| — | Epic 2 (Stripe) | **YES** | — |
| — | Epic 3 (Email) | **YES** | — |
| — | Epic 5 (Deploy) | **YES** | — |

**Total unblocked work: ~5-6 hours**
