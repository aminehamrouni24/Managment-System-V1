// models/Bordereau.js
const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  designation: { type: String, required: true },
  marque: { type: String },
  categorie: { type: String },
  quantite: { type: Number, required: true, min: 0 },
  prixUnitaire: { type: Number, required: true, min: 0 },
  montant: { type: Number, required: true, min: 0 },
});

const bordereauSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["facture", "bon_de_livraison", "bordereau"],
      default: "bordereau",
    },

    // info société (saisie admin)
    company: {
      name: String,
      address: String,
      phone: String,
      email: String,
      mf: String,
    },

    // info client / partner
    partner: {
      name: String,
      idNumber: String, // CIN ou ID
      contact: String,
      address: String,
    },

    // livraison metadata
    livraison: {
      date: { type: Date, default: Date.now },
      numero: String,
      transporteur: String,
      camion: String,
      cin: String,
    },

    items: [itemSchema],

    totals: {
      totalHT: { type: Number, default: 0 },
      payé: { type: Number, default: 0 },
      reste: { type: Number, default: 0 },
    },

    notes: String,

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Bordereau", bordereauSchema);
