# BMAD Sprint 2 — Research Phase
**Date:** 2026-02-27 | **Agent:** Dev2

## Competitive Analysis: Text-First AI Apps

### 1. Tomo (tomo.ai) — Primary Competitor
- **50K+ users**, text-first accountability AI
- Lives in your texts (SMS native)
- Learns your goals, holds you accountable
- Features: group chats, reminders, video watching, photo editing
- Integrations: calendar, email, Notion, Google Drive
- **Key differentiator:** "Most meaningfully helpful and most fun AI"
- **Tone:** Casual, friend-like, uses "lock in" language
- **Onboarding:** One text to get started

### 2. Replika — Companion AI
- 10M+ downloads
- Focuses on emotional connection
- Memory of conversations (never forgets)
- Multiple relationship modes (friend, partner, mentor)
- AR experiences, video calls
- **Key lesson:** Memory + personality = retention

### 3. Rosebud — AI Journaling
- 4.9/5 rating, 5K reviews
- Write → Analyze → Take Action cycle
- Weekly insight reports
- Goal tracking with personalized action plans
- **Key lesson:** Structured reflection + measurable outcomes

### 4. Youper — Mental Health AI
- CBT-based conversational techniques
- Mood tracking + emotional reflection
- Crisis detection + safety protocols
- **Key lesson:** Safety first, structured check-ins

## What We Need to Beat Tomo

### Speed
- Tomo responds in <2 seconds
- Our current: ~3-5 seconds (800ms server + Twilio delivery)
- **Target:** <2 seconds perceived response time

### Conversation Quality
- Tomo sounds like a friend, not a bot
- Uses slang, emojis, short messages
- Remembers context across conversations
- **Our gap:** Onboarding is robotic, post-onboarding AI is good but needs personality tuning

### Features We Need (Priority Order)
1. **Natural onboarding** — No "stage 1, stage 2" feel. Should feel like meeting someone
2. **Better greeting handling** — Already fixed "Hi" bug, but need more robust NLU
3. **Personality consistency** — Same voice across all messages
4. **Proactive check-ins** — Morning/evening (already built, needs testing)
5. **Goal celebrations** — Track progress, celebrate wins
6. **Group chat support** — Tomo's killer feature
7. **Calendar/email integration** — Phase 2

## Design Principles for Besh
1. **Every message should feel like texting a smart friend**
2. **Short messages** — SMS, not email. Max 2-3 sentences.
3. **Use emojis sparingly** — 1 per message max
4. **Remember everything** — Reference past conversations
5. **Be proactive, not just reactive** — Check in first
6. **Celebrate wins** — Make users feel good about progress
7. **Fast** — Under 2 seconds perceived
