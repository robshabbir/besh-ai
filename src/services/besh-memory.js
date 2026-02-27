/**
 * Besh Memory Service — Customer conversation memory & context
 * Builds rich context for AI text conversations from conversation history,
 * user profile, goals, and preferences.
 */

const INTENT_PATTERNS = [
  { regex: /\bremind(er)?\s+(me|to)\b/i, intent: 'reminder' },
  { regex: /\bset\s+(a\s+)?goal\b/i, intent: 'goal' },
  { regex: /\bmy\s+(new\s+)?goal\b/i, intent: 'goal' },
  { regex: /\b(check\s*in|how\s+am\s+i|my\s+progress|status\s+update)\b/i, intent: 'checkin' },
  { regex: /\bi want to\b/i, intent: 'goal' },
  { regex: /\bhow('?s|'?m)\s+(it|i)\s+(going|doing)\b/i, intent: 'checkin' },
];

const GOAL_PATTERNS = [
  { regex: /set a goal to (.+)/i, group: 1 },
  { regex: /my goal is to (.+)/i, group: 1 },
  { regex: /new goal:\s*(.+)/i, group: 1 },
  { regex: /i want to (.+)/i, group: 1 },
  { regex: /goal:\s*(.+)/i, group: 1 },
];

function createBeshMemory({ store, contextWindow = 10 } = {}) {
  if (!store) throw new Error('store is required');

  /**
   * Build full context for a user — profile + recent messages
   */
  async function buildContext(userId) {
    const [user, messages, goals] = await Promise.all([
      store.getUser(userId),
      store.getConversationHistory(userId, contextWindow),
      store.getActiveGoals ? store.getActiveGoals(userId) : Promise.resolve([])
    ]);

    const profile = (user && user.profile_json) || {};
    const userName = (user && user.display_name) || profile.name || 'there';

    return {
      userId,
      userName,
      profile,
      recentMessages: messages || [],
      goals: goals || [],
      onboardingComplete: !!(user && user.onboarding_complete)
    };
  }

  /**
   * Format conversation history as LLM messages array
   * inbound → user, outbound → assistant
   */
  async function formatForLLM(userId) {
    const ctx = await buildContext(userId);
    return ctx.recentMessages.map(m => ({
      role: m.direction === 'inbound' ? 'user' : 'assistant',
      content: m.content
    }));
  }

  /**
   * Detect intent from user text message
   */
  function detectIntent(text) {
    const lower = (text || '').toLowerCase();
    for (const { regex, intent } of INTENT_PATTERNS) {
      if (regex.test(lower)) return intent;
    }
    return 'chat';
  }

  function extractGoalText(text) {
    for (const { regex, group } of GOAL_PATTERNS) {
      const m = text.match(regex);
      if (m && m[group]) return m[group].trim().replace(/[.!?]+$/, '');
    }
    return text.trim();
  }

  return {
    buildContext,
    formatForLLM,
    detectIntent,
    extractGoalText
  };
}

module.exports = { createBeshMemory };
