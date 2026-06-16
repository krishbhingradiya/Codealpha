/**
 * ============================================
 * ShortLink Pro — URL Service (Business Logic)
 * ============================================
 */

const urlModel = require('../models/urlModel');
const qrService = require('./qrService');
const { generateShortCode, buildShortUrl, isExpired, sanitizePagination } = require('../utils/helpers');
const { ERROR_MESSAGES } = require('../utils/constants');

async function shortenUrl(originalUrl, expiresAt = null, userId = null) {
  let shortCode;
  let attempts = 0;
  do {
    shortCode = generateShortCode();
    const exists = await urlModel.shortCodeExists(shortCode);
    if (!exists) break;
    attempts++;
  } while (attempts < 5);

  if (attempts >= 5) throw new Error('Failed to generate a unique short code. Please try again.');

  const created = await urlModel.create({
    original_url: originalUrl, short_code: shortCode, expires_at: expiresAt || null, user_id: userId || null,
  });

  const shortUrl = buildShortUrl(created.short_code);
  const qrCode = await qrService.generateQRCode(shortUrl);
  return { ...created, short_url: shortUrl, qr_code: qrCode };
}

async function createCustomUrl(originalUrl, customCode, expiresAt = null, userId = null) {
  const exists = await urlModel.shortCodeExists(customCode);
  if (exists) {
    const error = new Error(ERROR_MESSAGES.SHORT_CODE_EXISTS);
    error.statusCode = 409;
    throw error;
  }

  const created = await urlModel.create({
    original_url: originalUrl, short_code: customCode, expires_at: expiresAt || null, user_id: userId || null,
  });

  const shortUrl = buildShortUrl(created.short_code);
  const qrCode = await qrService.generateQRCode(shortUrl);
  return { ...created, short_url: shortUrl, qr_code: qrCode };
}

async function resolveShortCode(shortCode) {
  const url = await urlModel.findByShortCode(shortCode);
  if (!url) { const e = new Error(ERROR_MESSAGES.URL_NOT_FOUND); e.statusCode = 404; throw e; }
  if (!url.is_active) { const e = new Error(ERROR_MESSAGES.URL_INACTIVE); e.statusCode = 410; throw e; }
  if (isExpired(url.expires_at)) {
    await urlModel.update(url.id, { is_active: false });
    const e = new Error(ERROR_MESSAGES.URL_EXPIRED); e.statusCode = 410; throw e;
  }
  urlModel.incrementClickCount(url.id).catch((err) => console.error('Click count error:', err.message));
  return url.original_url;
}

async function getAnalytics(shortCode, userId) {
  const url = await urlModel.findByShortCode(shortCode);
  if (!url) { const e = new Error(ERROR_MESSAGES.URL_NOT_FOUND); e.statusCode = 404; throw e; }
  if (url.user_id !== userId) {
    const e = new Error('You do not have permission to access these analytics');
    e.statusCode = 403;
    throw e;
  }
  const shortUrl = buildShortUrl(url.short_code);
  const qrCode = await qrService.generateQRCode(shortUrl);
  return {
    id: url.id, original_url: url.original_url, short_code: url.short_code,
    short_url: shortUrl, click_count: url.click_count, is_active: url.is_active,
    is_expired: isExpired(url.expires_at), created_at: url.created_at,
    updated_at: url.updated_at, last_visited: url.last_visited,
    expires_at: url.expires_at, qr_code: qrCode,
  };
}

async function getUrlById(id, userId) {
  const url = await urlModel.findById(id);
  if (!url) { const e = new Error(ERROR_MESSAGES.URL_NOT_FOUND); e.statusCode = 404; throw e; }
  if (url.user_id !== userId) {
    const e = new Error('You do not have permission to access this link');
    e.statusCode = 403;
    throw e;
  }
  const shortUrl = buildShortUrl(url.short_code);
  const qrCode = await qrService.generateQRCode(shortUrl);
  return { ...url, short_url: shortUrl, qr_code: qrCode };
}

async function getAllUrls(userId, page, limit, sort, filter) {
  const pagination = sanitizePagination(page, limit);
  const { data, count } = await urlModel.findAll(userId, pagination.limit, pagination.offset, sort, filter);
  const enriched = data.map((url) => ({ ...url, short_url: buildShortUrl(url.short_code) }));
  return {
    urls: enriched,
    pagination: { page: pagination.page, limit: pagination.limit, total: count, totalPages: Math.ceil(count / pagination.limit) },
  };
}

async function updateUrl(id, userId, updates) {
  const existing = await urlModel.findById(id);
  if (!existing) { const e = new Error(ERROR_MESSAGES.URL_NOT_FOUND); e.statusCode = 404; throw e; }
  if (existing.user_id !== userId) {
    const e = new Error('You do not have permission to update this link');
    e.statusCode = 403;
    throw e;
  }
  const allowedUpdates = {};
  if (updates.original_url) allowedUpdates.original_url = updates.original_url;
  if (updates.expires_at !== undefined) allowedUpdates.expires_at = updates.expires_at;
  if (updates.is_active !== undefined) allowedUpdates.is_active = updates.is_active;
  const updated = await urlModel.update(id, allowedUpdates);
  return { ...updated, short_url: buildShortUrl(updated.short_code) };
}

async function deleteUrl(id, userId) {
  const existing = await urlModel.findById(id);
  if (!existing) { const e = new Error(ERROR_MESSAGES.URL_NOT_FOUND); e.statusCode = 404; throw e; }
  if (existing.user_id !== userId) {
    const e = new Error('You do not have permission to delete this link');
    e.statusCode = 403;
    throw e;
  }
  return await urlModel.remove(id);
}

async function searchUrls(userId, query, page, limit, sort, filter) {
  const pagination = sanitizePagination(page, limit);
  const { data, count } = await urlModel.search(userId, query, pagination.limit, pagination.offset, sort, filter);
  const enriched = data.map((url) => ({ ...url, short_url: buildShortUrl(url.short_code) }));
  return {
    urls: enriched,
    pagination: { page: pagination.page, limit: pagination.limit, total: count, totalPages: Math.ceil(count / pagination.limit) },
  };
}

module.exports = {
  shortenUrl, createCustomUrl, resolveShortCode, getAnalytics,
  getUrlById, getAllUrls, updateUrl, deleteUrl, searchUrls,
};

