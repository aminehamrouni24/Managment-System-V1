// /mnt/data/stats.controller.js
const Product = require("../models/Product");
const Client = require("../models/Client");
const Fournisseur = require("../models/Fournisseur");
const Facture = require("../models/Facture");

/**
 * getStatistics
 * - calcule ventesMensuelles comme SUM(prixVente * q) pour les factures/transactions du mois
 * - calcule achatsMensuels comme SUM(prixAchat * q) pour les factures/transactions du mois
 * - margesMensuelles = ventesMensuelles - achatsMensuels
 * - construit todayJournal avec productName, prixUnitaire (vente), prixAchat si dispo
 */
exports.getStatistics = async (req, res) => {
  try {
    // counts
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

    // valeur produits stock (quantite * prixAchat)
    const products = await Product.find({}).lean();
    const valeurProduits = products.reduce(
      (sum, p) => sum + Number(p.prixAchat || 0) * Number(p.quantite || 0),
      0
    );

    // date ranges
    const now = new Date();
    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
      0,
      0,
      0,
      0
    );
    const startOfNextMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      1,
      0,
      0,
      0,
      0
    );
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0
    );
    const startOfNextDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0,
      0,
      0,
      0
    );

    // --- helper type detection (robuste) ---
    const isVenteType = (t) =>
      ["client", "sale", "supply", "vente", "sold"].includes(
        String(t || "").toLowerCase()
      );
    const isAchatType = (t) =>
      ["fournisseur", "supplier", "buy", "achat", "purchased"].includes(
        String(t || "").toLowerCase()
      );

    // --- factures du mois (utiles si tu utilises Facture collection) ---
    const facturesMonth = await Facture.find({
      createdAt: { $gte: startOfMonth, $lt: startOfNextMonth },
    })
      // si tes factures stockent des product refs dans items.product, il peut être utile de populate
      .lean();

    // initial totals
    let ventesMensuelles = 0;
    let achatsMensuels = 0;

    // Process factures month (respecter prixVente/prixAchat par item)
    for (const f of facturesMonth) {
      const items = Array.isArray(f.items) ? f.items : [];
      for (const it of items) {
        const qty = Number(it.quantite ?? it.qty ?? 0);
        if (!qty) continue;

        // determine sale price and cost price for this item
        // prix de vente (vente) : prefer item.prixUnitaire / item.price / item.prixVente / item.priceVente
        const prixVente = Number(
          it.prixUnitaire ?? it.price ?? it.prixVente ?? it.priceVente ?? 0
        );

        // prix d'achat (coût) : item.prixAchat or product.prixAchat (if populated) or fallback 0
        let prixAchat = Number(it.prixAchat ?? it.purchasePrice ?? 0);
        if (
          (!prixAchat || prixAchat === 0) &&
          it.product &&
          typeof it.product === "object"
        ) {
          prixAchat = Number(
            it.product.prixAchat ?? it.product.purchasePrice ?? 0
          );
        }

        const lineSale = prixVente * qty;
        const lineCost = prixAchat * qty;

        if (isVenteType(f.type)) ventesMensuelles += lineSale;
        else if (isAchatType(f.type)) achatsMensuels += lineCost;
        else {
          // unknown facture type: try to infer by context (amount sign or presence of prixVente/prixAchat)
          // By default treat as sale if prixVente > 0
          if (prixVente > 0) ventesMensuelles += lineSale;
          else achatsMensuels += lineCost;
        }
      }
    }

    // --- fallback / complementary sources: clients.produitsAchetes and fournisseurs.produitsFournis
    // populate products in clients/fournisseurs to have product fields readily available
    const clients = await Client.find({})
      .populate(
        "produitsAchetes.product",
        "nom marque categorie prixAchat prixVente"
      )
      .lean();
    const fournisseurs = await Fournisseur.find({})
      .populate(
        "produitsFournis.product",
        "nom marque categorie prixAchat prixVente"
      )
      .lean();

    // clients -> ventes (produitsAchetes)
    for (const c of clients) {
      if (!Array.isArray(c.produitsAchetes)) continue;
      for (const a of c.produitsAchetes) {
        const dt = a.dateAchat ? new Date(a.dateAchat) : null;
        if (!dt) continue;
        if (dt >= startOfMonth && dt < startOfNextMonth) {
          const qty = Number(a.quantite ?? a.qty ?? 0);
          if (!qty) continue;
          // prix de vente : prefer a.prixVente then a.prixUnitaire then product.prixVente then product.prixAchat
          const prixVente = Number(
            a.prixVente ??
              a.prixUnitaire ??
              (a.product && a.product.prixVente) ??
              0
          );
          const prixAchat = Number(
            a.prixAchat ?? (a.product && a.product.prixAchat) ?? 0
          );
          ventesMensuelles += prixVente * qty;
          achatsMensuels += prixAchat * qty; // add the cost associated with the sold items
        }
      }
    }

    // fournisseurs -> achats (produitsFournis)
    for (const fo of fournisseurs) {
      if (!Array.isArray(fo.produitsFournis)) continue;
      for (const l of fo.produitsFournis) {
        const dt = l.createdAt
          ? new Date(l.createdAt)
          : l.date
          ? new Date(l.date)
          : null;
        if (!dt) continue;
        if (dt >= startOfMonth && dt < startOfNextMonth) {
          const qty = Number(l.quantite ?? l.qty ?? 0);
          if (!qty) continue;
          const prixAchat = Number(
            l.prixUnitaire ??
              l.prixAchat ??
              (l.product && l.product.prixAchat) ??
              0
          );
          const prixVente = Number(
            l.prixVente ??
              l.prixUnitaire ??
              (l.product && l.product.prixVente) ??
              0
          );
          achatsMensuels += prixAchat * qty;
          // If supplier transaction includes a sale price (rare), don't double-count as sale here.
        }
      }
    }

    const margesMensuelles = ventesMensuelles - achatsMensuels;

    // --- todayJournal: prefer Facture collection for today, else fallback to client/fournisseur arrays ---
    const facturesToday = await Facture.find({
      createdAt: { $gte: startOfDay, $lt: startOfNextDay },
    })
      .sort({ createdAt: -1 })
      .lean();

    const mapItem = (it) => {
      const prodObj =
        it.product && typeof it.product === "object" ? it.product : null;
      const productName =
        (prodObj && (prodObj.nom || prodObj.name)) ||
        it.nom ||
        it.designation ||
        "";
      const quantite = Number(it.quantite ?? it.qty ?? 0) || 0;
      const prixUnitaire = Number(
        it.prixUnitaire ??
          it.price ??
          it.prixVente ??
          it.prixAchat ??
          (prodObj && prodObj.prixVente) ??
          0
      );
      const prixAchat = Number(
        it.prixAchat ?? (prodObj && prodObj.prixAchat) ?? 0
      );
      const montantTotal =
        Number(it.montantTotal ?? prixUnitaire * quantite) || 0;
      return {
        productId: (prodObj && prodObj._id) || it.productId || null,
        productName,
        quantite,
        prixUnitaire,
        prixAchat,
        montantTotal,
      };
    };

    let todayJournal = facturesToday.map((f) => ({
      factureId: f._id,
      type: f.type,
      partner: f.partner || f.client || f.fournisseur || null,
      createdAt: f.createdAt,
      items: Array.isArray(f.items) ? f.items.map(mapItem) : [],
      montantTotal: Number(f.montantTotal || f.total || 0),
      montantPaye: Number(f.montantPaye || f.paid || 0),
      reste: Number(
        f.reste ??
          (f.montantTotal || f.total || 0) - (f.montantPaye || f.paid || 0)
      ),
    }));

    // fallback to client.produitsAchetes and fournisseur.produitsFournis if no factures today
    if (todayJournal.length === 0) {
      for (const c of clients) {
        if (!Array.isArray(c.produitsAchetes)) continue;
        for (const a of c.produitsAchetes) {
          const dt = a.dateAchat ? new Date(a.dateAchat) : null;
          if (!dt) continue;
          if (dt >= startOfDay && dt < startOfNextDay) {
            const prodObj =
              a.product && typeof a.product === "object" ? a.product : null;
            const productName =
              (prodObj && (prodObj.nom || prodObj.name)) ||
              a.nom ||
              a.designation ||
              "";
            const quantite = Number(a.quantite ?? a.qty ?? 0) || 0;
            const prixVente = Number(
              a.prixVente ??
                a.prixUnitaire ??
                (prodObj && prodObj.prixVente) ??
                0
            );
            const prixAchat = Number(
              a.prixAchat ?? (prodObj && prodObj.prixAchat) ?? 0
            );
            todayJournal.push({
              factureId: a._id || null,
              type: "client",
              partner: { _id: c._id, name: c.name },
              createdAt: dt,
              items: [
                {
                  productId: (prodObj && prodObj._id) || a.productId || null,
                  productName,
                  quantite,
                  prixUnitaire: prixVente,
                  prixAchat,
                  montantTotal: Number(a.montantTotal ?? prixVente * quantite),
                },
              ],
              montantTotal: Number(a.montantTotal || 0),
              montantPaye: Number(a.montantPaye || 0) || 0,
              reste: Number((a.montantTotal || 0) - (a.montantPaye || 0) || 0),
            });
          }
        }
      }

      for (const fo of fournisseurs) {
        if (!Array.isArray(fo.produitsFournis)) continue;
        for (const l of fo.produitsFournis) {
          const dt = l.createdAt
            ? new Date(l.createdAt)
            : l.date
            ? new Date(l.date)
            : null;
          if (!dt) continue;
          if (dt >= startOfDay && dt < startOfNextDay) {
            const prodObj =
              l.product && typeof l.product === "object" ? l.product : null;
            const productName =
              (prodObj && (prodObj.nom || prodObj.name)) ||
              l.nom ||
              l.designation ||
              "";
            const quantite = Number(l.quantite ?? l.qty ?? 0) || 0;
            const prixAchat = Number(
              l.prixUnitaire ??
                l.prixAchat ??
                (prodObj && prodObj.prixAchat) ??
                0
            );
            todayJournal.push({
              factureId: l._id || null,
              type: "fournisseur",
              partner: { _id: fo._id, name: fo.name },
              createdAt: dt,
              items: [
                {
                  productId: (prodObj && prodObj._id) || l.productId || null,
                  productName,
                  quantite,
                  prixUnitaire: Number(l.prixUnitaire ?? 0),
                  prixAchat,
                  montantTotal: Number(l.montantTotal ?? prixAchat * quantite),
                },
              ],
              montantTotal: Number(l.montantTotal || 0),
              montantPaye: Number(l.montantPaye || 0) || 0,
              reste: Number((l.montantTotal || 0) - (l.montantPaye || 0) || 0),
            });
          }
        }
      }
    }

    // tri desc
    todayJournal.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // réponse
    return res.status(200).json({
      message: "Statistiques récupérées avec succès",
      totalProduits: productCount,
      totalClients: clientCount,
      totalFournisseurs: fournisseurCount,
      totalFactures,
      facturesClients: clientFactures,
      facturesFournisseurs: fournisseurFactures,
      valeurProduits,
      ventesMensuelles,
      achatsMensuels,
      margesMensuelles,
      todayJournal,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return res.status(500).json({ message: error.message });
  }
};
