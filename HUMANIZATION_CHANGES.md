# Calva AI Receptionist - Humanization Changes
**Date:** 2026-02-13
**Status:** ✅ COMPLETED

## Summary
Made the AI receptionist voice sound MORE HUMAN and less robotic through voice quality improvements, natural speech patterns, and conversational prompt tuning.

---

## 1. ✅ Voice Quality (ElevenLabs TTS)
**File:** `src/services/elevenlabs-tts.js`

### Changes Made:
- **Model:** `eleven_flash_v2_5` → `eleven_multilingual_v2` (more natural & expressive)
- **Voice:** Jessica (`cgSgspJ2msm6clMCkdW9`) → Rachel (`21m00Tcm4TlvDq8ikWAM`) - warmer, more natural receptionist voice
- **Stability:** 0.4 → 0.3 (more variation = more human)
- **Similarity Boost:** 0.75 → 0.85 (better voice consistency)
- **Speed:** 1.05 → 1.0 (natural pace, not rushed)
- **New Parameters:**
  - `style: 0.4` (added for expressiveness)
  - `use_speaker_boost: true` (enhanced clarity)

---

## 2. ✅ SSML + Conversation Naturalness
**File:** `src/routes/voice.js`

### Enhanced `toSSML()` Function:
- **Natural breathing pauses:** 200ms after sentences (. ? !)
- **Micro-pauses:** 150ms after commas, 100ms before "and"/"but"
- **Emphasis on key words:**
  - Strong: emergency, urgent, now, immediately, important
  - Moderate: please, thank you, thanks, sorry
- **Conversational rhythm:** Pauses before conjunctions for natural flow
- **SSML wrapping:** Proper `<speak>` tags for full SSML support

---

## 3. ✅ Prompt Tuning for More Human Speech
**Files:** ALL templates in `templates/` directory
- auto-repair.json
- law-firm.json
- medical-office.json
- plumber.json
- real-estate.json
- restaurant.json
- salon-spa.json
- school.json
- veterinary.json

### Added "SPEECH PATTERNS (CRITICAL)" Section to All Templates:
```
- Start responses with filler: "Yeah", "Oh", "Hmm", "So", "Right"
- Use incomplete thoughts sometimes: "I can— actually, let me check on that"
- Vary sentence length. Mix short with long.
- Use casual contractions: "gonna", "wanna", "gotta", "y'know"
- React before answering: "Oh wow", "Yikes", "Nice", "Gotcha"
- Don't over-explain. Real receptionists are brief.
- Use "um" or "uh" occasionally (1 per 3-4 responses max)
- End some sentences trailing off: "so we could probably..."
- Interrupt yourself: "The appointment— oh wait, are you looking for morning or afternoon?"
- NEVER use bullet points or numbered lists in speech
- Keep it to 1-2 SHORT sentences. Max 30 words per response.
- Sound like you're multitasking: "Okay hang on one sec... *typing sounds* ...alright"
```

---

## 4. ✅ Greeting Fix
**File:** `src/routes/voice.js`

### Before:
```
"Hey there, thanks for calling ${businessName}. What's going on?"
```

### After:
```
"Hey! ${businessName}, this is Sarah. What's goin' on?"
```

**Impact:** More casual, personal, and conversational - sounds like a real receptionist answering the phone.

---

## Testing & Verification

### Server Status:
✅ Server restarted successfully
✅ Running on port 3100
✅ ElevenLabs TTS enabled
✅ All routes functional

### Key Improvements:
1. **Voice Quality:** Rachel voice with natural pacing and expressiveness
2. **Speech Flow:** Natural pauses and breathing between phrases
3. **Conversational Style:** Fillers, casual contractions, brief responses
4. **Greeting:** Personal and warm, not corporate

---

## Expected Results

### Before:
- Robotic, rushed delivery
- Corporate, formal language
- Perfect grammar (too perfect = robotic)
- No pauses or breathing
- Predictable response patterns

### After:
- Natural, conversational flow
- Casual, friendly language with fillers
- Human imperfections (incomplete thoughts, self-corrections)
- Natural pauses and emphasis
- Varied response patterns with personality

---

## Notes
- All template prompts now include strict guidance for human-sounding speech
- SSML enhancements work with both ElevenLabs and fallback Twilio TTS
- Rachel voice is warmer and more professional than Jessica
- Lower stability (0.3) allows more natural variation in delivery
- Script `templates/add-speech-patterns.js` created for future template updates

---

**Status:** All changes deployed and server running. Ready for testing with live calls.
