const requiredEnvVars = [
  'MAILER_HOST',
  'MAILER_PORT',
  'MAILER_USER',
  'MAILER_PASSWORD',
  'MAILER_FROM_EMAIL',
  'MAILER_RESET_URL'
];

const missingVars = requiredEnvVars.filter((key) => !process.env[key]);

if (missingVars.length > 0) {
  throw new Error(`Missing required mailer environment variables: ${missingVars.join(', ')}`);
}

const mailerPort = Number(process.env.MAILER_PORT);
if (Number.isNaN(mailerPort)) {
  throw new Error('MAILER_PORT must be a number');
}

const normalizeBaseUrl = (value) => value.replace(/\/+$/, '');
const buildResetLink = (token) => `${normalizeBaseUrl(process.env.MAILER_RESET_URL)}/${token}`;

const passwordResetSubject = process.env.MAILER_PASSWORD_RESET_SUBJECT || 'Reset your password';
const passwordResetGreeting = process.env.MAILER_PASSWORD_RESET_GREETING || 'Assalamu Alaikum';
const passwordResetClosing = process.env.MAILER_PASSWORD_RESET_CLOSING || 'If you did not request this change, you can safely ignore this email.';

const templates = {
  passwordReset: ({ firstName, token }) => {
    const safeName = firstName ? firstName.trim() : 'there';
    const resetLink = buildResetLink(token);

    return {
      subject: passwordResetSubject,
      text: `${passwordResetGreeting} ${safeName},\n\n` +
        'We received a request to reset your password. You can set a new password by visiting the link below:\n' +
        `${resetLink}\n\n${passwordResetClosing}\n`,
      html: `
        <p>${passwordResetGreeting} ${safeName},</p>
        <p>We received a request to reset your password. You can set a new password by visiting the link below:</p>
        <p><a href="${resetLink}">Reset your password</a></p>
        <p>${passwordResetClosing}</p>
      `
    };
  }
};

module.exports = {
  transporterConfig: {
    host: process.env.MAILER_HOST,
    port: mailerPort,
    secure: process.env.MAILER_SECURE ? process.env.MAILER_SECURE === 'true' : false,
    auth: {
      user: process.env.MAILER_USER,
      pass: process.env.MAILER_PASSWORD
    }
  },
  defaultFrom: {
    address: process.env.MAILER_FROM_EMAIL,
    name: process.env.MAILER_FROM_NAME || 'Dating2025 Support'
  },
  templates,
  buildResetLink
};
