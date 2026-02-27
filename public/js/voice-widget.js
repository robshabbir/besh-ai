/**
 * Besh AI Voice Widget
 * Talk to the AI receptionist directly from the website.
 * Uses Web Speech API for STT + ElevenLabs for TTS.
 */
(function() {
  'use strict';

  // ============= STATE =============
  let isOpen = false;
  let isListening = false;
  let isProcessing = false;
  let isSpeaking = false;
  let sessionId = null;
  let recognition = null;
  let audioContext = null;
  let messages = [];

  // ============= CREATE UI =============
  function createWidget() {
    // Floating button
    const btn = document.createElement('div');
    btn.id = 'calva-voice-btn';
    btn.innerHTML = `
      <div class="calva-voice-btn-inner">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          <line x1="12" y1="19" x2="12" y2="23"/>
          <line x1="8" y1="23" x2="16" y2="23"/>
        </svg>
      </div>
      <div class="calva-voice-btn-pulse"></div>
    `;
    
    // Chat panel
    const panel = document.createElement('div');
    panel.id = 'calva-voice-panel';
    panel.innerHTML = `
      <div class="calva-panel-header">
        <div class="calva-panel-title">
          <div class="calva-avatar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            </svg>
          </div>
          <div>
            <div class="calva-name">Besh AI</div>
            <div class="calva-status" id="calva-status">Click mic to start talking</div>
          </div>
        </div>
        <button class="calva-close" id="calva-close">&times;</button>
      </div>
      <div class="calva-messages" id="calva-messages"></div>
      <div class="calva-controls">
        <button class="calva-mic-btn" id="calva-mic">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" y1="19" x2="12" y2="23"/>
            <line x1="8" y1="23" x2="16" y2="23"/>
          </svg>
        </button>
        <div class="calva-mic-hint" id="calva-mic-hint">Tap to speak</div>
      </div>
      <div class="calva-waveform" id="calva-waveform">
        <div class="calva-wave-bar"></div>
        <div class="calva-wave-bar"></div>
        <div class="calva-wave-bar"></div>
        <div class="calva-wave-bar"></div>
        <div class="calva-wave-bar"></div>
      </div>
    `;

    document.body.appendChild(btn);
    document.body.appendChild(panel);

    // Event listeners
    btn.addEventListener('click', togglePanel);
    document.getElementById('calva-close').addEventListener('click', closePanel);
    document.getElementById('calva-mic').addEventListener('click', toggleMic);

    // Add styles
    addStyles();
  }

  // ============= PANEL TOGGLE =============
  function togglePanel() {
    if (isOpen) {
      closePanel();
    } else {
      openPanel();
    }
  }

  function openPanel() {
    isOpen = true;
    document.getElementById('calva-voice-panel').classList.add('open');
    document.getElementById('calva-voice-btn').classList.add('hidden');
    
    // Play greeting on first open
    if (messages.length === 0) {
      fetchGreeting();
    }
  }

  function closePanel() {
    isOpen = false;
    stopListening();
    document.getElementById('calva-voice-panel').classList.remove('open');
    document.getElementById('calva-voice-btn').classList.remove('hidden');
  }

  // ============= GREETING =============
  async function fetchGreeting() {
    setStatus('Connecting...');
    try {
      const resp = await fetch('/api/voice-widget/greeting');
      const data = await resp.json();
      
      if (data.audio) {
        addMessage('ai', data.text);
        await playAudio(data.audio);
        setStatus('Tap mic to respond');
      }
    } catch (err) {
      console.error('Greeting error:', err);
      addMessage('ai', 'Hi there! How can I help you today?');
      setStatus('Tap mic to respond');
    }
  }

  // ============= SPEECH RECOGNITION =============
  function toggleMic() {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }

  function startListening() {
    if (isProcessing || isSpeaking) return;
    
    // Check browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setStatus('Voice not supported in this browser');
      addMessage('system', 'Voice recognition requires Chrome, Edge, or Safari.');
      return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      isListening = true;
      document.getElementById('calva-mic').classList.add('active');
      document.getElementById('calva-mic-hint').textContent = 'Listening...';
      document.getElementById('calva-waveform').classList.add('active');
      setStatus('Listening...');
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const isFinal = event.results[0].isFinal;
      
      if (isFinal && transcript.trim()) {
        stopListening();
        sendMessage(transcript.trim());
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setStatus('Microphone access denied');
        addMessage('system', 'Please allow microphone access to use voice chat.');
      } else if (event.error !== 'aborted') {
        setStatus('Tap mic to try again');
      }
      stopListening();
    };

    recognition.onend = () => {
      isListening = false;
      document.getElementById('calva-mic').classList.remove('active');
      document.getElementById('calva-waveform').classList.remove('active');
    };

    try {
      recognition.start();
    } catch (err) {
      console.error('Failed to start recognition:', err);
    }
  }

  function stopListening() {
    isListening = false;
    if (recognition) {
      try { recognition.stop(); } catch(e) {}
      recognition = null;
    }
    document.getElementById('calva-mic').classList.remove('active');
    document.getElementById('calva-mic-hint').textContent = 'Tap to speak';
    document.getElementById('calva-waveform').classList.remove('active');
  }

  // ============= SEND MESSAGE =============
  async function sendMessage(text) {
    isProcessing = true;
    addMessage('user', text);
    setStatus('Thinking...');
    document.getElementById('calva-mic').classList.add('processing');

    try {
      const resp = await fetch('/api/voice-widget/talk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId })
      });
      
      const data = await resp.json();
      sessionId = data.sessionId || sessionId;
      
      addMessage('ai', data.text);
      
      if (data.audio) {
        setStatus('Speaking...');
        await playAudio(data.audio);
      }
      
      setStatus('Tap mic to respond');
    } catch (err) {
      console.error('Send error:', err);
      addMessage('ai', "Sorry, I had trouble hearing you. Could you try again?");
      setStatus('Tap mic to try again');
    } finally {
      isProcessing = false;
      document.getElementById('calva-mic').classList.remove('processing');
    }
  }

  // ============= AUDIO PLAYBACK =============
  async function playAudio(base64Audio) {
    isSpeaking = true;
    document.getElementById('calva-waveform').classList.add('speaking');
    
    return new Promise((resolve) => {
      try {
        const audioData = atob(base64Audio);
        const arrayBuffer = new Uint8Array(audioData.length);
        for (let i = 0; i < audioData.length; i++) {
          arrayBuffer[i] = audioData.charCodeAt(i);
        }
        
        const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        
        audio.onended = () => {
          isSpeaking = false;
          document.getElementById('calva-waveform').classList.remove('speaking');
          URL.revokeObjectURL(url);
          resolve();
        };
        
        audio.onerror = () => {
          isSpeaking = false;
          document.getElementById('calva-waveform').classList.remove('speaking');
          URL.revokeObjectURL(url);
          resolve();
        };
        
        audio.play().catch(() => {
          isSpeaking = false;
          document.getElementById('calva-waveform').classList.remove('speaking');
          resolve();
        });
      } catch (err) {
        console.error('Audio playback error:', err);
        isSpeaking = false;
        document.getElementById('calva-waveform').classList.remove('speaking');
        resolve();
      }
    });
  }

  // ============= UI HELPERS =============
  function addMessage(type, text) {
    messages.push({ type, text });
    const container = document.getElementById('calva-messages');
    const msg = document.createElement('div');
    msg.className = `calva-msg calva-msg-${type}`;
    msg.textContent = text;
    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
  }

  function setStatus(text) {
    document.getElementById('calva-status').textContent = text;
  }

  // ============= STYLES =============
  function addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      #calva-voice-btn {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 10000;
        cursor: pointer;
        transition: all 0.3s ease;
      }
      #calva-voice-btn.hidden {
        transform: scale(0);
        opacity: 0;
        pointer-events: none;
      }
      .calva-voice-btn-inner {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
        transition: transform 0.2s;
      }
      #calva-voice-btn:hover .calva-voice-btn-inner {
        transform: scale(1.1);
      }
      .calva-voice-btn-pulse {
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        border-radius: 50%;
        border: 2px solid rgba(99, 102, 241, 0.5);
        animation: calva-pulse 2s ease-out infinite;
      }
      @keyframes calva-pulse {
        0% { transform: scale(1); opacity: 1; }
        100% { transform: scale(1.5); opacity: 0; }
      }

      #calva-voice-panel {
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 380px;
        max-height: 520px;
        background: #1a1a2e;
        border-radius: 20px;
        box-shadow: 0 8px 40px rgba(0,0,0,0.3);
        z-index: 10001;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        transform: scale(0.8) translateY(20px);
        opacity: 0;
        pointer-events: none;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      #calva-voice-panel.open {
        transform: scale(1) translateY(0);
        opacity: 1;
        pointer-events: all;
      }

      .calva-panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        color: white;
      }
      .calva-panel-title {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .calva-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(255,255,255,0.2);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .calva-name {
        font-weight: 600;
        font-size: 16px;
      }
      .calva-status {
        font-size: 12px;
        opacity: 0.9;
      }
      .calva-close {
        background: none;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        opacity: 0.8;
        padding: 0;
        line-height: 1;
      }
      .calva-close:hover { opacity: 1; }

      .calva-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        min-height: 200px;
        max-height: 300px;
      }
      .calva-msg {
        max-width: 85%;
        padding: 10px 14px;
        border-radius: 16px;
        font-size: 14px;
        line-height: 1.4;
        animation: calva-fadeIn 0.3s ease;
      }
      @keyframes calva-fadeIn {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .calva-msg-ai {
        background: #2d2d44;
        color: #e0e0e0;
        align-self: flex-start;
        border-bottom-left-radius: 4px;
      }
      .calva-msg-user {
        background: #6366f1;
        color: white;
        align-self: flex-end;
        border-bottom-right-radius: 4px;
      }
      .calva-msg-system {
        background: transparent;
        color: #888;
        font-size: 12px;
        text-align: center;
        align-self: center;
      }

      .calva-controls {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 16px;
        gap: 8px;
      }
      .calva-mic-btn {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: #2d2d44;
        border: 2px solid #444;
        color: #aaa;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
      }
      .calva-mic-btn:hover {
        background: #3d3d54;
        color: white;
        border-color: #6366f1;
      }
      .calva-mic-btn.active {
        background: #ef4444;
        border-color: #ef4444;
        color: white;
        animation: calva-micPulse 1.5s ease infinite;
      }
      .calva-mic-btn.processing {
        background: #6366f1;
        border-color: #6366f1;
        color: white;
        animation: calva-spin 1s linear infinite;
      }
      @keyframes calva-micPulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
        50% { box-shadow: 0 0 0 12px rgba(239,68,68,0); }
      }
      @keyframes calva-spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      .calva-mic-hint {
        font-size: 12px;
        color: #888;
      }

      .calva-waveform {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 3px;
        height: 24px;
        padding-bottom: 12px;
        opacity: 0;
        transition: opacity 0.3s;
      }
      .calva-waveform.active,
      .calva-waveform.speaking {
        opacity: 1;
      }
      .calva-wave-bar {
        width: 3px;
        height: 4px;
        background: #6366f1;
        border-radius: 2px;
        transition: height 0.15s;
      }
      .calva-waveform.active .calva-wave-bar {
        animation: calva-wave 0.8s ease-in-out infinite;
        background: #ef4444;
      }
      .calva-waveform.speaking .calva-wave-bar {
        animation: calva-wave 0.6s ease-in-out infinite;
        background: #6366f1;
      }
      .calva-wave-bar:nth-child(1) { animation-delay: 0s; }
      .calva-wave-bar:nth-child(2) { animation-delay: 0.1s; }
      .calva-wave-bar:nth-child(3) { animation-delay: 0.2s; }
      .calva-wave-bar:nth-child(4) { animation-delay: 0.3s; }
      .calva-wave-bar:nth-child(5) { animation-delay: 0.4s; }
      @keyframes calva-wave {
        0%, 100% { height: 4px; }
        50% { height: 20px; }
      }

      @media (max-width: 480px) {
        #calva-voice-panel {
          width: calc(100vw - 16px);
          right: 8px;
          bottom: 8px;
          max-height: 70vh;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // ============= INIT =============
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWidget);
  } else {
    createWidget();
  }
})();
