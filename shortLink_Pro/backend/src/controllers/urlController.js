/**
 * ============================================
 * ShortLink Pro — URL Controller
 * ============================================
 */

const urlService = require('../services/urlService');
const { formatResponse } = require('../utils/helpers');
const { HTTP_STATUS, SUCCESS_MESSAGES } = require('../utils/constants');

async function shortenUrl(req, res, next) {
  try {
    const { url, expires_at } = req.body;
    const result = await urlService.shortenUrl(url, expires_at, req.user?.id);
    res.status(HTTP_STATUS.CREATED).json(formatResponse(SUCCESS_MESSAGES.URL_SHORTENED, result));
  } catch (err) { next(err); }
}

async function createCustomUrl(req, res, next) {
  try {
    const { url, custom_code, expires_at } = req.body;
    const result = await urlService.createCustomUrl(url, custom_code, expires_at, req.user?.id);
    res.status(HTTP_STATUS.CREATED).json(formatResponse(SUCCESS_MESSAGES.URL_SHORTENED, result));
  } catch (err) { next(err); }
}

async function getAllUrls(req, res, next) {
  try {
    const { page, limit, sort, filter } = req.query;
    const result = await urlService.getAllUrls(req.user.id, page, limit, sort, filter);
    res.status(HTTP_STATUS.OK).json(formatResponse(SUCCESS_MESSAGES.URLS_FETCHED, result));
  } catch (err) { next(err); }
}

async function searchUrls(req, res, next) {
  try {
    const { q, page, limit, sort, filter } = req.query;
    const result = await urlService.searchUrls(req.user.id, q, page, limit, sort, filter);
    res.status(HTTP_STATUS.OK).json(formatResponse(SUCCESS_MESSAGES.SEARCH_COMPLETE, result));
  } catch (err) { next(err); }
}

async function getAnalytics(req, res, next) {
  try {
    const { shortCode } = req.params;
    const result = await urlService.getAnalytics(shortCode, req.user.id);
    res.status(HTTP_STATUS.OK).json(formatResponse(SUCCESS_MESSAGES.ANALYTICS_FETCHED, result));
  } catch (err) { next(err); }
}

async function getUrlById(req, res, next) {
  try {
    const { id } = req.params;
    const result = await urlService.getUrlById(id, req.user.id);
    res.status(HTTP_STATUS.OK).json(formatResponse(SUCCESS_MESSAGES.URL_FOUND, result));
  } catch (err) { next(err); }
}

async function updateUrl(req, res, next) {
  try {
    const { id } = req.params;
    const result = await urlService.updateUrl(id, req.user.id, req.body);
    res.status(HTTP_STATUS.OK).json(formatResponse(SUCCESS_MESSAGES.URL_UPDATED, result));
  } catch (err) { next(err); }
}

async function deleteUrl(req, res, next) {
  try {
    const { id } = req.params;
    const result = await urlService.deleteUrl(id, req.user.id);
    res.status(HTTP_STATUS.OK).json(formatResponse(SUCCESS_MESSAGES.URL_DELETED, result));
  } catch (err) { next(err); }
}

module.exports = {
  shortenUrl, createCustomUrl, getAllUrls, searchUrls,
  getAnalytics, getUrlById, updateUrl, deleteUrl,
};

