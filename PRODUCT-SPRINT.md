# CALVA — Product Sprint: Competitor-Ready
*Created: 2026-02-13 | Sprint Goal: Ship all critical features to compete with top AI receptionist platforms*

## Current State: SOLID Foundation
- Voice: Google Chirp3-HD-Leda (Twilio's best generative voice — already top-tier natural sound)
- AI: Gemini 2.0 Flash (fast, smart, near-free)
- STT: Enhanced phone_call model with 3s speech timeout
- Server: Running on port 3100, Cloudflare tunnel live
- Demo: (929) 755-7288 — Mike's Plumbing

## Priority 1: MUST SHIP (Compete with anyone)

### 1. Call Recording + Transcript Viewer
- Add `record: 'record-from-answer-dual'` to Twilio gather
- Store recording URL + transcript in calls table
- Dashboard: play button + searchable transcript
- **Why:** Every competitor has this. Businesses need to review calls.

### 2. Knowledge Base / Custom Training
- Dashboard: "Business Info" section where owner pastes FAQ, menu, services, pricing
- Store as JSON in tenant config
- Inject into AI system prompt as context
- No RAG needed yet — just stuff it in the prompt (Gemini has 1M context window)
- **Why:** This is what separates "demo" from "real product"

### 3. Self-Service Dashboard Upgrade
- Edit business name, greeting message, hours of operation
- Add/edit FAQ entries (Q&A pairs)
- Toggle: booking enabled, SMS notifications, after-hours mode
- Upload business logo
- **Why:** Customers can't call us every time they want to change their greeting

### 4. Human Handoff / Call Transfer
- When AI says "let me transfer you" → Twilio `<Dial>` to owner's phone
- SMS to owner: "Incoming transfer — caller needs: [summary]"
- Configurable: always available, business hours only, emergency only
- **Why:** Smith.ai's #1 selling point. We need this.

### 5. Call Analytics Dashboard
- Cards: total calls today/week/month, avg duration, busiest hour
- Chart: calls over time (7-day, 30-day)
- Table: recent calls with duration, intent, outcome
- Export to CSV
- **Why:** Business owners need to see ROI

## Priority 2: HIGH VALUE (Week 2)

### 6. Multi-Language Support
- Detect caller language from first utterance
- Switch Gemini prompt + Twilio voice to match
- Start with: English + Spanish (covers 95% of US market)
- Twilio Chirp3 voices available in Spanish: `Google.es-US-Chirp3-HD-*`
- **Why:** 42M Spanish speakers in US. Huge market.

### 7. Stripe Integration
- `/pricing` page → Stripe Checkout sessions
- Tiers: Starter ($99) / Pro ($297) / Business ($597)
- 7-day free trial
- Auto-provision Twilio number on payment
- Webhook: handle subscription events
- **Why:** Can't collect money without it

### 8. Simulation/Test Mode
- Dashboard: "Test Your AI" button
- Opens web-based voice chat (WebRTC or simple text chat)
- Uses same AI + knowledge base as real calls
- Shows transcript in real-time
- **Why:** Fin AI's Simulations feature. Builds buyer confidence.

### 9. Voicemail Fallback
- If AI errors out or Twilio has issues → record voicemail
- Send voicemail audio + transcript to owner via SMS/email
- **Why:** Never truly miss a call, even if AI has a bad day

## Priority 3: DIFFERENTIATORS (Week 3+)

### 10. CRM Integration (HubSpot)
- After each call, create/update HubSpot contact
- Log call as activity
- Create deal if booking made
- **Why:** Smith.ai charges extra for this. We include it.

### 11. Chat Widget
- Embed on business website
- Same AI, same knowledge base, text instead of voice
- **Why:** Fin AI's core product. Multi-channel = more value.

### 12. Review Generation
- After successful service call, AI texts customer: "How was your experience? Leave a review: [Google link]"
- **Why:** No competitor does this. Massive value for local businesses.

## Voice Quality Notes
- **Current voice (Chirp3-HD-Leda):** This is already Twilio's BEST. It's a generative AI voice, not pre-recorded. Natural prosody, handles names and numbers well.
- **Alternative voices available:** Chirp3-HD-Aoife (Irish accent), Chirp3-HD-Kore (Korean-accented English), etc.
- **Per-template voice selection:** Different voice per industry (e.g., warm female for medical, authoritative male for law)
- **SSML support:** Already implemented for natural pauses

## Dev Agent Task Queue
```
TASK 1: [P1] Call recording + transcript storage + dashboard playback
TASK 2: [P1] Knowledge base input in dashboard + inject into AI prompt  
TASK 3: [P1] Self-service dashboard (edit greeting, hours, FAQs, toggles)
TASK 4: [P1] Human handoff via Twilio <Dial>
TASK 5: [P1] Call analytics cards + chart in dashboard
TASK 6: [P2] Spanish language support
TASK 7: [P2] Stripe integration
TASK 8: [P2] Test/simulation mode
TASK 9: [P2] Voicemail fallback
TASK 10: [P3] HubSpot CRM integration
```

## Definition of Done
Each feature must:
- [ ] Work end-to-end (not just backend — UI must exist)
- [ ] Handle errors gracefully
- [ ] Be testable via the demo number or dashboard
- [ ] Not break existing functionality
