/**
 * ============================================
 * ShortLink Pro — Frontend UI Server
 * ============================================
 * Express server that serves EJS views and static assets.
 * All dynamic data operations are carried out client-side
 * via AJAX calling the Backend API server.
 */

const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 3000;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Setup view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));

// Serve static assets from public folder
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to inject configuration globally into EJS locals
app.use((req, res, next) => {
  res.locals.BACKEND_URL = BACKEND_URL;
  res.locals.SUPABASE_URL = process.env.SUPABASE_URL || '';
  res.locals.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
  next();
});

// ─── UI Routes ───────────────────────────────────────

// 1. Landing Page
app.get('/', (req, res) => {
  res.render('index', { title: 'Shorten Your Links, Amplify Your Reach' });
});

// 2. Login Page
app.get('/login', (req, res) => {
  res.render('login', { title: 'Sign In' });
});

// 3. Signup Page
app.get('/signup', (req, res) => {
  res.render('signup', { title: 'Create Account' });
});

// 4. Forgot Password Page
app.get('/forgot-password', (req, res) => {
  res.render('forgot-password', { title: 'Recover Password' });
});

// 5. Reset Password Page
app.get('/reset-password', (req, res) => {
  res.render('reset-password', { title: 'Reset Password' });
});

// 6. Dashboard Page
app.get('/dashboard', (req, res) => {
  res.render('dashboard', { title: 'Console Dashboard' });
});

// 7. Analytics Page
app.get('/analytics/:shortCode', (req, res) => {
  const { shortCode } = req.params;
  res.render('analytics', { 
    title: `Link Analytics — ${shortCode}`,
    shortCode 
  });
});

// 8. Link Management Console
app.get('/console', (req, res) => {
  res.render('console', { title: 'Link Management Console' });
});

// ─── Fallback 404 Route ──────────────────────────────
app.use((req, res) => {
  res.status(404).render('error', {
    title: '404 - Page Not Found',
    statusCode: 404,
    message: 'The page you are looking for does not exist or has been moved.',
    errorType: 'not_found'
  });
});

// ─── Launch Server ───────────────────────────────────
app.listen(PORT, () => {
  console.log('\n🔗 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('   ShortLink Pro Frontend — UI Server');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log(`🚀 UI server running on port ${PORT}`);
  console.log(`🌍 Environment: ${NODE_ENV}`);
  console.log(`🔌 API Backend URL: ${BACKEND_URL}`);
  console.log(`🖥️  Browser view: http://localhost:${PORT}`);
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});
