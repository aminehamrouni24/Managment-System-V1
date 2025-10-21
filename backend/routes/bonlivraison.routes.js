const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth.middleware");
const bonLivraisonController = require("../controllers/bonLivraisonController");

// 🟢 Créer un bon de livraison
router.post("/", verifyToken, bonLivraisonController.createBonLivraison);

// 🔵 Récupérer tous les bons
router.get("/", verifyToken, bonLivraisonController.getAllBons);

// 🟡 Récupérer un bon spécifique
router.get("/:id", verifyToken, bonLivraisonController.getBonById);

module.exports = router;
