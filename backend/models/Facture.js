const mongoose = require("mongoose");

const factureSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["client", "fournisseur"],
      required: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: function () {
        return this.type === "client";
      },
    },
    fournisseur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Fournisseur",
      required: function () {
        return this.type === "fournisseur";
      },
    },
    produits: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantite: { type: Number, required: true, min: 1 },
        prixUnitaire: { type: Number, required: true, min: 0 },
        total: { type: Number, required: true, min: 0 },
      },
    ],
    montantTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    montantPaye: {
      type: Number,
      required: true,
      default: 0,
    },
    resteAPayer: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["paid", "pending"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Facture", factureSchema);
