#!/usr/bin/env node

require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const db = require('./src/db');
const { migrate } = require('./src/db/migrate');
const logger = require('./src/utils/logger');

const session = require('express-session');

// Import routes
const voiceRoutes = require('./src/routes/voice');
const { router: voiceStreamRoutes, setupMediaStreamWebSocket } = require('./src/routes/voice-stream');
const adminRoutes = require('./src/routes/admin');
const apiRoutes = require('./src/routes/api');
const onboardRoutes = require('./src/routes/onboard');
const billingRoutes = require('./src/routes/billing');
const chatRoutes = require('./src/routes/chat');
const authRoutes = require('./src/routes/auth');
const dashboardRoutes = require('./src/routes/dashboard');
const dashboardApiRoutes = require('./src/routes/dashboard-api');
const passwordResetRoutes = require('./src/routes/password-reset');
const calendarRoutes = require('./src/routes/calendar');
const { setupConversationRelay } = require('./src/routes/conversation-relay');
const voiceWidgetRoutes = require('./src/routes/voice-widget');

const app = express();
const PORT = process.env.PORT || 3100;

// Trust proxy for Railway/Fly.io (needed for secure cookies + rate limiting)
app.set('trust proxy', 1);

// ============= STARTUP =============

logger.info('Starting Calva AI Receptionist Platform');

// Initialize database
db.init();
migrate().then(() => {
  logger.info('Database initialized (Supabase)');
}).catch(error => {
  logger.error('Database initialization failed', { error: error.message });
  process.exit(1);
});

// ============= MIDDLEWARE =============

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com", "https://cdn.tailwindcss.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net", "https://cdn.tailwindcss.com", "https://js.stripe.com", "https://elevenlabs.io"],
      fontSrc: ["'self'", "https://cdn.jsdelivr.net", "https://fonts.gstatic.com", "https://fonts.googleapis.com"],
      connectSrc: ["'self'", "https://api.stripe.com", "blob:", "https://api.elevenlabs.io", "wss://api.elevenlabs.io"],
      mediaSrc: ["'self'", "blob:", "data:"],
      frameSrc: ["'self'", "https://js.stripe.com"],
      imgSrc: ["'self'", "data:", "https:"],
    }
  }
}));

// CORS for API routes
app.use('/api', async (req, res, next) => {
  const allowedOrigins = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : [];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Compression
app.use(compression());

// Stripe webhook - needs raw body (must come before JSON parser)
app.use('/billing/webhook', express.raw({ type: 'application/json' }));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
const SESSION_SECRET = process.env.SESSION_SECRET || (process.env.NODE_ENV === 'production' ? undefined : 'calva-dev-secret-change-in-production');
if (!SESSION_SECRET) {
  logger.error('SESSION_SECRET environment variable is required in production');
  process.exit(1);
}
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Serve audio files (ElevenLabs TTS)
app.use('/audio', express.static(path.join(__dirname, 'public/audio')));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`
    });
  });
  next();
});

// ============= ROUTES =============

// Voice webhooks (Twilio)
app.use('/api', voiceRoutes);

// Media Streams voice (Twilio + Deepgram + ElevenLabs)
app.use('/api', voiceStreamRoutes);

// Admin dashboard
app.use('/admin', adminRoutes);

// REST API
app.use('/api', apiRoutes);

// Chat widget API
app.use('/api', chatRoutes);

// Voice widget API (browser talk-to-agent)
app.use('/api', voiceWidgetRoutes);

// Onboarding
app.use('/onboard', onboardRoutes);

// Password reset page (GET serves HTML, POST handled by passwordResetRoutes)
app.get('/auth/reset-password', async (req, res) => {
  if (req.query.token) return res.sendFile(path.join(__dirname, 'public/reset-password.html'));
  res.redirect('/forgot-password');
});

// Auth
app.use('/auth', authRoutes);
app.use('/auth', passwordResetRoutes);
app.use('/api/calendar', calendarRoutes);

// Session-based dashboard
app.use('/dashboard', dashboardRoutes);

// Dashboard API (analytics + settings)
app.use('/api/dashboard', dashboardApiRoutes);

// Billing (Stripe)
app.use('/billing', billingRoutes);

// Landing page
app.get('/', async (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Clean URL routes for static pages
app.get('/pricing', async (req, res) => {
  res.sendFile(path.join(__dirname, 'public/pricing.html'));
});
app.get('/login', async (req, res) => {
  res.sendFile(path.join(__dirname, 'public/login.html'));
});
app.get('/signup', async (req, res) => {
  res.sendFile(path.join(__dirname, 'public/login.html'));
});
app.get('/settings', async (req, res) => {
  res.sendFile(path.join(__dirname, 'public/settings.html'));
});
app.get('/forgot-password', async (req, res) => {
  res.sendFile(path.join(__dirname, 'public/forgot-password.html'));
});
app.get('/terms', async (req, res) => {
  res.sendFile(path.join(__dirname, 'public/terms.html'));
});
app.get('/privacy', async (req, res) => {
  res.sendFile(path.join(__dirname, 'public/privacy.html'));
});

// Health check
app.get('/health', async (req, res) => {
  const checks = { database: false, geminiKey: false, twilioKeys: false };
  let status = 'ok';

  // Database check
  try {
    const tenants = await db.getAllTenants();
    checks.database = true;
    checks.activeTenants = tenants.filter(t => t.active).length;
    checks.totalTenants = tenants.length;
  } catch (e) {
    status = 'degraded';
    checks.databaseError = e.message;
  }

  // API key presence checks
  checks.geminiKey = !!process.env.GEMINI_API_KEY;
  checks.twilioKeys = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
  checks.stripeConfigured = !(process.env.STRIPE_SECRET_KEY || '').includes('PLACEHOLDER');
  checks.smtpConfigured = !!process.env.SMTP_HOST;

  if (!checks.geminiKey || !checks.twilioKeys) status = 'degraded';

  res.status(status === 'ok' ? 200 : 503).json({
    status,
    service: 'calva-platform',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    checks
  });
});

// 404 handler
app.use((req, res) => {
  if (req.accepts('html')) {
    return res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
  }
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Error handler
app.use((error, req, res, next) => {
  logger.error('Unhandled error', {
    error: error.message,
    stack: error.stack,
    path: req.path
  });
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'An error occurred' 
      : error.message
  });
});

// ============= GRACEFUL SHUTDOWN =============

function shutdown() {
  logger.info('Shutting down gracefully...');
  
  server.close(() => {
    logger.info('HTTP server closed');
    db.close();
    logger.info('Database connection closed');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// ============= CLEANUP JOBS =============

// Clean up temp audio files every 2 minutes
const { cleanupTempFiles } = require('./src/services/elevenlabs-tts');
const tempAudioDir = path.join(__dirname, 'public/audio/temp');

setInterval(() => {
  cleanupTempFiles(tempAudioDir, 5 * 60 * 1000); // Delete files older than 5 minutes
}, 2 * 60 * 1000); // Run every 2 minutes

// ============= START SERVER =============

const server = app.listen(PORT, () => {
  logger.info(`🚀 Calva platform running on port ${PORT}`);
  logger.info(`📞 Voice webhook: http://localhost:${PORT}/api/voice`);
  logger.info(`🎙️  Media Streams webhook: http://localhost:${PORT}/api/voice-stream`);
  logger.info(`🗣️  ElevenLabs streaming TTS enabled (Sarah voice)`);
  logger.info(`📝 Deepgram real-time STT enabled`);
  logger.info(`🖥️  Landing page: http://localhost:${PORT}`);
  logger.info(`📊 Dashboard: http://localhost:${PORT}/admin/dashboard`);
  logger.info(`🎯 Onboarding: http://localhost:${PORT}/onboard`);
  logger.info(`\n💡 Expose with: ngrok http ${PORT}`);
  logger.info(`   or: tailscale serve https / http://localhost:${PORT}`);
});

// ============= WEBSOCKET SERVERS =============

const { WebSocketServer } = require('ws');

// Both WebSocket servers use noServer mode with manual upgrade routing
const wss = new WebSocketServer({ noServer: true });
const mediaStreamWss = new WebSocketServer({ noServer: true });

setupConversationRelay(wss);
logger.info(`🔌 ConversationRelay WebSocket ready on wss://<tunnel>/ws`);

// Route WebSocket upgrades by path
server.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  
  if (pathname === '/ws/media-stream') {
    mediaStreamWss.handleUpgrade(request, socket, head, (ws) => {
      mediaStreamWss.emit('connection', ws, request);
    });
  } else if (pathname === '/ws') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});
setupMediaStreamWebSocket(mediaStreamWss);
logger.info(`🎙️  Media Streams WebSocket ready on wss://<tunnel>/ws/media-stream`);

module.exports = app;
