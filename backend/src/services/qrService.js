/**
 * ============================================
 * ShortLink Pro — QR Code Service
 * ============================================
 */

const QRCode = require('qrcode');

async function generateQRCode(url, options = {}) {
  const { width = 300, darkColor = '#4F46E5', lightColor = '#0F172A' } = options;
  try {
    return await QRCode.toDataURL(url, {
      width, margin: 2,
      color: { dark: darkColor, light: lightColor },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.error('QR code generation failed:', err.message);
    throw new Error('Failed to generate QR code');
  }
}

async function generateQRCodeSVG(url) {
  try {
    return await QRCode.toString(url, {
      type: 'svg', margin: 2,
      color: { dark: '#4F46E5', light: '#0F172A' },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.error('QR SVG generation failed:', err.message);
    throw new Error('Failed to generate QR code');
  }
}

module.exports = { generateQRCode, generateQRCodeSVG };
