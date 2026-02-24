# BESH — BMAD Analysis
## Brainstorm → Map → Architect → Deliver

---

# PHASE 1: BRAINSTORM — Understanding Tomo Completely

## How Tomo ACTUALLY Works (Reverse-Engineered)

### Tech Stack (from source)
- **Framework:** Next.js 15 (App Router, Turbopack)
- **Hosting:** Vercel (confirmed by dpl_ deployment IDs)
- **Styling:** Tailwind CSS + shadcn/ui components
- **Theme:** Dark mode forced (forcedTheme="dark")
- **Font:** Geist + Geist Mono + custom "BitcountGridSingle" for logo
- **Color accent:** Orange (#f54a00 / orange-300)
- **Progress bar:** NProgress (orange)
- **Toast:** Sonner (via shadcn)

### Website Structure
```
/ (home)         — Hero + phone input + "Get Started" button (iMessage icon)
/about           — What is Tomo? paragraph
/faq             — Accordion with 7 questions
/love            — Social proof (testimonials/stats ticker)
/login           — Phone number login (existing users)
/contact         — Contact form
/terms           — Legal
/privacy         — Legal
```

### Home Page Anatomy (Exact)
```
[HEADER]
  Logo: "Tomo" (custom BitcountGrid font)
  Social proof badge: "Trusted by 50,000+ people [rotating activity]"
  Login button (outline, rounded-xl)

[HERO - centered, lots of whitespace]
  H1: "Tomo wants you to lock in. Do you?" (4xl mobile / 6xl desktop)
      "lock in" is italic
  H2: "It all starts with one text." (muted-foreground color)

[CTA - bottom of viewport or below hero]
  Big button: iMessage icon + "Get Started"
    - White bg, black text, orange-300 border
    - Animated glow effect (orange pulsing shadow)
    - Opens iMessage/SMS compose to Tomo's number
  Fine print: "By continuing, you agree to our Terms and Privacy."

[BACKGROUND]
  Canvas element (hidden by default, opacity: 0)
  Likely particle/gradient animation that fades in

[FOOTER]
  Logo "Tomo"
  Nav: About | FAQ | Contact | Terms | Privacy
```

### Key UX Decisions
1. **"Get Started" opens native SMS** — not a web form. The iMessage icon + button literally opens the user's texting app with Tomo's number pre-filled. This is critical — no web signup at all.
2. **Dark mode only** — forced, no toggle. Brand consistency.
3. **Rotating social proof** — "50,000+ people [working out today / studying right now / etc.]" rotates through activities. Shows real-time engagement.
4. **Login is separate** — phone number login for returning users. New users always go through SMS first.
5. **No features page** — they deliberately don't list features. The product speaks for itself via the text experience.
6. **No pricing on website** — pricing is handled INSIDE the text conversation.

### Onboarding Flow (via SMS)
1. User clicks "Get Started" → native SMS app opens with Tomo's number
2. User sends first text (anything)
3. Tomo responds — begins conversational onboarding
4. Learns about user through chat (goals, interests, schedule)
5. Starts sending proactive messages (reminders, check-ins, accountability)
6. Eventually prompts upgrade (subscription within conversation)

### Product Capabilities (from About + FAQ)
- **Accountability** — learns goals, holds you to them
- **Life organization** — calendar, email, tasks
- **Venting/therapy** — emotional support
- **Secretary mode** — manage calendar
- **Group chats** — can join group texts
- **Reminders** — proactive nudges
- **Video watching** — can process video links
- **Photo editing** — can edit photos
- **Integrations:** Google Calendar, Gmail, Notion, Google Drive
- **Pricing:** Varies per user (dynamic pricing / A-B tested)

### Login Flow
- Return to /login
- Enter phone number
- Receive verification code via SMS
- Enter code → logged in
- Dashboard/web experience for managing settings

---

# PHASE 2: MAP — Besh User Journeys

## Journey 1: Business Owner Discovers Besh

```
1. Sees ad / hears about Besh
2. Goes to besh.ai
3. Sees: "Besh wants your business to never miss a customer. Ready?"
4. Sees: "It all starts with one text."
5. Clicks "Get Started" → SMS app opens with Besh's number
6. Texts "Hey" or anything
7. Besh responds → begins business onboarding
```

## Journey 2: Business Owner Onboarding (via SMS)

```
Besh: "Hey! 👋 I'm Besh — your AI business assistant.
       I'll handle customer texts so you never miss a lead.
       What's your business name?"

Owner: "Mike's Plumbing"

Besh: "Nice! Mike's Plumbing 🔧
       What kind of services do you offer?
       (Just list a few, I'll learn more over time)"

Owner: "Drain cleaning, water heater repair, pipe installation"

Besh: "Got it. What are your business hours?"

Owner: "Mon-Fri 8am-6pm, Sat 9am-2pm"

Besh: "Perfect. One last thing — what's the best way for
       customers to reach you if it's urgent? Phone call? Email?"

Owner: "Call me at 555-123-4567"

Besh: "✅ Mike's Plumbing is live!

       Here's what happens now:
       • I'll text back when customers reach out
       • I handle scheduling, pricing questions, and FAQs
       • I capture leads and send you a daily summary
       • You can text me anytime to update info

       Want to try? Text me like a customer would,
       or share this number with your first customer."
```

## Journey 3: Customer Texts the Business

```
Customer texts business number: "Hi, do you do emergency drain cleaning?"

Besh (as Mike's Plumbing): "Hi there! Yes, Mike's Plumbing handles
       emergency drain cleaning. We can usually get someone out
       same-day. Would you like to schedule a visit?
       Our availability this week is pretty open."

Customer: "Yeah tomorrow morning would be great"

Besh: "Great! I can book you for tomorrow morning.
       What's your name and address?"

Customer: "John Smith, 45 Oak Street"

Besh: "Perfect, John! You're booked for tomorrow morning
       at 45 Oak Street for emergency drain cleaning.
       Mike will confirm the exact time shortly.
       Anything else I can help with?"

Customer: "How much does it usually cost?"

Besh: "Emergency drain cleaning typically starts at $150-250
       depending on the severity. Mike will give you an exact
       quote on-site. No hidden fees."

Customer: "Great thanks"

Besh: "You're welcome, John! See you tomorrow. 😊"
```

**Meanwhile, the owner gets:**
```
Besh → Owner: "📋 New booking!
       Customer: John Smith (555-987-6543)
       Service: Emergency drain cleaning
       When: Tomorrow morning
       Address: 45 Oak Street
       Confirm?"

Owner: "Confirmed, 9am"

Besh → Customer: "Great news, John! Mike confirmed your appointment
       for 9:00 AM tomorrow. See you then! 🔧"
```

## Journey 4: Owner Managing Besh (via SMS)

```
Owner: "How many leads this week?"
Besh: "📊 This week: 12 new conversations, 7 bookings,
       3 pending leads. Want details?"

Owner: "Update hours to closed Saturday"
Besh: "Done! Updated to Mon-Fri 8am-6pm. Saturdays I'll let
       customers know you're closed and offer Monday instead."

Owner: "What did that customer from yesterday want?"
Besh: "Sarah Chen (555-444-3333) asked about water heater
       replacement. She wants a quote. Want me to follow up?"

Owner: "Yeah follow up"
Besh → Sarah: "Hi Sarah! Following up on your water heater question.
       Mike's Plumbing can come out for a free assessment.
       Would this week work for you?"
```

## Journey 5: Return Customer

```
Customer texts again 3 months later:
"Hey I need another drain cleaning"

Besh (recognizes number): "Hey John! Good to hear from you again.
       Need another drain cleaning at 45 Oak Street?
       I can book you in — when works best?"

John: "Friday afternoon"

Besh: "Booked for Friday afternoon. Same address on file.
       Mike will be in touch with the exact time. 👍"
```

---

# PHASE 3: ARCHITECT — Technical Design

## Core Architecture

### System Design
```
┌──────────────────────────────────────────────────┐
│                  besh.ai (website)                │
│  Next.js 15 on Vercel • Dark mode • Minimal      │
│  Phone input → opens native SMS to Besh number    │
└──────────────────────┬───────────────────────────┘
                       │ (user texts Besh)
                       ▼
┌──────────────────────────────────────────────────┐
│              Twilio SMS Gateway                   │
│  Inbound webhook: POST /api/sms                  │
│  Outbound: Twilio REST API                       │
└──────────────────────┬───────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────┐
│             Besh Router Service                   │
│                                                   │
│  1. Parse incoming SMS (from, to, body)          │
│  2. Identify: Is this an OWNER or CUSTOMER?      │
│     - Check if `from` matches a business owner   │
│     - If yes → route to Owner Handler            │
│     - If no → route to Customer Handler          │
│  3. Load context from DB                         │
│  4. Call AI engine                               │
│  5. Send response via Twilio                     │
│  6. Store everything                             │
└──────────────────────┬───────────────────────────┘
                       │
              ┌────────┴────────┐
              ▼                 ▼
┌─────────────────┐  ┌──────────────────┐
│ Owner Handler   │  │ Customer Handler  │
│                 │  │                   │
│ • Onboarding    │  │ • Business lookup │
│ • Commands      │  │ • Customer memory │
│ • Stats query   │  │ • AI conversation │
│ • Update info   │  │ • Intent detect   │
│ • Follow-up     │  │ • Appointment     │
│ • Settings      │  │ • Lead capture    │
└────────┬────────┘  └────────┬─────────┘
         │                    │
         ▼                    ▼
┌──────────────────────────────────────────────────┐
│              Gemini 2.5 Flash AI                  │
│                                                   │
│  Dynamic system prompt built from:               │
│  • Business profile (name, industry, hours...)    │
│  • Customer history (if returning)               │
│  • Conversation context (last N messages)        │
│  • Intent context (scheduling, FAQ, etc.)        │
│                                                   │
│  Output: Natural response + structured intents   │
└──────────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────┐
│              Supabase (Postgres)                  │
│                                                   │
│  businesses    — owner profiles + settings       │
│  customers     — per-business customer profiles  │
│  messages      — full conversation history       │
│  appointments  — bookings + status               │
│  leads         — captured contacts + scoring     │
│  notifications — owner alerts queue              │
└──────────────────────────────────────────────────┘
```

### Key Routing Logic
```
INCOMING SMS (from: +1555xxx, to: +1888yyy, body: "...")

Step 1: Who is texting?
  → SELECT * FROM businesses WHERE owner_phone = from_number
  → If found: this is an OWNER texting Besh
  → If not found:
    → SELECT * FROM businesses WHERE twilio_number = to_number
    → If found: this is a CUSTOMER texting a business
    → If not found: this is a NEW USER (potential business owner)

Step 2: Route accordingly
  → OWNER → OwnerHandler (commands, queries, updates)
  → CUSTOMER → CustomerHandler (conversation, scheduling, FAQs)
  → NEW USER → OnboardingHandler (welcome, setup wizard)
```

### Two-Number Architecture
Each business gets a dedicated Twilio number. This is how we route:
- **Business's Twilio number** — customers text this
- **Besh's main number** — owners text this for setup/management
- Owner can also text their own business number to test

### AI Prompt Architecture
```
SYSTEM PROMPT (for customer conversations):

You are the AI assistant for {business_name}, a {industry} business.

BUSINESS INFO:
- Hours: {hours}
- Services: {services}
- Pricing: {pricing}
- Location: {location}
- Emergency contact: {owner_phone}

CUSTOMER INFO:
- Name: {customer_name or "Unknown"}
- Previous visits: {visit_count}
- Last contact: {last_contact}
- Preferences: {preferences}
- History summary: {conversation_summary}

CONVERSATION HISTORY (last 10 messages):
{messages}

INSTRUCTIONS:
- You are texting as {business_name}, NOT as "Besh" or "AI"
- Be warm, professional, and helpful
- If customer wants to book: collect name, service, preferred time
- If customer asks pricing: give ranges from knowledge base
- If customer asks hours: respond with business hours
- If you can't answer: say "Let me check with {owner_name} and get back to you"
- Keep responses under 160 chars when possible (SMS friendly)
- Never reveal you are AI unless directly asked
```

### Website Architecture (Matching Tomo)
```
besh.ai/
├── (public)/
│   ├── (home)/page.tsx      — Hero + CTA button
│   ├── about/page.tsx       — What is Besh?
│   ├── faq/page.tsx         — FAQ accordion
│   ├── love/page.tsx        — Social proof / testimonials
│   ├── contact/page.tsx     — Contact form
│   ├── terms/page.tsx       — Terms of service
│   ├── privacy/page.tsx     — Privacy policy
│   └── login/page.tsx       — Phone number login
├── (dashboard)/             — Owner dashboard (post-login)
│   ├── layout.tsx           — Dashboard layout
│   ├── page.tsx             — Overview / stats
│   ├── conversations/       — View customer conversations
│   ├── settings/            — Business settings
│   └── billing/             — Subscription management
├── api/
│   ├── sms/route.ts         — Twilio SMS webhook
│   ├── auth/route.ts        — Phone auth (send/verify code)
│   └── stripe/route.ts      — Billing webhooks
└── layout.tsx               — Root layout (dark mode, fonts)
```

### Design System (Matching Tomo)
- **Dark mode forced** — dark bg, white text
- **Font:** Geist Sans + Geist Mono (same as Tomo)
- **Logo font:** Custom display font for "Besh"
- **Accent:** TBD (Tomo uses orange #f54a00 — we should differentiate)
- **Components:** shadcn/ui (same as Tomo)
- **Spacing:** Extremely minimal, lots of whitespace
- **Responsive:** Mobile-first (sm breakpoint at 640px)
- **Animations:** Subtle — glow effect on CTA, fade-in background

---

# PHASE 4: DELIVER — Sprint Breakdown

## Pre-Sprint: Project Setup
- [ ] Create new Next.js 15 project (besh-app)
- [ ] Configure: Tailwind, shadcn/ui, Geist fonts, dark mode
- [ ] Set up Supabase project (new, separate from Calva)
- [ ] Set up Twilio (reuse existing account, new number for Besh)
- [ ] Environment variables (.env.local)
- [ ] Deploy skeleton to Vercel

## Sprint 1: SMS Engine + Database (Week 1)
**Goal:** A customer can text a business number and get an AI response

### Tasks:
1. Database schema migration (businesses, customers, messages, appointments, leads)
2. SMS inbound webhook (POST /api/sms)
3. Router service (owner vs customer vs new user detection)
4. Customer handler (load context → AI → reply)
5. Gemini AI integration (with dynamic business-context prompts)
6. SMS outbound (Twilio reply)
7. Message storage (both directions)
8. Customer recognition (by phone number)
9. Tests for ALL of the above

## Sprint 2: Onboarding + Website (Week 2)
**Goal:** Business owner can set up their AI assistant via text, and besh.ai is live

### Tasks:
1. Owner onboarding flow (5-text wizard via SMS)
2. Business profile creation from conversation
3. Industry detection + template loading
4. besh.ai landing page (exact Tomo layout)
5. "Get Started" → opens native SMS
6. /about, /faq, /contact, /terms, /privacy pages
7. Phone number verification for login
8. Tests

## Sprint 3: Intelligence + Owner Tools (Week 3)
**Goal:** Smart conversations, owner management, follow-ups

### Tasks:
1. Customer memory (preferences, history recall in prompts)
2. Appointment scheduling + confirmation flow
3. Lead capture + intent scoring
4. Owner commands via SMS (stats, updates, follow-up triggers)
5. Daily digest SMS to owner
6. Follow-up automation ("Thanks for visiting!")
7. Owner notification on new bookings
8. Tests

## Sprint 4: Dashboard + Voice + Launch (Week 4)
**Goal:** Web dashboard, voice option, billing, ship it

### Tasks:
1. Owner dashboard (conversations, stats, settings)
2. Voice module integration (existing Calva engine)
3. Stripe billing integration
4. SMTP for email notifications
5. Production deployment (Vercel + custom domain)
6. Launch checklist (legal, monitoring, error handling)
7. Tests + load testing

---

## OPEN DECISIONS (Need Rifat Input)

1. **Accent color** — Tomo is orange. What color for Besh? (Suggest: green for "growth" or teal)
2. **Logo font** — Custom display font needed. Commission or find one?
3. **Twilio number** — Use existing or provision new?
4. **Pricing model** — Fixed tiers or dynamic like Tomo?
5. **Free tier limit** — 50 conversations? 100? Unlimited for 14 days?
6. **Supabase project** — New project or extend existing Calva project?

---

*BMAD Complete. Ready for Sprint 1 upon approval.*
