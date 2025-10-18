const express = require("express");
const router = express.Router();
const { getStatistics } = require("../controllers/stats.controller");
const { verifyToken, isAdmin } = require("../middleware/auth.middleware");

// Admin only
router.get("/", verifyToken, isAdmin, getStatistics);

module.exports = router;
