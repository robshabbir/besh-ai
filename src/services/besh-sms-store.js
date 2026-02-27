const db = require('../db');
const { normalizePhone } = require('./besh-sms');

function createBeshSmsStore(client = null) {
  const getClient = () => client || db.getDb();

  async function getOrCreateUserByPhone(phone) {
    const normalized = normalizePhone(phone);
    const { data, error } = await getClient()
      .from('besh_users')
      .select('*')
      .eq('phone', normalized)
      .single();

    if (!error && data) return data;
    if (error && error.code !== 'PGRST116') throw error;

    const created = await getClient()
      .from('besh_users')
      .insert({ phone: normalized, onboarding_stage: 'ask_name', profile_json: {} })
      .select('*')
      .single();

    if (created.error) throw created.error;
    return created.data;
  }

  async function getOnboardingState(phone) {
    const user = await getOrCreateUserByPhone(phone);
    return {
      user,
      stage: user.onboarding_stage || 'ask_name',
      profile: user.profile_json || {}
    };
  }

  async function saveOnboardingStep({ userId, phone, state, done }) {
    const normalized = normalizePhone(phone);
    const payload = {
      phone: normalized,
      onboarding_stage: state.stage,
      onboarding_complete: !!done,
      profile_json: state.profile || {},
      display_name: (state.profile && state.profile.name) || undefined,
      updated_at: new Date().toISOString()
    };
    if (userId) payload.id = userId;

    const result = await getClient()
      .from('besh_users')
      .upsert(payload, { onConflict: 'phone' })
      .select('*')
      .single();

    if (result.error) throw result.error;
    return result.data;
  }

  async function findConversationByMessageSid(messageSid) {
    if (!messageSid) return null;

    const result = await getClient()
      .from('besh_conversations')
      .select('id, user_id, direction, content, meta_json')
      .eq('direction', 'inbound')
      .contains('meta_json', { messageSid })
      .limit(1)
      .maybeSingle();

    if (result.error) throw result.error;
    return result.data || null;
  }

  async function appendConversation({ userId, direction, content, meta = {} }) {
    const result = await getClient()
      .from('besh_conversations')
      .insert({
        user_id: userId,
        direction,
        channel: 'sms',
        content,
        meta_json: meta
      })
      .select('id')
      .single();

    if (result.error) throw result.error;
    return result.data.id;
  }

  async function getConversationHistory(userId, limit = 10) {
    const { data, error } = await getClient()
      .from('besh_conversations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).reverse();
  }

  async function getUser(userId) {
    const { data, error } = await getClient()
      .from('besh_users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }

  async function getActiveGoals(userId) {
    const { data, error } = await getClient()
      .from('besh_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async function createGoal({ userId, title, cadence }) {
    const { data, error } = await getClient()
      .from('besh_goals')
      .insert({
        user_id: userId,
        title,
        cadence: cadence || null,
        status: 'active'
      })
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  async function updateGoal(goalId, updates) {
    const { data, error } = await getClient()
      .from('besh_goals')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', goalId)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  async function completeGoal(goalId) {
    return updateGoal(goalId, { status: 'done' });
  }

  return {
    getOrCreateUserByPhone,
    getOnboardingState,
    saveOnboardingStep,
    findConversationByMessageSid,
    appendConversation,
    getConversationHistory,
    getUser,
    getActiveGoals,
    createGoal,
    updateGoal,
    completeGoal
  };
}

module.exports = { createBeshSmsStore };
