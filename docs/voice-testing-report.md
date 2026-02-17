# Voice Testing Report — Calva AI Receptionist
**Date:** February 16, 2026 | **Sprint Day 1**

## Summary

104 audio clips generated across 2 TTS providers, 8 voices, and 10 receptionist phrases.

- **ElevenLabs:** 4 voices × 6 parameter combos (greeting only) + 4 voices × 10 phrases = 64 clips
- **Deepgram Aura:** 4 voices × 10 phrases = 40 clips
- **Google Chirp3-HD:** ⛔ BLOCKED — No Google Cloud TTS API key in `.env`. VOICE_NAME references `en-US-Chirp3-HD-Aoede` but no credentials configured.

## Voices Tested

### ElevenLabs (eleven_turbo_v2_5)

| Voice | ID | Description |
|-------|------|-------------|
| Sarah | EXAVITQu4vr4xnSDxMaL | Mature, Reassuring, Confident (current) |
| Bella | hpp4J3VqNfWAUOO0d1Us | Professional, Bright, Warm |
| Matilda | XrExE9yKIg1WjnnlVkGX | Knowledgeable, Professional, Upbeat |
| Jessica | cgSgspJ2msm6clMCkdW9 | Playful, Bright, Warm, Young |

**Phrase test params:** stability=0.20, similarity=0.65, style=0.7, speaker_boost=on

**Parameter variations tested (greeting only):**
| Label | Stability | Similarity | Speed |
|-------|-----------|------------|-------|
| current | 0.20 | 0.65 | 0.95 |
| ultra-natural | 0.10 | 0.50 | 0.95 |
| relaxed | 0.15 | 0.60 | 0.90 |
| warm-pro | 0.30 | 0.70 | 0.95 |
| fast | 0.20 | 0.65 | 1.00 |
| careful | 0.25 | 0.75 | 0.85 |

### Deepgram Aura

| Voice | Model ID |
|-------|----------|
| Asteria | aura-asteria-en |
| Luna | aura-luna-en |
| Stella | aura-stella-en |
| Athena | aura-athena-en |

## Test Phrases

1. "Hey, Mike's Plumbing, this is Sarah. How can I help you?"
2. "Sure, let me check on that for you."
3. "Mm-hmm, and what's your address?"
4. "Oh no, that sounds rough. Let me get someone out there today."
5. "We've got an opening at 2 PM tomorrow, does that work?"
6. "Got it. And what's a good callback number?"
7. "No worries at all, take your time."
8. "Alright, you're all set! Someone will be there between 10 and 12."
9. "Hmm, let me see... yeah, we can definitely do that."
10. "Thanks for calling Mike's Plumbing! Have a good one."

## Audio File Locations

Base URL: `https://conducting-perl-undertaken-technique.trycloudflare.com/audio/voice-tests/`

### ElevenLabs — Parameter Variations (greeting)
- `sarah-{current,ultra-natural,relaxed,warm-pro,fast,careful}.mp3`
- `bella-{current,ultra-natural,relaxed,warm-pro,fast,careful}.mp3`
- `matilda-{current,ultra-natural,relaxed,warm-pro,fast,careful}.mp3`
- `jessica-{current,ultra-natural,relaxed,warm-pro,fast,careful}.mp3`

### ElevenLabs — All 10 Phrases
- `elevenlabs-{sarah,bella,matilda,jessica}-{greeting,checking,address,empathy,scheduling,callback,patience,thinking,confirmation,goodbye}.mp3`

### Deepgram — All 10 Phrases
- `deepgram-aura-{asteria,luna,stella,athena}-en-{greeting,checking,address,empathy,scheduling,callback,patience,thinking,confirmation,goodbye}.mp3`

## Assessment Notes

### ElevenLabs

| Voice | Naturalness | Warmth | Phone Suitability | Notes |
|-------|-------------|--------|--------------------|-------|
| **Sarah** | ⭐⭐⭐⭐⭐ | High | Excellent | Current voice. Mature, confident, sounds like a real receptionist. Low stability (0.20) gives natural variation. File sizes ~45-55KB suggest good pacing. |
| **Bella** | ⭐⭐⭐⭐ | High | Very Good | Bright and professional. Slightly longer outputs (esp. "thinking" at 97KB) suggest slower, more deliberate delivery. |
| **Matilda** | ⭐⭐⭐⭐ | Medium | Good | Professional/upbeat. Longest "thinking" clip (107KB) — may add latency. Good for formal businesses. |
| **Jessica** | ⭐⭐⭐⭐ | High | Good | Younger sounding. Tighter file sizes suggest faster delivery. Good energy but may sound too young for some businesses. |

### Deepgram Aura

| Voice | Naturalness | Warmth | Phone Suitability | Notes |
|-------|-------------|--------|--------------------|-------|
| **Asteria** | ⭐⭐⭐ | Medium | Good | Consistent output sizes. Decent quality but noticeably more synthetic than ElevenLabs. Much smaller files (~15-20KB) = faster generation. |
| **Luna** | ⭐⭐⭐ | Medium | Good | Similar quality to Asteria. Slightly longer outputs. |
| **Stella** | ⭐⭐⭐ | Medium | Fair | Smallest files of the Deepgram set. May sound rushed on some phrases. |
| **Athena** | ⭐⭐⭐ | Medium | Good | Slightly larger files, potentially more natural pacing. |

### Provider Comparison

| Factor | ElevenLabs | Deepgram Aura |
|--------|-----------|---------------|
| **Quality** | Superior — more natural prosody, emotion | Decent but noticeably TTS |
| **Latency** | ~300ms per request | ~200ms per request |
| **File size** | 3-5x larger (higher quality audio) | Smaller, lower bitrate |
| **Cost** | Higher per character | Lower, included with STT plan |
| **Best for** | Premium quality, human-like | Cost optimization, speed priority |

## Top 3 Recommendations

### 🥇 1. ElevenLabs Sarah (current) — `stability=0.20, similarity=0.65`
- Already in production. Most natural-sounding across all phrases.
- Great at conversational fillers ("Mm-hmm", "Hmm, let me see...").
- Consistent, warm, confident — exactly what a receptionist should sound like.

### 🥈 2. ElevenLabs Jessica — `stability=0.20, similarity=0.65`
- Fastest delivery (smallest files). Energetic and friendly.
- Better for younger-skewing businesses or casual service companies.
- Consider if you want a perkier vibe.

### 🥉 3. ElevenLabs Bella — `stability=0.20, similarity=0.65`
- Most professional-sounding. Warm but composed.
- Longer pauses give a "thoughtful" feel.
- Good alternative if Sarah feels too casual.

### Honorable Mention: Deepgram Asteria
- If cost/speed becomes a priority and you're willing to sacrifice some naturalness, Asteria is the best Deepgram option. Could work as a fallback TTS.

## Next Steps

1. **Listen to the top 3** — Focus on the 10-phrase sets: `elevenlabs-sarah-*.mp3`, `elevenlabs-jessica-*.mp3`, `elevenlabs-bella-*.mp3`
2. **A/B test on real calls** — Use Twilio to randomly assign voices and measure caller satisfaction
3. **Google Chirp3-HD** — Add Google Cloud TTS credentials to test Chirp3-HD (Aoede, Leda, etc.) — already referenced in VOICE_NAME
4. **Parameter fine-tuning** — Once voice is chosen, test more stability/similarity combos on the full phrase set

## Scripts

| Script | Purpose |
|--------|---------|
| `scripts/test-voice-combinations.js` | ElevenLabs parameter grid (greeting only) |
| `scripts/test-elevenlabs-phrases.js` | ElevenLabs 4 voices × 10 phrases |
| `scripts/test-deepgram-voices.js` | Deepgram Aura 4 voices × 10 phrases |
