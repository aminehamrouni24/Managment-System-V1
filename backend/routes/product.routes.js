const express = require("express");
const router = express.Router();
const { verifyToken, isAdmin } = require("../middleware/auth.middleware");
const productController = require("../controllers/product.controller");

// ✅ All product routes are admin-only
router.post("/", verifyToken, isAdmin, productController.createProduct); // Create
router.get("/all", verifyToken, isAdmin, productController.getAllProducts); // Get all
router.get("/:id", verifyToken, isAdmin, productController.getProductById); // Get one
router.put("/:id", verifyToken, isAdmin, productController.updateProduct); // Update
router.delete("/:id", verifyToken, isAdmin, productController.deleteProduct); // Delete

module.exports = router;
