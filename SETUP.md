# Quick Setup Guide

## ⚡ Fast Track (5 minutes)

### 1. Install ngrok (if not installed)
```bash
brew install ngrok
```

### 2. Set your Anthropic API key
```bash
# Add to .env file
echo 'ANTHROPIC_API_KEY=sk-ant-your-key-here' >> .env
```

### 3. Start the server
```bash
./start.sh
```

### 4. In a new terminal, expose with ngrok
```bash
cd /Users/rifat/clawd/revenue/ai-receptionist
ngrok http 3000
```

Copy the HTTPS URL that ngrok shows (e.g., `https://abc123.ngrok.io`)

### 5. Configure Twilio
1. Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/active
2. Click on: **+1 929 755 7288**
3. Scroll to "Voice Configuration"
4. Set:
   - **A CALL COMES IN**: Webhook
   - **URL**: `https://YOUR-NGROK-URL.ngrok.io/voice`
   - **HTTP**: POST
5. Click **Save**

### 6. Test!
Call: **+1 (929) 755-7288**

## 🧪 Test Locally First

Before testing with real calls:

```bash
# Start server in one terminal
npm start

# In another terminal, run tests
./test.sh
```

## 🎯 Example Conversations

### Booking Appointment
```
AI: Hi, thanks for calling Mike's Plumbing NYC! How can I help you today?
You: I need to schedule a drain cleaning
AI: Sure! I can help you with that. What's your name?
You: John Smith
AI: Thanks, John. What's a good phone number to reach you?
You: 555-123-4567
AI: Got it. What's the address where you need the service?
You: 123 Main Street, Brooklyn
AI: Perfect. When would you like us to come by?
You: Tomorrow afternoon around 2pm
AI: Great! I have you down for a drain cleaning tomorrow at 2pm at 123 Main Street in Brooklyn. We'll call you at 555-123-4567 to confirm. Have a great day!
```

### Hours Question
```
AI: Hi, thanks for calling Mike's Plumbing NYC! How can I help you today?
You: What are your hours?
AI: We're open Monday through Saturday, 7am to 6pm. Is there anything else I can help you with?
```

### Emergency
```
AI: Hi, thanks for calling Mike's Plumbing NYC! How can I help you today?
You: I have a burst pipe, it's an emergency!
AI: I understand this is urgent. Let me transfer you to Mike right away. Please hold.
```

## 📊 Monitor Active Calls

While the server is running:

```bash
# Check health
curl http://localhost:3000/health

# View active call sessions
curl http://localhost:3000/sessions
```

## 🔧 Troubleshooting

### Server won't start
```bash
# Check if port 3000 is in use
lsof -i :3000

# Kill existing process
kill -9 $(lsof -t -i :3000)

# Try again
npm start
```

### ngrok URL not working
- Make sure ngrok is running
- Check that you used the **HTTPS** URL (not HTTP)
- Verify webhook URL in Twilio ends with `/voice`

### AI not responding
- Check `.env` has valid `ANTHROPIC_API_KEY`
- Look at server logs for errors
- Try the test script: `./test.sh`

### Twilio debugger
Check for webhook errors: https://console.twilio.com/us1/monitor/logs/debugger

## 🚀 Next Steps

Once working:
1. ✅ Test with multiple call scenarios
2. ✅ Add booking persistence (database/n8n webhook)
3. ✅ Deploy to production (Railway/Render/Fly.io)
4. ✅ Add SMS confirmation after booking
5. ✅ Customize for different businesses

## 📞 Resources

- **Twilio Console**: https://console.twilio.com
- **Anthropic Dashboard**: https://console.anthropic.com
- **ngrok Dashboard**: https://dashboard.ngrok.com
- **Twilio TwiML Reference**: https://www.twilio.com/docs/voice/twiml

---

**Need help?** Check server logs or run `./test.sh` to diagnose issues.
