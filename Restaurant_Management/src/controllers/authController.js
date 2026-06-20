const authService = require('../services/authService');
const { logActivity } = require('../services/notificationService');

class AuthController {
  async showLogin(req, res) {
    if (req.session.user) {
      return res.redirect(req.session.user.role === 'customer' ? '/' : `/${req.session.user.role}`);
    }
    res.render('auth/login', { title: 'Login', layout: 'layouts/main' });
  }

  async showRegister(req, res) {
    if (req.session.user) {
      return res.redirect('/');
    }
    res.render('auth/register', { title: 'Register', layout: 'layouts/main' });
  }

  async register(req, res) {
    try {
      const { name, email, mobile, password, confirmPassword } = req.body;

      // Validation
      if (!name || !email || !password) {
        req.flash('error', 'Please fill in all required fields');
        return res.redirect('/auth/register');
      }

      if (password.length < 6) {
        req.flash('error', 'Password must be at least 6 characters');
        return res.redirect('/auth/register');
      }

      if (password !== confirmPassword) {
        req.flash('error', 'Passwords do not match');
        return res.redirect('/auth/register');
      }

      // Check existing
      const existing = await authService.findByEmail(email);
      if (existing) {
        req.flash('error', 'An account with this email already exists');
        return res.redirect('/auth/register');
      }

      // Create user
      const user = await authService.createUser({ name, email, mobile, password });
      
      // Create session
      const token = authService.generateToken(user);
      req.session.user = user;
      req.session.token = token;

      // Auto-generate welcome coupon on registration
      try {
        const couponService = require('../services/couponService');
        await couponService.checkAndGenerateFirstOrderCoupon(user);
      } catch (couponErr) {
        console.error('Failed to generate coupon on registration:', couponErr);
      }

      await logActivity(user.id, 'User registered');

      req.flash('success', 'Account created successfully!');
      res.redirect('/');
    } catch (err) {
      console.error('Registration error:', err);
      req.flash('error', err.message || 'Registration failed');
      res.redirect('/auth/register');
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        req.flash('error', 'Please enter email and password');
        return res.redirect('/auth/login');
      }

      const user = await authService.findByEmail(email);
      if (!user) {
        req.flash('error', 'Invalid email or password');
        return res.redirect('/auth/login');
      }

      const isValid = await authService.verifyPassword(password, user.password);
      if (!isValid) {
        req.flash('error', 'Invalid email or password');
        return res.redirect('/auth/login');
      }

      // Create session
      const token = authService.generateToken(user);
      const userData = { id: user.id, name: user.name, email: user.email, mobile: user.mobile, role: user.role };
      req.session.user = userData;
      req.session.token = token;

      // Auto-generate welcome coupon on login if eligible
      try {
        const couponService = require('../services/couponService');
        await couponService.checkAndGenerateFirstOrderCoupon(userData);
      } catch (couponErr) {
        console.error('Failed to generate coupon on login:', couponErr);
      }

      await logActivity(user.id, 'User logged in');

      req.flash('success', `Welcome back, ${user.name}!`);
      
      // Redirect based on role
      if (user.role === 'admin') return res.redirect('/admin');
      if (user.role === 'manager') return res.redirect('/manager/dashboard');
      return res.redirect('/');
    } catch (err) {
      console.error('Login error:', err);
      req.flash('error', 'Login failed. Please try again.');
      res.redirect('/auth/login');
    }
  }

  async logout(req, res) {
    try {
      if (req.session.user) {
        await logActivity(req.session.user.id, 'User logged out');
      }
    } catch (e) { /* ignore */ }
    
    req.session.destroy((err) => {
      res.redirect('/auth/login');
    });
  }

  // API endpoints
  async apiLogin(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const user = await authService.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValid = await authService.verifyPassword(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = authService.generateToken(user);
      const userData = { id: user.id, name: user.name, email: user.email, role: user.role };

      res.json({ user: userData, token });
    } catch (err) {
      res.status(500).json({ error: 'Login failed' });
    }
  }

  async apiRegister(req, res) {
    try {
      const { name, email, mobile, password } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required' });
      }

      const user = await authService.createUser({ name, email, mobile, password });
      const token = authService.generateToken(user);

      res.status(201).json({ user, token });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
}

module.exports = new AuthController();
