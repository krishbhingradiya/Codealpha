/**
 * ============================================
 * ShortLink Pro — Request Logger Middleware
 * ============================================
 */

const morgan = require('morgan');

// Development colored console format
const devFormat = (tokens, req, res) => {
  const status = tokens.status(req, res);
  let statusColor = '\x1b[32m'; // Green default

  if (status >= 500) statusColor = '\x1b[31m'; // Red
  else if (status >= 400) statusColor = '\x1b[33m'; // Yellow
  else if (status >= 300) statusColor = '\x1b[36m'; // Cyan

  const reset = '\x1b[0m';
  const method = tokens.method(req, res);
  const url = tokens.url(req, res);
  const responseTime = tokens['response-time'](req, res);

  return `   ${method} ${url} ${statusColor}${status}${reset} - ${responseTime} ms`;
};

const requestLogger = morgan(devFormat);

module.exports = requestLogger;
