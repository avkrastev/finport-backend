const express = require("express");
const { processHistoryData } = require("../controllers/cron");

const router = express.Router();

router.get("/processHistoryData", (req, res, next) => {
  processHistoryData(req, res, next);
});

module.exports = router;
