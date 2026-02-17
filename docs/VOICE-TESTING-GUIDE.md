# Voice Testing Quick Reference

## 🎧 Listen to Test Clips

All test clips are available at:
```
http://localhost:3100/audio/voice-tests/
```

## 🏆 Top 3 Recommendations (Start Here)

### 1. Bella Ultra-Natural (BEST)
**Listen:** http://localhost:3100/audio/voice-tests/bella-ultra-natural.mp3

**Config:**
```javascript
voice: 'hpp4J3VqNfWAUOO0d1Us-turbo_v2_5-0.95_0.10_0.50'
```

---

### 2. Matilda Relaxed (RUNNER-UP)
**Listen:** http://localhost:3100/audio/voice-tests/matilda-relaxed.mp3

**Config:**
```javascript
voice: 'XrExE9yKIg1WjnnlVkGX-turbo_v2_5-0.90_0.15_0.60'
```

---

### 3. Sarah Ultra-Natural (CURRENT IMPROVED)
**Listen:** http://localhost:3100/audio/voice-tests/sarah-ultra-natural.mp3

**Config:**
```javascript
voice: 'EXAVITQu4vr4xnSDxMaL-turbo_v2_5-0.95_0.10_0.50'
```

---

## 📊 All Test Clips

### Sarah (Current Voice - 6 variations)
- [sarah-current.mp3](http://localhost:3100/audio/voice-tests/sarah-current.mp3) - Current production settings
- [sarah-ultra-natural.mp3](http://localhost:3100/audio/voice-tests/sarah-ultra-natural.mp3) - ⭐ Recommended
- [sarah-relaxed.mp3](http://localhost:3100/audio/voice-tests/sarah-relaxed.mp3) - Slower pace
- [sarah-warm-pro.mp3](http://localhost:3100/audio/voice-tests/sarah-warm-pro.mp3) - Professional & warm
- [sarah-fast.mp3](http://localhost:3100/audio/voice-tests/sarah-fast.mp3) - Fast-paced
- [sarah-careful.mp3](http://localhost:3100/audio/voice-tests/sarah-careful.mp3) - Deliberate

### Bella (Professional, Bright, Warm - 6 variations)
- [bella-current.mp3](http://localhost:3100/audio/voice-tests/bella-current.mp3) - Using current settings
- [bella-ultra-natural.mp3](http://localhost:3100/audio/voice-tests/bella-ultra-natural.mp3) - ⭐⭐ Top Pick
- [bella-relaxed.mp3](http://localhost:3100/audio/voice-tests/bella-relaxed.mp3) - Slower pace
- [bella-warm-pro.mp3](http://localhost:3100/audio/voice-tests/bella-warm-pro.mp3) - Professional & warm
- [bella-fast.mp3](http://localhost:3100/audio/voice-tests/bella-fast.mp3) - Fast-paced
- [bella-careful.mp3](http://localhost:3100/audio/voice-tests/bella-careful.mp3) - Deliberate

### Matilda (Knowledgeable, Professional, Upbeat - 6 variations)
- [matilda-current.mp3](http://localhost:3100/audio/voice-tests/matilda-current.mp3) - Using current settings
- [matilda-ultra-natural.mp3](http://localhost:3100/audio/voice-tests/matilda-ultra-natural.mp3) - Maximum natural
- [matilda-relaxed.mp3](http://localhost:3100/audio/voice-tests/matilda-relaxed.mp3) - ⭐ Recommended
- [matilda-warm-pro.mp3](http://localhost:3100/audio/voice-tests/matilda-warm-pro.mp3) - Professional & warm
- [matilda-fast.mp3](http://localhost:3100/audio/voice-tests/matilda-fast.mp3) - Fast-paced
- [matilda-careful.mp3](http://localhost:3100/audio/voice-tests/matilda-careful.mp3) - Deliberate

### Jessica (Playful, Bright, Warm, Young - 6 variations)
- [jessica-current.mp3](http://localhost:3100/audio/voice-tests/jessica-current.mp3) - Using current settings
- [jessica-ultra-natural.mp3](http://localhost:3100/audio/voice-tests/jessica-ultra-natural.mp3) - Maximum natural
- [jessica-relaxed.mp3](http://localhost:3100/audio/voice-tests/jessica-relaxed.mp3) - Slower pace
- [jessica-warm-pro.mp3](http://localhost:3100/audio/voice-tests/jessica-warm-pro.mp3) - Professional & warm
- [jessica-fast.mp3](http://localhost:3100/audio/voice-tests/jessica-fast.mp3) - Fast-paced
- [jessica-careful.mp3](http://localhost:3100/audio/voice-tests/jessica-careful.mp3) - Deliberate

---

## 🚀 Quick Deploy

### Option 1: Update .env (Recommended)
```bash
# Edit .env file
nano /Users/rifat/clawd/revenue/ai-receptionist/.env

# Change this line:
CR_VOICE=hpp4J3VqNfWAUOO0d1Us-turbo_v2_5-0.95_0.10_0.50

# Restart server
npm run dev
```

### Option 2: Update Code
Edit `src/routes/voice.js` line 200:
```javascript
const crVoice = process.env.CR_VOICE || 'hpp4J3VqNfWAUOO0d1Us-turbo_v2_5-0.95_0.10_0.50';
```

---

## 🎯 What to Listen For

When testing each clip, rate on these criteria (1-10):

### Naturalness
- [ ] Does it sound like a real human?
- [ ] Natural prosody and intonation variation?
- [ ] No robotic monotone?

### Warmth
- [ ] Friendly and approachable?
- [ ] Welcoming tone?
- [ ] Makes you feel comfortable?

### Professionalism
- [ ] Sounds competent and trustworthy?
- [ ] Clear and easy to understand?
- [ ] Appropriate for business calls?

### Energy Level
- [ ] Right balance (not too energetic, not too flat)?
- [ ] Engaged but not hyperactive?
- [ ] Matches receptionist vibe?

---

## 📝 Testing Checklist

- [ ] Listen to Bella Ultra-Natural (top pick)
- [ ] Listen to Matilda Relaxed (runner-up)
- [ ] Listen to Sarah Ultra-Natural (current improved)
- [ ] Compare to current Sarah production voice
- [ ] Pick your favorite
- [ ] Update .env with chosen voice
- [ ] Restart server
- [ ] Make test call
- [ ] Verify it sounds natural on actual phone call

---

## 🔧 Parameter Reference

| Setting | Value | Effect |
|---------|-------|--------|
| **Stability** | 0.10 | Maximum natural variation (recommended) |
| | 0.20 | Current (still too robotic) |
| | 0.30+ | Too consistent, sounds monotone |
| **Similarity** | 0.50 | Flexible, expressive (recommended) |
| | 0.65 | Current (too rigid) |
| | 0.75+ | Very constrained |
| **Speed** | 0.90 | Relaxed, laid-back |
| | 0.95 | Natural pace (recommended) |
| | 1.0 | Default, slightly rushed |

---

## 📂 File Locations

- Test clips: `/Users/rifat/clawd/revenue/ai-receptionist/public/audio/voice-tests/`
- Recommendation doc: `/Users/rifat/clawd/revenue/ai-receptionist/docs/VOICE-RECOMMENDATION.md`
- Test script: `/Users/rifat/clawd/revenue/ai-receptionist/scripts/test-voice-combinations.js`
- Voice config: `/Users/rifat/clawd/revenue/ai-receptionist/src/routes/voice.js` (line 200)
- Environment: `/Users/rifat/clawd/revenue/ai-receptionist/.env`

---

**Need help?** Check VOICE-RECOMMENDATION.md for full details and research.
