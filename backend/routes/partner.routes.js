// routes/partner.routes.js
const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/partner.controller");

// CRUD
router.post("/", ctrl.createPartner);
router.get("/", ctrl.getAllPartners);
router.get("/:id", ctrl.getPartnerById);
router.put("/:id", ctrl.updatePartner);
router.delete("/:id", ctrl.deletePartner);

// transactions
router.post("/:id/transaction", ctrl.addTransaction);
router.put(
  "/:partnerId/transaction/:transactionId/payment",
  ctrl.updatePayment
);

// transfer & settlement
router.post("/transfer/:fromId/:toId", ctrl.transferBetweenPartners);
router.post("/settle/:partnerAId/:partnerBId", ctrl.settleNetBetweenPartners);

// invoice (json or pdf)
router.get("/:id/invoice", ctrl.getInvoice);

module.exports = router;
