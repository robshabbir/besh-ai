/**
 * Besh Conversation Insights Service
 * Logs intent, sentiment, and metrics for analytics
 */

const { createClient } = require('@supabase/supabase-js');

// Lazy initialization to avoid issues during testing
let supabase = null;

function getSupabase() {
  if (!supabase) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
    console.log('[insights] init:', { hasUrl: !!supabaseUrl, hasKey: !!supabaseKey });
    if (supabaseUrl && supabaseKey) {
      supabase = createClient(supabaseUrl, supabaseKey);
    } else {
      console.log('[insights] Missing config - URL:', !!supabaseUrl, 'Key:', !!supabaseKey);
    }
  }
  return supabase;
}

/**
 * Log conversation insight
 * @param {object} params
 * @param {string} params.userId - User UUID
 * @param {string} params.conversationId - Conversation UUID  
 * @param {object} params.intent - Intent detection result
 * @param {object} params.sentiment - Sentiment detection result
 * @param {object} params.routing - Routing result
 * @param {object} params.metadata - Additional metadata
 */
async function logInsight({ userId, conversationId, intent, sentiment, routing, metadata = {} }) {
  const sb = getSupabase();
  if (!sb) {
    console.log('[insights] Supabase not configured, skipping log');
    return null;
  }

  try {
    const now = new Date();
    const hour = now.getHours();
    let timeOfDay = 'night';
    if (hour >= 5 && hour < 12) timeOfDay = 'morning';
    else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
    else if (hour >= 17 && hour < 21) timeOfDay = 'evening';

    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'short' });

    const { data, error } = await sb.from('besh_conversation_insights').insert({
      user_id: userId,
      conversation_id: conversationId,
      intent: intent?.intent || 'unknown',
      intent_confidence: intent?.confidence || 0,
      sentiment: sentiment?.sentiment || 'neutral',
      sentiment_score: sentiment?.score || 0,
      route: routing?.route || 'llm',
      handler: routing?.handler || 'default',
      message_length: metadata.messageLength || 0,
      response_time_ms: metadata.responseTimeMs || 0,
      llm_tokens_used: metadata.tokensUsed || 0,
      goals_active_at_time: metadata.activeGoals || 0,
      time_of_day: timeOfDay,
      day_of_week: dayOfWeek
    });

    if (error) {
      console.error('[insights] Failed to log:', error);
      return null;
    }
    return data;
  } catch (err) {
    console.error('[insights] Error:', err.message);
    return null;
  }
}

/**
 * Get insights summary for a user
 */
async function getUserInsights(userId, days = 7) {
  const sb = getSupabase();
  if (!sb) return null;

  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await sb
    .from('besh_conversation_insights')
    .select('intent, sentiment, route, created_at')
    .eq('user_id', userId)
    .gte('created_at', since.toISOString());

  if (error) {
    console.error('[insights] Failed to get user insights:', error);
    return null;
  }

  // Aggregate
  const summary = {
    totalMessages: data.length,
    intents: {},
    sentiments: { positive: 0, negative: 0, neutral: 0 },
    llmCalls: 0,
    ruleCalls: 0
  };

  data.forEach(row => {
    summary.intents[row.intent] = (summary.intents[row.intent] || 0) + 1;
    if (row.sentiment) summary.sentiments[row.sentiment]++;
    if (row.route === 'llm') summary.llmCalls++;
    else summary.ruleCalls++;
  });

  return summary;
}

module.exports = {
  logInsight,
  getUserInsights
};
