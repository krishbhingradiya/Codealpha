/**
 * ============================================
 * ShortLink Pro — Authentication Middleware
 * ============================================
 */

const { supabase } = require('../config/database');

/**
 * Enforces that a valid Supabase JWT access token is provided.
 */
async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token is required',
      });
    }

    const token = authHeader.split(' ')[1];
    
    // Retrieve the user from Supabase Auth using the JWT
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired authentication token',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Optionally parses a Supabase JWT access token if present.
 * Does not fail if the token is missing or invalid; simply does not attach user.
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (!error && user) {
        req.user = user;
      }
    }
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { requireAuth, optionalAuth };
