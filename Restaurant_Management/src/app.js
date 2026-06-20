require('dotenv').config();
const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const flash = require('connect-flash');

const sessionConfig = require('./config/session');
const { attachUser } = require('./middlewares/auth');
const errorHandler = require('./middlewares/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');
const tableRoutes = require('./routes/tableRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const adminRoutes = require('./routes/adminRoutes');
const managerRoutes = require('./routes/managerRoutes');
const reportRoutes = require('./routes/reportRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const customerRoutes = require('./routes/customerRoutes');
const apiRoutes = require('./routes/apiRoutes');

const app = express();

// Security & Logging
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.tailwindcss.com", "https://unpkg.com", "https://cdn.jsdelivr.net"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", process.env.SUPABASE_URL || '']
    }
  }
}));
app.use(cors());
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session
app.use(session(sessionConfig));
app.use(flash());

// Static files
app.use(express.static(path.join(__dirname, '..', 'public')));

// View engine
const { formatCurrency } = require('./config/constants');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));
app.locals.formatCurrency = formatCurrency;
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// Attach user to all views
app.use(attachUser);

// Flash messages middleware
app.use((req, res, next) => {
  res.locals.formatCurrency = formatCurrency;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.warning = req.flash('warning');
  next();
});

// Routes
app.use('/', authRoutes);
app.use('/', menuRoutes);
app.use('/', orderRoutes);
app.use('/', tableRoutes);
app.use('/', reservationRoutes);
app.use('/', inventoryRoutes);
app.use('/manager', managerRoutes);
app.use('/admin', adminRoutes);
app.use('/', reportRoutes);
app.use('/', notificationRoutes);
app.use('/', customerRoutes);
app.use('/api', apiRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).render('errors/404', {
    title: 'Page Not Found',
    layout: 'layouts/main'
  });
});

// Error handler
app.use(errorHandler);

module.exports = app;
