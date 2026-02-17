#!/usr/bin/env node
/**
 * Test Deepgram Aura TTS voices for phone receptionist
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.DEEPGRAM_API_KEY;
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'audio', 'voice-tests');

const VOICES = [
  'aura-asteria-en',
  'aura-luna-en', 
  'aura-stella-en',
  'aura-athena-en'
];

const TEST_PHRASES = [
  { id: 'greeting', text: "Hey, Mike's Plumbing, this is Sarah. How can I help you?" },
  { id: 'checking', text: "Sure, let me check on that for you." },
  { id: 'address', text: "Mm-hmm, and what's your address?" },
  { id: 'empathy', text: "Oh no, that sounds rough. Let me get someone out there today." },
  { id: 'scheduling', text: "We've got an opening at 2 PM tomorrow, does that work?" },
  { id: 'callback', text: "Got it. And what's a good callback number?" },
  { id: 'patience', text: "No worries at all, take your time." },
  { id: 'confirmation', text: "Alright, you're all set! Someone will be there between 10 and 12." },
  { id: 'thinking', text: "Hmm, let me see... yeah, we can definitely do that." },
  { id: 'goodbye', text: "Thanks for calling Mike's Plumbing! Have a good one." }
];

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function generateClip(voice, phrase) {
  const filename = `deepgram-${voice}-${phrase.id}.mp3`;
  const outputPath = path.join(OUTPUT_DIR, filename);

  if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 500) {
    console.log(`  ⏭️  ${filename} — already exists`);
    return;
  }

  try {
    const response = await fetch(
      `https://api.deepgram.com/v1/speak?model=${voice}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Token ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: phrase.text })
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`API ${response.status}: ${err}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(outputPath, buffer);
    console.log(`  ✅ ${filename} — ${buffer.length} bytes`);

    await new Promise(r => setTimeout(r, 200));
  } catch (error) {
    console.error(`  ❌ ${filename} — ${error.message}`);
  }
}

async function main() {
  console.log('🎙️  Testing Deepgram Aura voices for Calva AI receptionist\n');
  console.log(`${VOICES.length} voices × ${TEST_PHRASES.length} phrases = ${VOICES.length * TEST_PHRASES.length} total clips\n`);

  for (const voice of VOICES) {
    console.log(`\n📢 ${voice}`);
    for (const phrase of TEST_PHRASES) {
      await generateClip(voice, phrase);
    }
  }

  console.log('\n✅ Done! Deepgram clips saved to:', OUTPUT_DIR);
}

main().catch(console.error);
