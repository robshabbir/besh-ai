# Sprint 1: Core SMS Engine
**Duration:** This week
**Goal:** Customers can text a business number → Besh AI responds intelligently

## Tasks (2-5 min each)

### 1. Database Schema
- [ ] Create Supabase migration: businesses, customers, messages, appointments, leads
- [ ] Test: tables exist, can insert/query

### 2. SMS Inbound Webhook
- [ ] POST /api/sms/inbound — receives Twilio SMS webhooks
- [ ] Identify business by Twilio phone number
- [ ] Identify/create customer by caller phone
- [ ] Test: webhook receives and parses SMS correctly

### 3. AI Conversation Engine
- [ ] Load business context (name, industry, hours, services, pricing)
- [ ] Load customer conversation history (last 10 messages)
- [ ] Build prompt with context + history + new message
- [ ] Call Gemini Flash for response
- [ ] Test: AI responds appropriately to scheduling, FAQ, pricing questions

### 4. SMS Reply
- [ ] Send AI response back via Twilio SMS
- [ ] Store both inbound + outbound messages in DB
- [ ] Test: full round-trip (receive SMS → AI → reply SMS)

### 5. Intent Detection
- [ ] Detect appointment intent → create appointment record
- [ ] Detect lead signals → create lead record
- [ ] Detect FAQ → respond from business knowledge base
- [ ] Test: intents correctly identified and stored

### 6. Customer Memory
- [ ] Recognize returning customers by phone
- [ ] Load previous conversation context
- [ ] Update visit_count, last_contact
- [ ] Test: returning customer gets personalized response
