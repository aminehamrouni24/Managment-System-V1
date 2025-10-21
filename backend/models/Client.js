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
      unique: true,
      lowercase: true,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },

    produitsAchetes: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product", // 🔗 Reference to the Product model
          required: true,
        },
        quantite: {
          type: Number,
          required: true,
          min: 1,
        },
        prixAchat: {
          type: Number,
          required: true,
          min: 0,
        },
        montantTotal: {
          type: Number,
          required: true,
          min: 0,
        },
        montantPaye: {
          type: Number,
          required: true,
          min: 0,
          default: 0,
        },
        resteAPayer: {
          type: Number,
          required: true,
          min: 0,
        },
        dateAchat: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Client", clientSchema);
