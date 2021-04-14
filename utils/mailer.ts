const nodemailer = require("nodemailer");
const config = require("./config");

var mail = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "hello@bitswap.network",
    pass: config.MAIL,
  },
});

const sendMail = (toEmail, subject, text) => {
  const mailOptions = {
    from: "hello@bitswap.network",
    to: toEmail,
    subject: subject,
    text: text,
  };
  mail.sendMail(mailOptions, function (error, info) {
    if (error) {
      throw error;
    } else {
      return info.response;
    }
  });
};

export default sendMail;
