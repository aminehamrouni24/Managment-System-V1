const express = require("express");
const router = express.Router();
const { verifyToken, isAdmin } = require("../middleware/auth.middleware");
const clientController = require("../controllers/client.controller");

// ✅ Only Admin can manage clients
router.post("/", verifyToken, isAdmin, clientController.createClient);
router.get("/", verifyToken, isAdmin, clientController.getAllClients);
router.get("/:id", verifyToken, isAdmin, clientController.getClientById);
router.put("/:id", verifyToken, isAdmin, clientController.updateClient);
router.delete("/:id", verifyToken, isAdmin, clientController.deleteClient);

// 💰 Client purchases
router.post(
  "/:clientId/purchase",
  verifyToken,
  isAdmin,
  clientController.addPurchase
);
router.put(
  "/:clientId/purchase/:productId/payment",
  verifyToken,
  isAdmin,
  clientController.updatePayment
);

module.exports = router;
