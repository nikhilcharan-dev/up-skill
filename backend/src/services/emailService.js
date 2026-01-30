import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

// Create Transporter
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail', // Default to gmail if not specified
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

/**
 * Send an email using Nodemailer
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - HTML content
 */
export const sendMail = async ({ to, subject, html }) => {
    try {
        const mailOptions = {
            from: `"UpSkill Learning" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Message sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

/**
 * Send Welcome Email to new users (Trainer or Trainee)
 * @param {string} email - Recipient email
 * @param {string} name - Recipient name
 * @param {string} password - Generated password
 * @param {string} role - User role (Trainer/Trainee)
 */
export const sendWelcomeEmail = async (email, name, password, role) => {
    // Determine Login URL based on role
    // Env vars are like "https://domain.com/api", so we replace "/api" with "/login" or just remove it if it's the root.
    let baseUrl;
    if (role.toLowerCase() === 'trainer' || role.toLowerCase() === 'admin') {
        baseUrl = process.env.ADMIN_DOMAIN || 'http://localhost:5173';
    } else {
        baseUrl = process.env.CLIENT_DOMAIN || 'http://localhost:5174';
    }

    // Remove trailing /api if present to get the frontend root and append /login
    // Example: https://upskill.adityauniversity.in/api -> https://upskill.adityauniversity.in/login
    baseUrl = baseUrl.replace(/\/api\/?$/, '');
    const loginUrl = `${baseUrl}/login`;

    // Premium HTML Template
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f9; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
            .header { background: #1a1a2e; padding: 30px; text-align: center; }
            .header h1 { color: #ffffff; margin: 0; font-weight: 300; letter-spacing: 1px; }
            .content { padding: 40px; color: #333; line-height: 1.6; }
            .welcome-text { font-size: 18px; color: #2d3748; margin-bottom: 20px; }
            .credentials-box { background: #f7fafc; border-left: 4px solid #4a5568; padding: 20px; margin: 25px 0; border-radius: 4px; }
            .credential-item { margin: 10px 0; font-size: 16px; }
            .label { font-weight: 600; color: #718096; min-width: 80px; display: inline-block; }
            .value { color: #2d3748; font-family: 'Courier New', monospace; font-weight: 600; }
            .btn-container { text-align: center; margin-top: 35px; }
            .btn { background-color: #4a5568; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; transition: background 0.3s; }
            .btn:hover { background-color: #2d3748; }
            .footer { background: #f4f4f9; padding: 20px; text-align: center; font-size: 12px; color: #a0aec0; border-top: 1px solid #e2e8f0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>UpSkill</h1>
            </div>
            <div class="content">
                <p class="welcome-text"><strong>Hello ${name},</strong></p>
                <p>Welcome to <strong>UpSkill</strong>! Your account has been successfully created. You can now access the platform as a <strong>${role}</strong>.</p>
                
                <p>Here are your secure login credentials:</p>
                
                <div class="credentials-box">
                    <div class="credential-item">
                        <span class="label">Email:</span>
                        <span class="value">${email}</span>
                    </div>
                    <div class="credential-item">
                        <span class="label">Password:</span>
                        <span class="value">${password}</span>
                    </div>
                </div>

                <div class="btn-container">
                    <a href="${loginUrl}" class="btn">Login to Dashboard</a>
                </div>
                
                <p style="margin-top: 30px; font-size: 14px; color: #718096;">
                    Note: We recommend changing your password after your first login for security purposes.
                </p>
            </div>
            <div class="footer">
                &copy; ${new Date().getFullYear()} UpSkill Learning Platform. All rights reserved.<br>
                Empowering your learning journey.
            </div>
        </div>
    </body>
    </html>
    `;

    return sendMail({
        to: email,
        subject: `Welcome to UpSkill - Your ${role} Credentials`,
        html: htmlContent
    });
};

/**
 * Send Batch Enrollment Email
 * @param {string} email - Recipient email
 * @param {string} name - Recipient name
 * @param {string} batchName - Name of the batch
 * @param {string} courseName - Name of the course
 * @param {string} startDate - Start date of the batch
 */
export const sendBatchEnrollmentEmail = async (email, name, batchName, courseName, startDate) => {
    // Determine Login URL (Trainees only for batches usually)
    let baseUrl = process.env.CLIENT_DOMAIN || 'http://localhost:5174';
    baseUrl = baseUrl.replace(/\/api\/?$/, '');
    const loginUrl = `${baseUrl}/login`;

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f9; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
            .header { background: #1a1a2e; padding: 30px; text-align: center; }
            .header h1 { color: #ffffff; margin: 0; font-weight: 300; letter-spacing: 1px; }
            .content { padding: 40px; color: #333; line-height: 1.6; }
            .welcome-text { font-size: 18px; color: #2d3748; margin-bottom: 20px; }
            .info-box { background: #ebf8ff; border-left: 4px solid #4299e1; padding: 20px; margin: 25px 0; border-radius: 4px; }
            .info-item { margin: 10px 0; font-size: 16px; }
            .label { font-weight: 600; color: #4a5568; min-width: 100px; display: inline-block; }
            .value { color: #2d3748; font-weight: 600; }
            .btn-container { text-align: center; margin-top: 35px; }
            .btn { background-color: #4299e1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; transition: background 0.3s; }
            .btn:hover { background-color: #3182ce; }
            .footer { background: #f4f4f9; padding: 20px; text-align: center; font-size: 12px; color: #a0aec0; border-top: 1px solid #e2e8f0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>UpSkill</h1>
            </div>
            <div class="content">
                <p class="welcome-text"><strong>Hello ${name},</strong></p>
                <p>You have been enrolled in a new learning batch on <strong>UpSkill</strong>.</p>
                
                <div class="info-box">
                    <div class="info-item">
                        <span class="label">Course:</span>
                        <span class="value">${courseName}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Batch:</span>
                        <span class="value">${batchName}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Starts On:</span>
                        <span class="value">${startDate ? new Date(startDate).toLocaleDateString() : 'TBA'}</span>
                    </div>
                </div>

                <p>Login to your dashboard to view your schedule and course materials.</p>

                <div class="btn-container">
                    <a href="${loginUrl}" class="btn">Go to Dashboard</a>
                </div>
            </div>
            <div class="footer">
                &copy; ${new Date().getFullYear()} UpSkill Learning Platform. All rights reserved.<br>
                Empowering your learning journey.
            </div>
        </div>
    </body>
    </html>
    `;

    return sendMail({
        to: email,
        subject: `You have been added to ${batchName} - UpSkill`,
        html: htmlContent
    });
};
