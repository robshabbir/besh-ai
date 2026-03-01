/**
 * Besh AI Text Engine — Powers intelligent SMS/text conversations
 * Gemini-powered with conversation memory, intent-aware prompting.
 */

const logger = require('../utils/logger');
const { formatExamplesForPrompt, formatToneRules } = require('../prompts/besh-personality');
const { detectInjectionAttempt } = require('./claude');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
const GEMINI_FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || 'gemini-1.5-flash-8b';

/**
 * Call Gemini API with specific model
 */
async function callGemini(model, systemPrompt, messages) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
  
  const geminiContents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  const response = await fetch(url, {
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

/**
 * Default LLM call via Gemini with automatic fallback
 * Tries primary model first, falls back to backup on failure
 */
async function defaultLLM(systemPrompt, messages) {
  try {
    // Try primary model first
    return await callGemini(GEMINI_MODEL, systemPrompt, messages);
  } catch (primaryError) {
    logger.warn('Primary Gemini model failed, trying fallback', { 
      model: GEMINI_MODEL, 
      error: primaryError.message 
    });
    
    try {
      // Fallback to secondary model
      return await callGemini(GEMINI_FALLBACK_MODEL, systemPrompt, messages);
    } catch (fallbackError) {
      logger.error('Both Gemini models failed', { 
        primary: GEMINI_MODEL, 
        fallback: GEMINI_FALLBACK_MODEL,
        primaryError: primaryError.message,
        fallbackError: fallbackError.message
      });
      throw new Error(`All models failed: ${primaryError.message}, then ${fallbackError.message}`);
    }
  }
}

const MAX_SMS_LEN = 320;

const INTENT_CONTEXT = {
  reminder: '\nThe user wants to set a reminder. Help them define what, when, and confirm it clearly. Keep it action-oriented.',
  goal: '\nThe user wants to set or update a goal. Help them articulate it specifically. Confirm what you understood.',
  checkin: '\nThe user wants a progress check-in. Reference their goals and recent activity. Be encouraging but honest.',
  chat: ''
};


// Age-aware tone instructions - dynamically loaded into prompts
const AGE_TONE_INSTRUCTIONS = {
  teen: "\n- you're talking to a teenager (13-19). keep messages SHORT (under 100 chars). use some emojis naturally. sound like a cool older cousin. be hyped, casual, fun. use current slang.",
  young_adult: "\n- you're talking to someone in their 20s. keep it casual and relatable. be supportive but not preachy. a bit of emoji is fine. be conversational.",
  adult: "\n- you're talking to someone in their 30s-40s. be respectful of their time. straightforward, warm, efficient. no excessive emojis. get to the point.",
  mature_adult: "\n- you're talking to someone 50+. be respectful, warm, professional but friendly. concise, never condescending. treat them as equals."
};

const COMM_STYLE_INSTRUCTIONS = {
  casual: "\n- text very casually. use contractions. be playful. relaxed energy.",
  normal: "\n- text normally. friendly but not overly casual. balanced.",
  formal: "\n- text politely and clearly. respectful tone. professional but warm."
};

function createBeshAI({ llm } = {}) {
  const callLLM = llm || defaultLLM;

  /**
   * Build system prompt with user context and intent
   */
  function buildSystemPrompt({ userName, profile, intent, goals }) {
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

    // Get age-aware instructions
    const ageGroup = profile?.age_group || 'young_adult';
    const commStyle = profile?.comm_style || 'normal';
    const ageTone = AGE_TONE_INSTRUCTIONS[ageGroup] || '';
    const commTone = COMM_STYLE_INSTRUCTIONS[commStyle] || '';

let prompt = `you are besh — a personal AI who texts with ${name}.
you text like a real friend. warm, lowercase. think: best friend who also keeps you on track.${ageTone}${commTone}

RULES:
- keep responses under 160 characters. shorter = better. one or two sentences max.
- no markdown, no bullet points. max 1 emoji per message. lowercase only.
- sound human. use contractions. be casual. never be preachy or lecture-y.
- Reference their goals and context naturally — don't repeat it back robotically.
- If they share progress, celebrate genuinely. If they're struggling, empathize then help.
- never say "as an AI" or "i'm here to help" or any corporate speak. you're a friend, not a service.
- don't ask more than one question per message.
- if they share a win, hype them up genuinely. if they're struggling, empathize first then suggest one thing.

CONTEXT:
- User: ${name}
- Timezone: ${tz}
- Current time: ${dateStr}`;

    if (goal) prompt += `\n- Active goal: ${goal}`;

    // Active goals
    if (goals && goals.length > 0) {
      prompt += '\n- Active goals:';
      goals.forEach(g => { prompt += `\n  • ${g.title}${g.cadence ? ' (' + g.cadence + ')' : ''}`; });
    }

    const prefs = profile?.preferences;
    if (prefs && typeof prefs === 'object' && Object.keys(prefs).length > 0) {
      prompt += `\n- Preferences: ${JSON.stringify(prefs)}`;
    }

    prompt += intentCtx;
    prompt += formatToneRules();
    prompt += formatExamplesForPrompt(6);

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
    const systemPrompt = buildSystemPrompt({ userName, profile, intent: intent || 'chat', goals: context.goals || [] });

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
