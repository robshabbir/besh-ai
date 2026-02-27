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

  async function isUnsubscribed(phone) {
    const user = await getOrCreateUserByPhone(phone);
    return !!user.unsubscribed;
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

  async function updateUser(userId, updates) {
    const { data, error } = await getClient()
      .from('besh_users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  async function createReminder({ userId, goalId, text, scheduleJson, nextFireAt }) {
    const { data, error } = await getClient()
      .from('besh_reminders')
      .insert({
        user_id: userId,
        goal_id: goalId || null,
        text,
        schedule_json: scheduleJson || {},
        next_fire_at: nextFireAt ? nextFireAt.toISOString() : null,
        active: true
      })
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  async function getDueReminders(now) {
    const { data, error } = await getClient()
      .from('besh_reminders')
      .select('*, besh_users!inner(phone, display_name, timezone)')
      .eq('active', true)
      .lte('next_fire_at', (now || new Date()).toISOString())
      .order('next_fire_at', { ascending: true })
      .limit(50);

    if (error) throw error;
    return data || [];
  }

  async function advanceReminder(reminderId, nextFireAt) {
    const updates = nextFireAt
      ? { next_fire_at: nextFireAt.toISOString() }
      : { active: false };

    const { data, error } = await getClient()
      .from('besh_reminders')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', reminderId)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  async function getOnboardedUsersWithGoals() {
    // Get onboarded users
    const { data: users, error } = await getClient()
      .from('besh_users')
      .select('*')
      .eq('onboarding_complete', true)
      .limit(200);

    if (error) throw error;
    if (!users || users.length === 0) return [];

    // Get active goals for each user
    const userIds = users.map(u => u.id);
    const { data: goals, error: goalsErr } = await getClient()
      .from('besh_goals')
      .select('*')
      .in('user_id', userIds)
      .eq('status', 'active');

    if (goalsErr) throw goalsErr;

    // Attach goals to users
    const goalsByUser = {};
    for (const g of (goals || [])) {
      if (!goalsByUser[g.user_id]) goalsByUser[g.user_id] = [];
      goalsByUser[g.user_id].push(g);
    }

    return users.map(u => ({ ...u, goals: goalsByUser[u.id] || [] }));
  }

  async function hasCheckinToday(userId, type) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await getClient()
      .from('besh_conversations')
      .select('id')
      .eq('user_id', userId)
      .eq('direction', 'outbound')
      .gte('created_at', today.toISOString())
      .contains('meta_json', { type: 'checkin', checkinType: type })
      .limit(1);

    if (error) throw error;
    return data && data.length > 0;
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
    updateUser,
    getActiveGoals,
    createGoal,
    updateGoal,
    completeGoal,
    createReminder,
    getDueReminders,
    advanceReminder,
    getOnboardedUsersWithGoals,
    hasCheckinToday
  };
}

module.exports = { createBeshSmsStore };
