const express = require("express");
const {
  getP2p,
  getP2pById,
  addP2p,
  updateP2p,
  deleteP2p
} = require("../controllers/p2p");
const checkAuth = require("../middleware/auth");

const router = express.Router();

router.use(checkAuth);

router.get("/", (req, res, next) => {
  getP2p(req, res, next);
});

router.get("/:id", (req, res, next) => {
  getP2pById(req, res, next);
});

router.post("/", (req, res, next) => {
  addP2p(req, res, next);
});

router.patch("/:id", (req, res, next) => {
  updateP2p(req, res, next);
});

router.delete("/:id", (req, res, next) => {
  deleteP2p(req, res, next);
});

module.exports = router;
