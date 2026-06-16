/**
 * ============================================
 * ShortLink Pro — Constants
 * ============================================
 */

const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  CONFLICT: 409,
  GONE: 410,
  UNPROCESSABLE: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_ERROR: 500,
};

const SUCCESS_MESSAGES = {
  URL_SHORTENED: 'URL shortened successfully',
  URL_FOUND: 'URL retrieved successfully',
  URL_UPDATED: 'URL updated successfully',
  URL_DELETED: 'URL deleted successfully',
  URLS_FETCHED: 'URLs retrieved successfully',
  ANALYTICS_FETCHED: 'Analytics retrieved successfully',
  SEARCH_COMPLETE: 'Search completed successfully',
  QR_GENERATED: 'QR code generated successfully',
};

const ERROR_MESSAGES = {
  URL_NOT_FOUND: 'URL not found',
  URL_EXPIRED: 'This link has expired',
  URL_INACTIVE: 'This link is no longer active',
  SHORT_CODE_EXISTS: 'This custom short code is already in use',
  INVALID_URL: 'Please provide a valid URL',
  INVALID_SHORT_CODE: 'Short code must be 3-20 alphanumeric characters',
  MISSING_URL: 'Original URL is required',
  INTERNAL_ERROR: 'An internal server error occurred',
  RATE_LIMIT: 'Too many requests. Please try again later.',
  VALIDATION_ERROR: 'Validation failed',
};

const SHORT_CODE_ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

module.exports = { HTTP_STATUS, SUCCESS_MESSAGES, ERROR_MESSAGES, SHORT_CODE_ALPHABET, PAGINATION };
