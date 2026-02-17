# AI Receptionist Documentation

## 📚 Documentation Index

This folder contains all documentation for the Calva AI receptionist voice testing project.

---

## 🎯 Start Here

### Quick Links

1. **🚀 Want to fix the robotic voice NOW?**  
   → Read: [VOICE-TESTING-GUIDE.md](./VOICE-TESTING-GUIDE.md)  
   → TL;DR: Update `.env` to `CR_VOICE=hpp4J3VqNfWAUOO0d1Us-turbo_v2_5-0.95_0.10_0.50`

2. **🔬 Want to understand the research?**  
   → Read: [VOICE-RECOMMENDATION.md](./VOICE-RECOMMENDATION.md)

3. **📊 Want the executive summary?**  
   → Read: [VOICE-TESTING-SUMMARY.md](./VOICE-TESTING-SUMMARY.md)

---

## 📄 Document Guide

### VOICE-TESTING-GUIDE.md
**Quick Reference** - Listen to all 24 test clips and deploy your favorite

**Contents:**
- Direct links to top 3 recommended voices
- Links to all 24 test clips
- Quick deploy instructions (copy-paste)
- Testing checklist

**Use when:** You want to quickly test voices and deploy

---

### VOICE-RECOMMENDATION.md
**Comprehensive Analysis** - Full research, recommendations, and implementation

**Contents:**
- Testing methodology
- Top 3 voice recommendations (with reasoning)
- Parameter explanations
- Implementation guide
- Before/After comparison
- Additional tips

**Use when:** You want to understand why certain voices/settings work better

---

### VOICE-TESTING-SUMMARY.md
**Executive Summary** - What was accomplished, deliverables, next steps

**Contents:**
- Task completion checklist
- Top 3 recommendations (brief)
- Quick deploy instructions
- File locations
- Success criteria met

**Use when:** You want a high-level overview of the project

---

## 🎧 Test Audio Files

**Location:** `/Users/rifat/clawd/revenue/ai-receptionist/public/audio/voice-tests/`

**Access:** `http://localhost:3100/audio/voice-tests/[filename].mp3`

### Top 3 Recommended Clips

1. **bella-ultra-natural.mp3** ⭐⭐⭐ (Best)
2. **matilda-relaxed.mp3** ⭐⭐ (Runner-up)
3. **sarah-ultra-natural.mp3** ⭐ (Current voice improved)

### All 24 Test Clips

**Format:** `[voice-name]-[setting-label].mp3`

**Voices:**
- Sarah (6 clips) - Current voice
- Bella (6 clips) - Recommended
- Matilda (6 clips) - Runner-up
- Jessica (6 clips) - Alternative

**Settings per voice:**
- current - Using current production settings
- ultra-natural - Maximum natural variation (recommended)
- relaxed - Slower pace
- warm-pro - Professional but warm
- fast - Fast-paced NYC style
- careful - Deliberate and clear

---

## 🛠️ Scripts

### test-voice-combinations.js
**Location:** `/Users/rifat/clawd/revenue/ai-receptionist/scripts/`

**Purpose:** Generate test audio clips with different voice/parameter combinations

**Usage:**
```bash
cd /Users/rifat/clawd/revenue/ai-receptionist
node scripts/test-voice-combinations.js
```

**Customization:** Edit the script to test additional voices or parameters

---

## 📋 Quick Implementation

### Option 1: Update .env (Recommended)

```bash
# Edit .env
nano /Users/rifat/clawd/revenue/ai-receptionist/.env

# Update this line
CR_VOICE=hpp4J3VqNfWAUOO0d1Us-turbo_v2_5-0.95_0.10_0.50

# Restart server
npm run dev
```

### Option 2: Update Code

Edit `src/routes/voice.js` (line 200):
```javascript
const crVoice = process.env.CR_VOICE || 'hpp4J3VqNfWAUOO0d1Us-turbo_v2_5-0.95_0.10_0.50';
```

---

## 🎯 Top 3 Voice Configs (Copy-Paste Ready)

### #1 - Bella Ultra-Natural (RECOMMENDED)
```bash
CR_VOICE=hpp4J3VqNfWAUOO0d1Us-turbo_v2_5-0.95_0.10_0.50
```
Professional, bright, warm American female. Sounds most human.

### #2 - Matilda Relaxed
```bash
CR_VOICE=XrExE9yKIg1WjnnlVkGX-turbo_v2_5-0.90_0.15_0.60
```
Knowledgeable, upbeat, very relaxed pace.

### #3 - Sarah Ultra-Natural
```bash
CR_VOICE=EXAVITQu4vr4xnSDxMaL-turbo_v2_5-0.95_0.10_0.50
```
Current voice with improved settings (less robotic).

---

## 🔍 Research Summary

### Current Problem
Voice sounds robotic because:
- Stability too high (0.20) → monotone
- Similarity too high (0.65) → rigid, unexpressive

### Solution
Lower stability and similarity:
- Stability: 0.10 (maximum natural variation)
- Similarity: 0.50 (flexible, expressive)

### Voice Change
Switch from Sarah to Bella:
- Bella has warmer, more professional receptionist tone
- Better suited for phone conversations
- Described as "bright and warm"

---

## 📊 Project Stats

- **Voices tested:** 4
- **Parameter combinations:** 6 per voice
- **Total test clips:** 24
- **Documentation files:** 4
- **Total documentation:** ~32 KB
- **Recommended voices:** 3
- **Best voice:** Bella Ultra-Natural

---

## 🚀 Testing Workflow

1. **Listen** to top 3 clips:
   - http://localhost:3100/audio/voice-tests/bella-ultra-natural.mp3
   - http://localhost:3100/audio/voice-tests/matilda-relaxed.mp3
   - http://localhost:3100/audio/voice-tests/sarah-ultra-natural.mp3

2. **Choose** your favorite

3. **Deploy** (update .env)

4. **Test** with a live phone call

5. **Iterate** if needed (try other clips or adjust parameters)

---

## 💡 Pro Tips

### If voice still sounds robotic:
- Try even lower stability (0.05)
- Use slower speed (0.90)
- Check that text isn't in ALL CAPS

### For per-tenant customization:
Add to tenant config in database:
```javascript
tenant.config.crVoice = 'hpp4J3VqNfWAUOO0d1Us-turbo_v2_5-0.95_0.10_0.50';
```

### For A/B testing:
Keep current voice for some calls, new voice for others:
```javascript
const crVoice = Math.random() < 0.5 
  ? 'hpp4J3VqNfWAUOO0d1Us-turbo_v2_5-0.95_0.10_0.50' // Bella
  : 'EXAVITQu4vr4xnSDxMaL-turbo_v2_5-0.95_0.10_0.50'; // Sarah
```

---

## 📞 Need Help?

### Re-generate test clips:
```bash
node scripts/test-voice-combinations.js
```

### Test new voices:
1. Get voice ID from ElevenLabs API
2. Add to `VOICES` array in script
3. Run script

### Adjust parameters:
1. Edit `PARAM_COMBINATIONS` in script
2. Run script
3. Listen to new clips

---

**Project completed:** February 16, 2026  
**Status:** ✅ All deliverables complete  
**Next step:** Deploy recommended voice and test on live calls
