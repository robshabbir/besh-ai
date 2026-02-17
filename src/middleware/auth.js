const db = require('../db');
const logger = require('../utils/logger');

/**
 * Authenticate tenant via API key (from header only - not query params for security)
 */
function authenticateTenant(req, res, next) {
  const apiKey = req.headers['x-api-key'] || 
                 req.headers['authorization']?.replace('Bearer ', '');
  
  if (!apiKey) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'API key required. Provide via X-API-Key header or Authorization: Bearer header'
    });
  }
  
  try {
    const tenant = db.getTenantByApiKey(apiKey);
    
    if (!tenant) {
      logger.warn('Invalid API key attempt', { apiKey: apiKey.substring(0, 10) + '...' });
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid API key'
      });
    }
    
    if (!tenant.active) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Account is inactive. Contact support.'
      });
    }
    
    // Attach tenant to request
    req.tenant = tenant;
    
    logger.debug('Tenant authenticated', { 
      tenantId: tenant.id,
      tenantName: tenant.name 
    });
    
    next();
  } catch (error) {
    logger.error('Authentication error', { error: error.message });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication failed'
    });
  }
}

module.exports = { authenticateTenant };
