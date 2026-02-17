const WebSocket = require('ws');
const logger = require('../utils/logger');

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

/**
 * Create a Deepgram STT WebSocket connection
 * Converts Twilio μ-law 8kHz audio to text in real-time
 * 
 * @param {Function} onTranscript - Callback for final transcripts (text) => void
 * @param {Function} onError - Callback for errors (error) => void
 * @returns {Object} { send, close } - Interface to send audio and close connection
 */
function createDeepgramConnection(onTranscript, onError) {
  if (!DEEPGRAM_API_KEY) {
    logger.error('DEEPGRAM_API_KEY not set');
    return { send: () => {}, close: () => {}, isOpen: () => false };
  }

  const url = 'wss://api.deepgram.com/v1/listen?' + new URLSearchParams({
    encoding: 'mulaw',
    sample_rate: '8000',
    channels: '1',
    model: 'nova-2-general',
    interim_results: 'true',
    punctuate: 'true',
    utterance_end_ms: '1500',
    endpointing: '300',
  });

  const ws = new WebSocket(url, {
    headers: {
      'Authorization': `Token ${DEEPGRAM_API_KEY}`
    }
  });

  let isOpen = false;

  ws.on('open', () => {
    isOpen = true;
    logger.info('Deepgram STT connection opened');
  });

  ws.on('message', (data) => {
    try {
      const result = JSON.parse(data.toString());
      
      // Check for final transcript
      if (result.type === 'Results' && result.channel?.alternatives?.[0]) {
        const transcript = result.channel.alternatives[0].transcript;
        const isFinal = result.is_final;
        
        if (isFinal && transcript.trim()) {
          logger.debug('Deepgram transcript', { 
            text: transcript.substring(0, 100),
            confidence: result.channel.alternatives[0].confidence 
          });
          onTranscript(transcript);
        }
      }
      
      // Handle errors
      if (result.type === 'error') {
        logger.error('Deepgram error', { error: result.error });
        onError(new Error(result.error));
      }
    } catch (error) {
      logger.error('Deepgram message parse error', { error: error.message });
    }
  });

  ws.on('error', (error) => {
    logger.error('Deepgram WebSocket error', { error: error.message });
    onError(error);
  });

  ws.on('close', () => {
    isOpen = false;
    logger.info('Deepgram STT connection closed');
  });

  return {
    /**
     * Send audio chunk to Deepgram (μ-law 8kHz, base64 encoded)
     * @param {string} audioBase64 - Base64 encoded μ-law audio
     */
    send: (audioBase64) => {
      if (isOpen && ws.readyState === WebSocket.OPEN) {
        const buffer = Buffer.from(audioBase64, 'base64');
        ws.send(buffer);
      }
    },

    /**
     * Close the connection
     */
    close: () => {
      if (isOpen && ws.readyState === WebSocket.OPEN) {
        // Send close frame to finalize transcription
        ws.send(JSON.stringify({ type: 'CloseStream' }));
        ws.close();
      }
    },

    /**
     * Check if connection is open
     */
    isOpen: () => isOpen && ws.readyState === WebSocket.OPEN
  };
}

module.exports = {
  createDeepgramConnection
};
