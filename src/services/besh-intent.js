/**
 * Besh Intent Detection Service
 * Cheap, fast intent classification without LLM
 */

const INTENT_PATTERNS = {
  // Goal-related - order matters! more specific first
  goal_complete: /\b(done|finished|completed|accomplished|crushed|hit (the )?goal|did it|im done|im finished|i finished|i just did|just finished|just completed)\b/i,
  goal_setting: /^(set|create|start|make|i'?ll|want to|wanna|i'?m going to|i will|my goal|i want to|i gonna|i want|going to start|decided to|i decided)/i,
  goal_progress: /\b(progress|how am i doing|how'?s my|how are my|update|check.?in|tracking|streak|days? (in|of)?|consecutive|how.?s it going|how.?s that going)\b/i,
  goal_missed: /\b(missed|skipped|didn'?t do|did not|forgot|slacked|failed|fell behind|didn.?t get to|didn.?t have time)\b/i,
  
  // Reminder-related
  reminder_set: /(remind|reminder|notify|alert| remind me|set a)/i,
  reminder_cancel: /(stop|cancel|delete|remove|don'?t remind|no longer)/i,
  
  // Venting/emotional
  venting: /(ugh|frustrat|annoy|stress|angry|mad|upset|worried|anxious|overwhelm|shit|damn|hate)/i,
  celebrating: /(won|hired|promoted|finished|completed|excited|happy|love|amazing|awesome|great news|yay|celebrat)/i,
  
  // Questions
  question: /\?$/,
  how_are_you: /(how are you|how do|what are you|who are you|tell me about)/i,
  
  // Casual
  greeting: /^(hi|hey|hello|yo|sup|what'?s up|howdy|hey besh|hi besh)/i,
  goodbye: /(bye|see you|later|gotta go|have to go|brb)/i,
  thanks: /(thanks|thank you|thx|ty|appreciate|grateful)/i,
  
  // Off-topic
  off_topic: /(weather|news|stock|bitcoin|sports|score|game|movie|recipe|random|what'?s the| tell me about)/i,
  
  // Help
  help: /(help|what can|what do|how do i|what should|commands?|menu|options)/i,
  
  // Encouragement
  encouraging: /(you got this|keep going|don'?t give up|stay focused|stay strong|keep pushing|you can do it|believe)/i,
  
  // Random casual
  ok: /^ok$|^okay$|^alright$|^sure$|^yeah$/i,
  hbu: /(how about you|and you|you doing|what about you)/i,
};

const SENTIMENT_KEYWORDS = {
  positive: /(\b(great|amazing|awesome|excellent|love|happy|excited|proud|yay|won|hired|promoted|finished|crushed|perfect|fantastic|wonderful|good|best|win|hype)\b)/gi,
  negative: /(shit|damn|hell|ugh|hate|terrible|awful|worst|failed|missed|skipped|stress|anxious|worried|frustrat|annoy|upset|sad|down|lonely|tired|exhausted|overwhelm)/gi,
  neutral: /\b(ok|okay|alright|sure|maybe|probably|i think|just)/i,
};

/**
 * Detect intent from user message
 * @param {string} text - User message
 * @param {object} userContext - User's goals, profile info
 * @returns {object} - { intent, confidence, details }
 */
function detectIntent(text, userContext = {})
 {
  if (!text) return { intent: 'unknown', confidence: 0, details: {} };
  
  const lower = text.toLowerCase().trim();
  
  // Check patterns in order of priority
  for (const [intent, pattern] of Object.entries(INTENT_PATTERNS)) {
    if (pattern.test(lower)) {
      return {
        intent,
        confidence: 0.8,
        details: { matched: pattern.source }
      };
    }
  }
  
  // Check if they're responding to a question from Besh
  if (userContext.pendingQuestion) {
    // Check for goal time response
    if (userContext.pendingQuestion.includes('time')) {
      const timeMatch = lower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
      if (timeMatch || lower.match(/morning|afternoon|evening|noon|night/)) {
        return { intent: 'goal_time', confidence: 0.9, details: { response: lower } };
      }
    }
    // Check for yes/no
    if (lower.match(/^(yes|yeah|yep|sure|ok|okay|definitely|absolutely|no|nah|nope)/)) {
      return { intent: 'confirmation', confidence: 0.9, details: { response: lower, question: userContext.pendingQuestion } };
    }
  }
  
  // Check for age in onboarding
  if (userContext.onboardingStage === 'ask_age') {
    const ageMatch = lower.match(/(\d{1,2})/);
    if (ageMatch) {
      return { intent: 'onboarding_age', confidence: 0.95, details: { age: ageMatch[1] } };
    }
  }
  
  // Default to casual conversation
  return { intent: 'casual', confidence: 0.5, details: {} };
}

/**
 * Detect sentiment from message
 * @param {string} text - User message
 * @returns {object} - { sentiment, score }
 */
function detectSentiment(text) {
  if (!text) return { sentiment: 'neutral', score: 0 };
  
  const lower = text.toLowerCase();
  
  const positiveCount = (lower.match(SENTIMENT_KEYWORDS.positive) || []).length;
  const negativeCount = (lower.match(SENTIMENT_KEYWORDS.negative) || []).length;
  
  if (positiveCount > negativeCount) {
    return { sentiment: 'positive', score: Math.min(positiveCount / 3, 1) };
  } else if (negativeCount > positiveCount) {
    return { sentiment: 'negative', score: Math.min(negativeCount / 3, 1) };
  }
  
  return { sentiment: 'neutral', score: 0.5 };
}

/**
 * Route message based on intent
 * Returns whether to use LLM or handle with rules
 * @param {object} intentResult - Result from detectIntent
 * @returns {object} - { route: 'llm' | 'rule', handler: string }
 */
function routeMessage(intentResult) {
  const { intent } = intentResult;
  
  // Route to LLM for complex conversations
  if (['venting', 'question', 'how_are_you', 'goal_progress'].includes(intent)) {
    return { route: 'llm', handler: 'conversation' };
  }
  
  // Route to rule-based handlers for simple intents
  if (['goal_setting', 'goal_complete', 'goal_missed', 'reminder_set', 'reminder_cancel', 'greeting', 'thanks', 'goodbye', 'confirmation', 'off_topic', 'help', 'question', 'goal_progress', 'encouraging', 'ok', 'hbu', 'celebrating'].includes(intent)) {
    return { route: 'rule', handler: intent };
  }
  
  // Check for onboarding
  if (intent.startsWith('onboarding_')) {
    return { route: 'rule', handler: intent };
  }
  
  // Default to LLM for natural conversation
  return { route: 'llm', handler: 'casual' };
}

module.exports = {
  detectIntent,
  detectSentiment,
  routeMessage,
  INTENT_PATTERNS,
  SENTIMENT_KEYWORDS
};
