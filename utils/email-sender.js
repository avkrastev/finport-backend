const nodemailer = require("nodemailer");

const sendEmail = async (email, subject, html) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "mail.telesto.dev",
      port: 465,
      secure: true, // use SSL
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailConfigurations = {
      from: process.env.EMAIL_USER,
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
