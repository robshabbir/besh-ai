# Competitive Intelligence Research — Calva AI
**Role:** Ghost (Researcher) | **Date:** Feb 21, 2026

---

## 1. Competitive Feature Matrix

| Feature | Calva ($49-199/mo) | Synthflow ($0.15-0.24/min) | Goodcall ($79-249/mo) | Bland (Enterprise) | Smith.ai ($300-2100/mo) |
|---------|-----|-----------|---------|------|---------|
| **Target Market** | SMB (1-20 emp) | Enterprise | SMB-Mid | Enterprise | SMB-Mid (legal, home services) |
| **Pricing Model** | Flat monthly | Per-minute usage | Per-agent + per-customer | Custom enterprise | Per-call ($8.50-11.50/call) |
| **Voice Quality** | ElevenLabs | ElevenLabs (native) | Proprietary (Google-born) | Custom fine-tuned | Human agents + AI |
| **Setup Time** | ~5 min wizard | Self-serve + flow builder | Minutes (no-code) | Weeks (custom) | Days (onboarding team) |
| **Industry Templates** | 9 templates | Prompt-based | General purpose | Custom per client | Legal, home services focus |
| **Calendar Integration** | Coming soon | Built-in | Google/Boulevard/CRM | Custom | Built-in |
| **CRM Integration** | Webhook only | API + integrations | ServiceTitan, HubSpot, Zapier, Sheets | Full custom | HubSpot, Salesforce, Clio, Zapier |
| **SMS Notifications** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Email Notifications** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Live Transfer** | ❌ Not yet | ✅ | ✅ | ✅ | ✅ (24/7 human backup) |
| **Multi-language** | ❌ English only | ✅ 30+ countries | ❌ | ✅ Any language | ✅ Spanish |
| **Visual Flow Builder** | ❌ | ✅ | ✅ (logic flows) | Custom | N/A |
| **White Label** | ❌ | ✅ ($2K/mo) | ❌ | ✅ | ❌ |
| **Concurrent Calls** | 1 | 5+ ($20/extra) | Unlimited | Unlimited | N/A (human) |
| **Analytics Dashboard** | Basic | Advanced | ✅ Rich insights | Custom | ✅ Dashboard |
| **Free Trial** | ❌ Not yet | ✅ Free to build | ✅ Free trial | Demo only | 30-day money-back |
| **Website Demo** | ✅ ElevenLabs widget | ✅ Flow preview | ❌ | ❌ (phone demo) | ❌ |

### Key Insight
**Calva's closest competitor is Goodcall**, not Synthflow. Both target SMBs with flat pricing and no-code setup. Goodcall is $79-249/mo vs our $49-199/mo — we're cheaper. But Goodcall has:
- ServiceTitan integration (critical for plumbers/HVAC)
- Google Calendar built-in
- Logic flows (visual)
- 42K+ agents launched, 4.7M+ calls handled (social proof)

**Smith.ai is 6-10x our price** ($300-2100/mo) — they use human agents. We're the AI alternative at 1/6th the cost.

---

## 2. Critical Feature Gaps (Priority Order)

### Must-Have Before Launch
1. **Live Call Transfer** — Every competitor has this. When the AI can't handle something, it must transfer to the business owner's cell. This is table stakes.
2. **Free Trial** — Goodcall and Synthflow both offer free trials. We need at least 14 days free.

### High Priority (Month 1)
3. **ServiceTitan / HubSpot Integration** — Goodcall lists this prominently. Plumbers use ServiceTitan. Law firms use Clio.
4. **Call Analytics** — Sentiment analysis, call scoring, intent breakdown. Goodcall has "rich business insights."
5. **Spam Call Filtering** — Smith.ai doesn't charge for spam. We should detect and skip spam calls.

### Medium Priority (Month 2-3)
6. **Visual Flow Builder** — Both Synthflow and Goodcall have this. Lets business owners customize call logic.
7. **Multi-language** — Spanish at minimum for US market.
8. **Concurrent Calls** — Handle multiple simultaneous calls.

---

## 3. Best Practices: AI Voice Agent UX

### Conversation Design (What Makes AI Sound Human)
1. **Backchanneling** — "Mm-hmm", "Got it", "Right" while caller speaks. Shows active listening.
2. **Filler words** — Occasional "Let me check on that for you" instead of instant responses. Too-fast replies feel robotic.
3. **Name usage** — Use caller's name once or twice (not every sentence). "John, we can definitely help with that."
4. **Varied responses** — Don't repeat the same phrase. Have 3-4 variants for confirmations.
5. **Graceful recovery** — "I'm sorry, I didn't quite catch that. Could you say that again?" instead of silence.
6. **Warm handoff** — "Let me connect you with Mike directly — one moment" before transfer.

### Trust Signals on Landing Pages
1. **Real-time demo** (we have this — competitive advantage!)
2. **Call count / social proof** — Goodcall shows "4.7M+ calls handled"
3. **Industry-specific testimonials** — Plumber quote, lawyer quote, etc.
4. **"Hear it yourself"** button — Phone number to call the AI (Synthflow does this)
5. **Setup time guarantee** — "5 minutes to your first call"

---

## 4. SMB Onboarding Best Practices

### Time to Value Benchmarks
- **Best-in-class:** Under 5 minutes to working product (Goodcall claims "minutes")
- **Acceptable:** Under 15 minutes
- **Bad:** Over 30 minutes

### What Works
1. **Template-first** — Don't make users configure from scratch. Pick industry → 80% configured.
2. **Progressive disclosure** — Start simple (name, industry), add complexity later (FAQs, hours, pricing).
3. **Instant gratification** — After onboarding, immediately show the AI greeting. Let them hear it.
4. **No credit card for trial** — Reduces friction 3-5x.

### Our Assessment
Calva's onboarding is solid (6-step wizard, industry templates). Missing: hearing the AI voice during onboarding (step 3 should play a sample greeting with their business name).

---

## 5. Landing Page Conversion Patterns

### What Converts for Voice AI Products
1. **Interactive demo above fold** — We have this. Keep it.
2. **Phone number to call** — "Call (555) 123-4567 right now to hear our AI". Synthflow does this. We should add a demo phone number.
3. **Before/after comparison** — "Without Calva: missed calls, lost revenue. With Calva: 24/7, every call answered."
4. **ROI calculator** — "If you miss 10 calls/week at $200 avg job = $8,000/month lost. Calva: $49/month."
5. **Industry-specific landing pages** — /plumbers, /lawyers, /salons with tailored messaging. We have these (/industries/) but they need content.

### Pricing Page
- **Anchor high** — Show the Smith.ai price ($300-2100/mo) as "traditional" and Calva as the modern alternative.
- **Highlight savings** — "Save $3,000-25,000/year vs human receptionist services"
- **Free trial CTA** — Every pricing plan should have "Start Free Trial"

---

## 6. Actionable Recommendations (For Dev2)

### Priority 1: Live Call Transfer (CRITICAL)
- Add Twilio `<Dial>` verb to transfer calls to business owner's phone
- Trigger on: AI detects "let me connect you" or caller asks for human
- Warm transfer: play hold music, try owner, if no answer → voicemail

### Priority 2: Demo Phone Number
- Provision a Twilio number as a "try it now" demo line
- Add to landing page: "📞 Call (XXX) XXX-XXXX to talk to our AI"
- Massive conversion booster — nothing beats hearing it yourself

### Priority 3: ROI Calculator
- Add to pricing page or landing page
- Inputs: calls missed/week, avg job value
- Output: annual savings vs current situation

### Priority 4: Social Proof
- Add call counter to landing page (we have real calls in DB)
- Testimonial section (even if placeholder for now — structure it)

### Priority 5: Spam Detection
- Use Twilio Lookup API to check caller reputation
- Skip AI conversation for known spam numbers
- Don't count spam in billing

---

## Sources
- Synthflow: synthflow.ai (pricing page, feature page)
- Goodcall: goodcall.com (pricing $79-249/mo, 42K+ agents, ServiceTitan integration)
- Bland AI: bland.ai (enterprise-focused, custom models, up to 1M concurrent)
- Smith.ai: smith.ai (human agents, $300-2100/mo, 30-day guarantee)
- Air AI: site down/pivoted (excluded from analysis)
