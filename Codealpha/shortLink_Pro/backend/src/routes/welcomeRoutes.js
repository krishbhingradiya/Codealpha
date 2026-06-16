// backend/src/routes/welcomeRoutes.js
const express = require('express');
const router = express.Router();
const { sendWelcomeEmail } = require('../services/welcomeEmail');

/**
 * POST /api/welcome
 * Body: { email: string, name: string }
 * Sends a premium welcome email.
 */
router.post('/', async (req, res) => {
  const { email, name } = req.body;
  if (!email || !name) {
    return res.status(400).json({ error: 'email and name required' });
  }
  try {
    await sendWelcomeEmail(email, name);
    res.status(200).json({ message: 'Welcome email sent' });
  } catch (err) {
    console.error('Welcome email error:', err);
    res.status(500).json({ error: 'Failed to send welcome email' });
  }
});

module.exports = router;
