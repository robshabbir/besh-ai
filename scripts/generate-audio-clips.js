#!/usr/bin/env node
/**
 * Generate pre-recorded audio clips using ElevenLabs TTS.
 * These clips are served as static files for instant playback via ConversationRelay `play` messages.
 * 
 * This gives us:
 * - Zero-latency greeting (no TTS wait on call pickup)
 * - Instant acknowledgments while LLM processes
 * - Human-quality audio recorded once, played many times
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'; // Sarah — conversational female
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'audio', 'clips');

// Voice settings: LOW stability = more natural variation (less robotic)
// LOW similarity = more creative (less constrained to reference voice)
const VOICE_SETTINGS = {
  stability: 0.20,        // Very low — maximum natural variation
  similarity_boost: 0.65, // Moderate — recognizable but not rigid
  style: 0.7,             // High expressiveness
  use_speaker_boost: true
};

// ===== CLIPS TO GENERATE =====
const CLIPS = {
  // Greetings — slightly bored, said it 500 times today
  'greeting-mikes-plumbing': "Mike's Plumbing, this is Sarah.",
  'greeting-mikes-plumbing-2': "Mike's Plumbing, Sarah speaking.",
  'greeting-mikes-plumbing-3': "Hey, Mike's Plumbing.",
  
  // Quick acks — fire instantly while LLM thinks
  'ack-mmhmm': "Mm-hmm.",
  'ack-mmhmm-2': "Mhm.",
  'ack-yeah': "Yeah.",
  'ack-yeah-2': "Yeah?",
  'ack-okay': "Okay.",
  'ack-okay-2': "Oh, okay.",
  'ack-gotcha': "Gotcha.",
  'ack-right': "Right.",
  'ack-yep': "Yep.",
  'ack-sure': "Sure.",
  
  // Thinking/stalling — while LLM processes complex queries
  'think-hmm': "Hmm...",
  'think-lemme-see': "Lemme see...",
  'think-hang-on': "Hang on one sec.",
  'think-oh-um': "Oh, um...",
  'think-so': "So...",
  'think-lemme-check': "Lemme check on that.",
  
  // Emotional reactions — fire instantly before LLM response
  'react-oh-no': "Oh no.",
  'react-oh-jeez': "Oh jeez.",
  'react-oh-man': "Oh man.",
  'react-oh-wow': "Oh wow.",
  'react-yikes': "Ooh, yikes.",
  'react-aw': "Aw.",
  
  // Still there / no input
  'still-there': "Hey, you still there?",
  'no-worries-bye': "No worries, give us a call back whenever. Bye!",
  
  // Common short responses that don't need LLM
  'no-worries': "No worries.",
  'for-sure': "For sure.",
  'cool-cool': "Cool, cool.",
  'alrighty': "Alrighty.",
};

async function generateClip(name, text) {
  const outputPath = path.join(OUTPUT_DIR, `${name}.mp3`);
  
  // Skip if already exists
  if (fs.existsSync(outputPath)) {
    const stats = fs.statSync(outputPath);
    if (stats.size > 1000) {
      console.log(`  ⏭️  ${name} — already exists (${stats.size} bytes)`);
      return;
    }
  }
  
  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_turbo_v2_5',
          output_format: 'mp3_44100_128', // High quality for pre-recorded
          voice_settings: VOICE_SETTINGS
        })
      }
    );
    
    if (!response.ok) {
      const err = await response.text();
      throw new Error(`API ${response.status}: ${err}`);
    }
    
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(outputPath, buffer);
    console.log(`  ✅ ${name} — ${buffer.length} bytes (${text})`);
    
    // Rate limit: ElevenLabs allows ~10 req/s on paid plans
    await new Promise(r => setTimeout(r, 200));
    
  } catch (error) {
    console.error(`  ❌ ${name} — ${error.message}`);
  }
}

async function main() {
  console.log('🎙️  Generating pre-recorded audio clips...\n');
  
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  const entries = Object.entries(CLIPS);
  console.log(`📋 ${entries.length} clips to generate\n`);
  
  for (const [name, text] of entries) {
    await generateClip(name, text);
  }
  
  console.log('\n✅ Done! Clips saved to:', OUTPUT_DIR);
  console.log('\nServed at: <BASE_URL>/audio/clips/<name>.mp3');
}

main().catch(console.error);
