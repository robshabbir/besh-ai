# Calva — Full Product Architecture
*How every piece fits together, end to end.*

## The Customer Journey

### Step 1: Business Discovers Calva
- Google ad, cold email, Facebook group, referral
- Lands on calva.ai → sees landing page

### Step 2: Business Signs Up (< 5 minutes)
```
calva.ai/onboard → 
  1. Pick your industry (restaurant, law firm, plumber, etc.)
  2. Enter business details (name, address, hours, services)
  3. Pick a plan ($297/$597/$997)
  4. Pay via Stripe
  5. Get a dedicated phone number instantly
```

### Step 3: Connect the Phone Number
**Option A (recommended):** Call forwarding
- Business keeps their existing number
- Sets up call forwarding to their Calva number
- When they can't answer → Calva picks up
- Instructions provided per carrier (AT&T, Verizon, T-Mobile)

**Option B:** Use Calva number directly
- Put the Calva number on their website, Google listing, business cards
- Good for new businesses or as a secondary line

**Option C:** Replace their number (advanced)
- Port their existing business number to Twilio
- Calva answers ALL calls, transfers to owner when needed

### Step 4: Call Comes In → AI Handles It
```
┌──────────────┐
│   Customer   │  "Hi, I need to book a plumber for tomorrow"
│   calls      │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Twilio     │  Routes to Calva server based on TO number
│   (phone)    │  Each business has a unique Twilio number
└──────┬───────┘
       │ Webhook POST /api/voice
       ▼
┌──────────────┐
│   Calva      │  1. Looks up business by phone number
│   Server     │  2. Loads that business's template + config
│   (Node.js)  │  3. Greets caller with business name
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Speech     │  Twilio <gather> with speechModel: 'phone_call'
│   to Text    │  Twilio's built-in STT (included in per-min cost)
└──────┬───────┘
       │ Text transcript
       ▼
┌──────────────┐
│   Claude     │  Haiku/Sonnet with business-specific system prompt
│   (LLM)      │  Knows: services, hours, pricing, FAQ, booking rules
│              │  Decides: answer question / book appointment / escalate
└──────┬───────┘
       │ Response text
       ▼
┌──────────────┐
│   Text to    │  Phase 1: Twilio Polly voices (free, included)
│   Speech     │  Phase 2: Edge TTS (free, better quality)
│              │  Phase 3: ElevenLabs (paid, human-quality)
└──────┬───────┘
       │ Audio
       ▼
┌──────────────┐
│   Customer   │  "Great, I have you booked for tomorrow at 2pm.
│   hears AI   │   You'll get a confirmation text shortly."
└──────────────┘
```

### Step 5: After the Call
```
Immediately:
├── SMS to caller: "Your appointment is confirmed for [date/time]"
├── SMS to business owner: "New booking: [name] at [time] for [service]"  
├── Email summary to business owner with full transcript
└── Lead saved to Calva dashboard

Dashboard (calva.ai/admin):
├── All calls listed with transcripts
├── Leads captured (name, phone, what they need)
├── Appointments booked
├── Call analytics (volume, peak times, common requests)
└── Missed call alerts
```

## How OUR System Runs

### Infrastructure (on YOUR Mac / VPS)
```
Your Mac (or $5/mo VPS)
├── Calva Server (Node.js, port 3000)
│   ├── SQLite database (tenants, calls, bookings)
│   ├── Multi-tenant: each business = 1 row in tenants table
│   ├── Templates loaded per business
│   └── Webhook endpoints for Twilio
│
├── Exposed via: ngrok / Tailscale funnel / VPS public IP
│   └── Twilio webhooks point here
│
└── Costs: $0 (Mac) or $5/mo (VPS)
```

### Per-Business Setup (automated)
When a new customer signs up:
1. **Twilio API** → buy a local phone number ($1/mo + $0.02/min)
2. **Database** → create tenant record with their config
3. **Template** → load industry template, customize with their details
4. **Webhook** → Twilio number points to our /api/voice endpoint
5. **Done** → business is live in under 60 seconds

### Multi-Tenant Architecture
```
Database: tenants table
┌────┬──────────────────┬────────────────┬─────────────┬──────────┐
│ id │ name             │ phone_number   │ template    │ plan     │
├────┼──────────────────┼────────────────┼─────────────┼──────────┤
│ 1  │ Mike's Plumbing  │ +19295551001  │ plumber     │ starter  │
│ 2  │ Roma Pizzeria    │ +19295551002  │ restaurant  │ growth   │
│ 3  │ Smith & Assoc.   │ +19295551003  │ law-firm    │ premium  │
│ 4  │ Happy Paws Vet   │ +19295551004  │ vet-clinic  │ starter  │
└────┴──────────────────┴────────────────┴─────────────┴──────────┘

Each tenant has:
- Custom system prompt (built from template + their business details)
- Their own Twilio phone number
- Separate call logs and analytics
- Custom hours, services, pricing info
```

## Cost Breakdown Per Customer

### Our Costs (per customer per month)
| Item | Cost | Notes |
|------|------|-------|
| Twilio number | $1.15/mo | Local US number |
| Twilio voice | ~$4-20/mo | $0.02/min × 200-1000 min |
| Claude API | ~$1-5/mo | Haiku at ~$0.01/call |
| SMS notifications | ~$1-3/mo | $0.0079/msg × 100-400 msgs |
| Hosting (shared) | ~$0.50/mo | $5 VPS ÷ 10 customers |
| **Total** | **~$8-30/mo** | |

### Our Revenue Per Customer
| Plan | Revenue | Margin |
|------|---------|--------|
| Starter ($297) | $297/mo | $267-289 (90-97%) |
| Growth ($597) | $597/mo | $567-589 (95-99%) |
| Premium ($997) | $997/mo | $967-989 (97-99%) |

**10 customers on Starter = $2,970/mo revenue, ~$2,700 profit**

## What Makes Us THE BEST

### 1. Speed to Value
- Competitors: days/weeks of setup
- Calva: **live in 5 minutes**

### 2. Industry Intelligence
- Not generic scripts — each template knows the business
- Restaurant template knows about reservations, dietary needs, party sizes
- Law firm template knows about case types, consultations, urgency
- Plumber template knows about emergencies vs routine maintenance

### 3. Actually Does the Job
- Books real appointments (Cal.com integration)
- Sends confirmation texts
- Captures leads with full details
- Emails owner the transcript
- Handles emergencies (transfers to owner's cell)

### 4. Sounds Right
- Business-appropriate tone per vertical
- Knows industry terminology
- Handles common objections
- Never says "I'm an AI" unless asked

### 5. Price
- 50-80% cheaper than human receptionist services
- No contracts, cancel anytime
- Free 7-day trial

## Deployment Plan

### Phase 1: TODAY
1. Run on your Mac via Tailscale funnel (free, secure)
2. Demo number: existing Twilio number +1(929)755-7288
3. Manual customer onboarding (you + Santa set up each business)

### Phase 2: WEEK 2
1. Move to $5/mo VPS (DigitalOcean or Hetzner)
2. Self-service onboarding via calva.ai/onboard
3. Stripe integration for automatic payment
4. Twilio number auto-provisioning

### Phase 3: MONTH 2
1. Customer dashboard (call logs, analytics)
2. Edge TTS → ElevenLabs upgrade
3. Multi-language (Spanish)
4. SMS follow-up sequences
5. Cal.com/Calendly integration for real booking

---
*This is the full picture. Every call, covered.*
