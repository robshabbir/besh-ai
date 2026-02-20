# Product Requirements Document — Calva AI Launch Sprint
**Author:** Dev2 | **Date:** 2026-02-20 | **Status:** Ready for Architect

---

## 1. Overview
Ship Calva AI as a launch-ready SaaS product. Focus: resolve 3 external blockers + internal cleanup to make every user flow work end-to-end.

## 2. Requirements

### 2.1 Appointment Capture (No Calendar)
**Priority:** P0 — Must have for launch

**Current:** Calendar integration exists but requires Google OAuth (deferred).
**Target:** When AI detects booking intent, capture details (name, phone, preferred time, service) and send SMS + email notification to business owner.

**Acceptance Criteria:**
- [ ] AC-1: AI extracts appointment details from conversation
- [ ] AC-2: SMS sent to business owner with appointment request
- [ ] AC-3: Email sent to business owner (when SMTP configured, fallback: log)
- [ ] AC-4: Appointment logged in call record with extracted details
- [ ] AC-5: Calendar routes return graceful "coming soon" instead of OAuth error

### 2.2 Stripe Billing Integration
**Priority:** P0 — BLOCKED on Stripe keys from Rifat

**Current:** Billing routes exist (checkout, webhooks, portal). Need real keys.
**Target:** Working subscription flow: signup → trial → checkout → active subscription.

**Acceptance Criteria:**
- [ ] AC-1: Stripe checkout creates subscription ($49/$99/$199 tiers)
- [ ] AC-2: Webhook handles payment success/failure
- [ ] AC-3: Customer portal accessible from dashboard
- [ ] AC-4: Trial period (14 days) enforced
- [ ] AC-5: Graceful handling when Stripe keys not configured

### 2.3 Transactional Email
**Priority:** P0 — BLOCKED on SMTP provider from Rifat

**Current:** Email service logs to console.
**Target:** Real emails for verification, password reset, appointment notifications.

**Acceptance Criteria:**
- [ ] AC-1: Verification email sent on signup
- [ ] AC-2: Password reset email works
- [ ] AC-3: Appointment notification emails to business owner
- [ ] AC-4: Graceful fallback when SMTP not configured (log + continue)

### 2.4 Production Deployment
**Priority:** P0 — BLOCKED on domain from Rifat

**Current:** Dockerfile, railway.json, fly.toml exist. Need domain + env vars.
**Target:** Deployed and accessible at production URL.

**Acceptance Criteria:**
- [ ] AC-1: App deploys to Railway or Fly.io
- [ ] AC-2: Custom domain configured with SSL
- [ ] AC-3: Environment variables set (DB, Twilio, ElevenLabs, Stripe, SMTP)
- [ ] AC-4: Health check endpoint responds

### 2.5 E2E Flow Verification
**Priority:** P0

**Target:** Every user-facing flow works without errors.

**Acceptance Criteria:**
- [ ] AC-1: Signup → verify → login → onboard → dashboard (no errors)
- [ ] AC-2: Industry template selection works and affects AI behavior
- [ ] AC-3: Call comes in → AI answers → conversation logged → dashboard shows it
- [ ] AC-4: Password reset flow works
- [ ] AC-5: All dashboard pages load (calls, settings, customize AI)
- [ ] AC-6: Test suite passes (all tests green on port 3100)
- [ ] AC-7: No console errors on any page
- [ ] AC-8: Mobile responsive on all pages

### 2.6 Calendar Stub (Graceful Degradation)
**Priority:** P1

**Target:** Remove hard dependency on Google OAuth. Calendar features show "coming soon."

**Acceptance Criteria:**
- [ ] AC-1: Calendar settings page shows "Coming Soon — Google Calendar integration"
- [ ] AC-2: No OAuth errors thrown anywhere
- [ ] AC-3: Calendar routes don't crash the app
- [ ] AC-4: Dashboard doesn't show broken calendar widgets

---

## 3. Out of Scope (Phase 2)
- Google Calendar real-time booking
- Visual flow builder
- White-label
- Concurrent call scaling
- Usage-based pricing
- SOC2/GDPR

## 4. Technical Notes
- Stack: Node.js, Express, Supabase Postgres, ElevenLabs, Twilio
- Port: 3100 (dev), configurable via PORT env
- 9 industry templates (plumber, law, medical, restaurant, salon, auto, dental, HVAC, real estate)
- Existing test suite: test.sh + tests/test-core.js + tests/test-production-ready.js
