const express = require("express");
const router = express.Router();
const fournisseurController = require("../controllers/fournisseur.controller");
const { verifyToken, isAdmin } = require("../middleware/auth.middleware");

// CRUD
router.post("/", verifyToken, fournisseurController.createFournisseur);
router.get("/", verifyToken, fournisseurController.getAllFournisseurs);
router.get("/:id", verifyToken, fournisseurController.getFournisseurById);
router.put("/:id", verifyToken, fournisseurController.updateFournisseur);
router.delete("/:id", verifyToken, fournisseurController.deleteFournisseur);

// Delivery management
router.post("/:id/produit", verifyToken, fournisseurController.addDelivery);

// Payment update
router.put(
  "/:id/produit/:productId/payment",
  verifyToken,
  fournisseurController.updatePayment
);

module.exports = router;
