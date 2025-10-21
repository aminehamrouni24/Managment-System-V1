const Fournisseur = require("../models/Fournisseur");
const Product = require("../models/Product");

// ✅ CREATE fournisseur
exports.createFournisseur = async (req, res) => {
  try {
    const { name, contact } = req.body;

    const fournisseur = await Fournisseur.create({ name, contact });

    res.status(201).json({
      message: "Fournisseur created successfully",
      data: fournisseur,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ GET all fournisseurs
exports.getAllFournisseurs = async (req, res) => {
  try {
    const fournisseurs = await Fournisseur.find().populate(
      "produitsFournis.product",
      "nom marque categorie"
    );
    res.status(200).json({ data: fournisseurs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ GET one fournisseur
exports.getFournisseurById = async (req, res) => {
  try {
    const fournisseur = await Fournisseur.findById(req.params.id).populate(
      "produitsFournis.product",
      "nom marque categorie"
    );

    if (!fournisseur)
      return res.status(404).json({ message: "Fournisseur not found" });

    res.status(200).json({ data: fournisseur });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ UPDATE fournisseur info (name or contact)
exports.updateFournisseur = async (req, res) => {
  try {
    const { name, contact } = req.body;

    const fournisseur = await Fournisseur.findByIdAndUpdate(
      req.params.id,
      { name, contact },
      { new: true }
    );

    if (!fournisseur)
      return res.status(404).json({ message: "Fournisseur not found" });

    res.status(200).json({
      message: "Fournisseur updated successfully",
      data: fournisseur,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ DELETE fournisseur
exports.deleteFournisseur = async (req, res) => {
  try {
    const fournisseur = await Fournisseur.findByIdAndDelete(req.params.id);

    if (!fournisseur)
      return res.status(404).json({ message: "Fournisseur not found" });

    res.status(200).json({ message: "Fournisseur deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ ADD product delivery
// exports.addDelivery = async (req, res) => {
//   try {
//     const { productId, quantite, prixAchat, montantPaye } = req.body;

//     const fournisseur = await Fournisseur.findById(req.params.id);
//     if (!fournisseur)
//       return res.status(404).json({ message: "Fournisseur not found" });

//     const product = await Product.findById(productId);
//     if (!product) return res.status(404).json({ message: "Product not found" });

//     // Add the delivery
//     fournisseur.produitsFournis.push({
//       product: productId,
//       quantite,
//       prixAchat,
//       montantPaye,
//       montantTotal: prixAchat * quantite,
//       resteAPayer: prixAchat * quantite - montantPaye,
//       status: montantPaye >= prixAchat * quantite ? "paid" : "pending",
//     });

//     await fournisseur.save();

//     // Increase stock quantity in Product
//     product.quantite += quantite;
//     await product.save();

//     res.status(200).json({
//       message: "Delivery added and stock updated successfully",
//       data: fournisseur,
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };
exports.addDelivery = async (req, res) => {
  try {
    const { productId, quantite, prixAchat, montantPaye } = req.body;

    const fournisseur = await Fournisseur.findById(req.params.id);
    if (!fournisseur)
      return res.status(404).json({ message: "Fournisseur not found" });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const quantiteNum = Number(quantite);
    const prixNum = Number(prixAchat);
    const montantNum = Number(montantPaye);

    // Add the delivery
    fournisseur.produitsFournis.push({
      product: productId,
      quantite: quantiteNum,
      prixAchat: prixNum,
      montantPaye: montantNum,
      montantTotal: prixNum * quantiteNum,
      resteAPayer: prixNum * quantiteNum - montantNum,
      status: montantNum >= prixNum * quantiteNum ? "paid" : "pending",
    });

    await fournisseur.save();

    // ✅ Increase stock quantity in Product
   product.quantite = Number(product.quantite || 0) + Number(quantite || 0);

    await product.save();

    res.status(200).json({
      message: "Delivery added and stock updated successfully",
      data: fournisseur,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ UPDATE payment for a specific product delivery
exports.updatePayment = async (req, res) => {
  try {
    const { additionalPayment } = req.body;
    const { id, productId } = req.params;

    const fournisseur = await Fournisseur.findById(id);
    if (!fournisseur)
      return res.status(404).json({ message: "Fournisseur not found" });

    const delivery = fournisseur.produitsFournis.id(productId);
    if (!delivery)
      return res.status(404).json({ message: "Delivery not found" });

    // Update payment info
    delivery.montantPaye += additionalPayment;
    delivery.resteAPayer = delivery.montantTotal - delivery.montantPaye;
    delivery.status = delivery.resteAPayer <= 0 ? "paid" : "pending";

    await fournisseur.save();

    res.status(200).json({
      message: "Payment updated successfully",
      data: delivery,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
