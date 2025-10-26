const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    address: String,
    phone: String,

    // 🛒 Produits achetés
    produitsAchetes: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantite: { type: Number, required: true, min: 1 },
        prixAchat: { type: Number, required: true, min: 0 },
        prixVente: { type: Number, required: false, min: 0 }, // ✅ NEW
        marge: { type: Number, required: false, default: 0 }, // ✅ NEW
        montantTotal: { type: Number, required: true, min: 0 },
        montantPaye: { type: Number, required: true, min: 0 },
        resteAPayer: { type: Number, required: true, min: 0 },
        dateAchat: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Client", clientSchema);
