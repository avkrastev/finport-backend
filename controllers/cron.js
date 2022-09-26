const SummaryAssetsStats = require("../models/stats/summary");
const HttpError = require("../models/http-error");

const processHistoryData = async (req, res, next) => {
  try {
    const summaryAssetsStats = new SummaryAssetsStats();
    await summaryAssetsStats.processHistoryData();
  } catch (err) {
    const error = new HttpError("Something went wrong!", 500);
    return next(error);
  }

  res.json({ success: true });
};

exports.processHistoryData = processHistoryData;
