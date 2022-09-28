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
    const error = new HttpError(
      "Could not create user, email already exists.",
      500
    );
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
    token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      process.env.JWT_KEY,
      { expiresIn: "12h" }
    );
  } catch (err) {
    const error = new HttpError("Adding new user failed, try again.", 500);
    return next(error);
  }

  const userData = Object.fromEntries(
    Object.entries(newUser.toObject({ getters: true })).filter(
      ([key]) => !["password", "id", "__v", "_id"].includes(key)
    )
  );

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
    token = jwt.sign(
      { userId: existingUser.id, email: existingUser.email },
      process.env.JWT_KEY,
      { expiresIn: "12h" }
    );
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
  let existingUser;

  try {
    existingUser = await User.findOneAndUpdate(
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
    const error = new HttpError(
      "Adding new asset asset failed, try again.",
      500
    );
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

exports.signup = signup;
exports.login = login;
exports.getLoggedInUserData = getLoggedInUserData;
exports.updateUser = updateUser;
exports.deleteUser = deleteUser;
