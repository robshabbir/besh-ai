const logger = require('../utils/logger');

// Simple in-memory rate limiting (use Redis in production)
const requestCounts = new Map();

/**
 * Simple rate limiting middleware
 * @param {number} maxRequests - Maximum requests allowed
 * @param {number} windowMs - Time window in milliseconds
 */
function rateLimit(maxRequests = 10, windowMs = 60000) {
  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    // Clean up old entries
    if (Math.random() < 0.01) { // 1% chance to clean up
      for (const [k, v] of requestCounts.entries()) {
        if (now - v.resetTime > windowMs) {
          requestCounts.delete(k);
        }
      }
    }
    
    // Get or create rate limit entry
    let entry = requestCounts.get(key);
    if (!entry || now - entry.resetTime > windowMs) {
      entry = {
        count: 0,
        resetTime: now
      };
      requestCounts.set(key, entry);
    }
    
    // Increment counter
    entry.count++;
    
    // Check if limit exceeded
    if (entry.count > maxRequests) {
      logger.warn('Rate limit exceeded', { 
        ip: key, 
        path: req.path,
        count: entry.count,
        limit: maxRequests
      });
      
      return res.status(429).json({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${Math.ceil((windowMs - (now - entry.resetTime)) / 1000)} seconds.`,
        retryAfter: Math.ceil((windowMs - (now - entry.resetTime)) / 1000)
      });
    }
    
    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - entry.count));
    res.setHeader('X-RateLimit-Reset', new Date(entry.resetTime + windowMs).toISOString());
    
    next();
  };
}

module.exports = { rateLimit };
