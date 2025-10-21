const Product = require("../models/Product");

// 🟢 CREATE PRODUCT
exports.createProduct = async (req, res) => {
  try {
    const { nom, marque, categorie, quantite, prixAchat } = req.body;

    if (
      !nom ||
      !marque ||
      !categorie ||
      quantite == null ||
      prixAchat == null
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newProduct = await Product.create({
      nom,
      marque,
      categorie,
      quantite,
      prixAchat,
      createdBy: req.user.id, // admin ID from token
    });

    return res.status(201).json({
      message: "Product created successfully",
      product: newProduct,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

// 🔵 GET ALL PRODUCTS
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().populate("createdBy", "name email");
    return res.status(200).json({
      count: products.length,
      products,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// 🟡 GET ONE PRODUCT BY ID
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id).populate(
      "createdBy",
      "name email"
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json({ product });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// 🟠 UPDATE PRODUCT
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, marque, categorie, quantite, prixAchat } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.nom = nom || product.nom;
    product.marque = marque || product.marque;
    product.categorie = categorie || product.categorie;
   if (quantite !== undefined && quantite !== null) {
     product.quantite = Number(quantite);
   }
    product.prixAchat = Number(prixAchat);

    await product.save();
    console.log("After save:", typeof product.quantite, product.quantite);

    return res.status(200).json({
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// 🔴 DELETE PRODUCT
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
exports.increase = async (req, res) => {
  try {
    const quantite = parseInt(req.body.quantite, 10);

    const product = await Product.findById(req.params.id);
    if (!product)
      return res.status(404).json({ message: "Produit introuvable" });

    console.log("Before:", product.quantite, "Adding:", quantite);
    product.quantite = Number(product.quantite || 0) + Number(quantite || 0);

    await product.save();
    console.log("After save:", product.quantite);

    res.json({ message: "Quantité mise à jour", product });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};
