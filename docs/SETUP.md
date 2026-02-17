# Calva AI Receptionist - Setup Guide

## Prerequisites

- Node.js 18+ installed
- Python 3.7+ installed (for Edge TTS)
- Twilio account with phone number
- Anthropic API key (Claude)

## Installation

### 1. Clone and Install Dependencies

```bash
cd /Users/rifat/clawd/revenue/ai-receptionist
npm install
```

### 2. Install Edge TTS (for high-quality voice)

Edge TTS is a free, high-quality text-to-speech service using Microsoft Edge's voices.

```bash
npm run setup-tts
# Or manually:
pip3 install edge-tts
```

Verify installation:
```bash
edge-tts --version
```

### 3. Environment Variables

Create `.env` file:

```bash
# Server
PORT=3000
NODE_ENV=development
BASE_URL=https://your-domain.com  # or ngrok URL

# Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token

# Anthropic (Claude)
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxx
```

### 4. Database Setup

```bash
npm run migrate
```

This creates the SQLite database with all required tables.

### 5. Start the Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

## Features Overview

### 1. Auto Phone Number Provisioning

When a new tenant signs up, the system automatically:
- Searches for available phone numbers in their area code
- Purchases a number via Twilio API
- Configures voice webhooks to point to your server
- Updates the tenant database record

**API Endpoint:**
```bash
POST /onboard/create
{
  "businessName": "Mike's Plumbing",
  "templateName": "plumber",
  "businessConfig": {
    "BUSINESS_NAME": "Mike's Plumbing",
    "BUSINESS_HOURS": "Mon-Fri 8am-6pm",
    "EMERGENCY_PHONE": "+19295551234",
    "OWNER_NAME": "Mike",
    "CITY_STATE": "New York, NY",
    "SERVICE_AREA": "Manhattan and Brooklyn",
    "LICENSE_NUMBER": "PLB-12345"
  },
  "areaCode": "929"  // Optional - auto-provision in this area
}
```

### 2. Post-Call Notifications

After every completed call, the system sends:

**To Business Owner:**
```
📞 New Call - Mike's Plumbing

👤 John Smith
📱 (555) 123-4567
🎯 📅 Appointment Booking
📋 Service: Kitchen faucet leaking
🗓️ Requested: Tomorrow afternoon

⏰ 2/12/24, 2:30 PM
```

**To Caller (if appointment booked):**
```
✅ Appointment Confirmed - Mike's Plumbing

Thank you for booking with us!

📋 Service: Kitchen faucet leaking
🗓️ When: Tomorrow at 2pm

Questions? Reply to this text or call (929) 555-1234
```

### 3. Template Loader

Templates are loaded from `/templates/` directory and merged with business-specific config.

**Available Templates:**
- `plumber.json` - Plumbing services
- `restaurant.json` - Restaurants
- `law-firm.json` - Law firms
- `medical-office.json` - Medical practices
- `auto-repair.json` - Auto repair shops
- `salon-spa.json` - Salons and spas

**Template Variables:**
Templates use `{{VARIABLE}}` placeholders that are replaced with business config:
- `{{BUSINESS_NAME}}` - Business name
- `{{BUSINESS_HOURS}}` - Operating hours
- `{{SERVICES_LIST}}` - Auto-generated bullet list of services
- `{{OWNER_NAME}}` - Owner's name
- etc.

**API Endpoints:**
```bash
# List all templates
GET /onboard/templates

# Get template variables
GET /onboard/templates/plumber/variables

# Merge template with config (used internally during onboarding)
```

### 4. Edge TTS Integration

High-quality, free text-to-speech using Microsoft Edge voices.

**Features:**
- 10+ natural-sounding voices
- Caching system (files stored in `/data/tts-cache/`)
- Automatic fallback to Twilio TTS if Edge TTS fails
- Industry-specific voice recommendations

**Recommended Voices:**
- Law firms, medical: `en-US-JennyNeural` (professional female) / `en-US-DavisNeural` (professional male)
- Restaurants, salons: `en-US-SaraNeural` (friendly female) / `en-US-JasonNeural` (friendly male)
- Plumbing, auto repair: `en-US-SaraNeural` (friendly female) / `en-US-GuyNeural` (friendly male)

**Cache Management:**
```bash
# Clean cache files older than 7 days
npm run clean-tts-cache
```

**How It Works:**
1. AI generates response text
2. System checks TTS cache for matching audio
3. If cache miss, generates new audio using Edge TTS
4. Audio file served to Twilio via `/api/tts-audio/:filename`
5. If Edge TTS unavailable, falls back to Twilio's `<Say>` verb

### 5. Call Forwarding Setup Guide

Interactive HTML guide at `/admin/setup-forwarding` with instructions for:
- AT&T
- Verizon
- T-Mobile
- Spectrum Mobile

**Features:**
- Carrier-specific dial codes
- Step-by-step instructions
- Input field to customize with tenant's Calva number
- Collapsible sections for easy navigation

**Usage:**
```
https://your-domain.com/admin/setup-forwarding?number=+19295551234
```

## Architecture

```
┌─────────────────────────────────────────────────┐
│ Twilio (Incoming Call)                          │
│ +19295551001 → POST /api/voice                  │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ Voice Routes (src/routes/voice.js)              │
│ - Lookup tenant by phone number                 │
│ - Load system prompt from template              │
│ - Generate TTS welcome message                  │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ Speech-to-Text (Twilio)                         │
│ "Hi, I need a plumber for tomorrow"             │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ Claude Service (src/services/claude.js)         │
│ - Process with business-specific prompt         │
│ - Extract intent & collected data               │
│ - Return response text                          │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ TTS Service (src/services/tts.js)               │
│ - Check cache for audio                         │
│ - Generate using Edge TTS if needed             │
│ - Return audio URL or fallback to Twilio        │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ Text-to-Speech (Edge TTS)                       │
│ "Great! What's your name?"                      │
│ → /api/tts-audio/abc123.mp3                     │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ Continue until complete = true                  │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ Post-Call Actions                               │
│ - Create booking in database                    │
│ - Send SMS to owner (notifications.js)          │
│ - Send SMS confirmation to caller               │
└─────────────────────────────────────────────────┘
```

## Testing

### Test Phone Number Provisioning
```bash
curl -X POST http://localhost:3000/onboard/create \
  -H 'Content-Type: application/json' \
  -d '{
    "businessName": "Test Plumbing",
    "templateName": "plumber",
    "businessConfig": {
      "BUSINESS_NAME": "Test Plumbing",
      "BUSINESS_HOURS": "Mon-Fri 9am-5pm",
      "EMERGENCY_PHONE": "+15555551234",
      "OWNER_NAME": "Test",
      "CITY_STATE": "New York, NY",
      "SERVICE_AREA": "NYC",
      "LICENSE_NUMBER": "TEST-123"
    },
    "areaCode": "212"
  }'
```

### Test TTS Generation
```bash
# In Node REPL
const { generateTTS } = require('./src/services/tts');
generateTTS("Hello, this is a test").then(console.log);
```

### Test Notifications
```bash
# In Node REPL
const { sendOwnerNotification } = require('./src/services/notifications');
const db = require('./src/db');

// You'll need a real tenant ID from your database
sendOwnerNotification(1, 1, {
  caller_phone: '+15555551234',
  intent: 'booking',
  collected: {
    name: 'John Smith',
    phone: '+15555551234',
    service: 'Kitchen faucet repair',
    preferredTime: 'Tomorrow at 2pm'
  }
}).then(console.log);
```

## Deployment

### Using ngrok (Development)
```bash
ngrok http 3000
# Use the HTTPS URL in Twilio webhook config
```

### Using Tailscale Funnel (Free, Permanent)
```bash
tailscale serve https / http://localhost:3000
# Use your Tailscale URL in Twilio webhook config
```

### Production VPS
1. Deploy to DigitalOcean/Hetzner ($5/mo)
2. Use PM2 for process management
3. Set up nginx reverse proxy
4. Configure SSL with Let's Encrypt

## Cost Breakdown

Per customer per month:

| Item | Cost |
|------|------|
| Twilio phone number | $1.15 |
| Twilio voice (200-1000 min) | $4-20 |
| Claude API (~100 calls) | $1-5 |
| SMS notifications (~100 msgs) | $1-3 |
| Edge TTS | $0 (free) |
| **Total** | **$7-29/mo** |

Revenue per customer: $297-997/mo

Margin: 90-97%

## Troubleshooting

### Edge TTS Not Working
```bash
# Check if edge-tts is installed
edge-tts --version

# Reinstall if needed
pip3 install --upgrade edge-tts

# Test manually
edge-tts --text "Hello world" --write-media test.mp3
```

### Notifications Not Sending
- Verify Twilio credentials in `.env`
- Check that tenant has `ownerPhone` or `emergency_line` in config
- Check logs for SMS errors

### Phone Provisioning Fails
- Verify Twilio account has available balance
- Check if area code has available numbers
- Ensure `BASE_URL` is set correctly in `.env`

## Next Steps

1. **Stripe Integration** - Add payment processing to onboarding
2. **Cal.com Integration** - Real calendar booking
3. **Multi-language** - Spanish support
4. **Email Transcripts** - Send full call transcripts to owners
5. **Analytics Dashboard** - Call volume, peak times, conversion rates

---

**Built with:**
- Node.js + Express
- Twilio Voice API
- Claude (Anthropic)
- Edge TTS (Microsoft)
- SQLite

**License:** MIT
