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

  return {
    getOrCreateUserByPhone,
    getOnboardingState,
    saveOnboardingStep,
    appendConversation
  };
}

module.exports = {
  createBeshSmsStore
};