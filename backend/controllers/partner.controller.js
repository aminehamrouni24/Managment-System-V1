// controllers/partner.controller.js
const Partner = require("../models/Partner");
const Product = require("../models/Product");
const PDFDocument = (() => {
  try {
    return require("pdfkit");
  } catch (e) {
    return null; // fallback, not installed
  }
})();

const buildInvoiceData = (partner, type) => {
  const items = (partner.transactions || [])
    .filter((t) => t.type === type)
    .map((t) => ({
      _id: t._id,
      product: t.product || null,
      quantite: t.quantite,
      prixUnitaire: t.prixUnitaire,
      montantTotal: t.montantTotal,
      montantPaye: t.montantPaye,
      resteAPayer: t.resteAPayer,
      date: t.date,
    }));
  const totals = items.reduce(
    (acc, it) => {
      acc.total += Number(it.montantTotal || 0);
      acc.paid += Number(it.montantPaye || 0);
      acc.reste += Number(it.resteAPayer || 0);
      acc.items.push(it);
      return acc;
    },
    { total: 0, paid: 0, reste: 0, items: [] }
  );
  return {
    partner,
    type,
    items: totals.items,
    totals,
    invoiceNumber: `INV-${String(partner._id).slice(-6)}-${type.toUpperCase()}`,
    date: new Date(),
  };
};

exports.createPartner = async (req, res) => {
  try {
    const { name, identifier, contact } = req.body;
    if (!name) return res.status(400).json({ message: "Name required" });
    const p = await Partner.create({ name, identifier, contact });
    return res.status(201).json({ message: "Partner created", partner: p });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};

exports.getAllPartners = async (req, res) => {
  try {
    const partners = await Partner.find()
      .sort({ createdAt: -1 })
      .populate(
        "transactions.product",
        "nom marque categorie prixAchat prixVente quantite"
      );
    return res.status(200).json({ count: partners.length, partners });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};

exports.getPartnerById = async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id).populate(
      "transactions.product",
      "nom marque categorie prixAchat prixVente quantite"
    );
    if (!partner) return res.status(404).json({ message: "Partner not found" });
    return res.status(200).json({ partner });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};

exports.updatePartner = async (req, res) => {
  try {
    const { name, identifier, contact } = req.body;
    const updated = await Partner.findByIdAndUpdate(
      req.params.id,
      { name, identifier, contact },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Partner not found" });
    return res
      .status(200)
      .json({ message: "Partner updated", partner: updated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};

exports.deletePartner = async (req, res) => {
  try {
    const deleted = await Partner.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Partner not found" });
    return res.status(200).json({ message: "Partner deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};

/**
 * addTransaction (buy | supply)
 */
exports.addTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      productId,
      productData,
      quantite,
      prixUnitaire,
      montantPaye,
      type,
    } = req.body;
    if (!["buy", "supply"].includes(type))
      return res.status(400).json({ message: "Invalid type (buy|supply)" });
    const partner = await Partner.findById(id);
    if (!partner) return res.status(404).json({ message: "Partner not found" });

    const q = Number(quantite);
    if (!q || q <= 0)
      return res.status(400).json({ message: "Quantite invalide" });

    let product = null;
    if (type === "supply") {
      if (productId) {
        product = await Product.findById(productId);
        if (!product)
          return res.status(404).json({ message: "Product not found" });
      } else if (productData) {
        const { nom, marque, categorie, prixAchat, prixVente } = productData;
        if (!nom)
          return res.status(400).json({ message: "Nom produit requis" });
        product = new Product({
          nom,
          marque: marque || "",
          categorie: categorie || "",
          prixAchat: Number(prixAchat || 0),
          prixVente: Number(prixVente || 0),
          quantite: 0,
        });
        await product.save();
      } else
        return res
          .status(400)
          .json({ message: "productId ou productData requis" });

      product.quantite = Number(product.quantite || 0) + q;
      await product.save();
    } else {
      // buy
      if (!productId)
        return res.status(400).json({ message: "productId requis pour buy" });
      product = await Product.findById(productId);
      if (!product)
        return res.status(404).json({ message: "Product not found" });
      if (Number(product.quantite || 0) < q)
        return res.status(400).json({ message: "Pas assez de stock" });
      product.quantite = Number(product.quantite) - q;
      await product.save();
    }

    const unit = Number(
      prixUnitaire || product.prixVente || product.prixAchat || 0
    );
    const paid = Number(montantPaye || 0);
    const total = unit * q;

    partner.transactions.push({
      product: product._id,
      quantite: q,
      prixUnitaire: unit,
      type,
      montantPaye: paid,
      montantTotal: total,
      resteAPayer: Math.max(0, total - paid),
      status: Math.max(0, total - paid) <= 0 ? "paid" : "pending",
      date: new Date(),
    });

    await partner.save();
    const updated = await Partner.findById(id).populate(
      "transactions.product",
      "nom marque categorie prixAchat prixVente quantite"
    );
    return res
      .status(200)
      .json({ message: "Transaction enregistrée", partner: updated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};

exports.updatePayment = async (req, res) => {
  try {
    const { partnerId, transactionId } = req.params;
    const { additionalPayment } = req.body;
    const partner = await Partner.findById(partnerId);
    if (!partner) return res.status(404).json({ message: "Partner not found" });
    const tx = partner.transactions.id(transactionId);
    if (!tx) return res.status(404).json({ message: "Transaction not found" });

    const add = Number(additionalPayment || 0);
    if (add <= 0) return res.status(400).json({ message: "Montant invalide" });

    tx.montantPaye = Number(tx.montantPaye || 0) + add;
    tx.resteAPayer = Math.max(0, Number(tx.montantTotal || 0) - tx.montantPaye);
    tx.status = tx.resteAPayer <= 0 ? "paid" : "pending";

    await partner.save();
    return res
      .status(200)
      .json({ message: "Paiement mis à jour", transaction: tx });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};

exports.transferBetweenPartners = async (req, res) => {
  try {
    const { fromId, toId } = req.params;
    const { productId, quantite, prixFrom, prixTo } = req.body;
    const [fromP, toP, product] = await Promise.all([
      Partner.findById(fromId),
      Partner.findById(toId),
      Product.findById(productId),
    ]);
    if (!fromP || !toP)
      return res.status(404).json({ message: "Partner not found" });
    if (!product) return res.status(404).json({ message: "Product not found" });
    const q = Number(quantite);
    if (!q || q <= 0)
      return res.status(400).json({ message: "Quantite invalide" });
    if (Number(product.quantite || 0) < q)
      return res
        .status(400)
        .json({ message: "Pas assez de stock pour transfer" });

    product.quantite = Number(product.quantite) - q;
    await product.save();

    fromP.transactions.push({
      product: product._id,
      quantite: q,
      prixUnitaire: Number(
        prixFrom || product.prixVente || product.prixAchat || 0
      ),
      type: "buy",
      montantPaye: 0,
      montantTotal:
        Number(prixFrom || product.prixVente || product.prixAchat || 0) * q,
      resteAPayer:
        Number(prixFrom || product.prixVente || product.prixAchat || 0) * q,
      status: "pending",
      date: new Date(),
    });

    toP.transactions.push({
      product: product._id,
      quantite: q,
      prixUnitaire: Number(
        prixTo || product.prixAchat || product.prixVente || 0
      ),
      type: "supply",
      montantPaye: 0,
      montantTotal:
        Number(prixTo || product.prixAchat || product.prixVente || 0) * q,
      resteAPayer:
        Number(prixTo || product.prixAchat || product.prixVente || 0) * q,
      status: "pending",
      date: new Date(),
    });

    // re-add to stock
    product.quantite = Number(product.quantite) + q;
    await product.save();

    await fromP.save();
    await toP.save();
    return res
      .status(200)
      .json({ message: "Transfer enregistré", from: fromP, to: toP });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};

exports.settleNetBetweenPartners = async (req, res) => {
  try {
    const { partnerAId, partnerBId } = req.params;
    const { partnerAItems = [], partnerBItems = [] } = req.body;
    const [A, B] = await Promise.all([
      Partner.findById(partnerAId),
      Partner.findById(partnerBId),
    ]);
    if (!A || !B) return res.status(404).json({ message: "Partner not found" });
    const totalA = partnerAItems.reduce(
      (s, it) => s + Number((it.prix || 0) * (it.quantite || 0)),
      0
    );
    const totalB = partnerBItems.reduce(
      (s, it) => s + Number((it.prix || 0) * (it.quantite || 0)),
      0
    );
    const net = Number(totalA) - Number(totalB);
    return res
      .status(200)
      .json({
        totalA,
        totalB,
        net,
        message:
          net > 0
            ? `Partner A owes B ${net}`
            : `Partner B owes A ${Math.abs(net)}`,
      });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};

/**
 * GET /api/partner/:id/invoice?type=buy|supply&format=json|pdf
 * - returns invoice JSON, or PDF (if pdfkit installed)
 */
exports.getInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const { type = "supply", format = "json" } = req.query;
    const partner = await Partner.findById(id).populate(
      "transactions.product",
      "nom marque categorie prixAchat prixVente quantite"
    );
    if (!partner) return res.status(404).json({ message: "Partner not found" });

    const invoice = buildInvoiceData(partner, type);

    if (format === "pdf") {
      if (!PDFDocument) {
        // fallback to json if pdfkit not available
        return res.status(200).json({ invoice });
      }
      const doc = new PDFDocument({ margin: 40, size: "A4" });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=facture_${partner.name}_${type}.pdf`
      );
      doc.pipe(res);

      // Header
      doc.fontSize(16).text("FACTURE", { align: "left" });
      doc.moveDown(0.5);
      doc.fontSize(10).text(`N°: ${invoice.invoiceNumber}`, { align: "left" });
      doc.text(`Date: ${new Date().toLocaleString()}`, { align: "left" });
      doc.moveDown();

      doc.fontSize(12).text("Client / Fournisseur:", { underline: true });
      doc.fontSize(10).text(`${partner.name}`);
      if (partner.identifier) doc.text(`ID: ${partner.identifier}`);
      if (partner.contact) doc.text(partner.contact);
      doc.moveDown();

      // Table header
      doc.fontSize(10).text("No", 40, doc.y, { continued: true });
      doc.text("Produit", 70, doc.y, { continued: true });
      doc.text("Marque", 220, doc.y, { continued: true });
      doc.text("Catégorie", 320, doc.y, { continued: true });
      doc.text("Qte", 420, doc.y, { continued: true, width: 30 });
      doc.text("PU", 460, doc.y, { continued: true, width: 50 });
      doc.text("Total", 520, doc.y, { width: 60 });
      doc.moveDown();

      invoice.items.forEach((it, idx) => {
        doc.fontSize(9).text(String(idx + 1), 40, doc.y, { continued: true });
        doc.text(it.product?.nom || "-", 70, doc.y, { continued: true });
        doc.text(it.product?.marque || "-", 220, doc.y, { continued: true });
        doc.text(it.product?.categorie || "-", 320, doc.y, { continued: true });
        doc.text(String(it.quantite), 420, doc.y, {
          continued: true,
          width: 30,
        });
        doc.text((it.prixUnitaire || 0).toFixed(2), 460, doc.y, {
          continued: true,
          width: 50,
        });
        doc.text((it.montantTotal || 0).toFixed(2), 520, doc.y, { width: 60 });
        doc.moveDown();
      });

      doc.moveDown(1);
      doc
        .fontSize(11)
        .text(`Total: ${invoice.totals.total.toFixed(2)}`, { align: "right" });
      doc
        .fontSize(11)
        .text(`Payé: ${invoice.totals.paid.toFixed(2)}`, { align: "right" });
      doc
        .fontSize(12)
        .fillColor("red")
        .text(`Reste: ${invoice.totals.reste.toFixed(2)}`, { align: "right" });

      doc.end();
      return;
    }

    // default json
    return res.status(200).json({ invoice });
  } catch (err) {
    console.error("getInvoice:", err);
    return res.status(500).json({ message: err.message });
  }
};
