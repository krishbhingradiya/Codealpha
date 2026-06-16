/**
 * ============================================
 * ShortLink Pro — URL Routes
 * ============================================
 */

const express = require('express');
const router = express.Router();

const urlController = require('../controllers/urlController');
const { apiLimiter, creationLimiter } = require('../middleware/rateLimiter');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const {
  validate,
  shortenRules,
  customShortenRules,
  updateRules,
  paginationRules,
  searchRules,
} = require('../middleware/validator');

// Rate limiting on all routes
router.use(apiLimiter);

/**
 * @route   POST /api/urls/shorten
 * @desc    Shorten a long URL
 */
router.post('/shorten', optionalAuth, creationLimiter, shortenRules, validate, urlController.shortenUrl);

/**
 * @route   POST /api/urls/custom
 * @desc    Create a custom shortened URL alias
 */
router.post('/custom', optionalAuth, creationLimiter, customShortenRules, validate, urlController.createCustomUrl);

/**
 * @route   GET /api/urls/search
 * @desc    Search URLs by original URL or short code
 */
router.get('/search', requireAuth, searchRules, validate, urlController.searchUrls);

/**
 * @route   GET /api/urls/analytics/:shortCode
 * @desc    Get detailed analytics for a short URL
 */
router.get('/analytics/:shortCode', requireAuth, urlController.getAnalytics);

/**
 * @route   GET /api/urls
 * @desc    Get all URLs (paginated)
 */
router.get('/', requireAuth, paginationRules, validate, urlController.getAllUrls);

/**
 * @route   GET /api/urls/:id
 * @desc    Get a single URL by ID
 */
router.get('/:id', requireAuth, urlController.getUrlById);

/**
 * @route   PUT /api/urls/:id
 * @desc    Update a URL (e.g., original URL, expiry, active status)
 */
router.put('/:id', requireAuth, updateRules, validate, urlController.updateUrl);

/**
 * @route   DELETE /api/urls/:id
 * @desc    Delete a URL record
 */
router.delete('/:id', requireAuth, urlController.deleteUrl);

module.exports = router;

