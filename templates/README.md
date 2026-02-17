# AI Receptionist Templates

Professional, industry-specific templates for deploying AI receptionists across different business verticals.

## Available Templates

### 1. Law Firm (`law-firm.json`)
AI receptionist for legal practices with:
- Client intake and case type classification
- Attorney-client privilege compliance
- Conflict of interest screening
- Emergency legal situation handling
- Consultation scheduling

**Best for:** Law firms, solo practitioners, legal clinics

### 2. Medical Office (`medical-office.json`)
AI receptionist for healthcare providers with:
- HIPAA-compliant patient communication
- Emergency symptom screening (911 protocol)
- Appointment scheduling (new & existing patients)
- Prescription refill requests
- Insurance verification

**Best for:** Primary care, specialists, urgent care, dental offices

---

## How to Use Templates

### Quick Start

1. **Choose your template** based on industry
2. **Copy the template file** to your working directory
3. **Customize variables** (see below)
4. **Integrate with server** (see Integration section)
5. **Test thoroughly** before going live

### Customization Variables

Each template includes customization variables marked with `{{VARIABLE_NAME}}`. Replace these with your business-specific information.

#### Example: Law Firm Template

```json
{
  "business_config": {
    "name": "{{FIRM_NAME}}",           // Replace with: "Smith & Associates"
    "hours": "{{BUSINESS_HOURS}}",     // Replace with: "Monday-Friday 9am-5pm"
    "emergency_line": "{{EMERGENCY_PHONE}}"  // Replace with: "+1-555-0199"
  }
}
```

#### All Variables Reference

| Variable | Template | Example Value |
|----------|----------|---------------|
| `{{FIRM_NAME}}` | Law Firm | "Smith & Associates Law Firm" |
| `{{PRACTICE_NAME}}` | Medical | "Downtown Family Medicine" |
| `{{BUSINESS_HOURS}}` | Both | "Monday-Friday 9am-5pm" |
| `{{EMERGENCY_PHONE}}` | Law Firm | "+1-555-0199" |
| `{{NURSE_LINE}}` | Medical | "+1-555-0166" |
| `{{CITY_STATE}}` | Law Firm | "Chicago, Illinois" |
| `{{LOCATION}}` | Medical | "Seattle, WA" |
| `{{ADDRESS}}` | Medical | "123 Medical Plaza, Suite 200" |
| `{{PARKING}}` | Medical | "Free parking in building garage" |
| `{{CONSULTATION_FEE}}` | Law Firm | "$150" or "Complimentary for injury cases" |
| `{{SPECIALTY}}` | Medical | "Family Medicine" / "Pediatrics" |

See `customization_variables` section in each template for complete list.

### Integration with Server

#### Method 1: Direct Configuration (Recommended)

```javascript
// server.js
const template = require('./templates/law-firm.json');

// Replace template variables
const BUSINESS_CONFIG = {
  name: template.business_config.name.replace('{{FIRM_NAME}}', 'Smith & Associates'),
  // ... continue replacing variables
};

// Build system prompt from template
const SYSTEM_PROMPT = template.system_prompt
  .replace(/\{\{FIRM_NAME\}\}/g, 'Smith & Associates')
  .replace(/\{\{BUSINESS_HOURS\}\}/g, 'Monday-Friday 9am-5pm')
  .replace(/\{\{PRACTICE_AREAS_LIST\}\}/g, template.business_config.practice_areas.map(s => `- ${s}`).join('\n'))
  // ... replace all variables
;
```

#### Method 2: Template Processing Function

```javascript
// template-processor.js
function processTemplate(template, customizations) {
  let systemPrompt = template.system_prompt;
  
  // Replace all variables
  Object.keys(customizations).forEach(key => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    systemPrompt = systemPrompt.replace(regex, customizations[key]);
  });
  
  // Handle list variables
  systemPrompt = systemPrompt.replace(
    /\{\{PRACTICE_AREAS_LIST\}\}/g,
    template.business_config.practice_areas.map(s => `- ${s}`).join('\n')
  );
  
  return {
    businessConfig: template.business_config,
    systemPrompt: systemPrompt,
    faq: template.faq
  };
}

// Usage
const lawTemplate = require('./templates/law-firm.json');
const config = processTemplate(lawTemplate, {
  FIRM_NAME: 'Smith & Associates',
  BUSINESS_HOURS: 'Monday-Friday 9am-5pm',
  EMERGENCY_PHONE: '+1-555-0199',
  CITY_STATE: 'Chicago, Illinois',
  PARTNER_NAME: 'John Smith, Esq.',
  CONSULTATION_FEE: '$150'
});
```

---

## Template Structure

Every template follows this structure:

```json
{
  "template_name": "Human-readable name",
  "template_version": "Semantic version",
  "industry": "Industry category",
  
  "business_config": {
    // Business-specific configuration
    // Services, hours, contact info, etc.
  },
  
  "system_prompt": "Complete Claude system prompt with {{VARIABLES}}",
  
  "sample_conversations": [
    {
      "scenario": "Description",
      "conversation": [
        {
          "caller": "What caller says",
          "ai": "How AI responds",
          "state": { /* Internal state tracking */ }
        }
      ]
    }
  ],
  
  "faq": [
    {
      "question": "Common question",
      "answer": "Response (may include {{VARIABLES}})"
    }
  ],
  
  "customization_variables": {
    // Documentation of all variables
  },
  
  "industry_compliance": {
    "required_disclosures": [],
    "prohibited_actions": [],
    // Industry-specific compliance notes
  },
  
  "integration_notes": {
    // CRM fields, calendar integration, etc.
  }
}
```

---

## Creating New Templates

### Step-by-Step Guide

#### 1. Research the Industry

- Identify common customer inquiries
- Understand regulatory requirements (HIPAA, attorney-client privilege, etc.)
- Research industry terminology and etiquette
- Map out typical conversation flows

#### 2. Define Business Configuration

Start with core business information:

```json
{
  "business_config": {
    "name": "{{BUSINESS_NAME}}",
    "hours": "{{BUSINESS_HOURS}}",
    "services": [
      "Service 1",
      "Service 2"
    ]
  }
}
```

Add industry-specific fields (examples):
- **Restaurant:** `cuisine_type`, `reservation_types`, `menu_url`, `dietary_options`
- **Salon/Spa:** `services`, `providers`, `booking_duration`, `cancellation_policy`
- **Auto Repair:** `services`, `shuttle_available`, `loaner_cars`, `warranty_info`

#### 3. Write the System Prompt

Your system prompt should include:

1. **Identity & Context**
   ```
   You are the AI receptionist for {{BUSINESS_NAME}}, a {{BUSINESS_TYPE}} in {{LOCATION}}.
   ```

2. **Services/Offerings**
   - List what the business provides
   - Include hours, location, key details

3. **Required Disclosures**
   - Legal notices (attorney-client privilege, HIPAA, etc.)
   - Call recording notice
   - Privacy statements

4. **Role & Responsibilities**
   - What the AI should do
   - How to categorize intents (booking, question, emergency, etc.)
   - What information to collect

5. **Information Collection Requirements**
   - Required fields for bookings
   - Identity verification steps
   - Screening questions (urgency, eligibility, etc.)

6. **Conversation Guidelines**
   - Tone and personality
   - Response length
   - Question pacing (one at a time)
   - State tracking rules

7. **Transfer Rules**
   - When to escalate
   - Emergency protocols
   - Complex questions routing

8. **Response Format**
   ```json
   {
     "message": "string",
     "intent": "enum",
     "collected": { /* fields */ },
     "transfer_to": "string|null",
     "complete": boolean
   }
   ```

#### 4. Create Sample Conversations

Write 3-5 realistic conversation flows covering:
- **Happy path:** Successful booking/inquiry
- **Emergency/urgent:** How to handle urgent situations
- **Complex:** Multi-step interaction with edge cases
- **FAQ:** Simple information request

Include state tracking in each exchange to show progression.

#### 5. Build FAQ Section

10-15 most common questions with answers:
- Business hours and location
- Pricing and payment
- What to bring/prepare
- Cancellation policy
- Emergency procedures
- Service details

#### 6. Document Compliance Requirements

```json
{
  "industry_compliance": {
    "required_disclosures": [
      "What must be stated on every call"
    ],
    "data_retention": "How long to keep records",
    "prohibited_actions": [
      "What AI should NEVER do"
    ]
  }
}
```

#### 7. Define Integration Points

```json
{
  "integration_notes": {
    "crm_fields": ["List", "of", "fields", "to", "sync"],
    "calendar_integration": "How appointments sync",
    "special_routing": "Complex logic needs"
  }
}
```

---

## Template Checklist

Before deploying a new template, verify:

- [ ] All `{{VARIABLES}}` are documented in `customization_variables`
- [ ] System prompt includes required industry disclosures
- [ ] Emergency/urgent scenarios are handled appropriately
- [ ] Sample conversations cover common and edge cases
- [ ] FAQ has 10+ realistic questions
- [ ] Response format JSON matches server expectations
- [ ] Compliance requirements are clearly stated
- [ ] Integration fields map to CRM/calendar systems
- [ ] Tone and personality fit industry expectations
- [ ] State tracking logic prevents repeated questions

---

## Best Practices

### Conversation Design

1. **Screen for emergencies early** (medical, legal, safety)
2. **Ask one question at a time** (reduces caller confusion)
3. **Confirm collected information** before completing
4. **Provide clear next steps** at completion
5. **Offer human transfer** when AI reaches limits

### Industry-Specific Considerations

| Industry | Key Considerations |
|----------|-------------------|
| **Healthcare** | HIPAA compliance, 911 protocol, no medical advice, identity verification |
| **Legal** | Attorney-client privilege, conflict checks, no legal advice, emergency screening |
| **Financial** | PCI compliance, identity verification, fraud screening, secure data handling |
| **Food Service** | Allergen warnings, dietary restrictions, health code compliance |
| **Automotive** | Safety recalls, warranty coverage, EPA regulations |

### Response Quality

- **Keep it conversational:** Write like a human receptionist speaks
- **Be concise:** 1-3 sentences per response
- **Use active voice:** "I can schedule that" vs "That can be scheduled"
- **Avoid jargon:** Unless industry-standard (e.g., "retainer" in legal)
- **Be empathetic:** Acknowledge concerns ("I'm sorry to hear that")

### Testing Templates

Before deploying:

1. **Role-play test calls** covering all conversation flows
2. **Test variable substitution** ensures all `{{VARS}}` are replaced
3. **Verify compliance** with legal counsel if regulated industry
4. **Load test** with realistic call volume
5. **Monitor first 100 calls** and refine based on patterns

---

## Template Library Roadmap

### In Development
- Restaurant / Food Service
- Dental Office
- Auto Repair Shop
- Hair Salon / Spa
- Real Estate Office
- Veterinary Clinic

### Planned
- HVAC / Home Services
- Financial Advisor
- Insurance Agency
- Fitness Studio / Gym
- Property Management
- Travel Agency

### How to Request a New Template

1. Create issue with industry details
2. Provide sample conversation flows
3. Note any regulatory requirements
4. Share common questions/scenarios
5. Identify required integrations (CRM, calendar, etc.)

---

## Support & Customization

For custom template development or integration assistance:
- **Technical Support:** See main README.md
- **Custom Development:** Contact for enterprise template creation
- **Compliance Review:** Available for regulated industries

---

## Version History

| Template | Version | Date | Changes |
|----------|---------|------|---------|
| Law Firm | 1.0.0 | 2026-01-XX | Initial release |
| Medical Office | 1.0.0 | 2026-01-XX | Initial release |

---

## License

Templates are provided as part of the AI Receptionist product. Customers may customize templates for their own use but may not resell or redistribute templates separately.

---

**Built with quality. Deploy with confidence.** 🚀
