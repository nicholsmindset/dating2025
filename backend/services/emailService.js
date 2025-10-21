const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  /**
   * Send email verification
   * @param {String} email - Recipient email
   * @param {String} name - User's name
   * @param {String} verificationToken - Verification token
   */
  async sendVerificationEmail(email, name, verificationToken) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    const mailOptions = {
      from: `"${process.env.REACT_APP_NAME || 'Islamic Dating'}" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email Address',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2E7D32; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; }
            .button { display: inline-block; padding: 12px 30px; background: #2E7D32; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Islamic Dating!</h1>
            </div>
            <div class="content">
              <h2>As-salamu alaykum, ${name}!</h2>
              <p>Thank you for registering with Islamic Dating. We're excited to help you find your perfect match in a halal way.</p>
              <p>To complete your registration and start exploring profiles, please verify your email address by clicking the button below:</p>
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: #eee; padding: 10px;">${verificationUrl}</p>
              <p><strong>This link will expire in 24 hours.</strong></p>
              <p>If you didn't create an account with us, please ignore this email.</p>
              <p>May Allah guide you in your search for a righteous spouse.</p>
              <p>Best regards,<br>The Islamic Dating Team</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Islamic Dating. All rights reserved.</p>
              <p>This email was sent to ${email}</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Verification email sent to ${email}`);
      return { success: true };
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw error;
    }
  }

  /**
   * Send password reset email
   * @param {String} email - Recipient email
   * @param {String} name - User's name
   * @param {String} resetToken - Password reset token
   */
  async sendPasswordResetEmail(email, name, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `"${process.env.REACT_APP_NAME || 'Islamic Dating'}" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Reset Your Password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2E7D32; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; }
            .button { display: inline-block; padding: 12px 30px; background: #2E7D32; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <h2>As-salamu alaykum, ${name}!</h2>
              <p>We received a request to reset the password for your account.</p>
              <p>If you made this request, click the button below to reset your password:</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: #eee; padding: 10px;">${resetUrl}</p>
              <div class="warning">
                <p><strong>Security Notice:</strong></p>
                <ul>
                  <li>This link will expire in 1 hour</li>
                  <li>If you didn't request this, please ignore this email</li>
                  <li>Your password won't change until you create a new one</li>
                </ul>
              </div>
              <p>If you continue to have problems, please contact our support team.</p>
              <p>Best regards,<br>The Islamic Dating Team</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Islamic Dating. All rights reserved.</p>
              <p>This email was sent to ${email}</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Password reset email sent to ${email}`);
      return { success: true };
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  }

  /**
   * Send welcome email
   * @param {String} email - Recipient email
   * @param {String} name - User's name
   */
  async sendWelcomeEmail(email, name) {
    const mailOptions = {
      from: `"${process.env.REACT_APP_NAME || 'Islamic Dating'}" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Welcome to Islamic Dating - Your Journey Begins!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2E7D32; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; }
            .button { display: inline-block; padding: 12px 30px; background: #2E7D32; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
            .tips { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #2E7D32; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Islamic Dating!</h1>
            </div>
            <div class="content">
              <h2>As-salamu alaykum, ${name}!</h2>
              <p>Your email has been verified successfully! Welcome to our Islamic community dedicated to helping Muslims find their perfect match in a halal way.</p>

              <div class="tips">
                <h3>🎯 Quick Start Guide:</h3>
                <ol>
                  <li><strong>Complete Your Profile</strong> - Add photos and details about yourself</li>
                  <li><strong>Set Your Preferences</strong> - Tell us what you're looking for</li>
                  <li><strong>Browse Profiles</strong> - Start exploring compatible matches</li>
                  <li><strong>Take the Compatibility Quiz</strong> - Get better match recommendations</li>
                  <li><strong>Start Conversations</strong> - Connect with people who interest you</li>
                </ol>
              </div>

              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL}/dashboard" class="button">Start Browsing</a>
              </div>

              <div class="tips">
                <h3>💡 Tips for Success:</h3>
                <ul>
                  <li>Be honest and authentic in your profile</li>
                  <li>Upload clear, recent photos</li>
                  <li>Respond promptly to messages</li>
                  <li>Respect Islamic values in all interactions</li>
                  <li>Consider involving your wali when appropriate</li>
                </ul>
              </div>

              <p>Need help? Our support team is here for you. Reply to this email or visit our help center.</p>

              <p>May Allah bless your search and guide you to a righteous spouse.</p>

              <p>Best regards,<br>The Islamic Dating Team</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Islamic Dating. All rights reserved.</p>
              <p>This email was sent to ${email}</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Welcome email sent to ${email}`);
      return { success: true };
    } catch (error) {
      console.error('Error sending welcome email:', error);
      throw error;
    }
  }

  /**
   * Send match notification email
   * @param {String} email - Recipient email
   * @param {String} name - User's name
   * @param {String} matchName - Matched user's name
   */
  async sendMatchNotificationEmail(email, name, matchName) {
    const mailOptions = {
      from: `"${process.env.REACT_APP_NAME || 'Islamic Dating'}" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `It's a Match! ${matchName} likes you too!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2E7D32; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; text-align: center; }
            .button { display: inline-block; padding: 12px 30px; background: #2E7D32; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .match-icon { font-size: 48px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 It's a Match!</h1>
            </div>
            <div class="content">
              <div class="match-icon">💚</div>
              <h2>Congratulations, ${name}!</h2>
              <p><strong>${matchName}</strong> likes you too!</p>
              <p>This could be the start of something beautiful. May Allah bless this connection.</p>
              <a href="${process.env.FRONTEND_URL}/chat" class="button">Start Conversation</a>
              <p>Remember to keep your conversations respectful and in line with Islamic values.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Islamic Dating. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Match notification sent to ${email}`);
      return { success: true };
    } catch (error) {
      console.error('Error sending match notification:', error);
      throw error;
    }
  }
}

module.exports = new EmailService();
