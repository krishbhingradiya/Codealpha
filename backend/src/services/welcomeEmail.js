const nodemailer = require('nodemailer');
const config = require('../config/environment');

// Setup transporter: use provided SMTP or fallback to Ethereal test account for development
let transporter;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
} else {
  // Create a test Ethereal account (no real email sent)
  nodemailer.createTestAccount().then((testAccount) => {
    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('⚡ Using Ethereal test SMTP for welcome emails');
  }).catch(console.error);
}

/**
 * Send a premium welcome email to a newly registered user.
 * @param {string} toEmail - Recipient email address.
 * @param {string} userName - Recipient's display name.
 */
async function sendWelcomeEmail(toEmail, userName) {
  // Wait for transporter to be ready in case of async Ethereal setup
  while (!transporter) {
    await new Promise(r => setTimeout(r, 100));
  }
  const mailOptions = {
    from: process.env.FROM_EMAIL || 'no-reply@shortlink.pro',
    to: toEmail,
    subject: '🎉 Welcome to ShortLink Pro – Your account is ready',
    html: `
      <!DOCTYPE html>
      <html lang="en" style="margin:0;padding:0;background:#0a0e1a;color:#e0e6ed;font-family:Arial,Helvetica,sans-serif;">
      <head>
        <meta charset="UTF-8" />
        <title>Welcome to ShortLink Pro</title>
        <style>
          .container {max-width:600px;margin:auto;padding:2rem;background:#1a1e2b;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.3);}
          .header {font-size:1.8rem;color:#4f46e5;margin-bottom:0.5rem;}
          .content {font-size:1rem;line-height:1.6;margin-bottom:1.5rem;}
          .cta {display:inline-block;padding:0.75rem 1.5rem;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;}
          .footer {font-size:0.85rem;color:#8892a3;margin-top:2rem;}
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">Hello ${userName},</div>
          <div class="content">
            <p>Welcome to <strong>ShortLink Pro</strong>! 🎉</p>
            <p>We're excited to have you join our growing community of developers, creators, and businesses.</p>
            <p>Your account has been successfully created and you’re ready to start creating smarter, shorter, and more powerful links.</p>
            <p style="text-align:center;margin:2rem 0;">
              <a href="${config.frontendUrl}" class="cta">Go to Dashboard</a>
            </p>
            <p>If you have any questions, feel free to reply to this email – we’re here to help.</p>
          </div>
          <div class="footer">
            © ${new Date().getFullYear()} ShortLink Pro. All rights reserved.
          </div>
        </div>
      </body>
      </html>`
  };

  await transporter.sendMail(mailOptions);
}

module.exports = { sendWelcomeEmail };

