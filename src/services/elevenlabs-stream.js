const WebSocket = require('ws');
const logger = require('../utils/logger');

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

// Voice settings by language
const VOICES = {
  en: {
    id: 'EXAVITQu4vr4xnSDxMaL', // Sarah - conversational, phone-optimized
    stability: 0.25,
    similarity_boost: 0.75,
    style: 0.6,
    use_speaker_boost: true
  },
  es: {
    id: 'cgSgspJ2msm6clMCkdW9', // Spanish voice
    stability: 0.25,
    similarity_boost: 0.75,
    style: 0.6,
    use_speaker_boost: true
  }
};

/**
 * Create an ElevenLabs streaming TTS WebSocket connection
 * Streams text input and receives μ-law 8kHz audio chunks for Twilio
 * 
 * @param {string} language - 'en' or 'es'
 * @param {Function} onAudio - Callback for audio chunks (buffer) => void
 * @param {Function} onComplete - Callback when stream completes () => void
 * @param {Function} onError - Callback for errors (error) => void
 * @returns {Object} { sendText, flush, close } - Interface to send text and control stream
 */
function createElevenLabsStream(language = 'en', onAudio, onComplete, onError) {
  const voice = VOICES[language] || VOICES.en;
  
  // ElevenLabs WebSocket URL for streaming input with ulaw_8000 output
  const url = `wss://api.elevenlabs.io/v1/text-to-speech/${voice.id}/stream-input?` + 
    new URLSearchParams({
      model_id: 'eleven_turbo_v2_5',
      output_format: 'ulaw_8000', // μ-law 8kHz for Twilio
      optimize_streaming_latency: '3', // Balanced latency/quality
    });

  const ws = new WebSocket(url, {
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY
    }
  });

  let isOpen = false;
  let isFlushed = false;

  ws.on('open', () => {
    isOpen = true;
    logger.info('ElevenLabs stream opened', { voice: voice.id, language });
    
    // Send initial voice settings
    ws.send(JSON.stringify({
      text: ' ', // Initial space to start stream
      voice_settings: {
        stability: voice.stability,
        similarity_boost: voice.similarity_boost,
        style: voice.style,
        use_speaker_boost: voice.use_speaker_boost
      },
      xi_api_key: ELEVENLABS_API_KEY
    }));
  });

  ws.on('message', (data) => {
    try {
      // Check if it's JSON (status message) or binary audio
      if (data[0] === 0x7b) { // '{' = JSON
        const msg = JSON.parse(data.toString());
        
        if (msg.audio) {
          // Base64 encoded audio chunk
          const audioBuffer = Buffer.from(msg.audio, 'base64');
          onAudio(audioBuffer);
        }
        
        if (msg.isFinal) {
          logger.debug('ElevenLabs stream complete');
          onComplete();
        }
        
        if (msg.error) {
          logger.error('ElevenLabs stream error', { error: msg.error });
          onError(new Error(msg.error));
        }
      } else {
        // Raw audio data (shouldn't happen with current settings, but handle it)
        onAudio(data);
      }
    } catch (error) {
      logger.error('ElevenLabs message parse error', { error: error.message });
    }
  });

  ws.on('error', (error) => {
    logger.error('ElevenLabs WebSocket error', { error: error.message });
    onError(error);
  });

  ws.on('close', () => {
    isOpen = false;
    logger.info('ElevenLabs stream closed');
  });

  return {
    /**
     * Send text chunk for TTS (can be called multiple times for streaming)
     * @param {string} text - Text to convert to speech
     */
    sendText: (text) => {
      if (isOpen && ws.readyState === WebSocket.OPEN && !isFlushed) {
        ws.send(JSON.stringify({
          text: text,
          try_trigger_generation: true // Start generating immediately
        }));
        logger.debug('Sent text to ElevenLabs', { length: text.length });
      }
    },

    /**
     * Flush and finalize the stream (call when done sending text)
     */
    flush: () => {
      if (isOpen && ws.readyState === WebSocket.OPEN && !isFlushed) {
        isFlushed = true;
        ws.send(JSON.stringify({
          text: '' // Empty text to signal end
        }));
        logger.debug('ElevenLabs stream flushed');
      }
    },

    /**
     * Close the connection immediately
     */
    close: () => {
      if (isOpen && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    },

    /**
     * Check if connection is open
     */
    isOpen: () => isOpen && ws.readyState === WebSocket.OPEN,
    
    /**
     * Check if stream has been flushed
     */
    isFlushed: () => isFlushed
  };
}

module.exports = {
  createElevenLabsStream,
  VOICES
};
