# 🔥 CALVA BATTLE PLAN — Compete with Fin AI & Top Dogs
*Created: 2026-02-12 | Led by: Santa (COO)*
*"Every call, covered. Every competitor, crushed."*

---

## THE GOAL

Copy the best from Fin AI (Intercom), Smith.ai, Ruby, Synthflow, Retell AI — then beat them on **price, speed, and simplicity.** Calva should be the best AI receptionist at the lowest cost to market.

---

## WHAT FIN AI DOES (The Gold Standard)

Fin AI charges **$0.99 per resolution** on top of $29+/mo base. Here's what makes them #1:

1. **Procedures** — Natural language SOPs the AI follows step-by-step (refund flows, troubleshooting, etc.)
2. **Simulations** — Test AI behavior with fake conversations before going live
3. **Knowledge Base** — AI learns from your docs, FAQs, help center
4. **Multi-channel** — Chat, email, SMS, voice, Slack, Discord
5. **45+ languages**
6. **Human handoff** — Seamless escalation to human agents
7. **Analytics/Insights** — AI-powered suggestions, trend reports, resolution scoring
8. **Deterministic controls** — Mix AI reasoning with hard-coded rules for compliance
9. **Continuous improvement** — "Fin Flywheel" — train, test, deploy, analyze, repeat
10. **66% average resolution rate** across 6,000+ customers

---

## WHAT CALVA HAS TODAY

| Component | Status | Notes |
|-----------|--------|-------|
| Voice AI (Twilio + Gemini Flash) | ✅ Working | Multi-turn conversations, (929) 755-7288 |
| Edge TTS | ✅ Working | Free, with caching + Twilio fallback |
| 9 Industry Templates | ✅ Done | Plumber, law, medical, restaurant, auto, salon, real estate, vet, school |
| Multi-tenant | ✅ Working | One platform, unlimited businesses |
| Onboarding wizard | ✅ Working | /onboard route |
| Admin Dashboard | ✅ Working | Calls, bookings, analytics |
| Post-call SMS notifications | ✅ Working | Owner + caller |
| Emergency detection | ✅ Working | Identifies urgent situations |
| Smart booking | ✅ Working | Collects info, schedules |
| Landing page | ✅ Working | Hero, pricing, testimonials, FAQ |
| Health check | ✅ Working | /health endpoint |
| API auth + rate limiting | ✅ Working | API key per tenant |
| Call forwarding setup guide | ✅ Working | AT&T, Verizon, T-Mobile, Spectrum |
| Docker deployment | ✅ Ready | Dockerfile included |
| Auto phone provisioning | ✅ Working | Twilio number per tenant |
| Cloudflare tunnel | ✅ Working | Public URL active |

**Bottom line: Core product works. A real person can call (929) 755-7288 right now and talk to the AI.**

---

## GAPS: What Fin AI / Top Dogs Have That We Don't

### 🔴 CRITICAL (Must have to compete)

| # | Feature | What It Does | Copy From | Effort |
|---|---------|-------------|-----------|--------|
| 1 | **Knowledge Base / Custom Training** | Business uploads their FAQ/docs, AI learns from them | Fin AI | 1-2 days |
| 2 | **Self-Service Dashboard** | Business owner configures AI behavior, greeting, hours, FAQs without coding | Fin AI, Goodcall | 2-3 days |
| 3 | **Call Analytics Dashboard** | Call volume, resolution rate, avg duration, peak hours, missed calls | Fin AI, everyone | 1-2 days |
| 4 | **Multi-language support** | AI handles calls in Spanish, Mandarin, etc. | Fin AI (45+), Synthflow (20+) | 1 day |
| 5 | **Stripe payments + billing** | Self-serve signup → pay → get phone number → live in 5 min | Everyone | 1-2 days |

### 🟡 HIGH PRIORITY (Differentiators)

| # | Feature | What It Does | Copy From | Effort |
|---|---------|-------------|-----------|--------|
| 6 | **Simulation/Testing** | Business tests AI with fake calls before going live | Fin AI | 2 days |
| 7 | **CRM Integration** | Auto-push call data to HubSpot, Salesforce, etc. | Smith.ai, Retell | 1-2 days |
| 8 | **Call Recording + Transcripts** | Full call audio + text transcript for review | Everyone | 1 day |
| 9 | **Human Handoff** | Transfer to real person when AI can't handle it | Smith.ai, Fin AI | 1 day |
| 10 | **Chat Widget** | Not just phone — embed chat on business website | Fin AI, Intercom | 2-3 days |

### 🟢 NICE TO HAVE (Month 2+)

| # | Feature | What It Does |
|---|---------|-------------|
| 11 | Voice cloning (custom brand voice) |
| 12 | SMS conversations (not just notifications) |
| 13 | Email handling |
| 14 | Appointment reminders |
| 15 | White-label for agencies |

---

## EXECUTION PLAN: 2 Weeks to Feature Parity

### Week 1 (Feb 13-19): Foundation

**Day 1-2: Knowledge Base + Custom Training**
- Let business upload FAQ doc, website URL, or paste text
- Parse into knowledge chunks
- AI retrieves relevant chunks during calls (RAG)
- Store in SQLite with embeddings (or use Gemini's built-in context)
- **This is the #1 thing that separates "demo" from "product"**

**Day 2-3: Self-Service Dashboard Upgrade**
- Current dashboard shows calls/bookings — needs:
  - Edit greeting message
  - Set business hours
  - Add/edit FAQ entries
  - Toggle features (booking, SMS, emergency)
  - View/edit AI personality/tone
  - Upload logo
- **This makes onboarding ZERO-touch**

**Day 3-4: Call Analytics**
- Dashboard cards: total calls, avg duration, resolution rate, peak hours
- Chart: calls over time (daily/weekly)
- Top caller intents
- Missed call tracking
- Export to CSV

**Day 4-5: Multi-Language**
- Detect caller language from speech
- Switch AI response language automatically
- Start with: English, Spanish, Mandarin, French, Portuguese
- Gemini Flash already supports 40+ languages — just need to configure STT/TTS

### Week 2 (Feb 20-26): Monetization + Polish

**Day 6-7: Stripe Integration**
- Pricing page → Stripe Checkout → Auto-provision
- Three tiers: $297 / $597 / $997
- Free 7-day trial
- Usage tracking (call count per billing period)
- Upgrade/downgrade flow

**Day 7-8: Simulation Mode**
- "Test Your AI" button in dashboard
- Business owner calls a test number or uses web interface
- Simulates real call with their custom config
- Shows transcript + AI behavior
- **Copy from Fin AI's Simulations — this builds trust**

**Day 8-9: Call Recording + Transcripts**
- Record all calls (Twilio recording API — already available)
- Store transcripts (we already have transcript_json)
- Playback in dashboard
- Search transcripts
- Flag interesting calls

**Day 9-10: Human Handoff**
- When AI detects it can't help: "Let me connect you with [name]"
- Transfer to business owner's personal number
- SMS notification: "Transferring a call — here's what they need: [summary]"
- Warm handoff with context

---

## PRICING STRATEGY (Undercut Everyone)

### Our Cost Per Call
| Component | Cost |
|-----------|------|
| Twilio voice | ~$0.02/min |
| Gemini Flash | ~$0.001/call (free tier generous) |
| Edge TTS | $0/call (free) |
| SMS notification | ~$0.01/msg |
| **Total** | **~$0.03-0.05/call** |

### Competitor Pricing vs. Calva

| Service | 200 calls/mo cost | Calva equivalent |
|---------|-------------------|-----------------|
| Ruby | $720/mo (200 min) | $297/mo (unlimited) |
| Smith.ai | $810/mo (90 calls!) | $297/mo (200 calls) |
| Fin AI | $29 + $198 (200 resolutions) | $297/mo flat |
| Synthflow | $375/mo (2000 min) | $297/mo |
| Goodcall | $129/mo (250 customers) | $297/mo |
| Dialzara | $99/mo (220 min) + overage | $297/mo (no overage) |

**We're cheaper than the premium players (Ruby, Smith.ai) and more full-featured than the budget players (Dialzara, Goodcall).**

### Revised Pricing (Lower Entry, Higher Conversion)

| Tier | Price | Target | Includes |
|------|-------|--------|----------|
| **Free Trial** | $0 for 7 days | Everyone | 50 calls, full features |
| **Starter** | $99/mo | Solopreneurs | 100 calls, 1 number, basic analytics |
| **Pro** | $297/mo | Small biz | 500 calls, 2 numbers, full analytics, CRM |
| **Business** | $597/mo | Multi-location | Unlimited calls, 5 numbers, voice cloning, priority |
| **Enterprise** | Custom | Agencies | White-label, API, dedicated support |

**$99/mo entry point → lower barrier, higher trial conversion**

---

## CALVA vs FIN AI: Why We Win in Our Lane

Fin AI is chat/email-first. Calva is VOICE-first. Different lanes.

| | Fin AI | Calva |
|---|---|---|
| Primary channel | Chat + email | **Phone calls** |
| Target | SaaS/e-commerce | **Local businesses** |
| Setup | Complex (knowledge base, procedures) | **5 minutes** |
| Pricing | $29/mo + $0.99/resolution (unpredictable) | **Flat monthly (predictable)** |
| Voice | Added later, secondary | **Core product** |
| Industry templates | Generic | **9 vertical-specific** |
| Self-hostable | No (SaaS only) | **Yes (Docker)** |
| Cost to run | $$$ (Intercom platform) | **$20-50/tenant** |

**We don't compete with Fin AI head-to-head. We compete in the space they DON'T serve: local businesses that need their phones answered.**

---

## WHAT RIFAT NEEDS TO DO

1. 🔴 **Register calva.ai domain** — we need a real domain
2. 🔴 **Create Stripe account** — can't charge money without it
3. 🟡 **Record 30-second demo call** — show people it works
4. 🟡 **Test the current demo** — call (929) 755-7288, tell me what's broken
5. 🟢 **Pick which pricing to launch with** — $99/$297/$597 or $297/$597/$997

---

## IMMEDIATE TASK QUEUE FOR DEV

Priority order for Dev agent / Claude Code:

```
1. [CRITICAL] Knowledge base upload + RAG for custom business training
2. [CRITICAL] Self-service dashboard (edit greeting, FAQs, hours)
3. [CRITICAL] Call analytics dashboard (volume, duration, resolution)
4. [CRITICAL] Multi-language support (Spanish first)
5. [HIGH] Stripe integration (signup → pay → provision → live)
6. [HIGH] Simulation/test mode
7. [HIGH] Call recording playback in dashboard
8. [HIGH] Human handoff / call transfer
9. [MEDIUM] Chat widget for websites
10. [MEDIUM] CRM integration (HubSpot first)
```

---

## SUCCESS METRICS (30-Day)

| Metric | Target |
|--------|--------|
| Live businesses on platform | 5+ |
| Calls handled | 500+ |
| Revenue | $500+ MRR |
| Free trial signups | 20+ |
| Demo calls booked | 10+ |
| Resolution rate | >70% |
| Average call duration | <3 min |

---

## THE BOTTOM LINE

Calva already WORKS. The AI answers calls. It books appointments. It detects emergencies. It notifies owners. 

What's missing is the **self-service layer** (knowledge base, dashboard, analytics, payments) that turns a demo into a business.

**2 weeks of focused dev work = feature parity with the mid-tier competitors. Our voice-first positioning + $99 entry price + industry templates = we WIN in the local business segment that Fin AI, Zendesk, and Intercom don't even try to serve.**

---

*Execute daily. Ship fast. Iterate on customer feedback. The first 5 paying customers teach us more than any competitive analysis.*
