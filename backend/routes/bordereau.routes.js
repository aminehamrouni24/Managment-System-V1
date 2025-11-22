// routes/bordereau.routes.js
const express = require("express");
const router = express.Router();
const controller = require("../controllers/bordereau.controller");
const { verifyToken, isAdmin } = require("../middleware/auth.middleware");

router.get("/", verifyToken, isAdmin, controller.getAll);
router.post("/", verifyToken, isAdmin, controller.create);
router.get("/:id", verifyToken, isAdmin, controller.getOne);
router.put("/:id", verifyToken, isAdmin, controller.update);
router.delete("/:id", verifyToken, isAdmin, controller.remove);

module.exports = router;
