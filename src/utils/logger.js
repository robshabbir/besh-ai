/**
 * Structured logger for Besh platform
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL?.toUpperCase()] ?? LOG_LEVELS.INFO;

function log(level, message, meta = {}) {
  if (LOG_LEVELS[level] > currentLevel) return;
  
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...meta
  };
  
  const emoji = {
    ERROR: '❌',
    WARN: '⚠️',
    INFO: 'ℹ️',
    DEBUG: '🔍'
  }[level] || '';
  
  console.log(`${emoji} [${timestamp}] ${level}: ${message}`, 
    Object.keys(meta).length > 0 ? meta : '');
}

module.exports = {
  error: (msg, meta) => log('ERROR', msg, meta),
  warn: (msg, meta) => log('WARN', msg, meta),
  info: (msg, meta) => log('INFO', msg, meta),
  debug: (msg, meta) => log('DEBUG', msg, meta),
};
