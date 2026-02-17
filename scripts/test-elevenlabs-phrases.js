#!/usr/bin/env node
/**
 * Test ElevenLabs voices with 10 receptionist phrases
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.ELEVENLABS_API_KEY;
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'audio', 'voice-tests');

const VOICES = [
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'sarah' },
  { id: 'hpp4J3VqNfWAUOO0d1Us', name: 'bella' },
  { id: 'XrExE9yKIg1WjnnlVkGX', name: 'matilda' },
  { id: 'cgSgspJ2msm6clMCkdW9', name: 'jessica' }
];

const TEST_PHRASES = [
  { id: 'greeting', text: "Hey, Mike's Plumbing, this is Sarah. How can I help you?" },
  { id: 'checking', text: "Sure, let me check on that for you." },
  { id: 'address', text: "Mm-hmm, and what's your address?" },
  { id: 'empathy', text: "Oh no, that sounds rough. Let me get someone out there today." },
  { id: 'scheduling', text: "We've got an opening at 2 PM tomorrow, does that work?" },
  { id: 'callback', text: "Got it. And what's a good callback number?" },
  { id: 'patience', text: "No worries at all, take your time." },
  { id: 'thinking', text: "Hmm, let me see... yeah, we can definitely do that." },
  { id: 'confirmation', text: "Alright, you're all set! Someone will be there between 10 and 12." },
  { id: 'goodbye', text: "Thanks for calling Mike's Plumbing! Have a good one." }
];

// Best params from initial test
const PARAMS = { stability: 0.20, similarity: 0.65, style: 0.7 };

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function generateClip(voice, phrase) {
  const filename = `elevenlabs-${voice.name}-${phrase.id}.mp3`;
  const outputPath = path.join(OUTPUT_DIR, filename);

  if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 500) {
    console.log(`  ⏭️  ${filename} — already exists`);
    return;
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voice.id}`,
      {
        method: 'POST',
        headers: { 'xi-api-key': API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: phrase.text,
          model_id: 'eleven_turbo_v2_5',
          output_format: 'mp3_44100_128',
          voice_settings: {
            stability: PARAMS.stability,
            similarity_boost: PARAMS.similarity,
            style: PARAMS.style,
            use_speaker_boost: true
          }
        })
      }
    );

    if (!response.ok) throw new Error(`API ${response.status}: ${await response.text()}`);

    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(outputPath, buffer);
    console.log(`  ✅ ${filename} — ${buffer.length} bytes`);
    await new Promise(r => setTimeout(r, 300));
  } catch (error) {
    console.error(`  ❌ ${filename} — ${error.message}`);
  }
}

async function main() {
  console.log('🎙️  ElevenLabs - 10 receptionist phrases per voice\n');
  console.log(`${VOICES.length} voices × ${TEST_PHRASES.length} phrases = ${VOICES.length * TEST_PHRASES.length} clips\n`);

  for (const voice of VOICES) {
    console.log(`\n📢 ${voice.name}`);
    for (const phrase of TEST_PHRASES) {
      await generateClip(voice, phrase);
    }
  }

  console.log('\n✅ Done!');
}

main().catch(console.error);
