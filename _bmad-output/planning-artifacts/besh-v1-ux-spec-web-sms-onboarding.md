# Besh v1 UX Spec — Web + SMS Onboarding

## Goal
Deliver Tomo-parity onboarding with Apple/Anthropic-level polish: clear hierarchy, calm motion, crisp copy, fast path to first value in <60s.

## UX Principles
1. **One primary action per screen**
2. **Progressive disclosure** (no overload)
3. **Trust-first microcopy** (privacy + control)
4. **Native-first channel handoff** (web -> SMS)
5. **Error recovery in 1 tap**

## Design System (Concise)
### Typography
- Display: 44/52, semibold
- H1: 32/40, semibold
- Body L: 18/28, regular
- Body: 16/24, regular
- Label: 14/20, medium
- Meta: 12/16, medium

### Spacing (8pt grid)
- 4, 8, 12, 16, 24, 32, 40, 56, 72
- Card padding: 24
- Screen side gutters: 20 mobile / 32 desktop

### Color/contrast
- Dark default, high contrast text >= 4.5:1
- Primary CTA contrast >= 7:1
- Error #FF4D4F, Success #22C55E, Info #60A5FA

### Motion
- Duration: 120–220ms
- Easing: `cubic-bezier(.2,.8,.2,1)`
- No decorative motion blocking task completion

## Onboarding Flow (Web -> SMS)
1. **Welcome**
   - Headline: “It all starts with one text.”
   - CTA: “Get started”
2. **Phone entry**
   - Auto-format + country code assumptions
   - Inline validation
3. **OTP verify**
   - 6-digit segmented input, paste support
   - Resend at 30s with visible timer
4. **Personalization quickstart**
   - Name, top goal, reminder time
5. **SMS handoff**
   - “Text sent to your number. Reply to begin.”
6. **Success**
   - “You’re set. First nudge arrives today.”

## SMS Copy Deck (v1)
- Welcome: "Hey {{name}} — I’m Besh. Want to lock in your top goal this week?"
- Goal prompt: "What’s the one thing you want done by Friday?"
- Reminder prompt: "What time should I nudge you daily?"
- Confirmation: "Perfect. I’ll check in at {{time}} and keep you accountable."
- Recovery: "Didn’t catch that—reply with just the time (e.g. 8:30 PM)."

## Microinteraction Details
- OTP field auto-advance + backspace rewind
- Enter key submits only when valid
- Disabled states include reason text
- Error toast + inline message + field focus return
- Haptic feedback (mobile) on success and error

## Edge States
- Invalid phone -> inline correction, keep input
- OTP expired -> one-tap resend, preserve digits if possible
- Network timeout -> retry with optimistic restore
- Duplicate number -> route to login path

## Accessibility
- Full keyboard path
- Screen reader labels for every input/action
- Focus ring always visible
- Reduced-motion mode supported

## Better-than-Tomo Deltas
1. Explicit progress indicator (step 1/4)
2. Stronger inline validation and recovery
3. Trust panel: “What we store / how to delete”
4. Better OTP UX (paste, auto-advance, resend timer)

## Handoff Checklist
- [ ] Visual tokens mapped in CSS vars
- [ ] Component states documented (default/hover/focus/error)
- [ ] Copy frozen for v1
- [ ] Analytics events wired

## UX Analytics Events
- `onboarding_start`
- `phone_submitted`
- `otp_verified`
- `profile_completed`
- `sms_handoff_success`
- `onboarding_complete`
