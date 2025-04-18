const nodemailer = require('nodemailer');
require('dotenv').config();

// Create SMTP transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports like 587
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Email sending function
async function sendEmail({ to, subject, text, html }) {
    try {
        // Validate required fields
        if (!to || !subject || (!text && !html)) {
            throw new Error('Missing required fields: to, subject, and either text or html content');
        }

        // Send email
        const info = await transporter.sendMail({
            from: process.env.SMTP_USER,
            to,
            subject,
            text,
            html
        });

        console.log('Message sent: %s', info.messageId);
        return {
            success: true,
            message: 'Email sent successfully',
            messageId: info.messageId
        };
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
}

// Health check function
async function checkHealth() {
    return {
        status: 'healthy',
        timestamp: new Date().toISOString()
    };
}

module.exports = {
    sendEmail,
    checkHealth,
    transporter
};