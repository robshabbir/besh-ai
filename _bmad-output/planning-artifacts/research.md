# Competitive Research — Calva AI
**Date:** Feb 21, 2026 | **Role:** Researcher (Dev2)

---

## 1. Competitive Feature Matrix

| Feature | Calva ($49-199/mo) | Goodcall ($79-249/mo) | Smith.ai ($300-2100/mo) | Synthflow ($0.15-0.24/min) |
|---------|------|---------|---------|-----------|
| **Target** | SMB (1-20 emp) | SMB-Mid | SMB-Enterprise | Enterprise |
| **Pricing** | Flat monthly | Per agent + per customer | Per call ($8.50-11.50/call) | Per minute |
| **Setup time** | ~5 min wizard | Minutes | Human onboarding | Complex |
| **Voice quality** | ElevenLabs | Proprietary (ex-Google) | Human agents + AI | ElevenLabs |
| **24/7** | ✅ | ✅ | ✅ (human staffed) | ✅ |
| **Industry templates** | ✅ 9 templates | ✅ | ❌ Custom only | ✅ Flow builder |
| **Calendar booking** | ❌ Phase 2 | ✅ Google/CRM | ✅ | ✅ |
| **CRM integration** | ❌ Phase 2 | ✅ ServiceTitan, HubSpot | ✅ HubSpot, Salesforce, Clio | ✅ |
| **SMS notifications** | ✅ | ✅ | ✅ | ✅ |
| **Email notifications** | ✅ | ✅ Google Sheets | ✅ Dashboard | ✅ |
| **Call analytics** | ✅ Basic | ✅ Rich dashboard | ✅ Rich | ✅ |
| **Unique customers cap** | Unlimited | 100-500/mo (+$0.50 ea) | By call volume | Unlimited |
| **White-label** | ❌ | ❌ | ❌ | ✅ $2K/mo |
| **Visual flow builder** | ❌ | ✅ Logic flows | ❌ | ✅ |
| **Human fallback** | ❌ | ❌ Pure AI | ✅ Core feature | ❌ |
| **Free trial** | ❌ (need Stripe) | ✅ | ✅ 30-day money-back | ✅ Free to build |

### Key Competitive Insights

1. **Calva is the cheapest AI option** — $49/mo vs Goodcall's $79/mo minimum. Smith.ai starts at $300/mo but includes human agents.

2. **Goodcall is our closest competitor** — Same target market (SMB), similar features, founded from Google 2017. They've handled 4.7M+ calls. They have ServiceTitan integration which is huge for plumbing/HVAC.

3. **Smith.ai is human-first** — Different category. They charge per call ($8.50-11.50). Not a direct AI competitor but the incumbent SMBs are leaving.

4. **Synthflow is enterprise** — Complex setup, usage-based pricing. Not competing for the same customer.

5. **Our biggest gap: No calendar booking and no CRM integrations.** Every competitor has these. Calendar is Phase 2 but CRM integrations (even just Zapier) should be high priority.

---

## 2. Best Practices: AI Voice Agent UX

### What Makes AI Voice Agents Feel Human
1. **Backchanneling** — "Mm-hmm", "Got it", "Sure" while the caller is speaking. Shows the AI is listening.
2. **Filler words** — Occasional "let me check on that" or "one moment" before responses. Bridges the LLM latency.
3. **Name usage** — Use the caller's name once they provide it. Creates connection.
4. **Warm handoff** — When transferring to human: "I'm going to connect you with [name], I've filled them in on what you need."
5. **Error recovery** — "I didn't quite catch that, could you say that again?" not "I'm sorry, I didn't understand."
6. **Conversation memory** — Reference earlier parts of the call: "You mentioned the leak is in the kitchen..."

### Recommendations for Calva
- [ ] Add filler phrases during LLM processing ("Let me look into that for you...")
- [ ] Add backchanneling sounds to the voice pipeline
- [ ] Use caller's name after collection
- [ ] Improve error recovery phrasing

---

## 3. SMB Onboarding Best Practices

### Industry Benchmarks
- **Time to first value:** Best SaaS products deliver value in <3 minutes
- **Wizard completion rate:** 3-5 steps optimal. 6+ steps drops completion by 30%
- **Template-first wins:** Pre-filled templates beat blank canvas 4:1 for non-technical users

### Calva Assessment
- ✅ Template-first approach (good)
- ⚠️ 6-step wizard (borderline — consider combining Account + Industry into one step)
- ⚠️ Payment step before value (consider letting them configure + test call before paying)
- ❌ No "try before you buy" — Goodcall has free trial, we don't

### Recommendations
- [ ] Combine steps 1+2 (Account + Industry) into single step
- [ ] Move Payment to AFTER test call (let them hear their AI first)
- [ ] Add a "Test your AI" step before payment — let them call their own number
- [ ] Add progress indicator showing "2 min remaining"

---

## 4. Landing Page Conversion

### Best Practices for AI/Voice Products
1. **Interactive demo above the fold** — Let visitors try the AI immediately (Synthflow does this well)
2. **Social proof near CTA** — "4.7M+ calls handled" (Goodcall), star ratings, logos
3. **Problem → Solution framing** — Lead with the pain ("Missing calls?"), not the tech
4. **Pricing transparency** — Show pricing on the landing page, not behind a "Contact Sales" wall
5. **Industry-specific pages** — /plumbers, /lawyers, /salons with tailored messaging

### Calva Assessment
- ✅ Interactive voice demo (just fixed)
- ✅ Pricing visible
- ✅ Industry-specific content
- ⚠️ No social proof (no reviews, no call count, no logos)
- ⚠️ Demo requires mic permission before showing value
- ❌ No industry-specific landing pages (we have the templates but no dedicated pages)

### Recommendations
- [ ] Add social proof section (even placeholder: "Join 100+ businesses")
- [ ] Add industry-specific landing pages (/plumbers, /lawyers — we have templates already)
- [ ] Show a pre-recorded demo conversation that auto-plays (no mic needed) with option to try live
- [ ] Add "as seen in" logos section (even if aspirational)

---

## 5. Priority Ranking for Launch

### Must-Do Before Launch
1. **Stripe billing** — Can't charge without it (BLOCKED)
2. **SMTP email** — Verification flow broken (BLOCKED)
3. **Domain** — Need a URL (BLOCKED)
4. **Free trial mechanism** — Let users try before paying

### Should-Do Within 2 Weeks Post-Launch
5. **Zapier integration** — Connects to 5000+ apps, covers CRM gap
6. **Pre-recorded demo** — Landing page demo that works without mic
7. **Onboarding streamlined** — 6 steps → 4 steps
8. **Social proof section** — Even placeholder metrics

### Phase 2 (Month 2-3)
9. **Google Calendar booking**
10. **ServiceTitan integration** (huge for plumbing/HVAC)
11. **Industry landing pages**
12. **Visual flow builder (lite)**
