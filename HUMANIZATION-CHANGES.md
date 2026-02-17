# Calva AI Receptionist - Humanization Changes
**Date:** 2026-02-13  
**Goal:** Make Sarah sound like a REAL, GREAT human support agent (not AI)

## Changes Applied

### 1. ✅ ElevenLabs TTS Upgrade (`src/services/elevenlabs-tts.js`)
- **Model:** Switched from `eleven_multilingual_v2` → `eleven_turbo_v2_5` (faster + style support)
- **Voice:** Changed from Rachel → **Sarah** (EXAVITQu4vr4xnSDxMaL) - optimized for conversational/phone scenarios
- **Voice Settings:**
  - `stability: 0.25` (LOW = more natural variation, less robotic)
  - `similarity_boost: 0.75`
  - `style: 0.6` (HIGH = more expressive, emotional)
  - `use_speaker_boost: true` (enhanced clarity for phone calls)

### 2. ✅ Gemini AI Configuration (`src/services/claude.js`)
**Problem:** `maxOutputTokens: 40` was too restrictive, causing cut-off robotic responses

**Solution:**
```js
generationConfig: {
  maxOutputTokens: 100,     // Allow natural response variation
  temperature: 0.9,         // High but not max (max can get weird)
  topP: 0.95,
  topK: 40,
}
```

### 3. ✅ AI-ism Filter (`src/services/claude.js` - `cleanForSpeech()`)
Added post-processing to catch and remove common AI phrases that slip through:
- "I'd be happy to help" → removed
- "Thank you for calling/reaching out" → removed
- "How may I assist you" → removed
- "Is there anything else" → removed
- "I understand your concern/frustration" → removed
- "Absolutely" → randomly replaced with "Yeah" or "For sure"
- "Certainly" → replaced with "Sure"
- "I apologize for" → replaced with "Sorry about that"

### 4. ✅ Greeting Fix (`src/routes/voice.js`)
**Before:** `Hey! ${businessName}, this is Sarah. What's goin' on?`  
**After:** `Hey, ${businessName}, this is Sarah!`

Real receptionists say their name and wait. They don't ask "what's goin' on" immediately.

### 5. ✅ COMPLETE System Prompt Rewrite (All 9 Templates)
**Old approach:** 30+ bullet-pointed rules → AI "performs" naturalness (fake)  
**New approach:** Personality-driven character → AI embodies naturalness (real)

#### Pattern:
```
You're Sarah, the front desk person at {{BUSINESS_NAME}}. 
You've worked here X years. You genuinely care about helping people 
but you're also juggling a bunch of stuff at the desk.

How you talk on the phone:
- Short. Like really short. "Yep!" "Oh no." "Gotcha, one sec."
- When someone has a problem, you FEEL it: "Oh jeez, that's no fun"
- You trail off sometimes... "so that would be around... hmm let me see..."
...

You never say: "How may I assist you", "Is there anything else", 
"Thank you for calling", "I'd be happy to help". Dead giveaways.

You DO say: "Hey!", "What's up?", "No worries", "For sure", "Oh man"
```

#### Personality Adaptations by Vertical:
- **Plumber:** Warm, efficient, empathetic ("Oh jeez, that's no fun")
- **Law Firm:** Professional but warm ("Absolutely", "I understand")
- **Medical:** Warm, reassuring ("Don't worry, we'll get you taken care of")
- **Restaurant:** Upbeat, fast-paced ("Perfect!", "Awesome!", "Cool!")
- **Salon/Spa:** Bubbly, friendly ("Ooh!", "You'll love it!", "Yay!")
- **Auto Repair:** Chill, straightforward ("Yeah", "Oof", "That sucks")
- **Real Estate:** Enthusiastic ("Oh that's exciting!", "Congratulations!")
- **Veterinary:** Compassionate ("Aw, poor little guy", "Don't worry")
- **School:** Professional but approachable ("Of course", "Absolutely")

## Templates Updated
1. ✅ `plumber.json`
2. ✅ `law-firm.json`
3. ✅ `medical-office.json`
4. ✅ `restaurant.json`
5. ✅ `salon-spa.json`
6. ✅ `auto-repair.json`
7. ✅ `real-estate.json`
8. ✅ `veterinary.json`
9. ✅ `school.json`

## Server Status
✅ Server restarted successfully  
✅ Running on port 3100  
✅ Health check: PASSING  
✅ ElevenLabs TTS enabled with Sarah voice  

## Next Steps for Testing
1. Make a test call to the platform
2. Listen for:
   - Natural conversational tone (not robotic)
   - Appropriate emotional responses
   - Varied response lengths (not always same)
   - Natural filler words and trailing off
   - NO corporate speak or AI-isms
3. Verify Sarah voice sounds more human than Rachel
4. Check that responses aren't getting cut off mid-sentence

## Rollback (if needed)
All changes are in Git. To rollback:
```bash
cd /Users/rifat/clawd/revenue/ai-receptionist
git diff HEAD src/services/elevenlabs-tts.js
git diff HEAD src/services/claude.js
git diff HEAD src/routes/voice.js
git diff HEAD templates/
# If needed: git restore <file>
```

---
**Result:** Calva AI receptionist should now sound like a genuinely warm, capable human receptionist who's been doing the job for years — NOT an AI trying to sound human.
