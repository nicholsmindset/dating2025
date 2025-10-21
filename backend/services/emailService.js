const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Generate verification token
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Send verification email
const sendVerificationEmail = async (user, verificationToken) => {
  try {
    const transporter = createTransporter();

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    const mailOptions = {
      from: `"Islamic Dating Platform" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Verify Your Email - Islamic Dating Platform',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Islamic Dating Platform!</h1>
            </div>
            <div class="content">
              <p>Assalamu Alaikum ${user.firstName},</p>

              <p>Thank you for registering with Islamic Dating Platform. We're excited to help you find a compatible partner for marriage in a halal way.</p>

              <p>To complete your registration and activate your account, please verify your email address by clicking the button below:</p>

              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify My Email</a>
              </div>

              <p>Or copy and paste this link in your browser:</p>
              <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>

              <p><strong>This link will expire in 24 hours.</strong></p>

              <p>If you didn't create an account with us, please ignore this email.</p>

              <p>May Allah guide you in your search for a righteous spouse.</p>

              <p>Best regards,<br>Islamic Dating Platform Team</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Islamic Dating Platform. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending verification email:', error);
    return { success: false, error: error.message };
  }
};

// Send password reset email
const sendPasswordResetEmail = async (user, resetToken) => {
  try {
    const transporter = createTransporter();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `"Islamic Dating Platform" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Password Reset Request - Islamic Dating Platform',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Assalamu Alaikum ${user.firstName},</p>

              <p>We received a request to reset your password for your Islamic Dating Platform account.</p>

              <p>To reset your password, click the button below:</p>

              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset My Password</a>
              </div>

              <p>Or copy and paste this link in your browser:</p>
              <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>

              <div class="warning">
                <strong>⚠️ Important:</strong> This link will expire in 1 hour for security reasons.
              </div>

              <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns about your account security.</p>

              <p>Best regards,<br>Islamic Dating Platform Team</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Islamic Dating Platform. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
};

// Send welcome email after verification
const sendWelcomeEmail = async (user) => {
  try {
    const transporter = createTransporter();

    const dashboardUrl = `${process.env.FRONTEND_URL}/dashboard`;
    const waliNoticeHtml = user.wali?.hasWali ? `
      <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0;">
        <strong>Wali Involvement:</strong> We've sent a notification to your wali (${user.wali.waliName}) about your account creation. They will be able to supervise conversations as per Islamic guidelines.
      </div>
    ` : '';

    const mailOptions = {
      from: `"Islamic Dating Platform" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Welcome to Islamic Dating Platform - Your Account is Active!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .feature-box { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #667eea; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to Our Community!</h1>
            </div>
            <div class="content">
              <p>Assalamu Alaikum ${user.firstName},</p>

              <p>Your email has been verified successfully! Your account is now active and you can start your journey to find a compatible partner.</p>

              ${waliNoticeHtml}

              <h3>What's Next?</h3>

              <div class="feature-box">
                <strong>1. Complete Your Profile</strong><br>
                Add more details about yourself and upload photos to attract compatible matches.
              </div>

              <div class="feature-box">
                <strong>2. Set Your Preferences</strong><br>
                Tell us what you're looking for in a partner to get better matches.
              </div>

              <div class="feature-box">
                <strong>3. Browse Profiles</strong><br>
                ${user.subscription?.plan === 'premium' ? 'As a premium member, you have unlimited profile views!' : 'You can view up to 10 profiles per month on the free plan.'}
              </div>

              <div class="feature-box">
                <strong>4. Connect & Chat</strong><br>
                When you find someone interesting, send them a message to start a halal conversation.
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${dashboardUrl}" class="button">Start Exploring Profiles</a>
              </div>

              <h3>Important Guidelines:</h3>
              <ul>
                <li>Be respectful and follow Islamic etiquette in all interactions</li>
                <li>Keep conversations halal and purposeful</li>
                <li>Report any inappropriate behavior immediately</li>
                <li>Involve your wali/family in important decisions</li>
              </ul>

              <p>If you need any assistance, our support team is here to help.</p>

              <p>May Allah bless your search for a righteous spouse.</p>

              <p>Best regards,<br>Islamic Dating Platform Team</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Islamic Dating Platform. All rights reserved.</p>
              <p>If you have questions, reply to this email or contact support.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
};

// Send wali notification email
const sendWaliNotificationEmail = async (user) => {
  if (!user.wali?.hasWali || !user.wali?.waliEmail) {
    return { success: false, error: 'No wali information available' };
  }

  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Islamic Dating Platform" <${process.env.EMAIL_USER}>`,
      to: user.wali.waliEmail,
      subject: `Notification: ${user.firstName} ${user.lastName} Registered on Islamic Dating Platform`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .info-box { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Wali Notification</h1>
            </div>
            <div class="content">
              <p>Assalamu Alaikum ${user.wali.waliName},</p>

              <p>We are writing to inform you that <strong>${user.firstName} ${user.lastName}</strong> has created an account on Islamic Dating Platform for the purpose of finding a marriage partner.</p>

              <div class="info-box">
                <strong>Your Role as Wali:</strong><br>
                As the designated wali (guardian), you have been listed to oversee and guide this process according to Islamic principles. You may be contacted regarding potential matches and marriage proposals.
              </div>

              <div class="info-box">
                <strong>Platform Features:</strong>
                <ul>
                  <li>Halal, marriage-focused matching system</li>
                  <li>Wali supervision options for conversations</li>
                  <li>Strict guidelines for respectful interaction</li>
                  <li>Moderation and safety features</li>
                </ul>
              </div>

              <p><strong>Your Contact Information on File:</strong></p>
              <ul>
                <li>Name: ${user.wali.waliName}</li>
                <li>Relation: ${user.wali.waliRelation}</li>
                <li>Contact: ${user.wali.waliContact}</li>
                <li>Email: ${user.wali.waliEmail}</li>
              </ul>

              <p>If you have any questions or concerns, or if this registration was done without your knowledge, please contact us immediately.</p>

              <p>May Allah guide us all to what is best.</p>

              <p>Best regards,<br>Islamic Dating Platform Team</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Islamic Dating Platform. All rights reserved.</p>
              <p>For questions or concerns, please reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending wali notification email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  generateVerificationToken,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendWaliNotificationEmail
};
