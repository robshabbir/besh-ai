# UX Audit — Calva AI (Apple Standard)
**Date:** Feb 21, 2026 | **Role:** UX Designer (Dev2)
**Standard:** Jony Ive / Apple HIG level

---

## Landing Page (index.html) — Score: 6/10

### Critical
1. **No pre-recorded demo fallback** — If user denies mic permission, demo is useless. Need auto-playing sample conversation.
2. **1894 lines monolithic HTML** — Unmaintainable. Components should be separate files loaded dynamically.

### High
3. **No social proof anywhere** — No testimonials, no metrics, no logos. Kills trust. Even "Join 500+ businesses" helps.
4. **Hero phone animation is scripted** — Looks impressive but users may think it's the actual AI. Needs subtle "simulated conversation" label.
5. **Industry selector doesn't switch voice agent** — Note says "plumbing template only" which undermines the multi-industry pitch.
6. **Phone frame fixed width (340px)** — Added max-w-[90vw] but still may break at 320px.

### Polish  
7. **Fade-up animations on every section** — Too many. Apple uses motion sparingly — 2-3 key moments, not 15.
8. **Font loading** — No explicit font-display:swap, may flash unstyled.

---

## Login Page — Score: 8/10

### High
1. **No "show password" toggle** — Standard UX pattern missing.

### Polish
2. **Focus ring could be more visible** — Default ring-2 is subtle. Apple uses a prominent blue ring.
3. **No loading skeleton** — Button shows "Signing in..." which is good, but could animate.

---

## Onboarding (onboard.html) — Score: 7/10

### Critical
1. **6 steps is too many** — Industry best practice is 3-5. Combine Account + Industry into step 1. Move Payment after test call.

### High
2. **No "test your AI" step** — User should hear their receptionist BEFORE paying. This is the #1 conversion driver.
3. **Progress bar requires horizontal scroll on mobile** — `min-w-[600px]` breaks on phones.
4. **No inline validation on Step 3 (Customize)** — Only Step 1 has it now.

### Polish
5. **Template cards could show a sample conversation** — Instead of just description, show 2-line preview dialogue.
6. **Step transitions could be smoother** — fade-in is good but no exit animation.

---

## Dashboard — Score: 7/10

### High
1. **No skeleton loading states** — Stats show "—" while loading. Should show animated skeleton bars.
2. **Call table empty state is plain** — "No calls yet" with just text. Should have illustration + CTA ("Make a test call").
3. **No real-time updates** — Dashboard doesn't auto-refresh. New calls require page reload.

### Polish
4. **Toast notifications added** ✅ — Good.
5. **Sidebar doesn't highlight current page on direct navigation** — Only works with SPA nav.
6. **Mobile sidebar could use swipe gesture** — Currently click-only toggle.

---

## Settings Page — Score: 6/10

### High
1. **Calendar section updated to Coming Soon** ✅ — Good.
2. **No form validation** — Settings fields have no inline validation.
3. **Webhook URL field has no test button** — User can't verify their webhook works.

### Polish
4. **API key reveal needs copy-to-clipboard toast** — Currently just changes button text.

---

## Pricing Page — Score: 7/10

### High
1. **No annual pricing toggle** — Industry standard to show monthly vs annual.
2. **No feature comparison table** — Just cards. Users want to compare side-by-side.
3. **No FAQ section** — Pricing pages need FAQ (Synthflow and Goodcall both have this).

### Polish
4. **CTA could be more prominent** — "Start Free Trial" vs "Get Started" — trial language converts better.

---

## Global Issues

### Accessibility (WCAG 2.1 AA)
- **Landing page:** Only 1 aria attribute in 1894 lines. Needs aria-labels on buttons, alt text on decorative elements, skip navigation link.
- **Color contrast:** Dark theme on landing page needs verification — light gray text on dark background may fail 4.5:1 ratio.
- **Focus management:** No visible focus indicators on landing page interactive elements.
- **Screen reader:** No skip-to-content link on any page.

### Mobile (375px)
- **Landing page:** Phone frame + demo panel need testing at 375px. Grid may stack poorly.
- **Onboarding:** Progress bar overflows (min-w-[600px]).
- **Dashboard:** Sidebar behavior good (toggle + overlay).

---

## Top 10 Fixes (Priority Order)

| # | Fix | Page | Impact | Effort |
|---|-----|------|--------|--------|
| 1 | Add pre-recorded demo (no mic needed) | Landing | High — unblocks demo for all visitors | 2hr |
| 2 | Reduce onboarding to 4 steps | Onboard | High — improve completion rate | 2hr |
| 3 | Add social proof section | Landing | High — trust signal | 30min |
| 4 | Add "test your AI" before payment | Onboard | High — conversion driver | 3hr |
| 5 | Fix onboarding progress bar mobile | Onboard | Medium — mobile broken | 30min |
| 6 | Add skeleton loading to dashboard | Dashboard | Medium — perceived performance | 1hr |
| 7 | Add accessibility basics (aria, skip nav, alt) | All | Medium — compliance | 2hr |
| 8 | Add pricing FAQ section | Pricing | Medium — reduces support | 1hr |
| 9 | Show password toggle on login | Login | Low — standard UX | 15min |
| 10 | Reduce landing page animations | Landing | Low — Apple restraint | 30min |
