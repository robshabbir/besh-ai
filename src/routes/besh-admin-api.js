/**
 * Besh Admin API — View text users, conversations, goals, reminders
 * Protected by session auth (same as existing dashboard)
 */

const express = require('express');
const db = require('../db');
const logger = require('../utils/logger');

function createBeshAdminRouter() {
  const router = express.Router();
  const getClient = () => db.getDb();

  // Auth middleware — reuse existing session auth
  router.use((req, res, next) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  });

  // GET /api/besh/admin/users — list all text users
  router.get('/users', async (req, res) => {
    try {
      const { data, error } = await getClient()
        .from('besh_users')
        .select('id, phone, display_name, onboarding_complete, profile_json, created_at')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      res.json({ users: data || [], count: (data || []).length });
    } catch (err) {
      logger.error('Besh admin users error', { error: err.message });
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  // GET /api/besh/admin/users/:id — user detail with goals + recent conversations
  router.get('/users/:id', async (req, res) => {
    try {
      const userId = req.params.id;

      const [userRes, goalsRes, convRes] = await Promise.all([
        getClient().from('besh_users').select('*').eq('id', userId).single(),
        getClient().from('besh_goals').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        getClient().from('besh_conversations').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50)
      ]);

      if (userRes.error) throw userRes.error;

      res.json({
        user: userRes.data,
        goals: goalsRes.data || [],
        conversations: (convRes.data || []).reverse(),
        reminders: [] // TODO: add when needed
      });
    } catch (err) {
      logger.error('Besh admin user detail error', { error: err.message });
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  });

  // GET /api/besh/admin/stats — overview stats
  router.get('/stats', async (req, res) => {
    try {
      const [usersRes, onboardedRes, goalsRes, convRes, remindersRes] = await Promise.all([
        getClient().from('besh_users').select('id', { count: 'exact', head: true }),
        getClient().from('besh_users').select('id', { count: 'exact', head: true }).eq('onboarding_complete', true),
        getClient().from('besh_goals').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        getClient().from('besh_conversations').select('id', { count: 'exact', head: true }),
        getClient().from('besh_reminders').select('id', { count: 'exact', head: true }).eq('active', true)
      ]);

      res.json({
        totalUsers: usersRes.count || 0,
        onboardedUsers: onboardedRes.count || 0,
        activeGoals: goalsRes.count || 0,
        totalMessages: convRes.count || 0,
        activeReminders: remindersRes.count || 0,
        onboardingRate: usersRes.count > 0
          ? Math.round((onboardedRes.count / usersRes.count) * 100)
          : 0
      });
    } catch (err) {
      logger.error('Besh admin stats error', { error: err.message });
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  });

  return router;
}

module.exports = { createBeshAdminRouter };
