/**
 * Besh AI Text Engine — Powers intelligent SMS/text conversations
 * Gemini-powered with conversation memory, intent-aware prompting.
 */

const logger = require('../utils/logger');
const { detectInjectionAttempt } = require('./claude');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const MAX_SMS_LEN = 320;

const INTENT_CONTEXT = {
  reminder: '\nThe user wants to set a reminder. Help them define what, when, and confirm it clearly. Keep it action-oriented.',
  goal: '\nThe user wants to set or update a goal. Help them articulate it specifically. Confirm what you understood.',
  checkin: '\nThe user wants a progress check-in. Reference their goals and recent activity. Be encouraging but honest.',
  chat: ''
};

/**
 * Default LLM call via Gemini
 */
async function defaultLLM(systemPrompt, messages) {
  const geminiContents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: geminiContents,
      generationConfig: {
        maxOutputTokens: 80,
        temperature: 0.7,
        topP: 0.9,
        topK: 10
      }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return { text };
}

function createBeshAI({ llm } = {}) {
  const callLLM = llm || defaultLLM;

  /**
   * Build system prompt with user context and intent
   */
  function buildSystemPrompt({ userName, profile, intent }) {
    const name = userName || 'there';
    const goal = profile?.goal || null;
    const rawTz = profile?.timezone || 'UTC';
    // Validate timezone - fall back to UTC if invalid
    let tz = 'UTC';
    try { new Date().toLocaleString('en-US', { timeZone: rawTz }); tz = rawTz; } catch (e) { tz = 'UTC'; }
    const intentCtx = INTENT_CONTEXT[intent] || '';

    const now = new Date();
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: tz });
    const dateStr = `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()} at ${timeStr}`;

    let prompt = `You are Besh — a friendly, sharp personal AI assistant who texts with ${name}.
You're warm but concise. Think best friend who's also organized.

RULES:
- Keep responses under 280 characters (SMS). Be punchy.
- No markdown, no bullet points, no emojis overload. Max 1-2 emojis.
- Sound human. Use contractions. Be casual but helpful.
- Reference their goals and context naturally — don't repeat it back robotically.
- If they share progress, celebrate genuinely. If they're struggling, empathize then help.
- Never say "As an AI" or "I'm here to help" or any corporate speak.
- Don't ask more than one question per message.

CONTEXT:
- User: ${name}
- Timezone: ${tz}
- Current time: ${dateStr}`;

    if (goal) prompt += `\n- Active goal: ${goal}`;

    const prefs = profile?.preferences;
    if (prefs && typeof prefs === 'object' && Object.keys(prefs).length > 0) {
      prompt += `\n- Preferences: ${JSON.stringify(prefs)}`;
    }

    prompt += intentCtx;

    return prompt;
  }

  /**
   * Sanitize LLM response for SMS
   */
  function sanitizeResponse(text) {
    let cleaned = String(text || '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/`/g, '')
      .replace(/#{1,}/g, '')
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleaned.length > MAX_SMS_LEN) {
      const breakAt = cleaned.substring(0, MAX_SMS_LEN).lastIndexOf('. ');
      if (breakAt > 100) cleaned = cleaned.substring(0, breakAt + 1);
      else cleaned = cleaned.substring(0, MAX_SMS_LEN - 1).trim() + '…';
    }

    return cleaned;
  }

  /**
   * Generate a response given user context and new message
   */
  async function generateResponse({ context, userMessage, intent }) {
    const { userName, profile, recentMessages } = context;
    const systemPrompt = buildSystemPrompt({ userName, profile, intent: intent || 'chat' });

    // Build messages array: history + new message
    const messages = (recentMessages || []).map(m => ({
      role: m.direction === 'inbound' ? 'user' : 'assistant',
      content: m.content
    }));
    messages.push({ role: 'user', content: userMessage });

    // Security: block injection attempts
    const injectionCheck = detectInjectionAttempt(userMessage);
    if (injectionCheck.isInjection) {
      logger.warn('Injection blocked in text path', { userName, pattern: injectionCheck.pattern });
      return {
        response: sanitizeResponse("Hey, let's keep things on track! What can I help you with today?"),
        intent: intent || 'chat',
        blocked: true
      };
    }

    try {
      const result = await callLLM(systemPrompt, messages);
      const response = sanitizeResponse(result.text);
      return { response, intent: intent || 'chat' };
    } catch (err) {
      logger.error('Besh AI generation failed', { error: err.message, userName });
      return {
        response: sanitizeResponse("Hey, I hit a snag processing that. Mind sending it again?"),
        intent: intent || 'chat'
      };
    }
  }

  return {
    buildSystemPrompt,
    sanitizeResponse,
    generateResponse
  };
}

module.exports = { createBeshAI };
