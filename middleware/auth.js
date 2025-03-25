const HttpError = require("../models/http-error");
const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  if (req.method === "OPTIONS") {
    return next();
  }

  if (req.path.includes("cron")) {
    return next();
  }

  try {
    if (!req.headers.authorization) {
      throw new Error("No authorization header provided");
    }

    const token = req.headers.authorization.split(" ")[1];
    console.log(token)
    if (!token) {
      throw new Error("Authentication failed, try again!");
    }

    const decodedToken = jwt.verify(token, process.env.JWT_KEY);
    req.userData = { userId: decodedToken.userId };
    next();
  } catch (err) {
    console.log(err);

    const error = new HttpError("Authentication failed catch!", 401);
    return next(error);
  }
};
