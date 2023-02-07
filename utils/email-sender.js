const nodemailer = require("nodemailer");

const sendEmail = async (email, subject, html) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "mail.telesto.dev",
      port: 465,
      secure: true, // use SSL
      auth: {
        user: "finport@telesto.dev",
        pass: "str!peH8er",
      },
    });

    const mailConfigurations = {
      from: "finport@telesto.dev",
      to: email,
      subject: subject,
      html: html
    };

    await transporter.sendMail(mailConfigurations);
  } catch (error) {
    throw Error;
  }
};

module.exports = sendEmail;
