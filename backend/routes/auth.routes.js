const express = require("express");
const router = express.Router();
const authControllers = require("../controllers/auth.controller");

// ✅ Use the specific function exported from your controller
router.post("/register", authControllers.adminRegister);
router.post("/login", authControllers.adminLogin);

module.exports = router;
