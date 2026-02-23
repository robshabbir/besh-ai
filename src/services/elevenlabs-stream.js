const WebSocket = require('ws');
const axios = require('axios');
const logger = require('../utils/logger');

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

// ============= VOICE LIBRARY =============
// Top-tier voices tested for maximum naturalness

const VOICES = {
  en: {
    // Antoni — smooth, conversational male. Most natural-sounding.
    id: process.env.ELEVENLABS_VOICE_ID || 'ErXwobaYiN019PkySvjV',
    stability: 0.35,          // Lower = more natural variation (flash v2.5 supports 0-1 range)
    similarity_boost: 0.80,   // High = clear consistent voice
    style: 0.30,              // Some warmth & expressiveness
    use_speaker_boost: true
  },
  es: {
    id: process.env.ELEVENLABS_VOICE_ID_ES || 'ErXwobaYiN019PkySvjV',
    stability: 0.35,
    similarity_boost: 0.80,
    style: 0.30,
    use_speaker_boost: true
  }
};

/**
 * Build voice_settings compatible with the current model.
 * v3 only accepts stability=[0.0, 0.5, 1.0] and no style/speaker_boost.
 */
function buildVoiceSettings(voice) {
  const model = MODEL_ID;
  if (model === 'eleven_v3') {
    // v3: only stability + similarity_boost
    return {
      stability: voice.stability,
      similarity_boost: voice.similarity_boost
    };
  }
  // v2 models: full settings
  return {
    stability: voice.stability,
    similarity_boost: voice.similarity_boost,
    style: voice.style || 0,
    use_speaker_boost: voice.use_speaker_boost || false
  };
}

// Voice catalog for audition/selection
const VOICE_CATALOG = {
  female: [
    { id: 'g6xIsTj2HwM6VR4iXFCw', name: 'Jessica Anne Bogart', desc: 'Warm, chatty, natural American female — #1 conversational voice' },
    { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', desc: 'Soft, young, friendly — great for approachable receptionist' },
    { id: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte', desc: 'Mature, professional, clear — business-like tone' },
  ],
  male: [
    { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam', desc: 'Young, energetic, American male — approachable & friendly' },
    { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', desc: 'Deep, warm, professional male — authoritative yet friendly' },
    { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', desc: 'Smooth, conversational male — natural & easygoing' },
  ]
};

// Model selection:
// eleven_v3 = BEST quality, most natural/expressive (~2s latency)
// eleven_flash_v2_5 = fastest, great quality (~300ms) — Synthflow's default
// eleven_multilingual_v2 = excellent quality, multilingual
//
// STRATEGY: flash v2.5 for phone calls (latency critical), v3 for website widget (quality critical)
const MODEL_ID = process.env.ELEVENLABS_MODEL || 'eleven_flash_v2_5';
const MODEL_ID_HQ = 'eleven_v3'; // High-quality model for non-realtime use

/**
 * Streaming TTS via ElevenLabs REST API with chunked transfer.
 * Returns audio chunks progressively for lower time-to-first-byte.
 * Uses output_format=ulaw_8000 for Twilio compatibility.
 */
async function speakTextStreaming(text, language = 'en', onChunk) {
  const voice = VOICES[language] || VOICES.en;
  const t0 = Date.now();
  let totalBytes = 0;
  let firstChunkMs = 0;
  
  try {
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voice.id}/stream?output_format=ulaw_8000&optimize_streaming_latency=3`,
      {
        text,
        model_id: MODEL_ID,
        voice_settings: buildVoiceSettings(voice)
      },
      {
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'audio/basic' // mulaw
        },
        responseType: 'stream',
        timeout: 15000
      }
    );

    return new Promise((resolve, reject) => {
      const CHUNK_SIZE = 160 * 20; // 3200 bytes = 400ms of audio at 8kHz mulaw
      let buffer = Buffer.alloc(0);
      
      response.data.on('data', (chunk) => {
        if (!firstChunkMs) {
          firstChunkMs = Date.now() - t0;
        }
        totalBytes += chunk.length;
        buffer = Buffer.concat([buffer, chunk]);
        
        // Send chunks as they accumulate
        while (buffer.length >= CHUNK_SIZE) {
          const audioChunk = buffer.slice(0, CHUNK_SIZE);
          buffer = buffer.slice(CHUNK_SIZE);
          if (onChunk) onChunk(audioChunk.toString('base64'));
        }
      });
      
      response.data.on('end', () => {
        // Send remaining buffer
        if (buffer.length > 0) {
          if (onChunk) onChunk(buffer.toString('base64'));
        }
        
        logger.info('ElevenLabs streaming TTS complete', {
          model: MODEL_ID,
          voice: voice.id,
          firstChunkMs,
          totalMs: Date.now() - t0,
          audioBytes: totalBytes,
          textLen: text.length
        });
        
        resolve({ firstChunkMs, totalMs: Date.now() - t0, totalBytes });
      });
      
      response.data.on('error', (err) => {
        logger.error('ElevenLabs stream error', { error: err.message });
        reject(err);
      });
    });
  } catch (error) {
    // If streaming endpoint fails, fall back to non-streaming
    if (error.response?.status === 400 || error.response?.status === 422) {
      logger.warn('Streaming TTS failed, falling back to REST', { 
        status: error.response?.status,
        model: MODEL_ID 
      });
      return speakTextFallback(text, language, onChunk);
    }
    
    const errMsg = error.response?.data ? 
      (typeof error.response.data === 'string' ? error.response.data.substring(0, 200) : JSON.stringify(error.response.data).substring(0, 200)) :
      error.message;
    logger.error('ElevenLabs streaming TTS error', { error: errMsg, model: MODEL_ID });
    throw new Error(`ElevenLabs TTS failed: ${errMsg}`);
  }
}

/**
 * Fallback: Non-streaming REST TTS (works with all models including v3).
 * Returns base64-encoded ulaw_8000 audio chunks for Twilio.
 */
async function speakTextFallback(text, language = 'en', onChunk) {
  const voice = VOICES[language] || VOICES.en;
  const t0 = Date.now();
  
  try {
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voice.id}?output_format=ulaw_8000`,
      {
        text,
        model_id: MODEL_ID,
        voice_settings: buildVoiceSettings(voice)
      },
      {
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer',
        timeout: 15000
      }
    );
    
    const CHUNK_SIZE = 160 * 20; // 400ms chunks
    const rawBuffer = Buffer.from(response.data);
    const chunks = [];
    for (let i = 0; i < rawBuffer.length; i += CHUNK_SIZE) {
      const chunk = rawBuffer.slice(i, i + CHUNK_SIZE).toString('base64');
      chunks.push(chunk);
      if (onChunk) onChunk(chunk);
    }
    
    const totalMs = Date.now() - t0;
    logger.info('ElevenLabs TTS complete (REST fallback)', {
      model: MODEL_ID,
      voice: voice.id,
      latencyMs: totalMs,
      audioBytes: response.data.byteLength,
      chunks: chunks.length,
      textLen: text.length
    });
    
    return { firstChunkMs: totalMs, totalMs, totalBytes: response.data.byteLength };
  } catch (error) {
    const errMsg = error.response?.data ? 
      Buffer.from(error.response.data).toString().substring(0, 200) : 
      error.message;
    logger.error('ElevenLabs REST TTS error', { error: errMsg, model: MODEL_ID });
    throw new Error(`ElevenLabs TTS failed: ${errMsg}`);
  }
}

/**
 * Original speakText for backward compatibility.
 * Returns array of base64 audio chunks.
 */
async function speakText(text, language = 'en') {
  const voice = VOICES[language] || VOICES.en;
  const t0 = Date.now();
  
  try {
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voice.id}?output_format=ulaw_8000`,
      {
        text,
        model_id: MODEL_ID,
        voice_settings: buildVoiceSettings(voice)
      },
      {
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer',
        timeout: 15000
      }
    );
    
    const CHUNK_SIZE = 160 * 20;
    const rawBuffer = Buffer.from(response.data);
    const chunks = [];
    for (let i = 0; i < rawBuffer.length; i += CHUNK_SIZE) {
      chunks.push(rawBuffer.slice(i, i + CHUNK_SIZE).toString('base64'));
    }
    
    logger.info('ElevenLabs TTS complete (REST)', {
      model: MODEL_ID,
      voice: voice.id,
      latencyMs: Date.now() - t0,
      audioBytes: response.data.byteLength,
      chunks: chunks.length,
      textLen: text.length
    });
    
    return chunks;
  } catch (error) {
    const errMsg = error.response?.data ? 
      Buffer.from(error.response.data).toString().substring(0, 200) : 
      error.message;
    logger.error('ElevenLabs REST TTS error', { error: errMsg, model: MODEL_ID });
    throw new Error(`ElevenLabs TTS failed: ${errMsg}`);
  }
}

/**
 * Generate MP3 sample for a given voice (for audition).
 * Returns Buffer of MP3 audio.
 */
async function generateVoiceSample(voiceId, text, modelId) {
  const model = modelId || MODEL_ID;
  
  const response = await axios.post(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
    {
      text,
      model_id: model,
      voice_settings: buildVoiceSettings({ stability: 0.5, similarity_boost: 0.85 })
    },
    {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json'
      },
      responseType: 'arraybuffer',
      timeout: 30000
    }
  );
  
  return Buffer.from(response.data);
}

/**
 * WebSocket streaming approach (for models that support it).
 */
function createElevenLabsStream(language = 'en', onAudio, onComplete, onError) {
  const voice = VOICES[language] || VOICES.en;
  const wsModel = 'eleven_flash_v2_5'; // WS streaming only on flash models
  
  const url = `wss://api.elevenlabs.io/v1/text-to-speech/${voice.id}/stream-input?` + 
    new URLSearchParams({
      model_id: wsModel,
      output_format: 'ulaw_8000',
      optimize_streaming_latency: '4',
    });

  const ws = new WebSocket(url, {
    headers: { 'xi-api-key': ELEVENLABS_API_KEY }
  });

  let isReady = false;
  let isFlushed = false;
  let pendingText = [];

  ws.on('open', () => {
    ws.send(JSON.stringify({
      text: ' ',
      voice_settings: buildVoiceSettings(voice),
      xi_api_key: ELEVENLABS_API_KEY
    }));
    
    isReady = true;
    
    for (const t of pendingText) {
      ws.send(JSON.stringify({ text: t, try_trigger_generation: true }));
    }
    pendingText = [];
  });

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.audio && msg.audio.length > 0) { onAudio(msg.audio); }
      if (msg.isFinal && onComplete) onComplete();
      if (msg.error && onError) onError(new Error(msg.error));
    } catch (e) {}
  });

  ws.on('error', (error) => { if (onError) onError(error); });
  ws.on('close', () => { isReady = false; });

  return {
    sendText: (text) => {
      if (isReady && ws.readyState === WebSocket.OPEN && !isFlushed) {
        ws.send(JSON.stringify({ text, try_trigger_generation: true }));
      } else if (!isFlushed) {
        pendingText.push(text);
      }
    },
    flush: () => {
      if (ws.readyState === WebSocket.OPEN && !isFlushed) {
        isFlushed = true;
        ws.send(JSON.stringify({ text: '' }));
      }
    },
    close: () => { try { ws.close(); } catch(e) {} },
    isOpen: () => isReady && ws.readyState === WebSocket.OPEN,
    isFlushed: () => isFlushed
  };
}

module.exports = { 
  createElevenLabsStream, 
  speakText, 
  speakTextStreaming, 
  generateVoiceSample, 
  VOICES, 
  VOICE_CATALOG 
};
