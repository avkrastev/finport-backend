const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const HttpError = require("../models/http-error");
const User = require("../models/user");
const Asset = require("../models/asset");
const History = require("../models/history");
const P2P = require("../models/p2p");
const { CATEGORIES } = require("../utils/categories");
const sendEmail = require("../utils/email-sender");
const path = require("path");
const fs = require("fs");
const handlebars = require("handlebars");

const signup = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(new HttpError("Error!", 422));
  }

  const { name, email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email });
  } catch (err) {
    const error = new HttpError("Signing up failed, try again.", 500);
    return next(error);
  }

  if (existingUser) {
    const error = new HttpError("Could not create user, email already exists.", 500);
    return next(error);
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError("Signing up failed, try again.", 500);
    return next(error);
  }

  const newUser = new User({
    name,
    email,
    image: "avatar1.jpg",
    password: hashedPassword,
    categories: CATEGORIES,
    assets: [],
  });

  try {
    newUser.save();
  } catch (err) {
    const error = new HttpError("Adding new user failed, try again.", 500);
    return next(error);
  }

  let token;
  try {
    token = jwt.sign({ userId: newUser.id, email: newUser.email }, process.env.JWT_KEY, {
      expiresIn: "12h",
    });
  } catch (err) {
    const error = new HttpError("Adding new user failed, try again.", 500);
    return next(error);
  }

  const userData = Object.fromEntries(
    Object.entries(newUser.toObject({ getters: true })).filter(
      ([key]) => !["password", "id", "__v", "_id"].includes(key)
    )
  );

  const htmlToSend = prepareVerificationEmail(newUser, "verify");

  await sendEmail(newUser.email, "Email Verification", htmlToSend);

  res.status(201).json({
    userId: newUser.id,
    email: newUser.email,
    token,
    userData,
  });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email });
  } catch (err) {
    const error = new HttpError("Logging in failed, try again.", 500);
    return next(error);
  }

  if (!existingUser) {
    const error = new HttpError("Invalid credentials, try again.", 403);
    return next(error);
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    const error = new HttpError("Logging in failed, try again.", 500);
    return next(error);
  }

  if (!isValidPassword) {
    const error = new HttpError("Invalid credentials, try again.", 403);
    return next(error);
  }

  let token;
  try {
    token = jwt.sign({ userId: existingUser.id, email: existingUser.email }, process.env.JWT_KEY, {
      expiresIn: "12h",
    });
  } catch (err) {
    const error = new HttpError("Logging in failed, try again.", 500);
    return next(error);
  }

  const userData = Object.fromEntries(
    Object.entries(existingUser.toObject({ getters: true })).filter(
      ([key]) => !["password", "id", "__v", "_id"].includes(key)
    )
  );

  res.json({
    userID: existingUser.id,
    email: existingUser.email,
    token,
    userData,
  });
};

const getLoggedInUserData = async (req, res, next) => {
  const loggedInUserId = req.userData.userId;
  let userData = {};

  try {
    userData = await User.findById(loggedInUserId);
  } catch (err) {
    const error = new HttpError("Something went wrong. Please try again!", 500);
    return next(error);
  }

  res.json({
    userData: userData.toObject({ getters: true }),
  });
};

const updateUser = async (req, res, next) => {
  try {
    await User.findOneAndUpdate(
      { _id: req.userData.userId },
      { $set: { [req.body.key]: req.body.data } }
    );
  } catch (err) {
    const error = new HttpError("Something went wrong. Please try again!", 500);
    return next(error);
  }

  res.json({ [req.body.key]: req.body.data });
};

const deleteUser = async (req, res, next) => {
  let user;

  try {
    user = await User.findById(req.params.id);
  } catch (err) {
    const error = new HttpError("ser not found, try again.", 500);
    return next(error);
  }

  if (!user) {
    const error = new HttpError("Could not find user with provided id.", 404);
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await User.deleteOne({ session: sess, _id: req.params.id });
    await Asset.deleteMany({ session: sess, creator: req.params.id });
    await History.deleteMany({ session: sess, creator: req.params.id });
    await P2P.deleteMany({ session: sess, creator: req.params.id });
    sess.commitTransaction();
  } catch (err) {
    const error = new HttpError("Something went wrong. Please try again!", 500);
    return next(error);
  }

  res.status(200).json({ message: "Deleted asset" });
};

const verifyMail = async (req, res, next) => {
  const token = req.query.id;

  if (token) {
    try {
      jwt.verify(token, process.env.JWT_MAIL_KEY, async (e, decoded) => {
        if (e) {
          console.log(e);

          return res
            .status(202)
            .json({ message: "The link has expired! Please, resend the verification e-mail!" });
        } else {
          id = decoded.id;
          try {
            existingUser = await User.findOneAndUpdate(
              { _id: id },
              { $set: { email_verified: true } }
            );
            return res
              .status(200)
              .json({ message: "You have successfully verified your e-mail! Thank you!" });
          } catch (err) {
            return res
              .status(500)
              .json({ message: "An error ocurred! Please, resend the verification e-mail!" });
          }
        }
      });
    } catch (err) {
      console.log(err);
      return res
        .status(403)
        .json({ message: "An error ocurred! Please, resend the verification e-mail!" });
    }
  } else {
    return res
      .status(403)
      .json({ message: "An error ocurred! Please, resend the verification e-mail!" });
  }
};

const sendVerificationEmail = async (req, res, next) => {
  let user;

  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError("User not found, try again.", 500);
    return next(error);
  }

  const htmlToSend = prepareVerificationEmail(user, "verify");

  await sendEmail(user.email, "Email Verification", htmlToSend);

  res.status(200).json({ message: "Mail sent!" });
};

const prepareVerificationEmail = (userData, type) => {
  const filePath = path.join(__dirname, `../templates/${type}.html`);
  const source = fs.readFileSync(filePath, "utf-8").toString();
  const template = handlebars.compile(source);

  const token = jwt.sign(
    {
      id: userData._id,
      created: new Date().toString(),
    },
    process.env.JWT_MAIL_KEY,
    { expiresIn: "1h" }
  );

  const replacements = {
    username: userData.name,
    url: process.env.PUBLIC_URL + type + "?id=" + token,
    year: new Date().getFullYear(),
  };

  return template(replacements);
};

const setResetPasswordLink = async (req, res, next) => {
  console.log(req.body)
  console.log(process.env)
  try {
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      const htmlToSend = prepareVerificationEmail(user, "reset-password");

      await sendEmail(user.email, "Password Reset", htmlToSend);

      res.status(200).json({ message: "Mail sent!" });
    } else {
      return res.status(400).json({
        message: "Email Address is invalid",
      });
    }
  } catch (err) {
    console.log(err);
    const error = new HttpError("Server problem, try again.", 500);
    return next(error);
  }
};

const changePassword = async (req, res, next) => {
  const token = req.body.id;
  if (token) {
    try {
      jwt.verify(token, process.env.JWT_MAIL_KEY, async (e, decoded) => {
        if (e) {
          console.log(e);

          return res
            .status(202)
            .json({ message: "The link has expired! Please, start the process again!" });
        } else {
          id = decoded.id;
          try {
            let hashedPassword;
            try {
              hashedPassword = await bcrypt.hash(req.body.password, 12);
            } catch (err) {
              const error = new HttpError("Change password failed, try again.", 500);
              return next(error);
            }

            existingUser = await User.findOneAndUpdate(
              { _id: id },
              { $set: { password: hashedPassword } }
            );
            return res
              .status(200)
              .json({ message: "You have successfully changed your password!" });
          } catch (err) {
            return res
              .status(500)
              .json({ message: "An error ocurred! Please, start the process again!" });
          }
        }
      });
    } catch (err) {
      console.log(err);
      return res
        .status(403)
        .json({ message: "An error ocurred! Please, start the process again!" });
    }
  } else {
    return res.status(403).json({ message: "An error ocurred! Please, start the process again!" });
  }
};

exports.signup = signup;
exports.login = login;
exports.getLoggedInUserData = getLoggedInUserData;
exports.updateUser = updateUser;
exports.deleteUser = deleteUser;
exports.verifyMail = verifyMail;
exports.sendVerificationEmail = sendVerificationEmail;
exports.setResetPasswordLink = setResetPasswordLink;
exports.changePassword = changePassword;
