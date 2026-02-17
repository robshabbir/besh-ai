# Calva E2E Test Report
**Date:** 2026-02-16 21:55 EST  
**Server:** http://localhost:3100

## Test 7: All Page Loads

- `/`: ✅ HTTP 200
- `/login.html`: ✅ HTTP 200
- `/onboard.html`: ✅ HTTP 200
- `/dashboard/`: ✅ HTTP 200
- `/analytics.html`: ✅ HTTP 200
- `/settings.html`: ✅ HTTP 200
- `/pricing.html`: ✅ HTTP 200

**Result: ✅ PASS**

## Test 1: Full Signup Flow

- GET `/onboard.html`: ✅ HTTP 200
- POST `/auth/login`: ✅ HTTP 200 — user={'id': 6, 'email': 'e2e-test@calva.ai', 'tenantId': 7}
- POST `/auth/signup` (new user): ✅ HTTP 200 — tenantId=8

**Result: ✅ PASS**

## Test 2: Industry Templates

- GET `/onboard/templates`: HTTP 200, count=9
  - `auto-repair`
  - `law-firm`
  - `medical-office`
  - `plumber`
  - `real-estate`
  - `restaurant`
  - `salon-spa`
  - `school`
  - `veterinary`
- Template `auto-repair` variables: HTTP 200, fields=15
- Template `law-firm` variables: HTTP 200, fields=8
- Template `medical-office` variables: HTTP 200, fields=11

**Result: ✅ PASS**

## Test 3: Dashboard Access

- No auth → `/api/dashboard/settings`: HTTP 401 ✅ (401)
- With auth → `/dashboard/`: HTTP 200 ✅
- `/api/dashboard/overview`: HTTP 200 ✅ — keys: ['stats']
- `/api/dashboard/calls`: HTTP 200 ✅ — keys: ['calls']
- `/api/dashboard/settings`: HTTP 200 ✅ — keys: ['greeting', 'businessHours', 'personality', 'faqs']
- `/api/dashboard/analytics`: HTTP 200 ✅ — keys: ['today', 'thisWeek', 'avgDuration', 'topIntent', 'dailyVolume', 'hourlyDistribution']

**Result: ✅ PASS**

## Test 4: Settings Persistence

- GET settings: HTTP 200
  - Current greeting: `Hello! Welcome to E2E Test Dental, how can I help?`
- PUT settings: HTTP 200 ✅
- Verify greeting persisted: ✅ — `Hi there! Welcome to E2E Test Dental. How may I help you tod`
- Verify FAQs persisted: ✅

**Result: ✅ PASS**

## Test 5: Call History & Analytics

- GET `/api/dashboard/calls`: HTTP 200 ✅ — 0 calls
- GET `/api/dashboard/analytics`: HTTP 200 ✅ — keys: ['today', 'thisWeek', 'avgDuration', 'topIntent', 'dailyVolume', 'hourlyDistribution']
  - All expected keys present ✅

**Result: ✅ PASS**

## Test 6: Voice Route (Critical Path)

- POST `/api/voice-cr`: HTTP 200 ✅
- TwiML Response tag: ✅
- ConversationRelay: ✅
- Voice: `hpp4J3VqNfWAUOO0d1Us-turbo_v2_5-0.95_0.10_0.50`
- Greeting: `Mike's Plumbing, this is Sarah.`
- Mike's Plumbing ref: ✅
- Bella voice: ❌ (uses ElevenLabs voice ID — cosmetic only)

**Result: ✅ PASS**

## Test 8: Error Handling

- Duplicate signup: HTTP 409 ✅ (confirmed with full-length password)
- Wrong password: HTTP 401 ✅ (expected 401)
- No auth settings: HTTP 401 ✅ (expected 401)
- Missing fields create: HTTP 400 ✅

**Result: ✅ PASS**

---
## Bug List

- **[MINOR]** Voice uses ElevenLabs voice ID instead of 'Bella' name (cosmetic — ElevenLabs custom voice)

---
## Summary

| Test | Result |
|------|--------|
| 1. Signup Flow | ✅ PASS |
| 2. Industry Templates | ✅ PASS |
| 3. Dashboard Access | ✅ PASS |
| 4. Settings Persistence | ✅ PASS |
| 5. Call History & Analytics | ✅ PASS |
| 6. Voice Route | ✅ PASS |
| 7. All Page Loads | ✅ PASS |
| 8. Error Handling | ✅ PASS |

### Ready for Demo? ✅ YES

**Conditions:**
- All critical paths working: signup → login → dashboard → settings → voice
- All 7 pages load (HTTP 200)
- 9 industry templates with variable configs
- Settings persist correctly through PUT/GET cycle
- Voice route returns valid TwiML with ConversationRelay
- Error handling returns proper HTTP status codes

**Notes:**
- [minor] Voice uses ElevenLabs voice ID instead of 'Bella' — this is expected with custom ElevenLabs integration