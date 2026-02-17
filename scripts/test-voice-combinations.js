#!/usr/bin/env node
/**
 * Test different ElevenLabs voices and parameters for phone receptionist
 * Goal: Find the most natural-sounding, indistinguishable-from-human voice
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.ELEVENLABS_API_KEY;
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'audio', 'voice-tests');

// Test text - realistic receptionist greeting
const TEST_TEXT = "Hey, Mike's Plumbing, this is Sarah. How can I help you today?";

// Voice candidates - best for phone receptionist based on ElevenLabs library
const VOICES = [
  {
    id: 'EXAVITQu4vr4xnSDxMaL',
    name: 'Sarah',
    description: 'Current voice - Mature, Reassuring, Confident'
  },
  {
    id: 'hpp4J3VqNfWAUOO0d1Us',
    name: 'Bella',
    description: 'Professional, Bright, Warm'
  },
  {
    id: 'XrExE9yKIg1WjnnlVkGX',
    name: 'Matilda',
    description: 'Knowledgable, Professional, Upbeat'
  },
  {
    id: 'cgSgspJ2msm6clMCkdW9',
    name: 'Jessica',
    description: 'Playful, Bright, Warm, Young'
  }
];

// Parameter combinations to test
const PARAM_COMBINATIONS = [
  // Current settings
  { stability: 0.20, similarity: 0.65, speed: 0.95, label: 'current' },
  
  // More natural variations (lower stability = more human-like variation)
  { stability: 0.10, similarity: 0.50, speed: 0.95, label: 'ultra-natural' },
  { stability: 0.15, similarity: 0.60, speed: 0.90, label: 'relaxed' },
  
  // Professional but warm
  { stability: 0.30, similarity: 0.70, speed: 0.95, label: 'warm-pro' },
  
  // Fast-paced NYC receptionist
  { stability: 0.20, similarity: 0.65, speed: 1.0, label: 'fast' },
  
  // Slower, more careful
  { stability: 0.25, similarity: 0.75, speed: 0.85, label: 'careful' }
];

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function generateClip(voice, params, index) {
  const filename = `${voice.name.toLowerCase()}-${params.label}.mp3`;
  const outputPath = path.join(OUTPUT_DIR, filename);
  
  // Skip if already exists
  if (fs.existsSync(outputPath)) {
    const stats = fs.statSync(outputPath);
    if (stats.size > 1000) {
      console.log(`  ⏭️  ${filename} — already exists (${stats.size} bytes)`);
      return;
    }
  }
  
  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voice.id}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: TEST_TEXT,
          model_id: 'eleven_turbo_v2_5',
          output_format: 'mp3_44100_128',
          voice_settings: {
            stability: params.stability,
            similarity_boost: params.similarity,
            style: 0.7,
            use_speaker_boost: true
          }
        })
      }
    );
    
    if (!response.ok) {
      const err = await response.text();
      throw new Error(`API ${response.status}: ${err}`);
    }
    
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(outputPath, buffer);
    
    console.log(`  ✅ ${filename} — ${buffer.length} bytes`);
    console.log(`     Voice: ${voice.description}`);
    console.log(`     Settings: stability=${params.stability}, similarity=${params.similarity}, speed=${params.speed}`);
    
    // Rate limit: ElevenLabs allows ~10 req/s on paid plans
    await new Promise(r => setTimeout(r, 300));
    
  } catch (error) {
    console.error(`  ❌ ${filename} — ${error.message}`);
  }
}

async function main() {
  console.log('🎙️  Testing ElevenLabs voices for Calva AI receptionist\n');
  console.log(`Test phrase: "${TEST_TEXT}"\n`);
  console.log(`${VOICES.length} voices × ${PARAM_COMBINATIONS.length} parameter sets = ${VOICES.length * PARAM_COMBINATIONS.length} total clips\n`);
  
  let count = 0;
  
  for (const voice of VOICES) {
    console.log(`\n📢 ${voice.name} - ${voice.description}`);
    
    for (const params of PARAM_COMBINATIONS) {
      await generateClip(voice, params, count);
      count++;
    }
  }
  
  console.log('\n✅ Done! Test clips saved to:', OUTPUT_DIR);
  console.log('\n🎧 Next steps:');
  console.log('   1. Listen to each clip');
  console.log('   2. Rate naturalness (1-10)');
  console.log('   3. Check top 3 recommendations in VOICE-RECOMMENDATION.md');
}

main().catch(console.error);
