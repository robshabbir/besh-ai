# UX Audit — Calva AI (Apple Standard)
**Role:** Sally (UX Designer) | **Date:** Feb 21, 2026

---

## Landing Page (index.html) — Score: 7/10

### Critical
1. **No live call transfer mention** — Competitors highlight this. Users want to know the AI can hand off to a human. Add a feature card: "Seamless transfer to you when needed."
2. **No social proof numbers** — Goodcall shows "4.7M+ calls handled, 42K+ agents." We show nothing. Add a stats bar.
3. **No demo phone number** — "Call us now to hear our AI" is the #1 conversion driver for voice products. Synthflow and Bland both offer live phone demos.

### High
4. **Industry pages are thin** — `/industries/plumbers.html` etc. exist but are templated shells. Need real content, testimonials, specific pain points.
5. **No ROI calculator** — Missing opportunity on pricing section. "Calculate your savings" would boost conversion.
6. **1929 lines in one file** — Unmaintainable. Should be componentized (separate CSS, JS files at minimum).
7. **Hero phone demo is scripted animation** — Users may think the real product is scripted too. Add a note: "This is a simulation. Try the real thing below →"

### Polish
8. **Pricing section CTAs** — All say "Start Free Trial" but there's no free trial yet. Change to "Get Started" until trial is live.
9. **Footer links** — Privacy, Terms pages exist but are minimal. Fine for launch.
10. **Dark mode only** — Landing page is dark theme, dashboard is light. Intentional contrast, but jarring transition.

---

## Login Page (login.html) — Score: 9/10

### Polish
1. **No "Show password" toggle** — Minor but expected in 2026. Add eye icon.
2. **No rate-limit feedback** — If locked out after failed attempts, show friendly message.

Overall: Clean, focused, good UX. Very close to Apple standard.

---

## Onboarding (onboard.html) — Score: 8/10

### High
1. **No voice preview during setup** — After configuring greeting + industry, play a sample AI greeting with their business name. This is the "aha moment" — don't miss it.
2. **Step 5 (Payment) requires Stripe** — Currently broken. Show "Free during beta" or skip step.
3. **Step 4 (Phone) provisions a Twilio number** — If Twilio fails, no error recovery. Add: "We'll set up your number — if there's an issue, we'll email you."

### Polish
4. **Template cards could show sample greetings** — Let users hear what each industry template sounds like before choosing.
5. **Progress bar could show time estimate** — "~3 minutes remaining"

---

## Dashboard (dashboard/index.html) — Score: 7.5/10

### Critical
1. **No call playback** — Calls are logged but can't be replayed. Add audio player for call recordings.
2. **No quick actions** — Dashboard should have "Call back" button next to missed calls.

### High
3. **Empty state for new users** — Shows "—" for all stats. Should show a friendly onboarding checklist: "✅ Account created → Forward your calls → Get your first call"
4. **Customize AI page** — Greeting text field with no preview. Add "▶ Play" button to hear the greeting.
5. **No search/filter on calls** — Can't search calls by name, intent, or date. Critical once volume grows.

### Polish
6. **Skeleton loading added** ✅ (Dev2 already did this)
7. **Toast notifications added** ✅ (Dev2 already did this)
8. **Sidebar should show current plan** — "Pro Plan • 14 days left in trial"

---

## Settings (settings.html) — Score: 7/10

### High
1. **Calendar "Coming Soon"** ✅ (Dev2 fixed this)
2. **No webhook test button** — "Test Webhook" would help users verify integration works.
3. **API key section** — Good that it's hidden by default. Add a "Generate new key" button.

### Polish
4. **Integration section** — ServiceTitan, HubSpot logos would look more professional than plain text.

---

## Pricing (pricing.html) — Score: 6.5/10

### Critical
1. **No comparison to alternatives** — Add: "vs. $300-2100/mo for human receptionist (Smith.ai)" to anchor value.
2. **No ROI calculator** — Missing biggest conversion tool.
3. **"Start Free Trial" buttons but no trial** — Fix copy or implement trial.

### High
4. **Feature comparison table** — Show what's in each tier. Currently just price + vague descriptions.
5. **No FAQ section** — Common questions: "Can I cancel anytime?", "Is there a contract?", "How many calls included?"
6. **No annual pricing toggle** — Standard SaaS pattern. Offer 2 months free for annual.

---

## Forgot Password (forgot-password.html) — Score: 8/10

### Polish
1. **No "check your email" state** — After submitting, show: "Check your inbox for a reset link. Didn't get it? Resend."
2. **Page is very minimal** — 60 lines is fine, but add a "Back to login" link prominently.

---

## Top 10 Actions (Priority Order)

| # | Action | Impact | Effort | Page |
|---|--------|--------|--------|------|
| 1 | Add live call transfer to AI | Critical — table stakes | 2-3 hrs | conversation-relay |
| 2 | Add demo phone number to landing page | High conversion | 1 hr | index.html |
| 3 | Add voice preview to onboarding (play greeting) | Aha moment | 2 hrs | onboard.html |
| 4 | Add ROI calculator to pricing | Conversion boost | 2 hrs | pricing.html |
| 5 | Add social proof stats bar to landing | Trust signals | 30 min | index.html |
| 6 | Add call playback in dashboard | User retention | 2-3 hrs | dashboard |
| 7 | Improve dashboard empty state (onboarding checklist) | First-time UX | 1 hr | dashboard |
| 8 | Fix pricing page (comparison, FAQ, features) | Conversion | 2 hrs | pricing.html |
| 9 | Add "Play greeting" to Customize AI | Polish | 1 hr | dashboard |
| 10 | Add call search/filter | Usability | 2 hrs | dashboard |
