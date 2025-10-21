const Product = require("../models/Product");
const Client = require("../models/Client");
const Fournisseur = require("../models/Fournisseur");
const Facture = require("../models/Facture");

exports.getStatistics = async (req, res) => {
  try {
    // 🧾 Get counts
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

    // 💰 Valeur totale des produits
    const products = await Product.find();
    const valeurProduits = products.reduce(
      (sum, p) => sum + (p.prixAchat || 0) * (p.quantite || 0),
      0
    );

    // 📅 Filter purchases for current month
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const clients = await Client.find();
    const fournisseurs = await Fournisseur.find();

    // 🟢 Ventes mensuelles (clients)
    let ventesMensuelles = 0;
    clients.forEach((client) => {
      client.produitsAchetes.forEach((achat) => {
        const date = new Date(achat.dateAchat);
        if (
          date.getMonth() === currentMonth &&
          date.getFullYear() === currentYear
        ) {
          ventesMensuelles += achat.montantTotal || 0;
        }
      });
    });

    // 🟠 Achats mensuels (fournisseurs)
    let achatsMensuels = 0;
    fournisseurs.forEach((fournisseur) => {
      fournisseur.produitsFournis.forEach((livraison) => {
        const date = new Date(livraison.createdAt);
        if (
          date.getMonth() === currentMonth &&
          date.getFullYear() === currentYear
        ) {
          achatsMensuels += livraison.montantTotal || 0;
        }
      });
    });

    // 📊 Marge mensuelle = ventes - achats
    const margesMensuelles = ventesMensuelles - achatsMensuels;

    res.status(200).json({
      message: "Statistiques récupérées avec succès",
      totalProduits: productCount,
      totalClients: clientCount,
      totalFournisseurs: fournisseurCount,
      totalFactures,
      facturesClients: clientFactures,
      facturesFournisseurs: fournisseurFactures,
      valeurProduits,
      ventesMensuelles,
      margesMensuelles,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ message: error.message });
  }
};
