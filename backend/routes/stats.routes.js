const express = require("express");
const router = express.Router();
const { getStatistics } = require("../controllers/stats.controller");
const { verifyToken, isAdmin } = require("../middleware/auth.middleware");

// Admin only
router.get("/", verifyToken, getStatistics);

module.exports = router;
