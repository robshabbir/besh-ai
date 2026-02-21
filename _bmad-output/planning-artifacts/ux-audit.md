# UX Audit — Calva AI (Apple Standard)
**Author:** Dev2 (UX Designer role) | **Date:** Feb 21, 2026

---

## Landing Page (index.html) — Score: 6/10

### Critical
1. **1921 lines, unmaintainable** — This needs to be broken into components. One change risks breaking everything. No Apple product ships with a monolithic HTML file.
   - **Fix:** Extract sections into partials or use a simple template engine
   
2. **No "Call Our AI" demo** — The #1 conversion driver for voice AI products is missing. Visitors can use the ElevenLabs widget, but entering a phone number and receiving a CALL is 10x more convincing.
   - **Fix:** Add phone number input in hero → trigger Twilio API call with demo agent

3. **Hero phone animation is scripted, not real** — The conversation bubbles are pre-written JavaScript animations. Users might think this is the actual demo and be disappointed.
   - **Fix:** Label it clearly as "Example conversation" or replace with real widget

### High
4. **No accessibility (ARIA labels)** — Only 1 aria attribute in 1921 lines. Screen readers can't navigate this page.
   - **Fix:** Add `aria-label` to all interactive elements, `role="navigation"`, `role="main"`, landmark regions

5. **No focus styles on landing page** — Tab-through navigation is invisible. Keyboard users can't see where they are.
   - **Fix:** Add `focus-visible:ring-2 focus-visible:ring-indigo-500` to all interactive elements

6. **Color contrast issues** — `text-dark-400` and `text-dark-500` on dark background may fail WCAG AA (4.5:1 minimum).
   - **Fix:** Audit with contrast checker, bump to `text-dark-300` minimum

7. **Industry selector doesn't change demo behavior** — Only plumbing has a real agent. Other industries just change the label.
   - **Fix:** Already improved (shows note + highlights card). Phase 2: separate agents per industry.

### Polish
8. **Phone frame fixed at 340px** — Already added `max-w-[90vw]` but the internal elements may still overflow on 320px screens.
9. **Footer could be more useful** — Add links to docs, API reference, blog
10. **"Trusted by" section missing** — Need social proof badges

---

## Login Page (login.html) — Score: 8.5/10

### High
1. **No loading skeleton** — Page shows instantly (it's simple), but the login button loading state is good.

### Polish
2. **Could add "Show password" toggle** — Standard UX pattern
3. **Forgot password link is low-contrast gray** — Make it more visible

**Verdict:** Clean, well-designed. Minor improvements only.

---

## Onboarding (onboard.html) — Score: 7/10

### Critical
1. **No audio preview** — Users complete 6 steps without ever HEARING their AI receptionist. The "aha moment" should happen DURING onboarding, not after.
   - **Fix:** After step 3 (Customize), add "Listen to your AI" button that plays TTS of their greeting

### High
2. **Step 5 (Payment) with no Stripe** — This step will break without Stripe keys. Need graceful handling.
   - **Fix:** Show "Free trial — no credit card required" and skip payment step

3. **Template cards need audio samples** — Each industry template should have a "Listen" button so users can hear the voice.

4. **6 steps feels long** — Can we reduce to 4? Combine Account + Industry into one step.

### Polish
5. **Inline validation added ✅** — Good improvement from yesterday
6. **Progress bar overflows on small screens** — `min-w-[600px]` with overflow-x-auto works but feels janky on mobile
7. **Confetti animation on completion** — Fun touch, keep it

---

## Dashboard (dashboard/index.html) — Score: 7/10

### Critical
1. **No skeleton loading states** — Shimmer CSS added but not wired to actual data loading. Stats show "—" instead of animated skeleton.
   - **Fix:** Show skeleton div, then fade to real data when API returns

### High
2. **Zero ARIA attributes** — Dashboard is completely inaccessible to screen readers.
   - **Fix:** Add landmark roles, aria-labels for nav items, live regions for dynamic content

3. **Call list table not responsive** — Table will overflow on mobile. Need card layout for small screens.
   - **Fix:** `<table>` on desktop, stacked cards on mobile (hidden md:table-row)

4. **Toast system added ✅** — Good. Now wire it to all async operations (not just save).

### Polish
5. **Sidebar could show active call count** — Real-time indicator
6. **Settings page calendar "Coming Soon" ✅** — Good improvement
7. **Empty state for calls is good** — Friendly message with clear CTA

---

## Settings (settings.html) — Score: 6.5/10

### High
1. **Long scrolling form** — Should be organized into tabs or accordion sections (Business Info / Integrations / Notifications / Advanced).
   - **Fix:** Add tab navigation at top

2. **No save confirmation at top** — Save button is at bottom. User scrolls down, saves, can't see confirmation.
   - **Fix:** Sticky save bar at bottom + toast notification

3. **Calendar Coming Soon ✅** — Good improvement

### Polish
4. **Webhook URL input has no validation** — Should validate URL format
5. **Phone number formatting** — Auto-format as user types

---

## Pricing (pricing.html) — Score: 7/10

### High
1. **$49 starter should be more prominent** — SMBs are price-sensitive. The cheapest plan should be the visual anchor.
2. **No "per day" framing** — "$49/mo" vs "Less than $2/day" — the latter feels cheaper
3. **Feature comparison table needed** — What exactly do you get at each tier?

### Polish
4. **No FAQ section** — Common questions about minutes, limits, etc.
5. **Annual discount option** — Standard SaaS pattern, increases LTV

---

## Global Issues (All Pages)

### Critical
- **WCAG 2.1 AA compliance: FAIL** — Almost zero ARIA attributes across the entire app. This needs systematic remediation.
- **No skip-to-content links** — Keyboard users must tab through entire nav on every page.

### High  
- **Inconsistent button styles** — Some pages use `bg-indigo-600`, others use gradients. Need a design system.
- **No dark mode** — Dashboard is light, landing page is dark. Inconsistent.
- **No error boundary** — If API fails, pages may break silently. Need global error handler.

### Summary
The product looks good for a first sprint. The landing page demo, onboarding wizard, and dashboard are functional. But to reach Apple-level quality:
1. **Accessibility is the #1 gap** — must be fixed before launch
2. **Audio previews** will transform onboarding conversion
3. **"Call Our AI" demo** is the killer feature for the landing page
4. **Design system consistency** needs a pass
