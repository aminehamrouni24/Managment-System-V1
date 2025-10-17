const express = require("express");
const router = express.Router();
const { verifyToken, isAdmin } = require("../middleware/auth.middleware");
const adminController = require("../controllers/admin.controller");

// Admin User Management
router.post("/users", verifyToken, isAdmin, adminController.createUser); // Create user
router.get("/users", verifyToken, isAdmin, adminController.getAllUsers); // Get all users
router.get("/users/:id", verifyToken, isAdmin, adminController.getUserById); // Get one user
router.put("/users/:id", verifyToken, isAdmin, adminController.updateUser); // Update user
router.delete("/users/:id", verifyToken, isAdmin, adminController.deleteUser); // Delete user

module.exports = router;
