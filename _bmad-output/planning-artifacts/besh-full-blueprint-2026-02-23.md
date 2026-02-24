# Besh — Full Blueprint (Tomo Clone for Business)
**Date:** 2026-02-23
**Status:** APPROVED — Building Now

---

## TOMO'S EXACT PLAYBOOK (What We're Copying)

### 1. Website (tomo.ai)
- **Minimal** — almost nothing on the page
- Hero: "Tomo wants you to lock in. Do you?"
- One input: phone number
- "It all starts with one text."
- Terms + Privacy links at bottom
- That's IT. No features page, no pricing page, no blog. Just the hook.

### 2. Onboarding Flow
- User enters phone number on website
- Tomo texts them
- User replies → conversation begins
- AI learns about them through conversation
- No signup form, no email, no password. Just text.

### 3. Product (How It Works)
- Everything happens via text/SMS
- AI remembers you (conversation history + preferences)
- Handles: reminders, scheduling, accountability, life organization
- Integrates with Google Calendar, Gmail, Notion, etc.
- Group chat participation
- Gets smarter over time

### 4. Business Model
- Free to start (text to try)
- Subscription for premium features
- Sticky through habit loops + memory

---

## BESH'S VERSION (Same Playbook, Business Focus)

### 1. Website (besh.ai)
- **Identical minimal approach**
- Hero: "Besh wants your business to never miss a customer. Ready?"
- Subtext: "It all starts with one text."
- One input: business phone number
- Terms + Privacy links
- Nothing else. Clean, bold, confident.

### 2. Onboarding Flow
- Business owner enters their phone number on besh.ai
- Besh texts them: "Hey! I'm Besh, your AI business assistant. What's your business name?"
- Owner replies: "Mike's Plumbing"
- Besh: "Nice! What kind of business is Mike's Plumbing?" → auto-detects industry
- Besh: "Got it. What are your business hours?"
- Besh: "Perfect. I'm ready. When customers text this number, I'll handle scheduling, answer questions, and capture leads. Want to try? Text me like a customer would."
- Owner tests it → sees it work → hooked
- **Total setup: 5 texts. Under 2 minutes.**

### 3. Product (How It Works)

#### For the Business Owner (via SMS)
- Text Besh to update business info, hours, services
- Get daily/weekly summaries of customer interactions
- "How many leads this week?" → instant answer
- "Block off tomorrow 2-4pm" → calendar updated
- "What did that customer John ask about?" → full history
- Settings, training, everything via text

#### For the Business's Customers (via SMS)
- Customer texts the business number → Besh answers
- Natural conversation — scheduling, pricing, hours, FAQs
- "I need a root canal consultation next Tuesday" → booked
- "What are your hours?" → instant answer
- "How much for a cleaning?" → pricing from knowledge base
- Follow-up texts: "Thanks for visiting Dr. Smith! Ready for your next appointment?"
- Besh remembers every customer interaction

#### Voice (Premium Add-on)
- Flip a switch → Besh answers phone calls too
- Uses existing Calva voice engine (Gemini + Chirp3-HD)
- Same AI brain, same memory, just voice instead of text
- Call recording + transcription
- Warm transfer to staff

### 4. Business Model
- **Free:** Try it (first 50 customer conversations free)
- **$29/mo:** Unlimited text conversations, scheduling, memory
- **$79/mo:** Multi-channel (SMS + web chat + WhatsApp), CRM, analytics
- **$149/mo:** Voice AI, call transfer, multi-language, priority support

---

## TECHNICAL ARCHITECTURE

### Core Stack
```
besh.ai (website)
  └── Next.js or plain HTML (Tomo-minimal)
  └── Single page, phone number input
  └── Sends SMS via Twilio

Besh AI Engine
  └── Node.js/Express (existing Calva server)
  └── Gemini 2.5 Flash (fast, smart, cheap)
  └── Conversation state machine
  └── Supabase (Postgres) for all data

Twilio
  └── SMS inbound/outbound (primary)
  └── Voice (premium tier, existing code)
  └── Phone number provisioning

Supabase
  └── businesses (owner profile, settings, hours, services)
  └── customers (phone, name, history, preferences)
  └── conversations (full message history)
  └── appointments (bookings, reminders)
  └── leads (captured contacts, scoring)
```

### Database Schema
```sql
-- Business profiles
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_phone TEXT UNIQUE NOT NULL,
  business_name TEXT,
  industry TEXT,
  hours JSONB,
  services JSONB,
  pricing JSONB,
  settings JSONB DEFAULT '{}',
  voice_enabled BOOLEAN DEFAULT false,
  plan TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Customer profiles (per business)
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id),
  phone TEXT NOT NULL,
  name TEXT,
  preferences JSONB DEFAULT '{}',
  visit_count INTEGER DEFAULT 0,
  last_contact TIMESTAMPTZ,
  vip BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_id, phone)
);

-- Conversation messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id),
  customer_id UUID REFERENCES customers(id),
  direction TEXT NOT NULL, -- 'inbound' or 'outbound'
  channel TEXT DEFAULT 'sms', -- 'sms', 'voice', 'web', 'whatsapp'
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Appointments
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id),
  customer_id UUID REFERENCES customers(id),
  service TEXT,
  preferred_time TEXT,
  status TEXT DEFAULT 'requested', -- requested, confirmed, completed, cancelled
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Leads
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id),
  customer_id UUID REFERENCES customers(id),
  intent TEXT,
  score INTEGER DEFAULT 0,
  status TEXT DEFAULT 'new', -- new, contacted, qualified, converted
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### SMS Flow Architecture
```
Customer texts business number
  → Twilio webhook → /api/sms/inbound
  → Identify business (by Twilio number)
  → Identify/create customer (by phone)
  → Load conversation history
  → Build AI prompt (business context + customer history + message)
  → Gemini Flash response
  → Send reply via Twilio SMS
  → Store in messages table
  → Check for intents (appointment, lead, FAQ)
  → Trigger follow-up actions if needed

Owner texts Besh
  → Twilio webhook → /api/sms/owner
  → Detect owner commands vs customer mode
  → "How many leads?" → query + respond
  → "Update hours to 9-5" → update business
  → "Summary" → daily digest
```

---

## SPRINT PLAN

### Sprint 1: Core SMS Engine (This Week)
- [ ] Supabase schema (businesses, customers, messages, appointments, leads)
- [ ] SMS inbound webhook (/api/sms/inbound)
- [ ] Business identification by Twilio number
- [ ] Customer identification/creation by phone
- [ ] Gemini AI conversation engine (with business context)
- [ ] SMS outbound reply
- [ ] Conversation history loading
- [ ] Basic intent detection (appointment, FAQ, pricing)
- [ ] Tests for all of the above

### Sprint 2: Onboarding + Website (Next Week)
- [ ] Owner onboarding flow via SMS (5-text setup)
- [ ] besh.ai landing page (Tomo-minimal)
- [ ] Phone number input → triggers onboarding SMS
- [ ] Business profile creation from conversation
- [ ] Industry auto-detection
- [ ] Template loading based on industry

### Sprint 3: Intelligence (Week 3)
- [ ] Customer memory (preferences, history recall)
- [ ] Appointment scheduling via text
- [ ] Lead capture + scoring
- [ ] Owner commands (summary, stats, update hours)
- [ ] Follow-up automation ("Thanks for visiting!")
- [ ] Daily digest SMS to owner

### Sprint 4: Polish + Voice (Week 4)
- [ ] Voice module integration (existing Calva code)
- [ ] Multi-channel prep (web chat widget)
- [ ] Analytics dashboard
- [ ] Billing integration (Stripe)
- [ ] Production deployment
- [ ] Launch

---

## WEBSITE COPY (Tomo-Style)

### besh.ai
```
[minimal, centered, lots of whitespace]

Besh wants your business to never miss a customer.
Ready?

It all starts with one text.

[  Enter your phone number  ] [Get Started]

By continuing, you agree to our Terms and Privacy.
```

That's the entire page. Nothing else.

### Mobile-first
- 90%+ of SMB owners will hit this on their phone
- Phone number input should auto-open number pad
- "Get Started" sends them an SMS immediately
- They never leave their text app after that

---

## KEY DIFFERENCES FROM TOMO

| | Tomo | Besh |
|---|------|------|
| **Who texts** | You text Tomo | Your CUSTOMERS text your business |
| **Who benefits** | You personally | Your business (revenue) |
| **What it does** | Life organization | Customer communication |
| **Memory** | Remembers you | Remembers your customers |
| **Value prop** | "Lock in" | "Never miss a customer" |
| **Revenue proof** | Can't show ROI | Shows leads, bookings, revenue |

---

*"It all starts with one text."*
