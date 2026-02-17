const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const db = require('../db');
const logger = require('../utils/logger');

const router = express.Router();

const SALT_ROUNDS = 10;

/**
 * POST /auth/signup
 */
router.post('/signup', async (req, res) => {
  try {
    const { email, password, businessName } = req.body;

    if (!email || !password || !businessName) {
      return res.status(400).json({ error: 'Email, password, and businessName are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    const existing = db.getUserByEmail(email.toLowerCase());
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create tenant placeholder (no phone, no template yet)
    const apiKey = 'calva_' + crypto.randomBytes(32).toString('hex');
    const tenantId = db.createTenant(
      businessName,
      'pending', // industry set later during wizard
      null,
      { businessName, setupComplete: false },
      apiKey
    );

    // Create user
    const userId = db.createUser(email.toLowerCase(), passwordHash, tenantId);

    // Set session
    req.session.userId = userId;
    req.session.tenantId = tenantId;

    logger.info('User signed up', { userId, tenantId, email });

    res.json({
      success: true,
      user: { id: userId, email: email.toLowerCase(), tenantId },
      apiKey,
      tenantId
    });
  } catch (error) {
    logger.error('Signup failed', { error: error.message });
    res.status(500).json({ error: 'Signup failed' });
  }
});

/**
 * POST /auth/login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = db.getUserByEmail(email.toLowerCase());
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    req.session.userId = user.id;
    req.session.tenantId = user.tenant_id;

    logger.info('User logged in', { userId: user.id, email });

    res.json({
      success: true,
      user: { id: user.id, email: user.email, tenantId: user.tenant_id }
    });
  } catch (error) {
    logger.error('Login failed', { error: error.message });
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * POST /auth/logout
 */
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ success: true });
  });
});

/**
 * GET /auth/me
 */
router.get('/me', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const user = db.getUserById(req.session.userId);
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  const tenant = user.tenant_id ? db.getTenantById(user.tenant_id) : null;

  res.json({
    user: { id: user.id, email: user.email, tenantId: user.tenant_id },
    tenant: tenant ? { id: tenant.id, name: tenant.name, industry: tenant.industry, phoneNumber: tenant.phone_number, apiKey: tenant.api_key } : null
  });
});

module.exports = router;
