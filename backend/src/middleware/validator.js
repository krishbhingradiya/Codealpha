/**
 * ============================================
 * ShortLink Pro — Validation Middleware
 * ============================================
 */

const { body, query, validationResult } = require('express-validator');
const { HTTP_STATUS, ERROR_MESSAGES } = require('../utils/constants');
const { isValidUrl } = require('../utils/helpers');

/**
 * Common request validator checker
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(HTTP_STATUS.UNPROCESSABLE).json({
      success: false,
      message: ERROR_MESSAGES.VALIDATION_ERROR,
      errors: errors.array().map((err) => err.msg),
    });
  }
  next();
};

/**
 * Validation rules for shortening a URL
 */
const shortenRules = [
  body('url')
    .trim()
    .notEmpty()
    .withMessage(ERROR_MESSAGES.MISSING_URL)
    .custom((value) => {
      if (!isValidUrl(value)) {
        throw new Error(ERROR_MESSAGES.INVALID_URL);
      }
      return true;
    }),
  body('expires_at')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('Expiration date must be a valid ISO 8601 date string')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Expiration date must be in the future');
      }
      return true;
    }),
];

/**
 * Validation rules for custom short link creation
 */
const customShortenRules = [
  ...shortenRules,
  body('custom_code')
    .trim()
    .notEmpty()
    .withMessage('Custom short code is required')
    .isAlphanumeric('en-US', { ignore: '-_' })
    .withMessage('Short code must contain only alphanumeric characters, hyphens or underscores')
    .isLength({ min: 3, max: 20 })
    .withMessage(ERROR_MESSAGES.INVALID_SHORT_CODE),
];

/**
 * Validation rules for updating a URL
 */
const updateRules = [
  body('original_url')
    .optional()
    .trim()
    .custom((value) => {
      if (!isValidUrl(value)) {
        throw new Error(ERROR_MESSAGES.INVALID_URL);
      }
      return true;
    }),
  body('expires_at')
    .optional({ nullable: true })
    .custom((value) => {
      if (value === null) return true;
      if (isNaN(Date.parse(value))) {
        throw new Error('Expiration date must be a valid ISO date');
      }
      if (new Date(value) <= new Date()) {
        throw new Error('Expiration date must be in the future');
      }
      return true;
    }),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean value'),
];

/**
 * Validation rules for pagination queries
 */
const paginationRules = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be an integer greater than 0'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be an integer between 1 and 100'),
];

/**
 * Validation rules for searches
 */
const searchRules = [
  ...paginationRules,
  query('q')
    .trim()
    .notEmpty()
    .withMessage('Search query (q) parameter is required'),
];

module.exports = {
  validate,
  shortenRules,
  customShortenRules,
  updateRules,
  paginationRules,
  searchRules,
};
