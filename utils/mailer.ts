const nodemailer = require("nodemailer");
const config = require("./config");

var mail = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "support@bitswap.network",
    pass: config.MAIL,
  },
});

function sendMail(toEmail, subject, html) {
  const mailOptions = {
    from: "support@bitswap.network",
    to: toEmail,
    subject: subject,
    html: html,
  };
  mail.sendMail(mailOptions, function (error, info) {
    if (error) {
      throw error;
    } else {
      return info.response;
    }
  });
}

export const emailverified =
  '<!DOCTYPE html><html><body><p>Your email has been successfully verified.</p><br /><a href="https://app.bitswap.network">Go to BitSwap homepage.</a></body></html>';
export const invalidlink =
  '<!DOCTYPE html><html><body><p>The link is invalid.</p><br /><a href="https://app.bitswap.network">Go to BitSwap homepage.</a></body></html>';
export const servererror =
  '<!DOCTYPE html><html><body><p>An error has occurred.</p><br /><a href="https://app.bitswap.network">Go to BitSwap homepage.</a></body></html>';

export default sendMail;
