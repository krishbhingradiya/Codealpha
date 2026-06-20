const authService = require('../services/authService');

// Attach user data to res.locals for all views
const attachUser = async (req, res, next) => {
  res.locals.user = null;
  res.locals.isAuthenticated = false;
  
  if (req.session && req.session.user) {
    res.locals.user = req.session.user;
    res.locals.isAuthenticated = true;
  }
  
  next();
};

// Require authentication (session-based)
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  
  // Check for API token in header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const decoded = authService.verifyToken(token);
    if (decoded) {
      req.session.user = decoded;
      res.locals.user = decoded;
      res.locals.isAuthenticated = true;
      return next();
    }
  }
  
  // Check if this is an API request
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  req.flash('error', 'Please login to continue');
  res.redirect('/auth/login');
};

// Optional authentication - doesn't block, just attaches user if available
const optionalAuth = (req, res, next) => {
  // User already attached by attachUser middleware
  next();
};

module.exports = { attachUser, isAuthenticated, optionalAuth };
