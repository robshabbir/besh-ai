# Dev2 Audio Pipeline Audit — 2026-02-16

## Key Discovery: ElevenLabs NOT in live call path

ConversationRelay uses **Google Chirp3-HD-Leda** for TTS (configured in `voice-cr` route). ElevenLabs (`src/services/elevenlabs-tts.js`) is only used for landing page audio demos. Voice quality tuning for calls = Twilio CR voice selection, not ElevenLabs params.

## Current Latency (real calls)
| Metric | Value |
|--------|-------|
| Avg turn time (real calls) | 556–717ms |
| Avg turn time (simulated) | 921–986ms |
| Target | <800ms |
| **Status** | **✅ Already hitting target on real calls** |

## Changes Made

### Commit a3c278a — Prompt changes (before Dev's assignment came in)
- Rewrote HUMAN_SPEECH_PREAMBLE (3-10 word responses, varied openers)
- maxOutputTokens 80→45
- Added AI-isms to filter: definitely, specifically, etc.
- Slimmed tenant prompt to business-facts-only
- **Note:** Dev owns prompt domain — revert if conflicts

### Commit 3d13811 — Streaming pipeline fixes
1. **Chunk sizing**: min 4→6 chars (first), 10 chars (subsequent) — prevents choppy TTS
2. **Filler stacking**: filler + thinking timeout could both fire. Now only one fires.
3. **Thinking timeout**: 2s→1.5s
4. **Logging**: added chunk count per turn

## Recommendations (not yet implemented)

### Voice A/B Testing
- Current: Google.en-US-Chirp3-HD-Leda (warm, conversational)
- Alternative: Google.en-US-Chirp3-HD-Aoede (.env has it, unused by CR)
- Worth testing both on real calls

### Potential Further Optimizations
1. **Gemini model**: Could try `gemini-2.0-flash-lite` for even faster responses (test quality first)
2. **Response caching**: Cache is built but disabled — could enable for first-turn greetings per-tenant
3. **Pre-computed greetings**: The welcome greeting goes through TTS every call — could pre-cache audio

## Architecture Reference
```
Caller → Twilio → /api/voice-cr (TwiML) → ConversationRelay WebSocket
  ├── STT: Deepgram nova-3-general
  ├── WS: /ws → conversation-relay.js → Gemini 2.0 Flash (streaming)
  └── TTS: Google Chirp3-HD-Leda (Twilio-managed)
```

Fallback path (non-CR): `/api/voice` → Polly.Ruth-Generative + Gather/Say loop
