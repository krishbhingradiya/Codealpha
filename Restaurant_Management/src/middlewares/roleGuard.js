// Role-based access control middleware
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      if (req.originalUrl.startsWith('/api/')) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      req.flash('error', 'Please login to continue');
      return res.redirect('/auth/login');
    }

    const userRole = req.session.user.role;
    
    if (!roles.includes(userRole)) {
      if (req.originalUrl.startsWith('/api/')) {
        return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
      }
      req.flash('error', 'You do not have permission to access this page');
      return res.redirect('/');
    }

    next();
  };
};

module.exports = { requireRole };
