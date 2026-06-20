// src/config/constants.js
// Central constants for the Restaurant Management System

/**
 * Currency symbol used throughout the UI.
 * Indian Rupee – displayed as the Rupee sign.
 */
const CURRENCY_SYMBOL = '₹';

/**
 * Formats a numeric value as Indian currency string.
 * Example: formatCurrency(149) => "₹149"
 */
function formatCurrency(value) {
  if (value === null || value === undefined) return '';
  const num = typeof value === 'number' ? value : parseFloat(value);
  if (isNaN(num)) return '';
  // No decimals for whole rupees, show .XX for fractional amounts
  return CURRENCY_SYMBOL + (Number.isInteger(num) ? num : num.toFixed(2));
}

module.exports = { CURRENCY_SYMBOL, formatCurrency };
