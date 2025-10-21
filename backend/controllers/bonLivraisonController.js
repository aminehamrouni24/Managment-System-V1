const BonLivraison = require("../models/BonLivraison");
const Client = require("../models/Client");
const Product = require("../models/Product");

// Génère un numéro unique pour le BL
function generateNumeroBL() {
  const now = new Date();
  const year = now.getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `BL-${year}-${random}`;
}

// 🟢 Créer un bon de livraison
exports.createBonLivraison = async (req, res) => {
  try {
    const { clientId, produits, adresseLivraison } = req.body;

    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ message: "Client introuvable" });
    }

    let montantTotal = 0;
    const produitsFormatted = [];

    for (const p of produits) {
      const product = await Product.findById(p.productId);
      if (!product) continue;

      const quantite = Number(p.quantite);
      const prixUnitaire = Number(p.prixUnitaire);
      const total = quantite * prixUnitaire;
      montantTotal += total;

      // Mettre à jour le stock
      product.quantite -= quantite;
      await product.save();

      produitsFormatted.push({
        product: product._id,
        designation: product.nom,
        quantite,
        prixUnitaire,
        total,
      });
    }

    const bon = await BonLivraison.create({
      numeroBL: generateNumeroBL(),
      client: client._id,
      produits: produitsFormatted,
      montantTotal,
      adresseLivraison: adresseLivraison || client.address,
      telephoneClient: client.phone,
      status: "delivered",
    });

    res.status(201).json({
      message: "Bon de livraison créé avec succès",
      bon,
    });
  } catch (error) {
    console.error("Erreur lors de la création du bon :", error);
    res.status(500).json({ message: error.message });
  }
};

// 🔵 Tous les bons
exports.getAllBons = async (req, res) => {
  try {
    const bons = await BonLivraison.find()
      .populate("client", "name address phone")
      .populate("produits.product", "nom marque categorie");
    res.status(200).json({ bons });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🟡 Un bon spécifique
exports.getBonById = async (req, res) => {
  try {
    const bon = await BonLivraison.findById(req.params.id)
      .populate("client", "name address phone")
      .populate("produits.product", "nom marque categorie");
    if (!bon) return res.status(404).json({ message: "Bon introuvable" });
    res.status(200).json({ bon });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
