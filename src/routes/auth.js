const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const db = require('../db');
const logger = require('../utils/logger');
const { sendVerificationEmail, sendWelcomeEmail } = require('../services/email');
const { rateLimit } = require('../middleware/rateLimit');

const router = express.Router();

// Rate limiting on sensitive endpoints
router.use('/login', rateLimit(5, 60000));       // 5 attempts/min
router.use('/signup', rateLimit(3, 60000));       // 3 signups/min
router.use('/resend-verification', rateLimit(2, 60000)); // 2/min

const SALT_ROUNDS = 10;
const VERIFY_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

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
    const existing = await db.getUserByEmail(email.toLowerCase());
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create tenant placeholder (no phone, no template yet)
    const apiKey = 'besh_' + crypto.randomBytes(32).toString('hex');
    const tenantId = await db.createTenant(
      businessName,
      'pending', // industry set later during wizard
      null,
      { businessName, setupComplete: false },
      apiKey
    );

    // Create user
    const userId = await db.createUser(email.toLowerCase(), passwordHash, tenantId);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = Math.floor((Date.now() + VERIFY_EXPIRY_MS) / 1000);
    await db.setVerificationToken(userId, verificationToken, expiresAt);

    // Send verification email (async, don't block response)
    sendVerificationEmail(email.toLowerCase(), verificationToken).catch(err => {
      logger.error('Failed to send verification email', { email, error: err.message });
    });

    // Set session
    req.session.userId = userId;
    req.session.tenantId = tenantId;

    logger.info('User signed up', { userId, tenantId, email });

    res.json({
      success: true,
      user: { id: userId, email: email.toLowerCase(), tenantId, emailVerified: false },
      apiKey,
      tenantId,
      requiresVerification: true
    });
  } catch (error) {
    logger.error('Signup failed', { error: error.message });
    res.status(500).json({ error: 'Signup failed' });
  }
});

/**
 * GET /auth/verify?token=xxx
 * Verify email address
 */
router.get('/verify', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).send(verifyResultPage(false, 'Missing verification token.'));
    }

    const user = await db.getUserByVerificationToken(token);
    if (!user) {
      return res.status(400).send(verifyResultPage(false, 'Invalid or expired verification link.'));
    }

    // Check expiry
    const now = Math.floor(Date.now() / 1000);
    if (user.verification_expires && user.verification_expires < now) {
      return res.status(400).send(verifyResultPage(false, 'This verification link has expired. Please request a new one.'));
    }

    // Mark verified
    await db.markEmailVerified(user.id);
    logger.info('Email verified', { userId: user.id, email: user.email });

    // Send welcome email
    const tenant = user.tenant_id ? await db.getTenantById(user.tenant_id) : null;
    sendWelcomeEmail(user.email, tenant?.name || 'your business').catch(() => {});

    return res.send(verifyResultPage(true, 'Your email has been verified! Redirecting to dashboard...'));
  } catch (error) {
    logger.error('Email verification failed', { error: error.message });
    return res.status(500).send(verifyResultPage(false, 'Verification failed. Please try again.'));
  }
});

/**
 * POST /auth/resend-verification
 * Resend verification email
 */
router.post('/resend-verification', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await db.getUserById(req.session.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.email_verified) return res.json({ success: true, message: 'Email already verified' });

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = Math.floor((Date.now() + VERIFY_EXPIRY_MS) / 1000);
    await db.setVerificationToken(user.id, verificationToken, expiresAt);

    await sendVerificationEmail(user.email, verificationToken);
    res.json({ success: true, message: 'Verification email sent' });
  } catch (error) {
    logger.error('Resend verification failed', { error: error.message });
    res.status(500).json({ error: 'Failed to resend verification email' });
  }
});

function verifyResultPage(success, message) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Email Verification - Besh</title>
<script src="https://cdn.tailwindcss.com"></script>
${success ? '<meta http-equiv="refresh" content="3;url=/dashboard">' : ''}
</head><body class="bg-gray-50 min-h-screen flex items-center justify-center">
<div class="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
  <div class="text-5xl mb-4">${success ? '✅' : '❌'}</div>
  <h1 class="text-2xl font-bold mb-2">${success ? 'Email Verified!' : 'Verification Failed'}</h1>
  <p class="text-gray-600 mb-6">${message}</p>
  <a href="${success ? '/dashboard' : '/signup'}" class="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700">
    ${success ? 'Go to Dashboard' : 'Try Again'}
  </a>
</div></body></html>`;
}

/**
 * POST /auth/login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await db.getUserByEmail(email.toLowerCase());
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
router.post('/logout', async (req, res) => {
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
router.get('/me', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const user = await db.getUserById(req.session.userId);
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  const tenant = user.tenant_id ? await db.getTenantById(user.tenant_id) : null;

  res.json({
    user: { id: user.id, email: user.email, tenantId: user.tenant_id, emailVerified: !!user.email_verified },
    tenant: tenant ? { id: tenant.id, name: tenant.name, industry: tenant.industry, phoneNumber: tenant.phone_number, apiKey: tenant.api_key } : null
  });
});

module.exports = router;
