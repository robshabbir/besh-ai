# Quick Reference: Media Streams Implementation

## 🎯 What Was Built

A **Twilio Media Streams voice AI pipeline** that replaces ConversationRelay and allows using **ElevenLabs TTS** (which is blocked on ConversationRelay).

## 📁 Files Created

```
src/
├── services/
│   ├── deepgram-stt.js           # Deepgram WebSocket STT client
│   └── elevenlabs-stream.js      # ElevenLabs WebSocket streaming TTS
└── routes/
    └── voice-stream.js            # Media Streams route + WebSocket handler

server.js                          # Updated: added Media Streams WebSocket
.env                               # Updated: added DEEPGRAM_API_KEY placeholder
```

## 🔧 Quick Setup

### 1. Add Deepgram API Key

Get free key (includes $200 credit):
```bash
# Sign up: https://console.deepgram.com/signup
# Add to .env:
DEEPGRAM_API_KEY=your_key_here
```

### 2. Update Twilio Webhook

Change webhook URL from:
```
/api/voice          # Old: Gather + Say flow
/api/voice-cr       # Old: ConversationRelay (ElevenLabs blocked)
```

To:
```
/api/voice-stream   # New: Media Streams + Deepgram + ElevenLabs
```

**Steps:**
1. Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/incoming
2. Click: **+1 (929) 755-7288**
3. Set webhook to: `https://autumn-piano-mlb-gzip.trycloudflare.com/api/voice-stream`
4. Save

### 3. Restart Server

```bash
cd /Users/rifat/clawd/revenue/ai-receptionist
npm start
```

## 🧪 Testing

### Automated Test:
```bash
./test-media-streams.sh
```

### Manual Test:
1. Call: **+1 (929) 755-7288**
2. Say: "Hey, I need to schedule an appointment"
3. Verify natural voice and quick response

### Monitor Logs:
```bash
tail -f data/calva.log | grep -E "(Media Stream|Deepgram|ElevenLabs|User speech|AI response)"
```

## 📊 Comparison Table

| Route | STT | TTS | Use Case |
|-------|-----|-----|----------|
| `/api/voice` | Twilio | Twilio TTS + ElevenLabs files | Stable, no streaming |
| `/api/voice-cr` | Deepgram | Amazon Polly | ❌ ElevenLabs blocked |
| **`/api/voice-stream`** | **Deepgram** | **ElevenLabs streaming** | ✅ Best quality, unblocked |

## 🎙️ Voice Configuration

### Current Setup:
- **Voice:** ElevenLabs Sarah (`EXAVITQu4vr4xnSDxMaL`)
- **Model:** `eleven_turbo_v2_5`
- **Format:** `ulaw_8000` (μ-law 8kHz for Twilio)
- **Stability:** 0.25 (natural variation)
- **Style:** 0.6 (expressive)

### To Change Voice:
Edit `src/services/elevenlabs-stream.js`:
```javascript
const VOICES = {
  en: {
    id: 'YOUR_VOICE_ID',  // Get from ElevenLabs dashboard
    stability: 0.25,
    // ...
  }
};
```

## 🔍 Debugging

### Check Environment:
```bash
grep -E "(DEEPGRAM|ELEVENLABS|GEMINI)" .env
```

### Test APIs:
```bash
# ElevenLabs
curl -H "xi-api-key: $ELEVENLABS_API_KEY" https://api.elevenlabs.io/v1/user

# Deepgram
curl -H "Authorization: Token $DEEPGRAM_API_KEY" https://api.deepgram.com/v1/projects
```

### Check WebSocket:
```bash
# Look for these log messages:
# ✓ Media Stream WebSocket connected
# ✓ Deepgram STT connection opened
# ✓ ElevenLabs stream opened
```

## 🚨 Troubleshooting

### "Deepgram error: Invalid API key"
```bash
# Get free key: https://console.deepgram.com/signup
# Add to .env:
echo "DEEPGRAM_API_KEY=your_key" >> .env
```

### "ElevenLabs error 401"
```bash
# Verify key:
security find-generic-password -a "clawdbot" -s "elevenlabs-api-key" -w
# Or check .env:
grep ELEVENLABS_API_KEY .env
```

### No audio playback
1. Check WebSocket connection in logs
2. Verify BASE_URL matches tunnel URL
3. Test with: `./test-media-streams.sh`

### High latency
- Check network connection
- Verify using `nova-2-phonecall` (fastest Deepgram model)
- Verify using `eleven_turbo_v2_5` (fastest ElevenLabs model)

## 📞 Support Commands

```bash
# Check server status
curl http://localhost:3100/health

# Test endpoint
curl -X POST http://localhost:3100/api/voice-stream \
  -d "CallSid=test" \
  -d "To=%2B19297557288" \
  -d "From=%2B15551234567"

# View recent logs
tail -50 data/calva.log

# Restart server
npm start
```

## 🎯 Success Indicators

✅ **System is working when you see:**
- "Media Stream WebSocket connected"
- "Deepgram STT connection opened"  
- "ElevenLabs stream opened"
- "User speech: [transcript]"
- "AI response generated"
- Call completes successfully

## 💰 Cost Estimate

**Per minute:**
- Twilio: ~$0.01
- Deepgram: ~$0.0043 (or FREE with 45k min/year tier)
- ElevenLabs: ~$0.03

**Total: ~$0.04/min** (or **~$0.01/min** with Deepgram free tier)

## 📚 Full Documentation

See `MEDIA_STREAMS_SETUP.md` for complete architecture, setup, and troubleshooting guide.

---

**Last Updated:** 2024  
**Status:** Ready for Testing 🚀
