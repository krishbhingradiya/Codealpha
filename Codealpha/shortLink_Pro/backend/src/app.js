/**
 * ============================================
 * ShortLink Pro — Express App Configuration
 * ============================================
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const requestLogger = require('./middleware/requestLogger');
const { errorHandler } = require('./middleware/errorHandler');
const config = require('./config/environment');

const urlRoutes = require('./routes/urlRoutes');
const redirectRoutes = require('./routes/redirectRoutes');

const app = express();

// ─── Security & HTTP Configuration ───────────────────
app.use(helmet({
  contentSecurityPolicy: false, // For frontends using QR codes directly
  crossOriginResourcePolicy: false,
}));

// CORS Configuration
const allowedOrigins = [
  config.frontendUrl,
  'http://localhost:3000', // Local default
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    return callback(new Error('CORS Policy: This origin is not allowed access.'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Request parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Colorized console logs for requests
app.use(requestLogger);

// ─── API Routes ──────────────────────────────────────
app.use('/api/urls', urlRoutes);
app.use('/api/welcome', require('./routes/welcomeRoutes'));
// ─── Redirect Route (Catch-all for short codes) ──────
// Mounted last to avoid routing issues with /api
app.use('/', redirectRoutes);

// ─── Global Error Handler ────────────────────────────
app.use(errorHandler);



module.exports = app;
