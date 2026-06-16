/**
 * ============================================
 * ShortLink Pro — Redirect Routes
 * ============================================
 */

const express = require('express');
const router = express.Router();
const redirectController = require('../controllers/redirectController');

/**
 * @route   GET /:shortCode
 * @desc    Redirect to the original long URL
 */
router.get('/:shortCode', redirectController.handleRedirect);

module.exports = router;
