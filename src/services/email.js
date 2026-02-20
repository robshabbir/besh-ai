/**
 * Email Service — sends transactional emails (verification, welcome, etc.)
 * Uses nodemailer with configurable transport.
 * Falls back to console logging if no SMTP configured.
 */
const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// Configure transport
let transporter;

if (process.env.SMTP_HOST) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
} else {
  // Dev mode: log emails to console
  transporter = null;
}

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@calva.ai';
const APP_URL = process.env.APP_URL || 'http://localhost:3100';

/**
 * Send verification email with token link
 */
async function sendVerificationEmail(email, token) {
  const verifyUrl = `${APP_URL}/auth/verify?token=${token}`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; background: #4f46e5; border-radius: 16px;">
          <span style="color: white; font-size: 24px;">📞</span>
        </div>
      </div>
      <h1 style="font-size: 24px; font-weight: 700; text-align: center; margin-bottom: 16px; color: #111827;">Verify your email</h1>
      <p style="color: #6b7280; text-align: center; margin-bottom: 32px;">Click the button below to verify your email and activate your Calva AI Receptionist.</p>
      <div style="text-align: center; margin-bottom: 32px;">
        <a href="${verifyUrl}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Verify Email</a>
      </div>
      <p style="color: #9ca3af; font-size: 13px; text-align: center;">Or copy this link: <a href="${verifyUrl}" style="color: #4f46e5;">${verifyUrl}</a></p>
      <p style="color: #d1d5db; font-size: 12px; text-align: center; margin-top: 40px;">This link expires in 24 hours.</p>
    </div>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"Calva AI" <${FROM_EMAIL}>`,
        to: email,
        subject: 'Verify your Calva account',
        html,
      });
      logger.info('Verification email sent', { email });
    } catch (err) {
      logger.error('Failed to send verification email', { email, error: err.message });
      throw err;
    }
  } else {
    // Dev mode — log to console
    logger.info('📧 VERIFICATION EMAIL (dev mode)', { email, verifyUrl });
    console.log(`\n📧 Verify email for ${email}: ${verifyUrl}\n`);
  }
}

/**
 * Send welcome email after verification
 */
async function sendWelcomeEmail(email, businessName) {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
      <h1 style="font-size: 24px; font-weight: 700; text-align: center; color: #111827;">Welcome to Calva! 🎉</h1>
      <p style="color: #6b7280; text-align: center; margin: 16px 0;">Your AI receptionist for <strong>${businessName}</strong> is almost ready.</p>
      <p style="color: #6b7280; text-align: center;">Complete your setup in the dashboard to start taking calls.</p>
      <div style="text-align: center; margin-top: 32px;">
        <a href="${APP_URL}/dashboard" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">Go to Dashboard</a>
      </div>
    </div>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"Calva AI" <${FROM_EMAIL}>`,
        to: email,
        subject: `Welcome to Calva, ${businessName}!`,
        html,
      });
      logger.info('Welcome email sent', { email });
    } catch (err) {
      logger.error('Failed to send welcome email', { email, error: err.message });
    }
  } else {
    logger.info('📧 WELCOME EMAIL (dev mode)', { email, businessName });
  }
}

/**
 * Send password reset email
 */
async function sendPasswordResetEmail(email, token) {
  const resetUrl = `${APP_URL}/auth/reset-password?token=${token}`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; background: #4f46e5; border-radius: 16px;">
          <span style="color: white; font-size: 24px;">🔒</span>
        </div>
      </div>
      <h1 style="font-size: 24px; font-weight: 700; text-align: center; margin-bottom: 16px; color: #111827;">Reset your password</h1>
      <p style="color: #6b7280; text-align: center; margin-bottom: 32px;">Click the button below to reset your Calva account password. This link expires in 1 hour.</p>
      <div style="text-align: center; margin-bottom: 32px;">
        <a href="${resetUrl}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Reset Password</a>
      </div>
      <p style="color: #9ca3af; font-size: 13px; text-align: center;">If you didn't request this, you can safely ignore this email.</p>
      <p style="color: #d1d5db; font-size: 12px; text-align: center; margin-top: 40px;">This link expires in 1 hour.</p>
    </div>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"Calva AI" <${FROM_EMAIL}>`,
        to: email,
        subject: 'Reset your Calva password',
        html,
      });
      logger.info('Password reset email sent', { email });
    } catch (err) {
      logger.error('Failed to send password reset email', { email, error: err.message });
      throw err;
    }
  } else {
    logger.info('📧 PASSWORD RESET EMAIL (dev mode)', { email, resetUrl });
    console.log(`\n📧 Reset password for ${email}: ${resetUrl}\n`);
  }
}

/**
 * Generic send email — used by integrations for call summaries, etc.
 */
async function sendEmail({ to, subject, html, text }) {
  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"Calva AI" <${FROM_EMAIL}>`,
        to,
        subject,
        html,
        text,
      });
      logger.info('Email sent', { to, subject });
    } catch (err) {
      logger.error('Failed to send email', { to, subject, error: err.message });
      throw err;
    }
  } else {
    logger.info(`📧 EMAIL (dev mode) To: ${to} Subject: ${subject}`);
  }
}

module.exports = { sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail, sendEmail };
