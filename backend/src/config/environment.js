/**
 * ============================================
 * ShortLink Pro — Backend Environment Config
 * ============================================
 * Centralized configuration loaded from .env
 */

require('dotenv').config();

const config = {
  // Server
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  baseUrl: process.env.BASE_URL || 'http://localhost:5000',

  // Frontend (for CORS)
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  // Supabase
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,

  // Rate Limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,

  // Short Code
  shortCodeLength: parseInt(process.env.SHORT_CODE_LENGTH, 10) || 7,
};

/**
 * Validate that all required environment variables are set.
 */
function validateConfig() {
  const required = ['supabaseUrl', 'supabaseAnonKey'];
  const missing = required.filter((key) => !config[key]);

  if (missing.length > 0) {
    throw new Error(
      `❌ Missing required environment variables: ${missing.join(', ')}\n` +
      '   Please check your .env file. See .env.example for reference.'
    );
  }
}

validateConfig();

module.exports = config;
