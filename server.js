#!/usr/bin/env node

require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const db = require('./src/db');
const { migrate } = require('./src/db/migrate');
const logger = require('./src/utils/logger');

// Import routes
const voiceRoutes = require('./src/routes/voice');
const { router: voiceStreamRoutes, setupMediaStreamWebSocket } = require('./src/routes/voice-stream');
const adminRoutes = require('./src/routes/admin');
const apiRoutes = require('./src/routes/api');
const onboardRoutes = require('./src/routes/onboard');
const billingRoutes = require('./src/routes/billing');
const chatRoutes = require('./src/routes/chat');
const { setupConversationRelay } = require('./src/routes/conversation-relay');

const app = express();
const PORT = process.env.PORT || 3000;

// ============= STARTUP =============

logger.info('Starting Calva AI Receptionist Platform');

// Initialize database
try {
  db.init();
  migrate();
  logger.info('Database initialized');
} catch (error) {
  logger.error('Database initialization failed', { error: error.message });
  process.exit(1);
}

// ============= MIDDLEWARE =============

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com", "https://cdn.tailwindcss.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net", "https://cdn.tailwindcss.com", "https://js.stripe.com"],
      fontSrc: ["'self'", "https://cdn.jsdelivr.net", "https://fonts.gstatic.com", "https://fonts.googleapis.com"],
      connectSrc: ["'self'", "https://api.stripe.com"],
      frameSrc: ["'self'", "https://js.stripe.com"],
      imgSrc: ["'self'", "data:", "https:"],
    }
  }
}));

// Compression
app.use(compression());

// Stripe webhook - needs raw body (must come before JSON parser)
app.use('/billing/webhook', express.raw({ type: 'application/json' }));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Onboarding
app.use('/onboard', onboardRoutes);

// Billing (Stripe)
app.use('/billing', billingRoutes);

// Landing page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Health check
app.get('/health', (req, res) => {
  const tenants = db.getAllTenants();
  res.json({
    status: 'ok',
    service: 'calva-platform',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    stats: {
      activeTenants: tenants.filter(t => t.active === 1).length,
      totalTenants: tenants.length
    }
  });
});

// 404 handler
app.use((req, res) => {
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
