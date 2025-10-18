const mongoose = require("mongoose");

const bonLivraisonSchema = new mongoose.Schema(
  {
    fournisseur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    produits: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantite: { type: Number, required: true, min: 1 },
        prixAchat: { type: Number, required: true, min: 0 },
        total: { type: Number, required: true, min: 0 },
      },
    ],
    montantTotal: {
      type: Number,
      required: true,
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

module.exports = mongoose.model("BonLivraison", bonLivraisonSchema);
