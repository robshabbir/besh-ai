# BMAD Sprint 2 — Design + Plan
**Date:** 2026-02-27 | **Agent:** Dev2

## Epic: Conversation Quality + Speed

### Story 1: Natural Onboarding (2-5 min)
**Current:** Robotic 3-stage wizard
**Target:** Feels like meeting someone at a party

**Changes to besh-sms.js:**
- Improve greeting detection (more patterns)
- Add "what should I call you?" instead of "what's your name?"
- Make goal question more natural: "what's something you're working on?"
- Auto-detect timezone from phone area code (no need to ask!)
- Reduce onboarding from 3 messages to 2

### Story 2: System Prompt Optimization (5 min)
**Current:** Generic AI prompt
**Target:** Tomo-level personality

**Changes to besh-ai.js:**
- Shorter, punchier system prompt
- Add few-shot examples of ideal responses
- Enforce max 2 sentences per response
- Add personality rules: casual, warm, uses first name

### Story 3: Speed Optimization (5 min)
**Current:** 800-1200ms server, 3-5s total
**Target:** <500ms server, <2s total

**Changes:**
- Pre-warm Gemini connection on server start
- Cache user context (profile + recent convos)
- Use streaming for Gemini responses
- Reduce conversation history sent to AI (last 5, not all)

### Story 4: Auto-Timezone Detection (2 min)
**Current:** Asks user for timezone (friction)
**Target:** Auto-detect from phone area code

**Changes:**
- Add area code → timezone lookup
- Skip timezone question in onboarding
- Reduce onboarding from 3 steps to 2

## Execution Order
1. Story 4 (auto-timezone) — removes friction
2. Story 1 (natural onboarding) — better first impression
3. Story 2 (system prompt) — better AI quality
4. Story 3 (speed) — faster responses
