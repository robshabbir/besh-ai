const { execFile } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const logger = require('../utils/logger');

const execFileAsync = promisify(execFile);

// Cache directory for TTS audio files
const CACHE_DIR = path.join(__dirname, '../../data/tts-cache');

// Edge TTS voices - high quality, free
const VOICES = {
  female: {
    default: 'en-US-AriaNeural',
    professional: 'en-US-JennyNeural',
    friendly: 'en-US-JennyNeural'
  },
  male: {
    default: 'en-US-GuyNeural',
    professional: 'en-US-DavisNeural',
    friendly: 'en-US-JasonNeural'
  }
};

/**
 * Initialize TTS cache directory
 */
async function initCache() {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    logger.debug('TTS cache directory initialized', { path: CACHE_DIR });
  } catch (error) {
    logger.error('Failed to create TTS cache directory', { error: error.message });
  }
}

/**
 * Generate cache key for TTS request
 */
function getCacheKey(text, voice) {
  const hash = crypto.createHash('md5')
    .update(`${text}-${voice}`)
    .digest('hex');
  return `${hash}.mp3`;
}

/**
 * Check if edge-tts is available
 */
async function isEdgeTTSAvailable() {
  try {
    await execFileAsync('edge-tts', ['--version']);
    return true;
  } catch (error) {
    logger.warn('edge-tts not available', { error: error.message });
    return false;
  }
}

/**
 * Generate TTS audio using Edge TTS
 * @param {string} text - Text to convert to speech
 * @param {Object} options - TTS options
 * @param {string} options.voice - Voice name (default: en-US-AriaNeural)
 * @param {string} options.rate - Speech rate (default: +0%)
 * @param {string} options.pitch - Speech pitch (default: +0Hz)
 * @returns {Object} { success: boolean, filePath?: string, error?: string }
 */
async function generateTTS(text, options = {}) {
  try {
    // Ensure cache directory exists
    await initCache();

    const voice = options.voice || VOICES.female.friendly;
    const rate = options.rate || '+0%';
    const pitch = options.pitch || '+0Hz';

    // Check cache first
    const cacheKey = getCacheKey(text, voice);
    const cachedPath = path.join(CACHE_DIR, cacheKey);

    try {
      await fs.access(cachedPath);
      logger.debug('TTS cache hit', { text: text.substring(0, 50), voice });
      return {
        success: true,
        filePath: cachedPath,
        cached: true
      };
    } catch {
      // Cache miss, generate new
    }

    // Check if edge-tts is available
    const available = await isEdgeTTSAvailable();
    if (!available) {
      logger.warn('edge-tts not available, falling back to Twilio');
      return {
        success: false,
        error: 'edge-tts not installed',
        fallback: true
      };
    }

    logger.info('Generating TTS audio', {
      text: text.substring(0, 50),
      voice,
      outputFile: cacheKey
    });

    // Generate audio using edge-tts CLI
    const args = [
      '--voice', voice,
      '--rate', rate,
      '--pitch', pitch,
      '--text', text,
      '--write-media', cachedPath
    ];

    await execFileAsync('edge-tts', args, {
      timeout: 30000 // 30 second timeout
    });

    // Verify file was created
    try {
      const stats = await fs.stat(cachedPath);
      if (stats.size === 0) {
        throw new Error('Generated file is empty');
      }
    } catch (error) {
      throw new Error(`TTS file generation failed: ${error.message}`);
    }

    logger.info('TTS audio generated', {
      filePath: cachedPath,
      size: (await fs.stat(cachedPath)).size
    });

    return {
      success: true,
      filePath: cachedPath,
      cached: false
    };
  } catch (error) {
    logger.error('TTS generation failed', {
      error: error.message,
      text: text.substring(0, 50)
    });

    return {
      success: false,
      error: error.message,
      fallback: true
    };
  }
}

/**
 * Get audio URL for Twilio to play
 * @param {string} filePath - Path to audio file
 * @param {string} baseUrl - Base URL of the server
 * @returns {string} Public URL to the audio file
 */
function getAudioUrl(filePath, baseUrl) {
  const fileName = path.basename(filePath);
  return `${baseUrl}/api/tts-audio/${fileName}`;
}

/**
 * Clean old cached TTS files (older than 7 days)
 */
async function cleanOldCache(maxAgeDays = 7) {
  try {
    const files = await fs.readdir(CACHE_DIR);
    const now = Date.now();
    const maxAge = maxAgeDays * 24 * 60 * 60 * 1000;
    let deleted = 0;

    for (const file of files) {
      const filePath = path.join(CACHE_DIR, file);
      const stats = await fs.stat(filePath);
      const age = now - stats.mtimeMs;

      if (age > maxAge) {
        await fs.unlink(filePath);
        deleted++;
      }
    }

    if (deleted > 0) {
      logger.info('Cleaned old TTS cache files', { deleted, maxAgeDays });
    }
  } catch (error) {
    logger.error('Failed to clean TTS cache', { error: error.message });
  }
}

/**
 * Get cache statistics
 */
async function getCacheStats() {
  try {
    const files = await fs.readdir(CACHE_DIR);
    let totalSize = 0;

    for (const file of files) {
      const filePath = path.join(CACHE_DIR, file);
      const stats = await fs.stat(filePath);
      totalSize += stats.size;
    }

    return {
      fileCount: files.length,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
      cachePath: CACHE_DIR
    };
  } catch (error) {
    logger.error('Failed to get cache stats', { error: error.message });
    return {
      fileCount: 0,
      totalSizeMB: 0,
      cachePath: CACHE_DIR
    };
  }
}

/**
 * List available Edge TTS voices
 */
async function listVoices() {
  return VOICES;
}

/**
 * Get recommended voice for business type
 */
function getRecommendedVoice(industry, gender = 'female') {
  // Industry-specific voice recommendations
  const industryVoices = {
    'law-firm': { female: 'en-US-JennyNeural', male: 'en-US-DavisNeural' }, // Professional
    'medical-office': { female: 'en-US-JennyNeural', male: 'en-US-DavisNeural' }, // Professional
    'plumbing_services': { female: 'en-US-SaraNeural', male: 'en-US-GuyNeural' }, // Friendly
    'restaurant': { female: 'en-US-SaraNeural', male: 'en-US-JasonNeural' }, // Friendly
    'salon-spa': { female: 'en-US-AriaNeural', male: 'en-US-GuyNeural' }, // Warm
    'auto-repair': { female: 'en-US-SaraNeural', male: 'en-US-GuyNeural' } // Friendly
  };

  const voiceSet = industryVoices[industry] || VOICES[gender];
  return voiceSet[gender] || VOICES.female.default;
}

module.exports = {
  generateTTS,
  getAudioUrl,
  cleanOldCache,
  getCacheStats,
  listVoices,
  getRecommendedVoice,
  isEdgeTTSAvailable,
  CACHE_DIR,
  VOICES
};
