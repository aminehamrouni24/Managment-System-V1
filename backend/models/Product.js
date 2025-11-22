const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: true,
      trim: true,
    },
    marque: {
      type: String,
      required: true,
      trim: true,
    },
    
    quantite: {
      type: Number,
      required: true,
      min: 0,
    },
    prixAchat: {
      type: Number,
      required: true,
      min: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin", // The user who created this product
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
