/**
 * ============================================
 * ShortLink Pro — Redirect Controller
 * ============================================
 */

const urlService = require('../services/urlService');
const { HTTP_STATUS } = require('../utils/constants');

async function handleRedirect(req, res, next) {
  try {
    const { shortCode } = req.params;
    const originalUrl = await urlService.resolveShortCode(shortCode);
    // Successful redirect
    return res.redirect(originalUrl);
  } catch (err) {
    const statusCode = err.statusCode || 500;
    const title = err.message || 'Unexpected error';
    const message = err.message || 'Something went wrong.';

    // If the request expects HTML, send an inline error page
    // (backend has no view engine — do NOT use res.render)
    if (req.accepts('html')) {
      return res.status(statusCode).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${statusCode} — ${title}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{min-height:100vh;display:flex;align-items:center;justify-content:center;
         background:#0a0e1a;color:#e0e6ed;font-family:'Segoe UI',system-ui,sans-serif}
    .card{text-align:center;padding:3rem 2rem;max-width:480px;
          background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);
          border-radius:16px;backdrop-filter:blur(12px)}
    .code{font-size:5rem;font-weight:800;background:linear-gradient(135deg,#6366f1,#a855f7);
          -webkit-background-clip:text;-webkit-text-fill-color:transparent}
    h2{margin:.75rem 0;font-size:1.4rem;color:#c4b5fd}
    p{color:#8892a3;line-height:1.6;margin-bottom:1.5rem}
    a{display:inline-block;padding:.65rem 1.5rem;background:#6366f1;color:#fff;
      border-radius:8px;text-decoration:none;font-weight:600;transition:background .2s}
    a:hover{background:#4f46e5}
  </style>
</head>
<body>
  <div class="card">
    <div class="code">${statusCode}</div>
    <h2>${title}</h2>
    <p>${message}</p>
    <a href="/">← Back to Home</a>
  </div>
</body>
</html>`);
    }
    // Otherwise forward to JSON error handler
    return next(err);
  }
}

module.exports = { handleRedirect };
