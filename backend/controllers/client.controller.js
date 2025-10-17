const Client = require("../models/Client");
const Product = require("../models/Product");

// 🟢 CREATE CLIENT
exports.createClient = async (req, res) => {
  try {
    const { name, email, address } = req.body;

    const existingClient = await Client.findOne({ email });
    if (existingClient) {
      return res.status(400).json({ message: "Client already exists" });
    }

    const newClient = await Client.create({ name, email, address });
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
    const { name, email, address } = req.body;

    const updatedClient = await Client.findByIdAndUpdate(
      id,
      { name, email, address },
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

// 🛒 ADD A PURCHASE FOR A CLIENT
exports.addPurchase = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { productId, quantite, montantPaye } = req.body;

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

    // Check available stock
    if (product.quantite < quantite) {
      return res.status(400).json({ message: "Not enough stock available" });
    }

    const prixAchat = product.prixAchat;
    const montantTotal = prixAchat * quantite;
    const resteAPayer = montantTotal - montantPaye;

    // Update product quantity
    product.quantite -= quantite;
    await product.save();

    // Add purchase to client
    client.produitsAchetes.push({
      product: productId,
      quantite,
      prixAchat,
      montantTotal,
      montantPaye,
      resteAPayer,
      dateAchat: new Date(),
    });

    await client.save();

    return res.status(200).json({
      message: "Purchase added successfully",
      client,
    });
  } catch (error) {
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

    const purchase = client.produitsAchetes.find(
      (p) => p.product.toString() === productId
    );

    if (!purchase) {
      return res
        .status(404)
        .json({ message: "Purchase not found for this product" });
    }

    // Update payment
    purchase.montantPaye += additionalPayment;
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
