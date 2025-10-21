const mongoose = require("mongoose");

const bonLivraisonSchema = new mongoose.Schema(
  {
    numeroBL: {
      type: String,
      required: true,
      unique: true,
    },
    client: {
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
        designation: { type: String, required: true, trim: true },
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
    adresseLivraison: {
      type: String,
      required: true,
    },
    telephoneClient: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["delivered", "pending"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BonLivraison", bonLivraisonSchema);
