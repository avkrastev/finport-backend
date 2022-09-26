const { validationResult } = require("express-validator");
const HttpError = require("../models/http-error");
const P2p = require("../models/p2p");
const User = require("../models/user");
const mongoose = require("mongoose");

const getP2p = async (req, res, next) => {
  let p2p;

  try {
    const creator = req.userData.userId;
    p2p = await P2p.find({ creator });
  } catch (err) {
    const error = new HttpError("Something went wrong!", 500);
    return next(error);
  }

  if (!p2p) {
    const error = new HttpError("Could not find any P2P percentages!", 404);
    return next(error);
  }

  res.json({ p2p });
};

const getP2pById = async (req, res, next) => {
  let p2p;
  try {
    p2p = await P2p.findById(req.params.id);
  } catch (err) {
    const error = new HttpError("Something went wrong!", 500);
    return next(error);
  }

  if (!p2p) {
    const error = new HttpError("Could not find any P2P percentages!", 404);
    return next(error);
  }

  res.json({ p2p: p2p.toObject({ getters: true }) });
};

const addP2p = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Error!", 422));
  }

  // TODO check for existing value
  const creator = req.userData.userId;

  const addNewP2pPercentage = new P2p({
    ...req.body,
    creator,
  });

  let user;

  try {
    user = await User.findById(creator);
  } catch (err) {
    const error = new HttpError(
      "Adding new P2P percentage failed, try again.",
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
    await addNewP2pPercentage.save({ session: sess });
    user.p2p.push(addNewP2pPercentage);
    await user.save({ session: sess, validateModifiedOnly: true });
    sess.commitTransaction();
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Adding new P2P percentage failed, try again.",
      500
    );
    return next(error);
  }

  res.json({ p2p: addNewP2pPercentage.toObject({ getters: true }) });
};

const updateP2p = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Error!", 422));
  }

  const { apr, id } = req.body;

  let p2p;
  try {
    p2p = await P2p.findById(id);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find P2P percentage by ID.",
      500
    );
    return next(error);
  }

  if (p2p.creator.toString() !== req.userData.userId) {
    const error = new HttpError(
      "You are not allowed to modify this P2P percentage.",
      401
    );
    return next(error);
  }

  if (apr) p2p.apr = apr;

  try {
    await p2p.save();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update P2P percentage.",
      500
    );
    return next(error);
  }

  res.status(200).json({ p2p: p2p.toObject({ getters: true }) });
};

const deleteP2p = async (req, res, next) => {
  try {
    const sess = await mongoose.startSession();

    let p2p;
    try {
        p2p = await P2p.findById(req.params.id).populate("creator");
    } catch (err) {
      const error = new HttpError(
        "Something went wrong, could not find P2P percentage by ID.",
        500
      );
      return error;
    }

    if (!p2p) {
      const error = new HttpError("Could not find P2P percentage for this ID.", 404);
      return error;
    }

    if (p2p.creator.id !== userId) {
      const error = new HttpError(
        "You are not allowed to delete this P2P percentage.",
        401
      );
      return error;
    }

    try {
      sess.startTransaction();
      await p2p.remove({ session: sess });
      p2p.creator.p2p.pull(p2p);
      await p2p.creator.save({ session: sess });
      sess.commitTransaction();
    } catch (err) {
      const error = new HttpError(
        "Something went wrong, could not delete P2P percentage.",
        500
      );
      return error;
    }
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update P2P percentage.",
      500
    );
    return next(error);
  }

  res.status(200).json({ message: "Deleted P2P percentage!" });
};

exports.getP2p = getP2p;
exports.getP2pById = getP2pById;
exports.addP2p = addP2p;
exports.updateP2p = updateP2p;
exports.deleteP2p = deleteP2p;
