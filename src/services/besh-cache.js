/**
 * Simple Response Cache
 * Caches LLM responses for identical queries
 */

const responseCache = new Map();
const MAX_CACHE_SIZE = 100;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function getCacheKey(userMessage, userId, intent) {
  return `${userId || 'anonymous'}:${intent || 'chat'}:${userMessage.toLowerCase().trim()}`;
}

function getCachedResponse(key) {
  const cached = responseCache.get(key);
  if (!cached) return null;
  
  // Check if expired
  if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
    responseCache.delete(key);
    return null;
  }
  
  return cached.response;
}

function setCachedResponse(key, response) {
  // Evict oldest if at capacity
  if (responseCache.size >= MAX_CACHE_SIZE) {
    const firstKey = responseCache.keys().next().value;
    responseCache.delete(firstKey);
  }
  
  responseCache.set(key, {
    response,
    timestamp: Date.now()
  });
}

function clearCache() {
  responseCache.clear();
}

function getCacheStats() {
  return {
    size: responseCache.size,
    max: MAX_CACHE_SIZE
  };
}

module.exports = {
  getCachedResponse,
  setCachedResponse,
  clearCache,
  getCacheStats,
  getCacheKey
};
