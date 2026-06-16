/**
 * ============================================
 * ShortLink Pro — Utility Helpers
 * ============================================
 */

const { customAlphabet } = require('nanoid');
const config = require('../config/environment');
const { SHORT_CODE_ALPHABET } = require('./constants');

const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('Asia/Kolkata');

const generateId = customAlphabet(SHORT_CODE_ALPHABET, config.shortCodeLength);

function generateShortCode(length) {
  if (length) {
    const customGen = customAlphabet(SHORT_CODE_ALPHABET, length);
    return customGen();
  }
  return generateId();
}

function formatResponse(message, data = null) {
  const response = { success: true, message };
  if (data !== null) response.data = data;
  return response;
}

function formatError(message) {
  return { success: false, message };
}

function isExpired(expiresAt) {
  if (!expiresAt) return false;
  return dayjs.tz(expiresAt).isBefore(dayjs.tz());
}

function buildShortUrl(shortCode) {
  const base = config.baseUrl.replace(/\/+$/, '');
  return `${base}/${shortCode}`;
}

function isValidUrl(url) {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

function sanitizePagination(page, limit) {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const offset = (parsedPage - 1) * parsedLimit;
  return { page: parsedPage, limit: parsedLimit, offset };
}

module.exports = {
  generateShortCode, formatResponse, formatError,
  isExpired, buildShortUrl, isValidUrl, sanitizePagination,
};
