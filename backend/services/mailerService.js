const nodemailer = require('nodemailer');
const { transporterConfig, defaultFrom, templates } = require('../config/mailerConfig');

const transporter = nodemailer.createTransport(transporterConfig);

const formatFromAddress = () => {
  if (defaultFrom.name) {
    return `${defaultFrom.name} <${defaultFrom.address}>`;
  }
  return defaultFrom.address;
};

const sendMail = async ({ to, subject, text, html }) => {
  return transporter.sendMail({
    from: formatFromAddress(),
    to,
    subject,
    text,
    html
  });
};

const sendPasswordResetEmail = async ({ email, firstName, resetToken }) => {
  const template = templates.passwordReset({ firstName, token: resetToken });

  return sendMail({
    to: email,
    subject: template.subject,
    text: template.text,
    html: template.html
  });
};

module.exports = {
  sendPasswordResetEmail,
  transporter
};
