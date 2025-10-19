const Product = require("../models/Product");
const Client = require("../models/Client");
const Fournisseur = require("../models/Fournisseur");
const Facture = require("../models/Facture");

exports.getStatistics = async (req, res) => {
  try {
    const [
      productCount,
      clientCount,
      fournisseurCount,
      totalFactures,
      clientFactures,
      fournisseurFactures,
    ] = await Promise.all([
      Product.countDocuments(),
      Client.countDocuments(),
      Fournisseur.countDocuments(),
      Facture.countDocuments(),
      Facture.countDocuments({ type: "client" }),
      Facture.countDocuments({ type: "fournisseur" }),
    ]);

    res.status(200).json({
      message: "Statistiques récupérées avec succès",
      totalProduits: productCount,
      totalClients: clientCount,
      totalFournisseurs: fournisseurCount,
      totalFactures,
      facturesClients: clientFactures,
      facturesFournisseurs: fournisseurFactures,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
