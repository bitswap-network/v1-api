const nodemailer = require("nodemailer");
const config = require("./config");

const mail = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "support@bitswap.network",
    pass: config.MAIL
  }
});

function sendMail(toEmail, subject, html) {
  const mailOptions = {
    from: "support@bitswap.network",
    to: toEmail,
    subject: subject,
    html: html
  };
  mail.sendMail(mailOptions, function (error, info) {
    if (error) {
      throw error;
    } else {
      return info.response;
    }
  });
}

export default sendMail;
