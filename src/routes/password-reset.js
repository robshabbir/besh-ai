const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const db = require('../db');
const logger = require('../utils/logger');
const { sendPasswordResetEmail } = require('../services/email');
const { rateLimit } = require('../middleware/rateLimit');

const router = express.Router();
const SALT_ROUNDS = 10;
const RESET_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

// Strict rate limiting on password reset
router.use(rateLimit(3, 60000)); // 3 per minute

/**
 * POST /auth/forgot-password
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Always return success to prevent email enumeration
    const successResponse = { success: true, message: 'If an account exists with that email, a reset link has been sent.' };

    const user = await db.getUserByEmail(email.toLowerCase());
    if (!user) {
      return res.json(successResponse);
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = Math.floor((Date.now() + RESET_EXPIRY_MS) / 1000);
    await db.setResetToken(user.id, resetToken, expiresAt);

    sendPasswordResetEmail(email.toLowerCase(), resetToken).catch(err => {
      logger.error('Failed to send reset email', { email, error: err.message });
    });

    logger.info('Password reset requested', { email });
    res.json(successResponse);
  } catch (error) {
    logger.error('Forgot password error', { error: error.message });
    res.status(500).json({ error: 'An error occurred' });
  }
});

/**
 * POST /auth/reset-password
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const user = await db.getUserByResetToken(token);
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset link' });
    }

    const now = Math.floor(Date.now() / 1000);
    if (user.reset_token_expires && user.reset_token_expires < now) {
      return res.status(400).json({ error: 'Reset link has expired. Please request a new one.' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    await db.updateUserPassword(user.id, passwordHash);
    await db.clearResetToken(user.id);

    logger.info('Password reset completed', { userId: user.id });
    res.json({ success: true, message: 'Password has been reset. You can now log in.' });
  } catch (error) {
    logger.error('Reset password error', { error: error.message });
    res.status(500).json({ error: 'An error occurred' });
  }
});

module.exports = router;
