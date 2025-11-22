// models/Partner.js
const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  quantite: { type: Number, required: true, min: 0 },
  prixUnitaire: { type: Number, required: true, min: 0 },
  type: { type: String, enum: ["buy", "supply", "settlement"], required: true },
  montantTotal: { type: Number, required: true, min: 0 },
  montantPaye: { type: Number, required: true, default: 0, min: 0 },
  resteAPayer: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ["paid", "pending"], default: "pending" },
  date: { type: Date, default: Date.now },
});

const partnerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    identifier: { type: String, trim: true },
    contact: { type: String },
    transactions: [transactionSchema],
  },
  { timestamps: true }
);

partnerSchema.pre("save", function (next) {
  this.transactions.forEach((t) => {
    t.montantTotal = Number(t.prixUnitaire || 0) * Number(t.quantite || 0);
    t.montantPaye = Number(t.montantPaye || 0);
    t.resteAPayer = Math.max(
      0,
      Number(t.montantTotal || 0) - Number(t.montantPaye || 0)
    );
    t.status = t.resteAPayer <= 0 ? "paid" : "pending";
  });
  next();
});

module.exports = mongoose.model("Partner", partnerSchema);
