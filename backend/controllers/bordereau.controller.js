// controllers/bordereau.controller.js
const Bordereau = require("../models/Bordereau");

// Helper to recalc totals
function recalcTotals(doc) {
  const totalHT = (doc.items || []).reduce(
    (s, it) => s + Number(it.montant || it.prixUnitaire * it.quantite || 0),
    0
  );
  doc.totals = {
    totalHT,
    payé: Number(doc.totals?.payé || doc.totals?.paye || 0),
    reste: Math.max(
      0,
      totalHT - Number(doc.totals?.payé || doc.totals?.paye || 0)
    ),
  };
}

exports.create = async (req, res) => {
  try {
    const payload = req.body;
    const doc = new Bordereau(payload);
    recalcTotals(doc);
    await doc.save();
    res.status(201).json({ message: "Bordereau créé", bordereau: doc });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.max(1, Number(req.query.limit || 20));
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.q) {
      const q = req.query.q;
      query.$or = [
        { "partner.name": { $regex: q, $options: "i" } },
        { "company.name": { $regex: q, $options: "i" } },
        { "livraison.numero": { $regex: q, $options: "i" } },
      ];
    }

    const [data, totalCount] = await Promise.all([
      Bordereau.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Bordereau.countDocuments(query),
    ]);

    res.status(200).json({ data, totalCount, page, limit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const doc = await Bordereau.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ message: "Non trouvé" });
    res.status(200).json({ bordereau: doc });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const payload = req.body;
    const doc = await Bordereau.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Non trouvé" });
    // merge fields
    Object.assign(doc, payload);
    recalcTotals(doc);
    await doc.save();
    res.status(200).json({ message: "Mis à jour", bordereau: doc });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await Bordereau.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Supprimé" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
