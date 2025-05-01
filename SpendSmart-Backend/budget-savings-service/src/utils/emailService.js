const nodemailer = require('nodemailer');

// configure once using your SMTP details
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,        // e.g. 'smtp.gmail.com'
    port: process.env.SMTP_PORT,        // e.g. 587
    secure: false,                      // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,      // your SMTP username
        pass: process.env.SMTP_PASS,      // your SMTP password
    }
});

/**
 * sendMail
 * @param {string} to      recipient email address
 * @param {string} subject email subject line
 * @param {string} text    plain-text body
 * @param {string} html    optional HTML body
 */
async function sendMail({ to, subject, text, html }) {
    return transporter.sendMail({
        from: `"SpendSmart Alerts" <${process.env.SMTP_USER}>`,
        to,
        subject,
        text,
        html
    });
}

module.exports = { sendMail };
