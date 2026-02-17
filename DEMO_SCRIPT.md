# AI Receptionist Demo Script

## 🎯 Pitch: "AI Receptionist as a Service"

**Target**: Local businesses (plumbers, electricians, HVAC, contractors, etc.)

**Problem**: 
- Missing calls = lost business
- Can't afford full-time receptionist
- Customers frustrated with voicemail

**Solution**: 
- AI answers 24/7
- Books appointments automatically
- Natural conversation
- Costs less than $100/month

## 📞 Live Demo Flow

### Setup Before Call
1. Start server: `./start.sh`
2. Start ngrok: `ngrok http 3000`
3. Update Twilio webhook with ngrok URL
4. Have Twilio console debugger open: https://console.twilio.com/us1/monitor/logs/debugger
5. Have `/sessions` endpoint open: `http://localhost:3000/sessions`

### Demo Call #1: Appointment Booking

**Scenario**: Customer needs drain cleaning

```
☎️  Call: +1 (929) 755-7288

[AI answers]
"Hi, thanks for calling Mike's Plumbing NYC! How can I help you today?"

👤 YOU: "Hi, I need someone to fix my clogged drain"

🤖 AI: "I can help you with that. What's your name?"

👤 YOU: "Sarah Johnson"

🤖 AI: "Thanks, Sarah. What's a good phone number to reach you?"

👤 YOU: "555-987-6543"

🤖 AI: "Got it. What's the address where you need service?"

👤 YOU: "456 Oak Avenue, apartment 3B, Manhattan"

🤖 AI: "Perfect. When would you like us to come by?"

👤 YOU: "Is Friday morning available? Around 10am?"

🤖 AI: "Great! I have you scheduled for drain cleaning on Friday at 10am 
at 456 Oak Avenue, apartment 3B in Manhattan. We'll call you at 
555-987-6543 to confirm. Have a great day!"

[Call ends]
```

**Show**: Server logs capturing the full conversation and booking details

### Demo Call #2: Quick Question

**Scenario**: Customer wants hours

```
☎️  Call: +1 (929) 755-7288

🤖 AI: "Hi, thanks for calling Mike's Plumbing NYC! How can I help you today?"

👤 YOU: "What time do you close today?"

🤖 AI: "We're open Monday through Saturday, 7am to 6pm. Today we close at 6pm. 
Can I help you with anything else?"

👤 YOU: "No, that's all. Thanks!"

🤖 AI: "Have a great day!"

[Call ends]
```

### Demo Call #3: Emergency

**Scenario**: Urgent plumbing issue

```
☎️  Call: +1 (929) 755-7288

🤖 AI: "Hi, thanks for calling Mike's Plumbing NYC! How can I help you today?"

👤 YOU: "My basement is flooding! I need someone right now!"

🤖 AI: "I understand this is an emergency. I'm going to transfer you to Mike 
right away so he can help you immediately. Please hold."

[Would transfer - we'll simulate]
```

## 📊 Show During Demo

### 1. Server Logs
```
📞 Incoming call: CAxxxxxxxxxxxxxxx
💬 [CA...] Caller said: "I need someone to fix my clogged drain"
🤖 [CA...] AI Response: { intent: 'booking', message: '...' }
✅ [CA...] Booking completed: {
  name: 'Sarah Johnson',
  phone: '555-987-6543',
  address: '456 Oak Avenue, apt 3B, Manhattan',
  service: 'drain cleaning',
  preferredTime: 'Friday at 10am'
}
```

### 2. Active Sessions
```bash
curl http://localhost:3000/sessions | jq
```

Shows conversation history and collected data in real-time

### 3. Twilio Debugger
Show the webhook calls and responses in Twilio console

## 💰 Business Value Points

**During Demo, Mention:**

1. **Never Miss a Call**
   - Works 24/7/365
   - No sick days or vacations
   - Instant pickup

2. **Professional Experience**
   - Natural conversation
   - Collects accurate information
   - Confirms details

3. **Cost Effective**
   - ~$50-100/month (vs. $3000+/month for human)
   - No training needed
   - Instant setup

4. **Integration Ready**
   - Can sync to your calendar
   - Send confirmation emails/SMS
   - Update your CRM automatically

5. **Customizable**
   - Your business name and services
   - Your hours and policies
   - Your call transfer rules

## 🎨 Customization Examples

**Show how easy it is to customize:**

```javascript
const BUSINESS_CONFIG = {
  name: "ABC Electricians",  // ← Change here
  services: [
    "Panel upgrades",         // ← Your services
    "Outlet installation",
    "Emergency repairs"
  ],
  hours: "24/7",             // ← Your hours
  owner: "Alex"              // ← Owner name
};
```

**30 seconds to rebrand for ANY business!**

## 📈 Pricing Model Ideas

**Monthly Plans:**

- **Basic** ($79/mo): 100 calls, appointment booking
- **Pro** ($149/mo): 500 calls, CRM integration, SMS
- **Enterprise** ($299/mo): Unlimited, custom integration

**Or:**

- **Setup Fee**: $299 one-time
- **Monthly**: $0.25/call + $49 base fee
- **CRM Integration**: +$50/mo

## 🎯 Target Customers

**Best Fit:**
- Plumbers, electricians, HVAC
- Contractors (roofing, painting, etc.)
- Home services (cleaning, lawn care)
- Medical/dental offices
- Auto repair shops
- Any appointment-based business

**Sweet Spot:**
- 50-500 calls/month
- Can't afford full-time receptionist
- Missing calls hurts revenue

## 🚀 Call to Action

**After Demo:**

> "So that's it! An AI receptionist that:
> - Answers every call professionally
> - Books appointments automatically  
> - Costs less than $100/month
> 
> Would this help your business?"

**Next Steps:**
1. Free trial: "Let's set this up for your business"
2. Custom demo: "I'll configure it with your info"
3. Soft commit: "How many calls do you get per day?"

## 📝 Follow-up Materials

**Send After Demo:**
- Video recording of demo call
- Pricing sheet
- Sample conversation transcripts
- ROI calculator ("How much revenue are you losing from missed calls?")

---

## 🎬 Demo Checklist

Before each demo:

- [ ] Server running
- [ ] ngrok exposing localhost
- [ ] Twilio webhook configured
- [ ] Test call completed successfully
- [ ] Browser tabs open (logs, sessions, Twilio)
- [ ] Backup: Have recording ready if tech fails
- [ ] Pricing sheet printed/ready to share

**Pro Tip**: Record your test calls beforehand as backup in case of technical issues during live demo!
