# Calva Voice AI — Improvements Log

## 2026-02-16: Production Hardening Sprint

### RELIABILITY
- [x] **Gemini retry logic**: 3 retries with exponential backoff (200ms, 400ms, 800ms) via `fetchWithRetry()`
- [x] **Request timeout**: 4s timeout on non-streaming, 6s on streaming requests with AbortController
- [x] **Thinking fallback**: If no LLM chunk arrives within 3 seconds, sends "Hmm, let me think about that for a sec..." while continuing to wait
- [x] **Empty response handling**: Detects empty Gemini responses and retries; falls back to "can you say that again?" 
- [x] **WebSocket keep-alive**: Pings every 15 seconds to prevent tunnel/proxy timeouts
- [x] **Inactivity detection**: After 60s silence, asks "Hey, you still there?"; after 90s total, gracefully closes
- [x] **WS send safety**: All `ws.send()` calls now check `readyState === OPEN` and catch errors
- [x] **Error logging**: Every failure logged with full context (callSid, turn, error type, timestamp)

### INTELLIGENCE
- [x] **maxOutputTokens increased**: 80 → 150 — prevents mid-thought cutoffs on complex answers
- [x] **System prompt enhanced**: Added explicit handling for pricing ("let me get you a quote"), emergencies (urgent info collection), multi-part questions, scheduling
- [x] **Never "I don't know"**: Prompt now instructs to always offer callback or message-taking instead
- [x] **Knowledge base injection**: Tenant knowledgeBase field injected as "BUSINESS FAQ" into system prompt
- [x] **Short/unintelligible STT**: Inputs < 2 chars get "Sorry, could you repeat that?"

### RESPONSE SPEED
- [x] **Gemini pre-warming**: Sends dummy request on WebSocket connection to eliminate cold-start
- [x] **System prompt optimized**: Reduced HUMAN_SPEECH_PREAMBLE token count (~40% shorter) while maintaining quality
- [x] **Cache infrastructure**: Built response cache with 30-min TTL (per-tenant caching ready to enable)
- [x] **Filler detection improved**: Added price/cost/how-long to question detection patterns

### VOICE QUALITY
- [x] **HUMAN_SPEECH_PREAMBLE refined**: More concise, stronger banned phrases list, better conversation flow rules
- [x] **Response variety**: Prompt emphasizes "never repeat same structure twice" and natural reactions
- [x] **Interruption handling**: Logged and tracked; ConversationRelay handles natively

### CONTINUOUS IMPROVEMENT
- [x] **Transcript saving**: Every call saved to `logs/transcripts/` as JSON (full conversation, timing, collected info)
- [x] **Daily stats**: Per-call stats appended to `logs/stats/YYYY-MM-DD.jsonl` (turns, duration, errors, avgTurnMs)
- [x] **Call quality tracking**: Each session tracks turnTimes[], errors[], collected fields for scoring
- [x] **This file**: Created IMPROVEMENTS.md for ongoing issue/fix tracking

### ERROR HANDLING
- [x] **Empty Gemini response**: Detected and retried; fallback message if all retries fail
- [x] **STT noise**: Very short inputs (< 2 chars) handled gracefully
- [x] **Network blips**: Retry with backoff on stream failures; keep-alive prevents silent drops
- [x] **WS errors tracked**: All errors pushed to session.errors[] for post-call analysis

---

## Known Issues / Future Work
- [ ] Per-tenant response caching (infrastructure ready, needs tenant-specific cache keys)
- [ ] Gemini cold-start profiling (pre-warm helps but need to measure delta)
- [ ] A/B test temperature settings (0.9 vs 0.85 for consistency vs variety)
- [ ] Add call quality score formula (completeness * speed * no-errors)
- [ ] Webhook to notify on repeated failures (>3 errors in 10 minutes)
