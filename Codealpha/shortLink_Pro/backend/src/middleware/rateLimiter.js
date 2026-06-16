/**
 * ============================================
 * ShortLink Pro — Rate Limiter Middleware
 * ============================================
 */

const rateLimit = require('express-rate-limit');
const config = require('../config/environment');
const { HTTP_STATUS, ERROR_MESSAGES } = require('../utils/constants');

// General rate limiter for all API endpoints
const apiLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: ERROR_MESSAGES.RATE_LIMIT,
  },
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
});

// Stricter rate limiter for URL creation endpoints to prevent spam
const creationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Max 10 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many link creations. Please wait a minute.',
  },
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
});

module.exports = { apiLimiter, creationLimiter };
