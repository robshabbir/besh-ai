# Competitive Intelligence & Best Practices Research
**Author:** Dev2 (Researcher role) | **Date:** Feb 21, 2026

---

## 1. Competitive Feature Matrix

| Feature | Calva AI | Synthflow | Bland AI | Goodcall | Smith.ai |
|---------|----------|-----------|----------|----------|----------|
| **Target Market** | SMB ($49-199/mo) | Enterprise (usage-based) | Enterprise (custom) | SMB/Mid-market | SMB/Legal ($300+/mo) |
| **Pricing** | $49/$99/$199 flat | $0.15-0.24/min | Custom/enterprise | Not public | $300/30 calls ($10/call) |
| **Voice Quality** | ElevenLabs + Gemini | ElevenLabs native | Custom fine-tuned models | Google-born proprietary | Human agents + AI |
| **Setup Time** | ~5 min (wizard) | Minutes (visual flows) | Weeks (enterprise) | Minutes (no-code) | Days (human training) |
| **Phone Integration** | Twilio | Native + Twilio + BYOT | Custom SIP | Dedicated numbers | Dedicated numbers |
| **Calendar Booking** | Phase 2 (SMS capture) | ✅ Real-time | Via API | ✅ CRM + Calendar | ✅ CRM + Calendar |
| **CRM Integration** | Webhook + HubSpot | API + integrations | Full custom | ServiceTitan, Sheets, Zapier | HubSpot, Salesforce, Clio |
| **Industry Templates** | 9 templates | Flow-based (any) | Custom per client | General purpose | Legal-focused |
| **Languages** | English | 30+ | Any language | Multiple | English (human agents) |
| **Concurrent Calls** | 1 (Phase 1) | 5 free + $20/extra | 1M+ | Unlimited | Human-staffed |
| **Visual Flow Builder** | ❌ Phase 2 | ✅ Full editor | API-only | ✅ No-code builder | N/A (human) |
| **White Label** | ❌ | $2K/mo | ✅ | ❌ | ❌ |
| **Analytics Dashboard** | ✅ Basic | ✅ | ✅ Enterprise | ✅ Advanced | ✅ |
| **SMS/Chat** | SMS notifications | ✅ Omni-channel | ✅ Calls + SMS + Chat | ❌ Phone only | ✅ Chat + phone |
| **Live Demo on Site** | ✅ ElevenLabs widget | ✅ Flow preview + audio | ✅ Live call demo | ❌ | ❌ |

### Key Takeaways
1. **Calva's price is our biggest advantage** — Smith.ai charges $10/call, Synthflow $0.15-0.24/min. Our $49/mo flat rate is 5-10x cheaper for typical SMB volumes (20-50 calls/mo).
2. **Goodcall is our closest competitor** — SMB-focused, born from Google, no-code setup, 42K+ agents launched. But their pricing isn't public (likely higher).
3. **Bland AI is not our competition** — they're enterprise-only with custom models, forward-deployed engineers, $M+ deals.
4. **Smith.ai uses human agents** — expensive but high quality. We compete on price, they compete on quality.

---

## 2. Best Practices: AI Voice Agent UX

### What Makes Voice AI Feel Human

**Turn-taking patterns (critical):**
- Use backchanneling ("mmhmm", "right", "got it") during caller speech — Synthflow does this
- Add natural filler words sparingly ("let me check on that", "one moment")
- Don't interrupt — wait 300-500ms after caller stops before responding
- Handle interruptions gracefully — stop talking immediately when caller starts

**Voice selection:**
- Match voice to industry (warm female for medical, professional male for law)
- ElevenLabs v3 models sound significantly more natural than flash_v2
- Stability: 0.4-0.6 range sounds most human (too stable = robotic, too variable = drunk)

**Error recovery:**
- "I didn't quite catch that — could you say that again?"
- After 2 misheards: "I'm having a little trouble hearing you. Could you spell that for me?"
- After 3: "Let me connect you to someone who can help directly."

**Handoff to human:**
- Offer proactively for complex issues ("This sounds like something our team should handle directly")
- Warm transfer with context ("I'm connecting you to Mike — I've let him know about your drain issue")
- Never force callers to stay with AI

### What Goodcall Gets Right (Learn From Them)
- **97% caller interaction rate** — callers actually engage with their AI
- **ServiceTitan integration** — field service businesses (plumbers, HVAC) use this
- **Conditional call forwarding** — try human first, AI as backup (genius UX)
- **Call analytics** — automation rate, call duration, new vs return caller, intent breakdown

---

## 3. SMB Onboarding Best Practices

### Time to Value
- **Best-in-class: < 5 minutes** (Goodcall, Synthflow)
- **Calva current: ~5 min** — on par, but can improve
- Key insight: Show value BEFORE asking for payment (let them hear the AI first)

### Wizard vs Guided Setup
- **Template-first wins for SMB** — our approach is correct
- Show the template working immediately (live preview of greeting)
- Let them customize after seeing the default work

### Progressive Disclosure
- **Step 1:** Basic info (business name, industry) — required
- **Step 2:** Customize greeting — optional but shown
- **Step 3:** Advanced (hours, FAQs, knowledge base) — hidden behind "Advanced" toggle
- **Step 4:** Phone setup — the "aha moment"

### What We're Missing
- **Audio preview during onboarding** — let them hear the AI voice saying their greeting BEFORE going live
- **Test call button** — "Call your AI receptionist now to hear how it sounds"
- **Progressive trust building** — show social proof at each step

---

## 4. Landing Page Conversion Patterns

### What Works for Voice AI Products

**Hero Section:**
- Synthflow: Live flow preview + audio samples (interactive)
- Bland: "Receive a call now" (phone number input → instant demo call)
- Goodcall: Stats-first (97% interaction rate, 4.7M calls handled)
- **Winner: Interactive demo** — let people experience it, don't just describe it

**Demo Patterns:**
- **Best: "Call our AI now"** — Bland does this. Callers enter phone number, receive AI call instantly. Most convincing demo possible.
- **Good: In-page voice widget** — what we have. ElevenLabs embed.
- **Okay: Audio samples** — pre-recorded conversations. Least convincing.

**Social Proof:**
- Specific numbers > vague claims ("4,724,918 calls handled" > "trusted by thousands")
- Industry logos + use case labels ("Used by 500+ plumbing companies")
- Before/after metrics ("Reduced missed calls by 94%")

**CTA Optimization:**
- Primary: "Start Free" or "Try It Free" (not "Sign Up")
- Secondary: "See It In Action" (demo)
- Avoid: "Contact Sales" (screams enterprise, kills SMB conversion)

### Specific Recommendations for Calva

1. **Add "Call Our AI" demo** — let visitors enter their phone number and receive a demo call from the plumbing template. This is the #1 conversion driver for voice AI products.
2. **Add real metrics** — we have 15 tenants and real call data. Show "X calls answered" counter.
3. **Simplify pricing page** — 3 tiers is fine, but highlight the $49 starter more aggressively. "Less than $2/day."
4. **Industry-specific landing pages** — /plumbers, /lawyers, /salons with tailored copy and demo agent.
5. **Trust signals** — "Powered by Twilio + ElevenLabs" badges. Known brands build trust.

---

## 5. Priority Recommendations for Launch

### P0 — Do Before Launch
1. ~~Fix voice demo widget~~ ✅ Done
2. ~~Fix test suite~~ ✅ Done
3. ~~Calendar graceful degradation~~ ✅ Done
4. Stripe billing (blocked on keys)
5. SMTP email (blocked on provider)
6. Domain + deploy (blocked on domain)

### P1 — Do Within First Week
7. **"Call Our AI" demo** — phone number input on landing page, instant demo call
8. **Audio preview in onboarding** — hear your greeting before going live
9. **Real-time call counter** on landing page
10. **ServiceTitan integration** — #1 CRM for plumbers/HVAC

### P2 — Do Within First Month
11. Visual flow builder (compete with Synthflow/Goodcall)
12. Multi-language support
13. SMS/chat channels
14. Conditional call forwarding (try human first, AI backup)
15. Advanced analytics dashboard

---

## Sources
- Synthflow: synthflow.ai (pricing page, feature page)
- Bland AI: bland.ai (homepage, enterprise page)
- Goodcall: goodcall.com (homepage, FAQ, features)
- Smith.ai: smith.ai/pricing (pricing page)
- Industry data from product pages and public documentation
