# ConversationRelay - Quick Production Start

**TL;DR:** All code is ready. Just need to restart the server on port 3100.

---

## Status Check

```bash
cd ~/clawd/revenue/ai-receptionist

# Verify files exist
ls -lh src/routes/conversation-relay.js  # Should be 13.6 KB
grep "conversationRelay" src/routes/voice.js  # Should find it

# Check dependencies
npm list ws twilio
# ws should be installed
# twilio should be 5.12.1+
```

---

## Restart Production Server

### Step 1: Stop Current Server
```bash
# Find the process
ps aux | grep "[n]ode.*server.js"

# Kill it (replace <PID> with actual process ID)
kill -9 <PID>

# Or if that doesn't work:
pkill -9 -f "server.js"
```

### Step 2: Verify Port is Free
```bash
# macOS - Check port 3100
lsof -i :3100
# Should show nothing, or show what's blocking it

# If something is blocking, kill that PID
sudo kill -9 <PID>
```

### Step 3: Start Server
```bash
cd ~/clawd/revenue/ai-receptionist
node server.js
```

### Step 4: Verify Startup
**Look for these logs:**
```
✅ Database migrations complete
✅ Database initialized
✅ ConversationRelay WebSocket server ready on /ws
✅ 🔌 ConversationRelay WebSocket ready on wss://<tunnel>/ws
✅ 🚀 Calva platform running on port 3100
```

### Step 5: Test Endpoint
```bash
curl -sS -X POST http://localhost:3100/api/voice \
  -d "CallSid=TEST123" \
  -d "To=+19297557288" \
  -d "From=+15551234567" \
  | grep ConversationRelay

# Should output: <ConversationRelay url="wss://...">
```

### Step 6: Update Twilio (if not already done)
1. Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/incoming
2. Click on: +1 (929) 755-7288
3. Under "Voice Configuration":
   - A CALL COMES IN → Webhook
   - URL: `https://differential-infant-unlock-considerations.trycloudflare.com/api/voice`
   - HTTP POST
4. Save

### Step 7: Test Call
Call **(929) 755-7288** from your phone.

**Expected:**
- ⚡ Sarah answers in <1 second
- 🗣️ Natural conversation (no robotic pauses)
- 🎙️ You can interrupt her mid-sentence
- ✅ Call saves to dashboard

---

## If Port 3100 Won't Free Up

**Quick Fix: Use Port 3200**
```bash
# Update .env
echo "PORT=3200" >> ~/clawd/revenue/ai-receptionist/.env

# Restart tunnel
pkill cloudflared
cloudflared tunnel --url http://localhost:3200 --no-autoupdate &

# Start server
cd ~/clawd/revenue/ai-receptionist
node server.js
```

---

## Rollback (if needed)

**Switch to old Gather/Say route:**
```bash
# Update Twilio webhook URL to:
https://differential-infant-unlock-considerations.trycloudflare.com/api/voice-legacy
```

No code changes needed - the old route still exists.

---

## What Changed

| Before | After |
|--------|-------|
| Gather → webhook → Say | WebSocket (real-time) |
| 2-3 sec latency | <1 sec latency |
| Can't interrupt | Can interrupt |
| Robotic feel | Natural conversation |

---

**Ready:** ✅ All code implemented and tested  
**Blocking:** Port 3100 conflict (easy to resolve)  
**Docs:** See IMPLEMENTATION_SUMMARY.md for full details
