const Client = require("../models/Client");
const Product = require("../models/Product");

// 🟢 CREATE CLIENT
exports.createClient = async (req, res) => {
  try {
    const { name, email, address, phone } = req.body;

    const existingClient = await Client.findOne({ email });
    if (existingClient) {
      return res.status(400).json({ message: "Client already exists" });
    }

    const newClient = await Client.create({ name, email, address , phone});
    return res.status(201).json({
      message: "Client created successfully",
      client: newClient,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// 🔵 GET ALL CLIENTS
exports.getAllClients = async (req, res) => {
  try {
    const clients = await Client.find().populate(
      "produitsAchetes.product",
      "nom marque categorie prixAchat"
    );
    return res.status(200).json({ count: clients.length, clients });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// 🟡 GET ONE CLIENT BY ID
exports.getClientById = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await Client.findById(id).populate(
      "produitsAchetes.product",
      "nom marque categorie prixAchat"
    );
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }
    return res.status(200).json({ client });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// 🟠 UPDATE CLIENT INFO
exports.updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, address , phone } = req.body;

    const updatedClient = await Client.findByIdAndUpdate(
      id,
      { name, email, address , phone },
      { new: true }
    );

    if (!updatedClient) {
      return res.status(404).json({ message: "Client not found" });
    }

    return res.status(200).json({
      message: "Client updated successfully",
      client: updatedClient,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// 🔴 DELETE CLIENT
exports.deleteClient = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedClient = await Client.findByIdAndDelete(id);
    if (!deletedClient) {
      return res.status(404).json({ message: "Client not found" });
    }

    return res.status(200).json({ message: "Client deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// 🛒 ADD A PURCHASE FOR A CLIENT (with prixVente + marge)
exports.addPurchase = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { productId, quantite, montantPaye, prixVente } = req.body;

    // Validate client
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    // Validate product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Ensure numeric values
    const quantiteNum = Number(quantite);
    const montantPayeNum = Number(montantPaye);
    const prixAchat = Number(product.prixAchat);
    const prixVenteNum = prixVente ? Number(prixVente) : prixAchat;
    const marge = prixVenteNum - prixAchat;

    // Stock check
    if (product.quantite < quantiteNum) {
      return res.status(400).json({ message: "Not enough stock available" });
    }

    // Calculations
    const montantTotal = prixVenteNum * quantiteNum;
    const resteAPayer = montantTotal - montantPayeNum;

    // Update stock
    product.quantite -= quantiteNum;
    await product.save();

    // Add purchase with prixVente + marge
    client.produitsAchetes.push({
      product: productId,
      quantite: quantiteNum,
      prixAchat,
      prixVente: prixVenteNum,
      marge,
      montantTotal,
      montantPaye: montantPayeNum,
      resteAPayer,
      dateAchat: new Date(),
    });

    await client.save();

    const updatedClient = await Client.findById(clientId).populate(
      "produitsAchetes.product",
      "nom marque categorie prixAchat"
    );

    return res.status(200).json({
      message: "Purchase added successfully",
      client: updatedClient,
    });
  } catch (error) {
    console.error("Add Purchase Error:", error);
    return res.status(500).json({ message: error.message });
  }
};




// 💰 UPDATE PAYMENT FOR A PURCHASE
exports.updatePayment = async (req, res) => {
  try {
    const { clientId, productId } = req.params;
    const { additionalPayment } = req.body;

    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    // Fix comparison for populated products
    const purchase = client.produitsAchetes.find(
      (p) =>
        p.product?.toString() === productId ||
        p.product?._id?.toString() === productId
    );

    if (!purchase) {
      return res
        .status(404)
        .json({ message: "Purchase not found for this product" });
    }

    // Update payment
    purchase.montantPaye += Number(additionalPayment);
    purchase.resteAPayer = purchase.montantTotal - purchase.montantPaye;

    await client.save();

    return res.status(200).json({
      message: "Payment updated successfully",
      purchase,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};