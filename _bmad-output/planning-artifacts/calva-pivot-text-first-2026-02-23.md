# Calva Pivot: Text-First Business AI (Voice = Premium)
**Date:** 2026-02-23
**Author:** Dev2
**Status:** DRAFT — Awaiting Rifat Approval

---

## THE PIVOT

**Old Calva:** Voice AI receptionist that answers phone calls for SMBs.
**New Calva:** Text-first AI business assistant that manages customer communication — with voice as a premium add-on.

### Why This Is Smarter

1. **Lower barrier to entry** — No Twilio setup, no call forwarding. Just text.
2. **Wider market** — Not every business needs a phone receptionist, but EVERY business needs better customer communication.
3. **Faster activation** — "One text" onboarding like Tomo, but for businesses.
4. **Lower COGS** — Text is cheap. Voice (Twilio + TTS + STT) is expensive per minute.
5. **Voice becomes upsell** — Free/cheap text tier → paid voice tier = natural upgrade path.
6. **Tomo validated the model** — 50K users proved text-first AI works. We apply it to B2B.

---

## PRODUCT VISION

### What Calva Becomes

**"Your AI business assistant. It starts with one text."**

Calva is the AI that handles your business communications:
- Answers customer texts/DMs/chats
- Schedules appointments
- Follows up with leads
- Remembers every customer interaction
- Knows your business inside and out
- And when you're ready: answers your phone too.

### The Tomo Playbook, Applied to Business

| Tomo (Personal) | Calva (Business) |
|------------------|-------------------|
| "Lock in" — accountability | "Never miss a lead" — revenue |
| Texts you reminders | Texts your customers follow-ups |
| Remembers your preferences | Remembers your customers' history |
| Manages your calendar | Books appointments for your business |
| One text to start | One text to start |
| Learns about YOU | Learns about YOUR BUSINESS |
| Google Calendar/Gmail | Google Calendar + CRM + booking |

---

## TIER STRUCTURE

### 🟢 Starter — $29/mo (or free trial)
**"Text-first AI for your business"**
- AI answers customer texts (SMS, webchat, WhatsApp Business)
- Appointment scheduling via text
- Customer memory (recognizes repeat customers)
- Business knowledge base (hours, services, pricing)
- Daily summary email
- 1 business number / channel

### 🔵 Professional — $79/mo
**"Full communication suite"**
- Everything in Starter +
- Multi-channel (SMS + webchat + WhatsApp + Instagram DM + Facebook Messenger)
- Lead qualification & scoring
- CRM integration (HubSpot, Zoho, etc.)
- Automated follow-up sequences
- Analytics dashboard
- 3 channels

### 🟣 Enterprise — $149/mo
**"AI receptionist with voice"**
- Everything in Professional +
- **Voice AI receptionist** (answers phone calls)
- Call transfer & escalation
- Multi-language support
- Voicemail transcription
- Outbound follow-up calls
- Custom AI training on your business data
- Unlimited channels
- Priority support

---

## CORE FEATURES (Text-First)

### 1. Conversational AI Engine
- Natural language understanding for business contexts
- Industry-specific knowledge (dental, legal, HVAC, salon, etc.)
- Multi-turn conversations with context
- Handles: scheduling, FAQs, pricing questions, directions, hours
- Graceful handoff to human when needed

### 2. Customer Memory
- Recognize customers by phone number / email / chat ID
- Full conversation history across all channels
- Preference tracking (preferred times, providers, services)
- VIP flagging for high-value customers
- "Last time you came in for a cleaning on Jan 15th — ready to schedule your next one?"

### 3. Multi-Channel Inbox
- SMS (Twilio)
- Web chat widget (embed on business website)
- WhatsApp Business API
- Instagram DMs (Meta Business API)
- Facebook Messenger
- Google Business Messages
- Unified inbox — one AI, all channels

### 4. Smart Scheduling
- Text-based appointment booking
- Real-time availability (Google Calendar / custom)
- Confirmation + reminder texts
- Rescheduling via text
- No-show follow-up

### 5. Lead Management
- Auto-capture contact info from conversations
- Lead scoring based on intent signals
- Automated follow-up sequences ("Haven't heard back — still interested in that consultation?")
- Pipeline view in dashboard

### 6. Business Intelligence
- Conversation analytics (volume, topics, sentiment)
- Response time tracking
- Lead conversion rates
- Revenue attribution (when possible)
- Peak hours / common questions

### 7. Voice AI (Premium Tier)
- Everything current Calva does
- Phone call answering
- Real-time voice conversations
- Call recording + transcription
- Warm transfer to staff
- After-hours handling

---

## COMPETITIVE LANDSCAPE (Updated)

| Feature | Tomo | Calva (New) | Synthflow | Bland.ai |
|---------|------|-------------|-----------|----------|
| Text-first | ✅ | ✅ | ❌ | ❌ |
| Voice AI | ❌ | ✅ (premium) | ✅ | ✅ |
| B2B focused | ❌ | ✅ | ✅ | ✅ |
| Multi-channel | Partial | ✅ | ❌ | ❌ |
| Customer memory | ✅ | ✅ | ❌ | ❌ |
| Industry templates | ❌ | ✅ | ✅ | ❌ |
| Scheduling | ❌ | ✅ | ✅ | ❌ |
| Lead management | ❌ | ✅ | ❌ | ❌ |
| Revenue attribution | ❌ | ✅ | ❌ | ❌ |
| Onboarding friction | Zero | Zero | Medium | High |
| Starting price | ~$10/mo? | $29/mo | $29/mo | Usage |

**Calva's unique position:** The ONLY product that combines Tomo's text-first simplicity with Synthflow's voice capability, purpose-built for SMBs.

---

## TECH ARCHITECTURE (Revised)

### Core Platform
```
┌─────────────────────────────────────┐
│          Calva AI Engine            │
│  (Gemini Flash / GPT-4o-mini)      │
│  Industry templates + memory        │
├─────────────────────────────────────┤
│        Channel Router               │
│  SMS │ Web │ WhatsApp │ IG │ FB    │
├─────────────────────────────────────┤
│     Customer Memory (Supabase)      │
│  Profiles │ History │ Preferences   │
├─────────────────────────────────────┤
│      Scheduling Engine              │
│  Google Cal │ Custom availability   │
├─────────────────────────────────────┤
│      Voice Module (Premium)         │
│  Twilio │ Chirp3-HD │ Streaming    │
└─────────────────────────────────────┘
```

### What We Keep from Current Calva
- ✅ Supabase backend (DB, auth)
- ✅ Gemini Flash AI engine
- ✅ Industry templates (9 verticals)
- ✅ Twilio integration (SMS now primary, voice = premium)
- ✅ Dashboard SPA
- ✅ Auth flow (signup/login/onboard)

### What We Build New
- 🆕 SMS conversational flow (inbound customer texting)
- 🆕 Web chat widget (embeddable JS)
- 🆕 Customer memory schema + API
- 🆕 Multi-channel router
- 🆕 Lead management pipeline
- 🆕 Text-based scheduling engine
- 🆕 Follow-up automation system

### What Changes
- 🔄 Landing page → text-first messaging
- 🔄 Onboarding → SMS-first setup
- 🔄 Pricing → 3-tier with voice as premium
- 🔄 Templates → expanded for text conversations (not just voice scripts)

---

## EXECUTION PLAN

### Sprint 1 (Week 1): Foundation
- [ ] Customer memory schema (Supabase tables)
- [ ] SMS conversational AI (Twilio webhooks for inbound texts)
- [ ] Text-based appointment scheduling
- [ ] "One text" business onboarding via SMS
- [ ] Tests for all new features

### Sprint 2 (Week 2): Web & Multi-Channel
- [ ] Embeddable web chat widget
- [ ] Unified conversation API (SMS + web use same engine)
- [ ] Customer recognition across channels
- [ ] Dashboard updates (text conversations view)
- [ ] Follow-up automation (basic sequences)

### Sprint 3 (Week 3): Intelligence
- [ ] Lead scoring engine
- [ ] Analytics pipeline
- [ ] Revenue attribution (where trackable)
- [ ] Daily/weekly email summaries
- [ ] A/B testing for AI responses

### Sprint 4 (Week 4): Polish & Launch
- [ ] New landing page (Tomo-inspired, text-first)
- [ ] Pricing page with tier comparison
- [ ] Production deployment
- [ ] Documentation / help center
- [ ] Launch campaign

### Sprint 5+ (Ongoing): Premium Voice
- [ ] Voice module as opt-in add-on
- [ ] Call + text unified in dashboard
- [ ] Multi-language support
- [ ] Outbound calling

---

## OPEN QUESTIONS FOR RIFAT

1. **Name:** Still "Calva"? Or rebrand for the pivot? (Calva = AI receptionist vibe, might want something broader)
2. **Primary channel:** Start with SMS only? Or SMS + web chat simultaneously?
3. **Target vertical for launch:** Pick one industry to nail first? (dental is our strongest template)
4. **Free tier:** Offer a free tier to match Tomo's low barrier? Or free trial only?
5. **WhatsApp Business:** Priority channel? Big in many markets.
6. **Approve tier pricing:** $29 / $79 / $149 feel right?

---

## WHY THIS WINS

1. **Tomo proved text-first AI works** — we don't need to validate the model
2. **Nobody is doing "Tomo for business"** — it's a wide-open lane
3. **Voice is the upsell, not the cost center** — better unit economics
4. **Multi-channel = stickier** — once you're on SMS + web + IG, you can't leave
5. **Revenue attribution = easy sell** — "Calva made you $X this month"
6. **Lower CAC** — text onboarding = viral potential (business texts Calva → Calva texts back with "Powered by Calva" footer)

---

*"It all starts with one text. For your business."*
