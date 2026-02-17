# Calva AI Receptionist - Quick Start Guide

## 🚀 Get Running in 5 Minutes

### 1. Install Dependencies (2 min)
```bash
cd /Users/rifat/clawd/revenue/ai-receptionist

# Install Node.js packages
npm install

# Install Edge TTS (for high-quality voice)
./install-edge-tts.sh
# or manually: pip3 install edge-tts
```

### 2. Configure Environment (1 min)
Create `.env` file:
```bash
# Server
PORT=3000
BASE_URL=https://your-ngrok-url.ngrok.io

# Twilio (get from twilio.com/console)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token

# Anthropic (get from console.anthropic.com)
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxx
```

### 3. Initialize Database (30 sec)
```bash
npm run migrate
```

### 4. Start Server (30 sec)
```bash
npm run dev
```

Server runs at: `http://localhost:3000`

### 5. Expose to Internet (1 min)
Choose one:

**Option A - ngrok (easiest for testing):**
```bash
ngrok http 3000
# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
# Update BASE_URL in .env
```

**Option B - Tailscale Funnel (free, permanent):**
```bash
tailscale serve https / http://localhost:3000
# Use your Tailscale URL
```

---

## 🎯 Create Your First Tenant

### Using API
```bash
curl -X POST http://localhost:3000/onboard/create \
  -H 'Content-Type: application/json' \
  -d '{
    "businessName": "Mikes Plumbing",
    "templateName": "plumber",
    "businessConfig": {
      "BUSINESS_NAME": "Mikes Plumbing",
      "BUSINESS_HOURS": "Monday-Friday 8am-6pm",
      "EMERGENCY_PHONE": "+19295551234",
      "OWNER_NAME": "Mike",
      "CITY_STATE": "New York, NY",
      "SERVICE_AREA": "Manhattan and Brooklyn",
      "LICENSE_NUMBER": "PLB-12345",
      "ownerPhone": "+19295551234"
    },
    "areaCode": "929"
  }'
```

Response:
```json
{
  "success": true,
  "tenant_id": 1,
  "api_key": "calva_abc123...",
  "phone_number": "+19295550001",
  "message": "Account created successfully! Your phone number is +19295550001",
  "next_steps": [
    "Save your API key (you won't see it again)",
    "Your AI receptionist number: +19295550001",
    "Set up call forwarding (see /setup-forwarding)",
    "Test by calling the number"
  ]
}
```

**🎉 Done! You now have:**
- ✅ Dedicated phone number provisioned
- ✅ AI receptionist configured
- ✅ Template loaded with business info
- ✅ Ready to receive calls

---

## 📞 Test Your AI Receptionist

1. **Call the provisioned number** (from your phone)
2. **Listen to the greeting** (uses Edge TTS)
3. **Say something** like "Hi, I need a plumber for tomorrow"
4. **AI responds** and asks follow-up questions
5. **After call completes:**
   - Owner receives SMS summary
   - Caller receives confirmation (if booking)

---

## 📋 Available Templates

```bash
# List all templates
curl http://localhost:3000/onboard/templates
```

Templates included:
- `plumber` - Plumbing services
- `restaurant` - Restaurants
- `law-firm` - Law firms
- `medical-office` - Medical practices
- `auto-repair` - Auto repair shops
- `salon-spa` - Salons and spas

Each template includes:
- Industry-specific system prompt
- Sample conversations
- FAQ answers
- Customization variables

---

## 🔧 Useful Commands

### Development
```bash
npm run dev           # Start with auto-reload
npm run migrate       # Run database migrations
npm run clean-tts-cache  # Clean old TTS audio files
```

### Testing TTS
```bash
# Generate test audio
edge-tts --text "Hello from Calva AI" --write-media test.mp3

# Play it (macOS)
afplay test.mp3
```

### Check Status
```bash
curl http://localhost:3000/health
```

---

## 🌐 Web Interfaces

### Landing Page
```
http://localhost:3000/
```

### Onboarding Portal
```
http://localhost:3000/onboard
```

### Admin Dashboard
```
http://localhost:3000/admin/dashboard
```

### Call Forwarding Setup Guide
```
http://localhost:3000/admin/setup-forwarding?number=+19295550001
```

---

## 🐛 Troubleshooting

### Edge TTS not working?
```bash
# Verify installation
edge-tts --version

# Reinstall if needed
pip3 install --upgrade edge-tts
```

System will **automatically fallback** to Twilio TTS if Edge TTS unavailable.

### Phone provisioning fails?
- Check Twilio account balance
- Verify `BASE_URL` is publicly accessible
- Check Twilio credentials in `.env`

### Notifications not sending?
- Verify `ownerPhone` is set in business config
- Check Twilio SMS balance
- Look for errors in server logs

### Webhooks not receiving calls?
- Ensure `BASE_URL` is correct and publicly accessible
- Check Twilio phone number webhook configuration
- Verify webhook URL: `{BASE_URL}/api/voice`

---

## 📚 Documentation

- **Full Setup Guide:** `docs/SETUP.md`
- **Architecture:** `docs/ARCHITECTURE.md`
- **Implementation Summary:** `IMPLEMENTATION_SUMMARY.md`
- **API Reference:** (coming soon)

---

## 💡 Pro Tips

1. **Use ngrok for development**, Tailscale for permanent free hosting
2. **Set up call forwarding** so your existing number works with Calva
3. **Monitor the logs** - you'll see every call and TTS generation
4. **Cache grows** - run `npm run clean-tts-cache` weekly
5. **Test with different scenarios** - emergency, booking, questions

---

## 🎯 What's Next?

### Business-ready features to add:
1. **Stripe integration** - Accept payments during onboarding
2. **Cal.com integration** - Real calendar booking
3. **Email transcripts** - Send full call transcripts to owners
4. **Analytics dashboard** - Call volume, conversion rates
5. **Multi-language** - Spanish support

### Already have:
✅ Multi-tenant support  
✅ Auto phone provisioning  
✅ Post-call notifications  
✅ Template system  
✅ High-quality TTS  
✅ Call forwarding guide  

---

## 💰 Cost Per Customer

| Item | Monthly Cost |
|------|-------------|
| Twilio phone | $1.15 |
| Twilio voice (500 min) | $10 |
| Claude API (100 calls) | $2 |
| SMS (100 messages) | $2 |
| Edge TTS | **$0** (free!) |
| **Total** | **~$15/mo** |

**Charge customer:** $297-997/mo  
**Profit margin:** 95%+

---

## 🚀 Ready to Launch?

1. ✅ Server running
2. ✅ Phone number provisioned
3. ✅ Test call successful
4. ✅ Notifications working
5. ✅ Call forwarding configured

**You're ready to go live!**

Questions? Check the logs or read the full documentation in `docs/SETUP.md`.

---

**Built with:** Node.js • Express • Twilio • Claude • Edge TTS • SQLite

**License:** MIT
