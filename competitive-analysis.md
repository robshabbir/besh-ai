# Competitive Analysis - AI Receptionist Market
**Date:** 2026-02-17
**Author:** Ghost

## Executive Summary

**Who's winning and why:**
Fin AI (Intercom) dominates the enterprise segment with #1 G2 ranking and unmatched multi-channel capabilities (chat, email, voice), backed by custom LLMs trained on 20M+ customer service interactions. Smith.ai leads the premium human+AI hybrid market by offering reliability and quality that pure AI can't match yet. Retell AI and Bland AI win the developer-first segment with flexible APIs and pay-per-use models.

**Table stakes features (what EVERY competitor has):**
- 24/7 availability
- CRM integrations (HubSpot, Salesforce, etc.)
- Call recording & transcription
- Basic analytics dashboard
- Knowledge base / FAQ handling
- Call transfer to humans
- Multi-language support (at least English + Spanish)

**Differentiators (what separates leaders from followers):**
- **Enterprise-level:** Custom LLMs, advanced analytics with AI-powered optimization suggestions, compliance certifications (HIPAA, SOC2), dedicated support
- **Premium human services:** Zero AI mistakes on critical calls, emotional intelligence, complex judgment calls
- **Developer platforms:** API-first architecture, real-time function calling, white-label capabilities, granular usage pricing

**Gaps Calva needs to fill (top 5 critical):**

1. **Self-service onboarding in <15 minutes** — Fin requires Intercom subscription + setup; Ruby/Smith require sales calls; only Retell/Bland offer instant activation. Calva should beat all with guided 10-min setup.

2. **Transparent pricing for 200 calls/month** — Current market is confusing: Fin's resolution-based model is unpredictable for budgeting; Smith/Ruby charge per minute creating overage anxiety; Retell/Bland have hidden telephony costs. Calva needs simple, predictable monthly pricing.

3. **Dashboard that non-technical users actually understand** — Retell/Bland are developer-focused; Intercom overwhelms with enterprise features; Smith/Ruby lack real-time insights. Calva needs a beautiful, intuitive dashboard showing "what's working, what's not" at a glance.

4. **Voice quality + personality customization without coding** — Fin Voice requires workflows and guidance setup; Retell/Bland need developer implementation; Smith.ai lacks customization (human voices). Calva should offer voice cloning + personality sliders in UI.

5. **Instant performance optimization** — Fin's Optimize Dashboard requires manual review and approval of AI suggestions. Calva should auto-improve from call patterns without user intervention, surfacing only critical decisions.

---

## Fin AI Deep Dive

### Signup Flow
**NOT self-service for standalone use.** 
- Requires purchase of Intercom Customer Service Suite seat ($29-$139/mo per agent) OR integration with existing helpdesk (Zendesk, Salesforce)
- 14-day free trial available for Fin AI Agent
- $10 free credits for Fin standalone
- Onboarding involves content setup, guidance configuration, testing phase
- **Time to first call: 1-3 days** (requires knowledge base upload, testing, deployment configuration)

### Dashboard Features

**Performance Dashboard:**
- Resolution rate, involvement rate, CX Score in unified view
- Channel-specific filtering (phone, chat, email)
- Real-time metrics with drill-down capabilities
- Conversation transcripts with AI summary
- Topics Explorer (auto-categorizes conversations by topic/subtopic using AI)
- Holistic reporting across AI + human agents

**Optimize Dashboard:**
- AI-generated suggestions for content improvements
- Flags areas where Fin struggled to resolve
- One-click approval to implement fixes
- Batch testing tool (import conversations to test Fin's accuracy)
- Answer inspection (shows which sources + guidance shaped each response)
- Simulations for testing complex scenarios

**Additional Analytics:**
- Custom reporting with drag-and-drop chart builder
- Fin preview (real-time testing before deployment)
- Answer rating system for continuous improvement
- Integration with Intercom Inbox (all conversations in one place)

### Voice Capabilities

**Fin Voice** (launched 2025):
- **Full voice support** — AI voice agent for phone calls
- Natural, real-time conversations with ultra-low latency
- Handles interruptions smoothly
- Supports 45+ languages with real-time translation
- Multi-step workflows via "Procedures" (connect to APIs for refunds, order updates, etc.)
- Smart routing based on AI category detection (no IVR menus)
- Call transfer to humans with full context handoff
- CSAT collection at end of call (1-5 rating via keypad)
- Integration with Intercom Phone or third-party telephony via SIP/PSTN
- 15+ natural-sounding voice options
- Customizable greetings, tone, escalation policies

**Voice-specific features:**
- Rollout percentage control (start with 5-10% of calls)
- Office hours configuration
- Callback offers when team unavailable
- Voicemail handling
- Warm transfers with hold music
- Integration with external phone providers (Amazon Connect, etc.)

### Pricing

**Fin AI Agent pricing:**
- **$0.99 per resolution** (charged only when Fin resolves a customer conversation)
- Resolution defined as: customer confirms satisfaction OR exits without requesting further help
- No double-charging if conversation reopened
- Minimum 50 resolutions/month for standalone Fin

**Additional costs:**
- **Intercom seat required:** $29/mo (Essential) to $139/mo (Expert) per Full seat
- **OR** use with existing helpdesk (Zendesk, Salesforce) — just $0.99/resolution, no seat cost
- Usage-based fees for SMS, phone channels (separate from Fin pricing)

**Example cost for 200 calls/month:**
- If 150 resolved by Fin: 150 × $0.99 = **$148.50** + seat cost ($29+) = **$177.50+/mo total**
- Unpredictable scaling: costs rise directly with resolution volume

**Enterprise:** Custom pricing for high-volume (contact sales)

### What Makes Them Enterprise-Level?

1. **Custom LLMs trained on customer service data** — Proprietary models built from 20M+ real support interactions, not generic GPT
2. **Advanced compliance** — SOC2 Type II, GDPR, HIPAA available, enterprise SSO
3. **Multi-channel mastery** — Seamless across chat, email, voice, Slack, Discord, WhatsApp (not just phone)
4. **Agentic architecture** — Fin operates as specialized "roles" for different use cases
5. **AI-powered optimization** — Suggestions auto-generated from conversation analysis, Topics Explorer for trend detection
6. **Deep integrations** — Native connections to 100+ tools, data connectors for personalized answers
7. **Vision capabilities** — Fin can read images (screenshots, invoices, error messages)
8. **Scalability** — Handles thousands of concurrent conversations without degradation
9. **Premium support** — Dedicated success teams for Enterprise customers
10. **Continuous improvement flywheel** — Train → Test → Deploy → Analyze loop with AI suggestions closing the gap

### Weaknesses We Can Exploit

1. **Pricing complexity & unpredictability** — Resolution-based pricing makes budgeting difficult; customers report "per-resolution" model can get expensive fast (82 G2 mentions of high cost)

2. **Steep learning curve** — Users report "ample time for guidance" needed to utilize all features (86 G2 mentions); overwhelming for small teams who want simple setup

3. **Requires Intercom ecosystem** — Can't use Fin standalone without either buying Intercom seats OR having Zendesk/Salesforce; creates friction for pure AI receptionist buyers

4. **Voice is newest feature** — Fin Voice launched 2025, less mature than chat/email; limited customer reviews on voice quality vs competitors

5. **Configuration-heavy** — Guidance, procedures, workflows, audiences all require manual setup; not "plug and play"

6. **Inconsistent chat functionality reported** — 73 G2 mentions of unreliable notifications, multiple conversation issues (though this may not apply to phone)

7. **AI limitations in edge cases** — Users criticize "unhelpful replies and missed customer comments" — AI still struggles with nuance

8. **No self-service signup for voice** — Requires knowledge base setup, testing, deployment config before first call (1-3 day timeline)

9. **Overage anxiety** — Unlike fixed pricing, customers worry about unexpected spikes in resolutions driving up costs

10. **Enterprise features overkill for SMBs** — Small businesses don't need custom LLMs, multi-brand support, or Topics Explorer — simpler competitors may win this segment

---

## Smith.ai Deep Dive

### Signup Flow

**Sales-assisted for annual plans:**
- Monthly plans: Self-service signup at smith.ai/vr/get-started
- Annual AI Receptionist plans: Requires sales consultation call
- 30-day money-back guarantee (up to $1,000 refund)
- Onboarding process for human receptionist service:
  - Custom call playbook creation
  - Business-specific intake questions configured
  - Transfer destinations setup
  - CRM integration setup
- **Time to first call:** 
  - Human receptionist: 1-2 business days (onboarding required)
  - AI Receptionist (monthly): 24-48 hours self-service
  - AI Receptionist (annual): 48 hours with dedicated setup team

### Dashboard Features

**Call Dashboard:**
- Real-time call logging and summaries
- Searchable call recordings + transcripts (add-on: $0.25/call)
- Lead qualification status tracking
- Call details auto-sent to CRM
- SMS/Slack/Teams notifications for qualified transfers
- Call activity history and analytics
- PII masking for security

**Call Intelligence:**
- Lead screening results by custom criteria
- New client intake data capture
- Appointment booking confirmations
- Payment collection tracking
- Conflict check results (for legal/professional services)
- Spam call filtering (not charged)

**AI Receptionist Dashboard** (annual plans):
- AI analysis for all calls + human review
- Conversion rate tracking over time
- Custom-built AI performance reports
- Dedicated customer success manager portal
- System integration health monitoring

### Voice Capabilities

**Human Receptionist Service:**
- **100% live human agents** based in North America
- 24/7/365 coverage with no extra charges for nights/weekends
- Bilingual (English + Spanish) agents available ($1/call add-on for dedicated Spanish line)
- Trained on your business specifics
- Natural, empathetic conversations
- Complex judgment calls handled correctly
- **Voice quality: Premium human** (no AI voice artifacts)

**AI Receptionist** (separate product):
- AI voice agent with human agent backup
- Backed by 500+ live agents for escalation ($3/call when AI escalates)
- Natural conversational AI (voice quality not specified in detail)
- AI handles screening, qualification, scheduling first
- Seamless escalation to live agent when needed
- **Hybrid approach:** AI first, human safety net

**Key difference:** Smith.ai sells human service as primary, AI as secondary — opposite of pure AI competitors

### Pricing

**Human Virtual Receptionist:**
- **Starter:** $300/mo for 30 calls ($10/call) — 1 transfer destination
- **Basic:** $810/mo for 90 calls ($9/call) — 2 transfer destinations
- **Pro:** $2,100/mo for 300 calls ($7/call) — 10 transfer destinations
- **Enterprise:** Custom pricing
- Overage rates: $11.50 (Starter), $10.50 (Basic), $8.50 (Pro) per additional call

**AI Receptionist:**
- **Self-Service Monthly:**
  - $95/mo (~50 calls) at $1.90/call
  - $270/mo (~150 calls) at $1.80/call
  - $800/mo (~500 calls) at $1.60/call
  - Overage: $2.40/call
  - No dedicated support or custom integrations

- **Done-For-You Annual:**
  - $500/mo (~333 calls) at $1.50/call
  - $1,000/mo (~750 calls) at $1.33/call
  - $2,000/mo (~1,667 calls) at $1.20/call
  - No overages (flexible usage for entire subscription)
  - Includes: AI experts, custom integrations, dedicated success manager

**Example cost for 200 calls/month:**
- Human receptionist: **$810/mo** (90-call plan) + overages = **~$1,965/mo** for 200 calls
- AI self-service: **$270/mo** (150-call plan) + overages = **~$390/mo** for 200 calls
- AI annual: **$500/mo** (333-call plan, no overages) = **$500/mo** for 200 calls

**Add-ons** (per-call charges):
- Appointment booking: $1.50
- SMS/Slack notifications: $0.50
- Call recording & transcription: $0.25
- Spanish line: $1.00
- Accept payments: $1.00
- Complex routing: $1.50

### Why Customers Pay 3x for Human Service

1. **Zero AI mistakes on critical calls** — Legal, medical, financial services can't risk AI misunderstanding
2. **Emotional intelligence** — Humans detect frustration, urgency, read between lines
3. **Complex judgment calls** — "Should I interrupt the attorney for this?" requires human discretion
4. **Brand reputation protection** — Premium brands want human touch, not "press 1 for..."
5. **Conflict checking** (legal/professional services) — Requires secure, accurate human verification
6. **Client trust** — Hearing a real person builds confidence, especially for high-ticket services
7. **Nuanced screening** — "Is this lead a good fit?" often needs human intuition beyond scripted criteria
8. **Compliance requirements** — Some industries legally require human handling for certain calls
9. **Proven track record** — 10+ years in business, 5,000+ customers trust the model
10. **Guaranteed quality** — 30-day money-back guarantee, dedicated North America teams

### Onboarding Process

**Human Receptionist:**
- Sales call optional but recommended (helps optimize setup)
- Month-to-month, no long-term contracts
- Onboarding team creates custom call playbook
- Business-specific intake questions configured
- Transfer destinations and routing setup
- CRM integration (1st integration free, $0.50/call per additional)
- Testing phase with your team
- Go-live typically within 1-2 business days

**AI Receptionist:**
- **Monthly (self-service):** Sign up online, configure AI via dashboard, start in 24-48 hours
- **Annual (done-for-you):** 
  - Sales consultation to understand needs
  - Solutions experts learn your business
  - Custom AI configuration (voice, personality, workflows)
  - Deep integrations setup (can create custom integrations unique to your business)
  - 30-90 day ramp period:
    - Days 0-30: Onboard & train
    - Days 31-90: Refine with real call data
    - Days 91+: Full production + continuous improvement

### Call Dashboard and Call Intelligence Features

**Real-time capabilities:**
- Live call summaries sent to email, Slack, Teams
- Instant lead qualification results
- Appointment confirmations synced to calendar
- CRM auto-population (HubSpot, Salesforce, Clio, etc.)
- Spam filtering (20M+ known spammers blocked)

**Reporting:**
- Call volume trends
- Lead quality metrics
- Conversion tracking
- Intake data aggregation
- Performance by time of day/week
- Agent performance (for human service)

**Intelligence features:**
- Lead screening based on custom criteria (location, budget, needs)
- Appointment booking with complex calendar logic
- Payment processing tracking
- Conflict check automation
- Text/email follow-ups after call

---

## Ruby Receptionists Deep Dive

### Signup Flow

**Sales-assisted (talk-to-sales model):**
- Cannot purchase online — must call 1-844-311-7829 or submit contact form
- Dedicated sales team member "partners with you to craft ideal plan"
- Onboarding process:
  - Business assessment to understand needs
  - Custom greeting creation
  - Call handling instructions setup
  - Transfer destination configuration
  - FAQ and lead capture setup
  - Bilingual setup if needed (24/7 Spanish available)
- **Time to first call:** Typically 2-3 business days after sales consultation
- Month-to-month plans (no long-term contracts required)

**Why sales-call-required?**
- Premium positioning ("virtual receptionists are an investment")
- Complex customization requires consultation
- Ensures proper fit and expectations alignment
- Higher touch = higher retention

### Dashboard Features

**Shared Dashboard (Ruby Portal):**
- View call and chat activity in real-time
- Access call recordings + voicemail transcripts
- Check messages and notifications
- Update call handling instructions on-the-fly
- View caller information and history
- Track appointment bookings
- Monitor team availability

**Key features:**
- 24/7 access to portal
- Mobile app for iOS/Android
- Real-time status updates
- Ability to call and text from your business number via app
- Voicemail transcription
- Custom FAQs and lead capture forms

**Limitations:**
- Not as analytics-heavy as AI platforms
- Focused on operational controls vs. performance optimization
- No AI-powered insights or suggestions
- Simple reporting vs. advanced dashboards

### Voice Capabilities

**100% Human Receptionists:**
- **Live, trained professionals** (not AI)
- Based in North America
- 24/7/365 coverage including holidays
- No charge for after-hours, weekends, holidays (included in all plans)
- Personalized call handling
- Custom greetings tailored to your business
- Bilingual call answering (English + Spanish) available 24/7
- **Voice quality: Premium human** — professional, friendly, trained

**Key differentiators:**
- Emotional intelligence and empathy
- Handle complex, nuanced conversations
- Read tone and adjust approach
- Make judgment calls in real-time
- Build rapport with callers
- Professional communication skills
- Zero "robotic" interactions

### Pricing

**Virtual Receptionist Plans:**
- **50 minutes/month:** $250/mo ($5/minute) — Great for startups
- **100 minutes/month:** $395/mo ($3.95/minute) — Great for one-person businesses
- **200 minutes/month:** $720/mo ($3.60/minute) — **Most popular** — Great for small businesses
- **500 minutes/month:** $1,725/mo ($3.45/minute) — Great for larger/growing businesses
- Larger plans available (contact sales for 1,000+ minutes)

**Bundled Plans (Receptionist + Chat):**
- Save 20% when adding chat to receptionist plan
- Example: 200 minutes + 50 chats = $720 + $416 = $1,136/mo

**Example cost for 200 calls/month:**
- Assumes average call length ~5 minutes (industry standard for receptionist calls)
- 200 calls × 5 min = 1,000 minutes needed
- Would require **500-minute plan at $1,725/mo** + overage
- Or two 500-minute plans if splitting across multiple locations
- **Realistic estimate: $2,000-2,500/mo for 200 calls**

**What's included (no extra fees):**
- 24/7 coverage
- Custom greetings
- Call forwarding and routing
- Voicemail service + transcription
- Scheduling assistance
- Lead qualification + intake
- Payment collection
- Outbound call assistance
- HIPAA-compliant services (if needed)
- Local or toll-free number hosting
- Robocall filtering
- Mobile app access
- Online portal
- SMS capabilities

**No hidden fees:**
- No activation, onboarding, setup, or customization charges
- No extra cost for nights, weekends, holidays
- No charge for bilingual answering (Spanish included if configured)

### Customer Portal Features

**Operational controls:**
- Easy-to-update call handling options
- Flexible call forwarding rules
- Voicemail service configuration
- Custom FAQ management
- Lead capture form customization
- Real-time activity monitoring

**Communication:**
- Call and text from business number via app
- Receive notifications via mobile app + email
- Access call recordings and transcripts
- Review voicemail transcriptions
- Check appointment confirmations

**Transparency:**
- View detailed call logs
- Track receptionist activity
- Monitor response times
- Access billing details

### Why Premium Pricing?

1. **Two decades of experience** — Established 2003, proven track record
2. **Quality over cost** — Trained North America-based teams, not offshore
3. **Zero AI errors** — Humans catch nuances AI misses
4. **Personalized service** — Every business gets custom handling, not templates
5. **Relationship building** — Receptionists become extension of your team
6. **Complex call handling** — Can navigate difficult conversations, upset callers, ambiguous situations
7. **Professional representation** — Premium brand image, not "budget answering service"
8. **HIPAA compliance** — Healthcare-grade security and privacy
9. **Dedicated support** — North America-based technical and client support teams
10. **Reliability** — 5,000+ integrations, 99.9%+ uptime, no "AI went down" issues
11. **Emotional labor** — Humans provide empathy, patience, understanding
12. **Business impact** — Customers report "increased monthly revenue substantially" after implementing Ruby

**What customers get that AI can't:**
- Genuine warmth and connection
- Ability to handle angry/emotional callers
- Judgment in ambiguous situations ("Should I interrupt them?")
- Cultural sensitivity and context awareness
- Building long-term caller relationships
- Detecting urgency and priority accurately
- Representing brand with consistent quality
- Professional phone etiquette mastery

### Onboarding Process

**Consultation-first approach:**
1. Initial sales call to assess needs and fit
2. Plan selection based on expected call volume
3. Business profile creation (industry, services, team structure)
4. Custom greeting scripts written collaboratively
5. Call handling instructions documented
6. Transfer destinations and routing configured
7. FAQ and lead capture setup
8. Bilingual configuration if needed
9. HIPAA setup if required
10. Testing phase with trial calls
11. Go-live typically within 2-3 business days
12. Post-launch optimization based on early feedback

**Ongoing refinement:**
- Easy-to-update call handling via portal
- Regular check-ins with Ruby team
- Seasonal/situational adjustments (e.g., holiday hours)
- Scaling up/down minutes as business needs change

---

## Retell AI Deep Dive

### Signup Flow

**Self-service, developer-focused:**
- Sign up for free account at beta.re-tell.ai/dashboard
- Instant access — no approval needed
- $10 free credits to start
- 20 free concurrent calls included
- 10 free knowledge bases
- **Time to first call:** Can be <1 hour for developers with API experience
- No credit card required for free tier

**Setup process:**
1. Create account
2. Access dashboard
3. Configure voice agent via API or web interface
4. Upload knowledge base (FAQ, documents)
5. Test in sandbox
6. Deploy to phone number (BYOT or purchase Retell number)

**Who it's for:**
- Developers building voice AI products
- Businesses with engineering resources
- Agencies white-labeling voice solutions
- Enterprises wanting full control and customization

### Dashboard Features

**Analytics Dashboard:**
- Real-time call metrics and logs
- Conversation transcripts with timestamps
- Usage tracking (minutes, messages, concurrency)
- Cost breakdown by component (LLM, voice, telephony)
- Performance metrics (latency, success rate)
- Concurrent call monitoring
- Knowledge base usage stats

**Developer-centric features:**
- API logs and debugging tools
- Webhook endpoint configuration
- Custom function testing
- Simulation testing environment (test agents across scenarios before launch)
- Call quality metrics (audio quality, latency measurements)
- Real-time function calling logs

**Limitations:**
- No "business user" dashboard — developers only
- No AI-powered optimization suggestions
- No built-in CRM or business intelligence
- Requires technical knowledge to interpret data
- Not designed for non-technical teams to manage

### Voice Capabilities

**Industry-leading voice technology:**
- **Lowest latency: ~600ms** (independently benchmarked)
- Ultra-realistic voices built from real performance data
- Proprietary turn-taking model (knows when to stop/listen)
- Smooth, fluent conversations without awkward pauses

**Voice options:**
- Cartesia voices ($0.015/min)
- Minimax voices ($0.015/min)
- ElevenLabs voices ($0.015/min)
- Custom voice cloning available
- Multiple voice styles and personas

**Advanced capabilities:**
- Real-time function calling with preset functions
- Streaming RAG for knowledge (auto-syncs with website content)
- Configurable agentic framework (drag-and-drop call flows)
- Built-in guardrails and behavior controls
- Handles interruptions naturally
- Context awareness throughout conversation
- Multi-step workflows

**Telephony features:**
- SIP trunking support (BYOT — bring your own telephony)
- Branded caller ID for outbound
- Batch calling campaigns
- Verified phone numbers (prevent spam labeling)
- International calling support (40+ countries)
- Call transfer and warm transfer
- Voicemail detection and handling
- Call recording with PII removal

### Pricing

**Pay-as-you-go model (no platform fees):**

**Voice Agent Base Rate:**
- $0.07+/min for AI Voice Agents
- $0.002+/msg for AI Chat Agents

**Detailed component pricing:**

**Retell Voice Infrastructure:** $0.055/min

**Voice (TTS):**
- Cartesia/Minimax/ElevenLabs: $0.015/min each

**LLM (examples):**
- GPT-4.1: $0.045/min
- GPT-4.1 mini: $0.016/min
- GPT-4o: $0.05/min
- GPT-4o mini: $0.006/min
- Claude 4.5 Sonnet: $0.08/min
- Claude 3.5 Haiku: $0.02/min
- Gemini 2.0 Flash: $0.006/min

**Telephony:**
- Retell Twilio: $0.015/min
- No charge for SIP trunking/custom telephony (BYOT)

**Example cost for 200 calls/month (assume 5 min avg):**
- 200 calls × 5 min = 1,000 minutes
- Voice infra: 1,000 × $0.055 = $55
- Voice (ElevenLabs): 1,000 × $0.015 = $15
- LLM (GPT-4o mini): 1,000 × $0.006 = $6
- Telephony: 1,000 × $0.015 = $15
- **Total: ~$91/mo** (using cheapest LLM)
- **Total: ~$161/mo** (using GPT-4.1)

**Add-ons:**
- Knowledge Base: $0.005/min per KB (10 free)
- Batch Call: $0.005/dial
- Branded Call: $0.10/outbound call
- Advanced Denoising: $0.005/min
- PII Removal: $0.01/min

**Monthly subscriptions:**
- Retell Phone Numbers: $2/mo
- Retell SMS: $20/mo
- Concurrency: $8/concurrency/mo (20 free)
- Knowledge Base: $8/KB/mo (10 free)
- Verified Phone Number: $10/number/mo

**Enterprise Plan:**
- Custom pricing for high volume
- White-glove service (fully managed agent setup)
- Additional concurrency included
- Early access to beta features
- Premium private Slack support
- Custom deployment

### Self-Service Setup Flow

**Developer-first approach:**
1. Sign up, get $10 free credits
2. Access dashboard and API documentation
3. Choose LLM, voice engine, telephony provider
4. Configure agent personality and behavior
5. Upload knowledge base documents
6. Set up functions for real-time actions (optional)
7. Test with simulation testing tool
8. Deploy to phone number
9. Monitor via analytics dashboard
10. Iterate based on call logs

**Technical requirements:**
- API integration skills (REST, webhooks)
- Understanding of LLM prompting
- Telephony setup knowledge (SIP, Twilio, etc.)
- Optional: Custom function development for advanced use cases

**Complexity level:** Medium to High — requires developer resources

### Dashboard Capabilities

**Call Analytics:**
- Searchable call logs with filters
- Full conversation transcripts
- Call duration and outcome tracking
- Caller information and metadata
- Real-time vs. historical data

**Performance Monitoring:**
- Latency measurements per call
- Success/failure rates
- Concurrency usage
- Daily/hourly volume trends
- Model performance comparison

**Cost Management:**
- Real-time usage tracking
- Cost breakdown by component (voice, LLM, telephony)
- Budget alerts (can set limits)
- Invoice download with company details

**Testing & QA:**
- Simulation testing (validate behavior across scenarios)
- Pre-deployment testing environment
- A/B testing different configurations
- Call replay and analysis

**Custom Reporting:**
- API access to all metrics
- Build custom dashboards using data exports
- Integrate with BI tools (Tableau, Looker, etc.)

---

## Bland AI Deep Dive

### Signup Flow

**Self-service, instant access:**
- Sign up at app.bland.ai
- **Start Plan: Free** — no credit card required
- Instant dashboard access
- 100 calls/day limit on free plan
- **Time to first call:** <1 hour for developers

**Setup process:**
1. Create account (email/password)
2. Access dashboard
3. Build voice agent via API or dashboard
4. Configure call flows, prompts, voice
5. Upload knowledge base (optional)
6. Test in sandbox
7. Deploy to phone number

**Plan tiers:**
- **Start (Free):** 100 calls/day, 10 concurrency, 1 voice clone
- **Build ($299/mo):** 2,000 calls/day, 50 concurrency, 5 voice clones
- **Scale ($499/mo):** 5,000 calls/day, 100 concurrency, 15 voice clones
- **Enterprise:** Custom limits, unlimited

### Dashboard Features

**Main Dashboard:**
- Call logs with detailed metadata
- Credit usage tracking
- Agent configurations list
- Webhook endpoint management
- Real-time activity monitoring

**Call Logs:**
- Searchable conversation history
- Full transcripts with timestamps
- Call duration and outcome
- Caller information
- Recording playback
- Cost per call breakdown

**Agent Configuration:**
- Voice agent settings
- Prompt management
- Knowledge base upload
- Custom instructions
- Voice selection
- Transfer settings

**Billing Dashboard:**
- Real-time credit balance
- Usage history (calls, minutes)
- Cost breakdown by component
- Invoice downloads
- Plan upgrade options
- Usage alerts and limits

**Developer Tools:**
- API documentation
- Webhook logs and debugging
- Test environment
- Code examples
- Integration guides

**Limitations (compared to enterprise tools):**
- No AI-powered optimization suggestions
- No business intelligence or trend analysis
- No CRM integrations built-in (must use webhooks)
- Basic reporting (not advanced analytics)
- Developer-focused (not designed for non-technical users)

### Voice Capabilities

**Natural voice technology:**
- Advanced NLP capabilities
- Natural-sounding voices (provider not specified in detail)
- Custom voice cloning (1-15 clones depending on plan)
- Multi-language support

**Call features:**
- Warm transfers (proxy agent with hold music option)
- Call forwarding
- Voicemail detection and handling
- Call recording + transcription
- Complex call routing
- Multi-step conversations

**Function calling:**
- Real-time actions during calls
- API integrations for data lookup
- CRM updates during conversation
- Custom business logic execution

**Telephony:**
- BYOT (Bring Your Own Twilio) support — no transfer fees
- Bland-provided numbers available
- SIP connectivity
- International calling
- Branded caller ID (outbound)

### Pricing

**New Plan-Based Pricing (Effective Dec 5, 2025):**

**Connected Minute Rates:**
- **Start Plan (Free):** $0.14/min connected time
- **Build Plan ($299/mo):** $0.12/min connected time
- **Scale Plan ($499/mo):** $0.11/min connected time

**Transfer Time Rates:**
- **Start:** $0.05/min transfer time
- **Build:** $0.04/min transfer time
- **Scale:** $0.03/min transfer time

**Example billing for 10-min call (8 min AI, 2 min human transfer):**
- **Start:** (10 × $0.14) + (2 × $0.05) = $1.40 + $0.10 = **$1.50**
- **Build:** (10 × $0.12) + (2 × $0.04) = $1.20 + $0.08 = **$1.28**
- **Scale:** (10 × $0.11) + (2 × $0.03) = $1.10 + $0.06 = **$1.16**

**Additional charges:**
- **Outbound Minimum:** $0.015/call (using Bland telephony)
- **Voicemail:** Per-minute rate based on plan
- **Failed Calls:** $0.015/call minimum (using Bland telephony)
- **Transfer (BYOT):** $0.00/min (FREE when using your own Twilio)

**Example cost for 200 calls/month (5 min avg, no transfers):**
- 200 calls × 5 min = 1,000 minutes
- **Start Plan:** 1,000 × $0.14 = **$140/mo** (free plan)
- **Build Plan:** $299 + (1,000 × $0.12) = **$419/mo**
- **Scale Plan:** $499 + (1,000 × $0.11) = **$609/mo**

**Note:** Build/Scale plans include base fee + usage, so pricing can exceed usage-only for low volume

**SIP Pricing:**
- SIP calls billed at same per-minute rate as PSTN
- No special SIP discount
- Twilio charges Bland $0.004/min for SIP termination (currently absorbed by Bland)

**SMS:**
- $0.02 per message (inbound + outbound)

**Transition Credits:**
- One-time credits issued to existing customers based on last 30 days usage
- Covers difference between old $0.09/min rate and new plan-based rate

### Self-Service Setup Flow

**Quick start (developer path):**
1. Sign up for free Start plan
2. Access Bland dashboard
3. Create voice agent:
   - Define agent personality and instructions
   - Upload knowledge base (FAQ, docs, website content)
   - Choose voice style
   - Configure call handling (transfer, voicemail, etc.)
4. Test agent via API or dashboard test interface
5. Deploy to phone number:
   - Use Bland-provided number ($2/mo)
   - Or forward from your existing number
   - Or use SIP integration (BYOT)
6. Monitor calls in real-time via dashboard
7. Review logs, transcripts, and recordings
8. Iterate on prompts and configuration

**Time to setup:** 30 minutes to 2 hours (depending on complexity)

**Technical requirements:**
- API knowledge helpful but not required
- Dashboard allows no-code configuration for basic agents
- Advanced use cases (custom integrations, complex routing) require developer skills

### Dashboard Capabilities

**Real-time monitoring:**
- Active call dashboard
- Live call status (in-progress, completed, failed)
- Concurrent call usage vs. limits
- Credit balance and burn rate

**Call management:**
- Call history with filters (date, duration, outcome, caller)
- Conversation transcripts (searchable)
- Call recordings (playback + download)
- Caller information and metadata
- Call outcome classification

**Analytics:**
- Daily/hourly call volume trends
- Average call duration
- Success vs. failure rates
- Transfer rate tracking
- Credit usage by component

**Agent configuration:**
- Voice agent settings editor
- Prompt tuning interface
- Knowledge base management
- Voice clone selection
- Escalation rules

**Billing & usage:**
- Real-time credit balance
- Usage breakdown (calls, minutes, transfers)
- Cost per call visibility
- Invoice history
- Plan usage against limits

**Developer tools:**
- API endpoint documentation
- Webhook configuration and logs
- Test environment for simulations
- Integration examples
- Error logs and debugging

**Alarms & alerts:**
- Set alerts for call length anomalies
- Usage limit notifications
- Budget threshold warnings
- Daily/hourly cap approaching alerts

**Limitations:**
- No built-in CRM or business intelligence
- No AI suggestions for improvement
- No Topics Explorer or trend analysis
- Basic reporting (not advanced BI)
- Developer-centric (less friendly for non-technical users)

---

## Feature Comparison Matrix

| Feature | Fin AI | Smith.ai | Ruby | Retell AI | Bland AI | Calva Target |
|---------|--------|----------|------|-----------|----------|--------------|
| **Self-service signup** | No (requires Intercom seat or helpdesk) | Partial (monthly yes, annual no) | No (sales call required) | Yes (instant) | Yes (instant) | **Yes (<15 min guided setup)** |
| **Voice quality** | Natural AI (15+ voices) + 45 languages | Premium human OR AI hybrid | Premium human only | Ultra-realistic AI (~600ms latency) | Natural AI + voice cloning | **Human-quality AI + personality sliders** |
| **Dashboard analytics** | Advanced (Performance + Optimize dashboards, Topics Explorer) | Good (Call Dashboard, lead tracking) | Basic (portal for activity monitoring) | Developer-focused (logs, metrics, API tools) | Developer-focused (logs, usage, agents) | **Intuitive non-technical UI with auto-insights** |
| **Knowledge base upload** | Yes (multi-source, auto-sync, audiences) | Yes (AI), Manual (human) | Manual (human scripts) | Yes (auto-sync with website) | Yes (upload docs/FAQ) | **Yes (drag-drop + auto-sync + smart suggestions)** |
| **Multi-language** | 45+ languages (real-time translation) | English + Spanish (human), AI varies | English + Spanish (human) | Multi-language voices available | Multi-language voices | **20+ languages with auto-detection** |
| **CRM integration** | 100+ native integrations | HubSpot, Salesforce, Clio, Zapier (1st free) | Via Zapier or manual | Via API/webhooks | Via API/webhooks | **Top 10 CRMs native + Zapier** |
| **Price (200 calls/mo)** | $148-198+ (150 resolutions × $0.99 + seat) | $270-500 (AI self/annual), $1,965 (human) | $2,000-2,500 (human) | $91-161 (1,000 min pay-as-you-go) | $140 (Start), $419 (Build) | **$199-299 flat (all-inclusive)** |
| **Setup time** | 1-3 days (knowledge base + testing) | 24-48 hrs (AI self), 1-2 days (human) | 2-3 days (sales + onboarding) | <1 hour (developers) | <1 hour (developers) | **10-15 minutes (guided wizard)** |
| **Reporting/analytics** | Enterprise-level (AI suggestions, custom reports, Topics Explorer) | Good (call logs, lead tracking, performance) | Basic (activity monitoring, call logs) | Developer-level (API metrics, logs) | Developer-level (usage, logs) | **Business-friendly insights + auto-optimization** |
| **24/7 availability** | Yes | Yes | Yes | Yes | Yes | **Yes** |
| **Human backup** | Yes (transfer to Intercom team) | Yes (500+ live agents for AI, 100% human for VR) | Yes (100% human) | Optional (via transfer to external number) | Optional (via warm transfer) | **Yes (escalation to partner network)** |
| **Compliance** | SOC2, HIPAA, GDPR, SSO | HIPAA available | HIPAA available | SOC2 Type II, HIPAA, GDPR | Not specified | **HIPAA-ready, SOC2 Type II** |
| **Free trial** | 14 days + $10 credits | 30-day money-back | No (but money-back mentioned) | $10 credits + free tier | Free plan (100 calls/day) | **14-day full-featured trial** |
| **Phone channels** | Voice, chat, email, SMS, WhatsApp, Slack, Discord | Phone only (human), Phone + chat (AI) | Phone + chat | Phone (voice AI) | Phone (voice AI) | **Phone (+ SMS/chat future)** |

---

## Recommendations for Calva

### Must-Have (To Compete)

1. **10-minute self-service onboarding** — Guided wizard that gets first call live in <15 minutes without sales call or developer. Beat Fin's 1-3 days, Ruby's sales requirement, and match Retell/Bland ease but for non-technical users.

2. **Transparent flat pricing for SMBs** — $199-299/mo all-inclusive for 200-300 calls. No per-resolution unpredictability (Fin), no overage anxiety (Smith/Ruby), no component confusion (Retell/Bland). Clearly cheaper than human ($1,965+), clearly simpler than developer platforms.

3. **Beautiful, non-technical dashboard** — Show "what's working, what's not" in plain language. Auto-flag calls that need attention. Surface top 3 improvements weekly. Make it so good that even Smith.ai's human service customers want it.

4. **Voice quality matching Retell's <600ms latency** — This is table stakes for credibility. Partner with Cartesia or ElevenLabs. Natural interruptions, no awkward pauses, 20+ languages.

5. **Auto-optimization without manual work** — Learn from call patterns and auto-improve responses. Flag only critical decisions for user approval. Beat Fin's manual "review and approve suggestions" model with true autopilot.

6. **CRM integrations that actually work** — HubSpot, Salesforce, Pipedrive, Close, Copper (top 5 SMB CRMs) with 1-click setup. Auto-populate lead info, log calls, create tasks. Make it feel magical, not like "configure webhooks."

7. **HIPAA-ready + SOC2 compliance** — Healthcare, legal, financial services need this. Smith.ai and Ruby prove premium customers pay for compliance. Calva can charge premium and win enterprise SMBs.

8. **Human escalation network** — Partner with Smith.ai-style backup team for edge cases. Charge $3-5/escalation like Smith does. Gives customers confidence AI won't fail them on critical calls.

### Nice-to-Have (To Differentiate)

1. **Voice personality sliders in UI (no coding)** — Warmth (1-10), Formality (casual-professional), Pace (slow-fast), Humor (none-witty). Let users dial in brand voice without "guidance prompts." Easier than Fin, more accessible than Retell/Bland.

2. **Industry-specific templates** — Pre-built for dental, legal, real estate, home services, SaaS, etc. Include FAQ starters, voice personality, escalation rules. Get first call live in 5 minutes instead of 15.

3. **Smart call routing without IVR menus** — Like Fin's AI Category Detection but simpler. AI detects "billing question" vs "new patient" and routes accordingly. No "press 1 for..." ever.

4. **Multilingual auto-detection** — Caller speaks Spanish? AI responds in Spanish. No setup needed. Beat Fin's 45-language support with zero-config magic.

5. **Appointment scheduling with smart conflicts** — AI checks Google Calendar, finds conflicts, suggests alternatives. Integrates with Calendly, Acuity, Cal.com. Beats Smith.ai's $1.50/call add-on by making it included.

6. **Text follow-up automation** — After call, auto-send summary via SMS with next steps. "Hi John, great speaking with you! Here's the link to book your appointment: [link]". Reduces no-shows, increases conversion.

7. **Custom voice cloning (5 free, unlimited on premium)** — Record 30 seconds of business owner's voice, clone it for AI. Ultimate brand consistency. Beats Bland's 1-15 voice limit.

8. **Weekly performance emails** — "This week: 47 calls, 89% resolved by AI, top issue was 'pricing questions' — here's our suggestion to improve." Proactive insights without dashboard login.

9. **Call coaching replays** — Highlight best/worst calls of the week with AI commentary. "On this call, AI missed the caller's frustration — here's how we'll improve." Transparency builds trust.

10. **White-label for agencies** — Let agencies rebrand Calva and resell to clients with markup. Compete with Retell/Bland developer platforms but make it no-code.

### Skip It (Not Worth Effort)

1. **Multi-channel (chat, email, SMS, Slack, Discord)** — Fin's breadth is impressive but dilutes focus. Calva should nail phone first, add SMS later, skip the rest. Don't try to out-Intercom Intercom.

2. **Custom LLMs trained from scratch** — Fin's custom models are overkill for SMBs. Use GPT-4o/Claude 3.5 with fine-tuning. Save millions in ML costs, deliver 95% of quality.

3. **Topics Explorer with AI-generated subtopics** — Cool feature but requires massive data science team. Instead: simple tag cloud of common questions. Good enough for SMBs.

4. **Vision capabilities (screenshot reading)** — Fin's image understanding is neat for email support. For phone-only receptionist, it's irrelevant. Skip.

5. **Branded caller ID verification program** — Retell/Bland offer this for outbound spam prevention. Calva is inbound-first receptionist. Not needed now.

6. **SIP trunking and enterprise telephony** — Let enterprises use BYOT via simple forwarding. Don't build complex SIP infrastructure like Retell. Serve SMBs who just want a number.

7. **Batch calling / outbound campaigns** — Retell/Bland target sales teams. Calva is receptionist (inbound). Stay focused.

8. **Custom model selection (GPT vs Claude vs Gemini)** — Developer platforms let users choose LLM. Calva should pick best model and abstract complexity. SMBs don't care, they want results.

9. **Simulation testing environments** — Retell's advanced QA tools are for enterprises. Calva's "test with a call" button is sufficient for SMBs.

10. **Workflow builders with drag-and-drop** — Tempting to copy Fin's Procedures/Workflows. But adds complexity. Start with smart defaults and 80/20 customization. Expand later if customers demand it.

---

## Sources

### Fin AI (Intercom)
- https://www.intercom.com/pricing
- https://www.intercom.com/help/en/articles/7120684-fin-ai-agent-explained
- https://www.intercom.com/help/en/articles/8205718-fin-ai-agent-resolutions
- https://www.intercom.com/help/en/articles/10697275-deploy-fin-ai-agent-over-phone
- https://fin.ai/voice
- https://www.g2.com/products/fin-by-intercom/reviews
- https://bigsur.ai/blog/intercom-fin-ai-reviews
- https://www.gptbots.ai/blog/intercom-fin-pricing
- https://www.featurebase.app/blog/intercom-pricing

### Smith.ai
- https://smith.ai/pricing/receptionists
- https://smith.ai/pricing/ai-receptionist
- https://smith.ai/
- https://getvoip.com/blog/smith-ai-receptionist/
- https://loman.ai/blog/smith-ai-pricing
- https://smith.ai/blog/virtual-receptionist-pricing
- https://www.myaifrontdesk.com/blogs/smith-ai-ai-receptionist-pricing-2025-plans-and-features-compared-896aa

### Ruby Receptionists
- https://www.ruby.com/plans-and-pricing/
- https://getvoip.com/blog/ruby-virtual-receptionist/
- https://www.getnextphone.com/blog/ruby-receptionists-vs-ai
- https://ringeden.com/blog/ruby-receptionists-vs-ai-receptionist
- https://heyrosie.com/blog/ruby-receptionist-alternatives
- https://www.capterra.com/p/186839/Ruby-Receptionists-Virtual-Receptionist-and-Chat-Services/
- https://www.avoca.ai/blog/ruby-answering-service-details-pricing-alternatives
- https://hooquest.com/isa/ruby-receptionists/

### Retell AI
- https://www.retellai.com/pricing
- https://www.retellai.com
- https://www.retellai.com/resources/voice-ai-platform-pricing-comparison-2025
- https://blog.dograh.com/retell-ai-review-2025-pros-cons-pricing-and-features/
- https://www.retellai.com/resources/inbound-vs-outbound-callers-pricing-comparison-2025
- https://www.eesel.ai/blog/retell-ai-pricing
- https://synthflow.ai/blog/retell-ai-pricing
- https://thecxlead.com/tools/retell-ai-review/

### Bland AI
- https://docs.bland.ai/platform/billing
- https://www.lindy.ai/blog/bland-ai-pricing
- https://synthflow.ai/blog/bland-ai-review
- https://synthflow.ai/blog/bland-ai-pricing
- https://blog.dograh.com/decoding-bland-ai-pricing-and-plans-in-2025/
- https://www.dialora.ai/blog/bland-ai-pricing
- https://www.retellai.com/blog/bland-ai-reviews
- https://callbotics.ai/blog/bland-ai-pricing

### General Market Research
- https://thelettertwo.com/2025/03/20/intercom-multimodal-ai-fin-voice-image-integration/
- https://www.reddit.com/r/customerexperience/comments/1ly3qaj/what_are_you_paying_per_month_for_ai_support/
- https://hiverhq.com/blog/intercom-review
- https://pagergpt.ai/alternative/fin-ai-reviews
