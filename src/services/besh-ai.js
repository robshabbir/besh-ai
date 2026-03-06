/**
 * Besh AI Text Engine — Powers intelligent SMS/text conversations
 * OpenAI GPT-4o mini-powered with conversation memory, intent-aware prompting.
 */

const logger = require('../utils/logger');
const { formatExamplesForPrompt, formatToneRules } = require('../prompts/besh-personality');
const { detectInjectionAttempt } = require('./claude');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.LLM_MODEL || 'gpt-4o-mini';

/**
 * Call OpenAI API with retry and exponential backoff
 */
async function callOpenAI(systemPrompt, messages, retries = 3) {
  const url = 'https://api.openai.com/v1/chat/completions';
  
  const openAIMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content
    }))
  ];

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: MODEL,
          messages: openAIMessages,
          max_tokens: 50, // Keep responses short for cost savings
          temperature: 0.7
        })
      });

      // Rate limited - retry with backoff
      if (response.status === 429) {
        const waitTime = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        console.log(`[OpenAI] Rate limited, retrying in ${waitTime}ms...`);
        await new Promise(r => setTimeout(r, waitTime));
        continue;
      }

      if (!response.ok) {
        const errText = await response.text();
        // Server error - retry
        if (response.status >= 500) {
          const waitTime = Math.pow(2, attempt) * 1000;
          console.log(`[OpenAI] Server error ${response.status}, retrying in ${waitTime}ms...`);
          await new Promise(r => setTimeout(r, waitTime));
          continue;
        }
        throw new Error(`OpenAI API ${response.status}: ${errText}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || '';
      return { text };
      
    } catch (err) {
      if (attempt === retries - 1) throw err;
      const waitTime = Math.pow(2, attempt) * 1000;
      console.log(`[OpenAI] Error: ${err.message}, retrying in ${waitTime}ms...`);
      await new Promise(r => setTimeout(r, waitTime));
    }
  }
  
  throw new Error('OpenAI retries exhausted');
}

/**
 * Default LLM call - OpenAI only
 */
async function defaultLLM(systemPrompt, messages) {
  // OpenAI only - no Gemini fallback
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured');
  }
  
  return await callOpenAI(systemPrompt, messages);
}

const MAX_SMS_LEN = 320;

const INTENT_CONTEXT = {
  reminder: '\nThe user wants to set a reminder. Help them define what, when, and confirm it clearly. Keep it action-oriented.',
  goal: '\nThe user wants to set or update a goal. Help them articulate it specifically. Confirm what you understood.',
  checkin: '\nThe user wants a progress check-in. Reference their goals and recent activity. Be encouraging but honest.',
  chat: ''
};

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

  function buildSystemPrompt({ userName, profile, intent, goals }) {
    const name = userName || 'there';
    const goal = profile?.goal || null;
    const rawTz = profile?.timezone || 'UTC';
    let tz = 'UTC';
    try { new Date().toLocaleString('en-US', { timeZone: rawTz }); tz = rawTz; } catch (e) { tz = 'UTC'; }
    const intentCtx = INTENT_CONTEXT[intent] || '';

    const now = new Date();
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: tz });
    const dateStr = `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()} at ${timeStr}`;

    const ageGroup = profile?.age_group || 'young_adult';
    const commStyle = profile?.comm_style || 'normal';
    const ageTone = AGE_TONE_INSTRUCTIONS[ageGroup] || '';
    const commTone = COMM_STYLE_INSTRUCTIONS[commStyle] || '';

let prompt = `besh — ${name}'s friend who keeps it real.${ageTone}${commTone}

SHORT. lowercase. casual. 1-2 sentences. max 1 emoji.
NO: robots, markdown, lists, corporate speak.
YES: hype wins, call out slack, remember details, be direct.

User: ${name} | Time: ${timeStr} | Goal: ${goal || 'none'}`;

    if (goal) prompt += `\n- Active goal: ${goal}`;

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
    prompt += formatExamplesForPrompt(3); // Fewer examples = cheaper

    return prompt;
  }

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

  async function generateResponse({ context, userMessage, intent }) {
    const { userName, profile, recentMessages } = context;
    const systemPrompt = buildSystemPrompt({ userName, profile, intent: intent || 'chat', goals: context.goals || [] });

    const messages = (recentMessages || []).slice(-5).map(m => ({
      role: m.direction === 'inbound' ? 'user' : 'assistant',
      content: m.content
    }));
    messages.push({ role: 'user', content: userMessage });

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

// Pre-warm OpenAI connection on startup
let aiWarmed = false;
async function prewarmAI() {
  if (aiWarmed || !OPENAI_API_KEY) return;
  
  try {
    await callOpenAI('ping', [{ role: 'user', content: 'ping' }]);
    logger.info('OpenAI connection pre-warmed');
    aiWarmed = true;
  } catch (e) {
    logger.warn('OpenAI pre-warm failed', { error: e.message });
  }
}
prewarmAI();

module.exports = { createBeshAI };
