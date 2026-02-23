const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

// Voice settings by language/persona
const VOICES = {
  en: {
    id: 'EXAVITQu4vr4xnSDxMaL', // Sarah - professional American female, no accent
    settings: {
      stability: 0.3,         // Low = natural variation, not robotic
      similarity_boost: 0.8,  // High = stay close to voice character
      style: 0.5,             // Moderate expressiveness
      use_speaker_boost: true // Enhanced clarity for phone calls
    }
  },
  es: {
    id: 'cgSgspJ2msm6clMCkdW9', // Spanish voice
    settings: {
      stability: 0.25,
      similarity_boost: 0.75,
      style: 0.6,
      use_speaker_boost: true
    }
  }
};

/**
 * Generate speech using ElevenLabs TTS API
 * @param {string} text - Text to convert to speech
 * @param {string} outputPath - Where to save the MP3 file
 * @param {string} language - Language code ('en' or 'es')
 * @returns {Promise<string>} - Path to generated audio file
 */
async function generateSpeech(text, outputPath, language = 'en') {
  const voice = VOICES[language] || VOICES.en;
  
  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voice.id}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_turbo_v2_5',      // Faster AND supports style params
          output_format: 'mp3_22050_32',       // Phone quality MP3
          voice_settings: voice.settings
        })
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ElevenLabs API error ${response.status}: ${errorText}`);
    }
    
    const buffer = Buffer.from(await response.arrayBuffer());
    
    // Ensure directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, buffer);
    
    logger.info('ElevenLabs TTS generated', { 
      outputPath, 
      size: buffer.length,
      language,
      textLength: text.length 
    });
    
    return outputPath;
  } catch (error) {
    logger.error('ElevenLabs TTS failed', { 
      error: error.message,
      text: text.substring(0, 100)
    });
    throw error;
  }
}

/**
 * Clean up old temp audio files (older than maxAgeMs)
 * @param {string} tempDir - Directory containing temp files
 * @param {number} maxAgeMs - Maximum age in milliseconds (default 5 minutes)
 */
function cleanupTempFiles(tempDir, maxAgeMs = 5 * 60 * 1000) {
  try {
    if (!fs.existsSync(tempDir)) {
      return;
    }
    
    const now = Date.now();
    const files = fs.readdirSync(tempDir);
    let deleted = 0;
    
    for (const file of files) {
      if (!file.endsWith('.mp3')) continue;
      
      const filePath = path.join(tempDir, file);
      const stats = fs.statSync(filePath);
      const age = now - stats.mtimeMs;
      
      if (age > maxAgeMs) {
        fs.unlinkSync(filePath);
        deleted++;
      }
    }
    
    if (deleted > 0) {
      logger.info('Cleaned up temp audio files', { deleted, tempDir });
    }
  } catch (error) {
    logger.error('Cleanup failed', { error: error.message, tempDir });
  }
}

module.exports = {
  generateSpeech,
  cleanupTempFiles,
  VOICES
};
