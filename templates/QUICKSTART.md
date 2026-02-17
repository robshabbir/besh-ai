# Quick Start Guide - AI Receptionist Templates

Get your industry-specific AI receptionist running in 5 minutes.

## Step 1: Choose Your Template

```bash
cd /Users/rifat/clawd/revenue/ai-receptionist/templates
node template-processor.js list
```

Available:
- `law-firm` - For legal practices
- `medical-office` - For healthcare providers

## Step 2: Create Your Configuration

Create a JSON file with your business details:

**For Law Firms** (`my-firm-config.json`):
```json
{
  "FIRM_NAME": "Your Firm Name",
  "CITY_STATE": "City, State",
  "BUSINESS_HOURS": "Monday-Friday 9am-5pm",
  "EMERGENCY_PHONE": "+1-555-0100",
  "PARTNER_NAME": "Senior Partner Name, Esq.",
  "CONSULTATION_FEE": "$150"
}
```

**For Medical Offices** (`my-practice-config.json`):
```json
{
  "PRACTICE_NAME": "Your Practice Name",
  "SPECIALTY": "Family Medicine",
  "DOCTOR_NAME": "Dr. Your Name, MD",
  "LOCATION": "City, State",
  "BUSINESS_HOURS": "Monday-Friday 8am-5pm",
  "NURSE_LINE": "+1-555-0100",
  "ADDRESS": "123 Main St, City, State ZIP",
  "PARKING": "Free parking in lot"
}
```

See `examples/` folder for complete examples.

## Step 3: Process Your Template

```bash
node template-processor.js process law-firm my-firm-config.json > processed-config.json
```

This creates a ready-to-use configuration file.

## Step 4: Integrate with Server

### Option A: Direct Integration (Simple)

Edit your `server.js`:

```javascript
const { processTemplate } = require('./templates/template-processor');

// Load and process template
const config = processTemplate('law-firm', {
  FIRM_NAME: "Smith & Associates",
  CITY_STATE: "Chicago, Illinois",
  BUSINESS_HOURS: "Monday-Friday 9am-5pm",
  EMERGENCY_PHONE: "+1-312-555-0199",
  PARTNER_NAME: "John Smith, Esq.",
  CONSULTATION_FEE: "$150"
});

// Use in your server
const BUSINESS_CONFIG = config.businessConfig;
const SYSTEM_PROMPT = config.systemPrompt;

console.log('✅ AI Receptionist ready for:', config.businessConfig.name);
```

### Option B: From File (Production)

```javascript
const { processTemplate } = require('./templates/template-processor');
const fs = require('fs');

// Load customizations from file
const customizations = JSON.parse(
  fs.readFileSync('./config/my-firm.json', 'utf8')
);

const config = processTemplate('law-firm', customizations);

const BUSINESS_CONFIG = config.businessConfig;
const SYSTEM_PROMPT = config.systemPrompt;
```

## Step 5: Start Your Server

```bash
# Make sure environment variables are set
export ANTHROPIC_API_KEY="your-key"
export TWILIO_ACCOUNT_SID="your-sid"
export TWILIO_AUTH_TOKEN="your-token"

# Start the server
node server.js
```

## Complete Example

Create `server-law-firm.js`:

```javascript
#!/usr/bin/env node

require('dotenv').config();
const express = require('express');
const twilio = require('twilio');
const Anthropic = require('@anthropic-ai/sdk');
const { processTemplate } = require('./templates/template-processor');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Anthropic
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Process template
const config = processTemplate('law-firm', {
  FIRM_NAME: process.env.FIRM_NAME || "Smith & Associates",
  CITY_STATE: process.env.CITY_STATE || "Chicago, Illinois",
  BUSINESS_HOURS: process.env.BUSINESS_HOURS || "Monday-Friday 9am-5pm",
  EMERGENCY_PHONE: process.env.EMERGENCY_PHONE || "+1-312-555-0199",
  PARTNER_NAME: process.env.PARTNER_NAME || "John Smith, Esq.",
  CONSULTATION_FEE: process.env.CONSULTATION_FEE || "$150"
});

const BUSINESS_CONFIG = config.businessConfig;
const SYSTEM_PROMPT = config.systemPrompt;

// Session storage
const sessions = {};

function getSession(callSid) {
  if (!sessions[callSid]) {
    sessions[callSid] = {
      messages: [],
      collected: {},
      intent: null
    };
  }
  return sessions[callSid];
}

async function processWithClaude(session, userMessage) {
  const messages = [
    ...session.messages,
    { role: 'user', content: userMessage }
  ];

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: messages
    });

    const assistantMessage = response.content[0].text;
    
    let result;
    try {
      const jsonMatch = assistantMessage.match(/```json\n([\s\S]*?)\n```/) || 
                       assistantMessage.match(/```\n([\s\S]*?)\n```/) ||
                       [null, assistantMessage];
      result = JSON.parse(jsonMatch[1] || assistantMessage);
    } catch (e) {
      result = {
        message: assistantMessage,
        intent: 'question',
        collected: session.collected,
        complete: false
      };
    }

    session.messages.push(
      { role: 'user', content: userMessage },
      { role: 'assistant', content: assistantMessage }
    );
    session.collected = { ...session.collected, ...result.collected };
    session.intent = result.intent;

    return result;
  } catch (error) {
    console.error('Claude API error:', error);
    return {
      message: "I'm having trouble hearing you. Could you please repeat that?",
      intent: session.intent || 'question',
      collected: session.collected,
      complete: false
    };
  }
}

// Twilio webhooks
app.post('/voice', async (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();
  
  console.log('📞 Incoming call:', req.body.CallSid);

  const gather = twiml.gather({
    input: 'speech',
    action: '/gather',
    method: 'POST',
    speechTimeout: 'auto',
    speechModel: 'phone_call'
  });

  gather.say(
    { voice: 'Polly.Joanna' },
    `Hi, thanks for calling ${BUSINESS_CONFIG.name}! How can I help you today?`
  );

  twiml.say(
    { voice: 'Polly.Joanna' },
    "I didn't hear anything. Please call back when you're ready. Goodbye!"
  );

  res.type('text/xml');
  res.send(twiml.toString());
});

app.post('/gather', async (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();
  const callSid = req.body.CallSid;
  const speechResult = req.body.SpeechResult || '';

  console.log(`💬 [${callSid}] Caller said: "${speechResult}"`);

  if (!speechResult) {
    twiml.say({ voice: 'Polly.Joanna' }, "I didn't catch that. Please call back. Goodbye!");
    twiml.hangup();
    res.type('text/xml');
    res.send(twiml.toString());
    return;
  }

  const session = getSession(callSid);
  const result = await processWithClaude(session, speechResult);

  console.log(`🤖 [${callSid}] AI Response:`, result);

  if (result.complete) {
    twiml.say({ voice: 'Polly.Joanna' }, result.message);
    twiml.say({ voice: 'Polly.Joanna' }, "Have a great day!");
    twiml.hangup();
    
    console.log(`✅ [${callSid}] Booking completed:`, result.collected);
    delete sessions[callSid];
  } else {
    const gather = twiml.gather({
      input: 'speech',
      action: '/gather',
      method: 'POST',
      speechTimeout: 'auto',
      speechModel: 'phone_call'
    });

    gather.say({ voice: 'Polly.Joanna' }, result.message);
    twiml.say({ voice: 'Polly.Joanna' }, "I didn't hear a response. Please call back. Goodbye!");
  }

  res.type('text/xml');
  res.send(twiml.toString());
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    business: BUSINESS_CONFIG.name,
    template: config.templateName,
    version: config.templateVersion
  });
});

app.listen(PORT, () => {
  console.log(`🚀 AI Receptionist server running on port ${PORT}`);
  console.log(`📞 Business: ${BUSINESS_CONFIG.name}`);
  console.log(`📋 Template: ${config.templateName} v${config.templateVersion}`);
  console.log(`🔗 Webhook URL: http://localhost:${PORT}/voice`);
});
```

Run it:
```bash
chmod +x server-law-firm.js
node server-law-firm.js
```

## Environment Variables

Create `.env` file:

```bash
# Required
ANTHROPIC_API_KEY=your-anthropic-key
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token

# Business Configuration (optional - can be hardcoded)
FIRM_NAME="Smith & Associates Law Firm"
CITY_STATE="Chicago, Illinois"
BUSINESS_HOURS="Monday-Friday 9:00am-5:30pm"
EMERGENCY_PHONE="+1-312-555-0199"
PARTNER_NAME="John Smith, Esq."
CONSULTATION_FEE="$150 (complimentary for personal injury cases)"
```

## Testing

Test the template processor:

```bash
# List templates
node template-processor.js list

# Validate template
node template-processor.js validate law-firm

# Process with example config
node template-processor.js process law-firm examples/smith-associates.json
```

Test the server:

```bash
# Check health endpoint
curl http://localhost:3000/health

# Expose with ngrok for Twilio testing
ngrok http 3000
# Then configure Twilio webhook to: https://your-ngrok-url.ngrok.io/voice
```

## Troubleshooting

**Error: Missing required variables**
- Check that all variables in `customization_variables` are provided
- Run: `node template-processor.js validate <template-name>`

**Error: Template not found**
- Verify template file exists in `templates/` directory
- Check filename matches (e.g., `law-firm.json`, not `law_firm.json`)

**Variables not replaced in output**
- Ensure variable names match exactly (case-sensitive)
- Check for typos in variable names

**Claude not returning JSON**
- Template prompts are designed to return JSON
- Check `SYSTEM_PROMPT` was set correctly
- Review Claude API logs for formatting issues

## Next Steps

1. ✅ Choose template → Customize → Test
2. 📚 Review sample conversations in template
3. 🧪 Test with realistic scenarios
4. 🔧 Customize business_config for your needs
5. 🚀 Deploy to production

## Support

- **Templates:** See `README.md` for detailed documentation
- **Creating new templates:** See "Creating New Templates" section in README
- **Integration issues:** Check server.js in parent directory for reference

---

**You're ready to go! 🎉**

Your AI receptionist is configured and ready to handle calls professionally.
