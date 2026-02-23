# Calva vs Tomo: Strategic Analysis & Execution Plan
**Date:** 2026-02-23
**Author:** Dev2
**Framework:** BMAD + Superpowers

---

## 1. TOMO DEEP DIVE — What They Are

### Company
- **Legal entity:** Mapo Labs, Inc. (California)
- **Product:** Tomo — "Your AI for everything"
- **Tagline:** "It all starts with one text."
- **Website:** tomo.ai
- **Contact:** hello@tomo.ai
- **Traction:** 50,000+ users claimed
- **Stack:** Next.js on Vercel

### What Tomo Does
- **Text-first AI assistant** — you text it, it does things
- **Accountability & productivity** — reminders, nudges, habit loops
- **Life organization** — calendar, email, docs, tasks
- **Integrations:** Google Workspace (Gmail, Calendar, Drive), Notion, Airtable
- **Group chat participation** — AI in your group chats
- **Memory/personalization** — learns about you over time

### Tomo's Positioning
- "AI that strengthens human connection"
- "Bridges, not substitutes"
- General-purpose life copilot
- Targets individuals (B2C), not businesses
- Emotional/aspirational branding ("Tomo wants you to lock in. Do you?")
- Minimum age 13, parental consent for minors

### Tomo's Strengths
1. **Frictionless onboarding** — literally one text to start
2. **Text-native** — meets users where they already are (SMS/iMessage)
3. **Google Workspace integration** — real utility (calendar, email, drive)
4. **Habit loops** — accountability creates daily engagement
5. **Memory** — personalization deepens over time
6. **Clean legal/privacy** — explicit Google API compliance, GDPR-ready
7. **50K users** — social proof + data flywheel

### Tomo's Weaknesses
1. **No voice** — text only, no phone calls
2. **B2C only** — no business revenue capture
3. **General-purpose** — jack of all trades, master of none
4. **No industry specialization** — can't handle dental vs legal differently
5. **No appointment booking** — just reminders
6. **No call forwarding** — doesn't answer your phone
7. **No lead capture** — doesn't convert missed calls to revenue
8. **Subscription fatigue** — another $X/mo for consumers

---

## 2. CALVA vs TOMO — The Gap Analysis

| Dimension | Tomo | Calva (Current) | Calva (Target) |
|-----------|------|-----------------|-----------------|
| **Onboarding** | One text → started | Signup → verify → login → onboard | One text → live receptionist |
| **Time to value** | Instant | ~5 min | < 60 seconds |
| **Voice** | ❌ None | ✅ Chirp3-HD, Gemini Flash | ✅ Best-in-class |
| **Phone answering** | ❌ | ✅ Twilio | ✅ + smart routing |
| **Lead capture** | ❌ | ✅ SMS + email notify | ✅ + CRM + follow-up |
| **Appointment booking** | ❌ | ✅ Preferred time extraction | ✅ + real-time calendar |
| **Industry templates** | ❌ | ✅ 9 verticals | ✅ 20+ verticals |
| **Integrations** | Google, Notion, Airtable | None yet | Google Cal, CRM, Zapier |
| **Memory** | ✅ Learns about you | ❌ Stateless per call | ✅ Caller history + context |
| **Analytics** | ❌ | Basic dashboard | ✅ Revenue attribution |
| **Website** | Clean, minimal | Feature-heavy | Tomo-level clean + demo |
| **Pricing page** | Hidden (subscription) | $49/$99/$199 | Transparent + ROI calc |
| **Legal** | ✅ Full ToS, Privacy | ✅ Terms, Privacy | ✅ + HIPAA-ready |

---

## 3. THE STRATEGIC PLAY — "Tomo for Business Phones"

### Vision
**Calva = the Tomo experience, but for business phone lines.**

Tomo proved that "it all starts with one text" is the ultimate low-friction activation. We steal that playbook but apply it to the $50B+ missed-call problem for SMBs.

### Core Thesis
> Every missed call is lost revenue. Calva answers every call, captures every lead, books every appointment — and it starts with one text.

### Differentiation from Tomo
| Tomo | Calva |
|------|-------|
| Helps *you* organize *your* life | Helps *your business* capture *revenue* |
| Text-based assistant | Voice + text AI receptionist |
| B2C subscription | B2B SaaS with measurable ROI |
| "Lock in" (aspirational) | "Never miss a lead" (revenue) |
| General intelligence | Industry-specific intelligence |

---

## 4. WHAT WE NEED TO BUILD — Epic Breakdown

### Epic 1: "One Text" Onboarding (Tomo's Killer Move)
**Goal:** Business owner texts a number → AI asks 3 questions → receptionist is LIVE

**Stories:**
1. **SMS onboarding flow** — Text "START" to Calva number → interactive setup via SMS
2. **3-question wizard** — "What's your business name?" → "What industry?" → "Forward your calls to this number"
3. **Instant activation** — Receptionist answers calls within 60 seconds of completing setup
4. **Web fallback** — QR code / link for those who prefer web signup
5. **Template auto-selection** — Industry answer maps to best template automatically

**Why this wins:** Tomo's #1 advantage is zero-friction activation. We match it for B2B.

### Epic 2: Caller Memory & Context (Tomo's Secret Weapon)
**Goal:** Calva remembers callers and gets smarter over time

**Stories:**
1. **Caller recognition** — Match phone numbers to previous interactions
2. **Conversation history** — "You called last week about a root canal — how can I help today?"
3. **Preference learning** — Remember preferred appointment times, providers, etc.
4. **Business context accumulation** — AI learns from every call what works
5. **VIP caller flagging** — Repeat callers / high-value leads get priority treatment

**Why this wins:** Tomo's memory creates stickiness. Same principle, applied to business callers.

### Epic 3: Integration Hub (Match + Exceed Tomo)
**Goal:** Connect to the tools businesses already use

**Stories:**
1. **Google Calendar** — Real-time availability, instant booking (already built, needs OAuth)
2. **Google Contacts** — Sync caller info to business contacts
3. **CRM connectors** — HubSpot, Salesforce, Zoho push (webhook-based)
4. **Zapier/Make** — Universal connector for 5000+ apps
5. **Email summary** — Daily/weekly call digest with analytics
6. **SMS follow-up automation** — Auto-text callers after calls ("Thanks for calling Dr. Smith's office!")

**Why this wins:** Tomo has Google + Notion. We need Google + CRM + automation.

### Epic 4: Revenue Intelligence Dashboard (What Tomo Can't Do)
**Goal:** Show business owners exactly how much money Calva makes them

**Stories:**
1. **Lead attribution** — Track which calls → which bookings → which revenue
2. **Missed call recovery rate** — "Calva answered 47 calls you would have missed"
3. **ROI calculator** — "At $200/avg appointment, Calva generated $9,400 this month"
4. **Call quality scoring** — AI grades each interaction
5. **Trend analytics** — Peak hours, common requests, seasonal patterns
6. **Competitive benchmark** — "Businesses like yours average X leads/month"

**Why this wins:** Tomo can't show ROI because it's a personal tool. Calva proves its value in dollars.

### Epic 5: Website & Brand Overhaul (Match Tomo's Clean UX)
**Goal:** Calva.ai looks and feels as polished as tomo.ai

**Stories:**
1. **Minimal hero** — One headline, one CTA, one phone demo (like Tomo's "one text")
2. **Interactive demo** — Call the demo number right from the page, hear Calva answer
3. **Social proof section** — Testimonials, "X calls answered", industry logos
4. **Pricing with ROI** — Not just "$49/mo" but "$49/mo → average $3,200 in recovered leads"
5. **Industry landing pages** — SEO-optimized verticals (dental, legal, HVAC, etc.)
6. **Mobile-first** — 70%+ of SMB owners browse on phone

### Epic 6: Smart Features (Leapfrog Tomo)
**Goal:** Things Tomo can't do because they're not voice-native

**Stories:**
1. **Multi-language support** — Spanish, Mandarin, etc. (huge SMB market)
2. **After-hours intelligence** — Different behavior during/after business hours
3. **Emergency escalation** — Urgent calls get forwarded to owner's cell immediately
4. **Voicemail transcription** — If caller insists on voicemail, transcribe + summarize + text to owner
5. **Outbound follow-up calls** — AI calls back leads who didn't book
6. **Call transfer** — "Let me transfer you to Dr. Smith" (warm transfer)

---

## 5. EXECUTION PRIORITY (What to Build First)

### Phase 1: Match Tomo's Magic (Week 1-2)
1. ⚡ **SMS onboarding** — "One text" activation flow
2. 🧠 **Caller memory** — Recognition + history
3. 🎨 **Website redesign** — Tomo-level clean

### Phase 2: Exceed Tomo (Week 3-4)
4. 📊 **Revenue dashboard** — ROI attribution
5. 🔗 **Google Calendar OAuth** — Real booking
6. 📱 **SMS follow-up automation**

### Phase 3: Leapfrog (Week 5-8)
7. 🌍 **Multi-language**
8. 🔄 **CRM connectors**
9. 📞 **Call transfer + escalation**
10. 🤖 **Outbound follow-up calls**

---

## 6. TECH REQUIREMENTS

### New Infrastructure Needed
- **Redis/Postgres** for caller memory (Supabase already there ✅)
- **Twilio SMS** for onboarding flow (Twilio already integrated ✅)
- **Google OAuth** for Calendar/Contacts (built, needs keys)
- **Webhook system** for CRM/Zapier integration
- **Analytics pipeline** for revenue tracking

### Blocked Items (Need from Rifat)
- **Stripe keys** — for billing
- **SMTP provider** — for email notifications
- **Domain** — for deployment
- **Google OAuth credentials** — for Calendar integration

---

## 7. COMPETITIVE MOAT

Once built, Calva has 4 moats Tomo can never replicate:

1. **Voice-native** — Tomo is text. We own the phone line.
2. **Revenue attribution** — We prove ROI in dollars. Tomo can't.
3. **Industry specialization** — We know dental vs legal vs HVAC. Tomo is generic.
4. **Network effects** — Every call trains our AI for that industry vertical.

---

## 8. IMMEDIATE NEXT STEPS

### For Dev2 (me):
1. Design SMS onboarding flow (Twilio SMS → interactive setup)
2. Build caller memory schema in Supabase
3. Wireframe new minimal landing page
4. Write tests for all new features FIRST (TDD)

### For Rifat:
1. Provide Stripe keys (test + live)
2. Choose SMTP provider (SendGrid? Resend? Postmark?)
3. Secure domain (calva.ai? getcalva.com?)
4. Google OAuth credentials for Calendar
5. Approve this strategy before I start building

---

*"It all starts with one call."* — That's our version of Tomo's line.
