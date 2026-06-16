/**
 * ============================================
 * ShortLink Pro — Error Handling Middleware
 * ============================================
 */

const { HTTP_STATUS, ERROR_MESSAGES } = require('../utils/constants');

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

function errorHandler(err, req, res, next) {
  err.statusCode = err.statusCode || HTTP_STATUS.INTERNAL_ERROR;
  err.status = err.status || 'error';

  // Log all errors in development mode
  if (process.env.NODE_ENV === 'development') {
    console.error('💥 Error handler caught:', err);
  }

  // Handle specific Supabase / Postgres errors
  let error = { ...err };
  error.message = err.message;

  // 23505: Unique violation (e.g. short code already exists)
  if (err.code === '23505') {
    error = new AppError(ERROR_MESSAGES.SHORT_CODE_EXISTS, HTTP_STATUS.CONFLICT);
  }

  // Handle invalid UUID lookup
  if (err.code === '22P02') {
    error = new AppError(ERROR_MESSAGES.URL_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_ERROR;
  const message = error.message || ERROR_MESSAGES.INTERNAL_ERROR;

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = { errorHandler, AppError };
