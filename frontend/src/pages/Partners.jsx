// src/pages/Partners.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Plus } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import InvoiceModalPaper from "../components/InvoiceModalPaper";

// logo local (si vous l'utilisez)
const logoUrl = "/mnt/data/960734d0-4352-41e7-8a50-c75e1ea6a047.jpeg";

export function Partners() {
  const { token } = useAuth?.() || { token: "" };
  const apiBase = `${import.meta.env.VITE_REACT_APP_BACKEND_URL || ""}/api`;

  const [partners, setPartners] = useState([]);
  const [products, setProducts] = useState([]);

  const [showCreatePartner, setShowCreatePartner] = useState(false);
  const [newPartner, setNewPartner] = useState({
    name: "",
    identifier: "",
    contact: "",
  });

  // TRANSACTION modal
  const [showTxModal, setShowTxModal] = useState(false);
  const [txPartnerId, setTxPartnerId] = useState(null);
  const [tx, setTx] = useState({
    type: "buy",
    productId: "",
    quantite: 1,
    prixUnitaire: 0,
    montantPaye: 0,
    isNewProduct: false,
    productData: {
      nom: "",
      marque: "",
      categorie: "",
      quantite: 0,
      prixAchat: 0,
      prixVente: 0,
    },
  });

  // INVOICE modal
  const [invoiceData, setInvoiceData] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);

  // PAYMENT modal context
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentCtx, setPaymentCtx] = useState(null);
  // paymentCtx = { mode: "single"|"invoice"|"partnerNet", partnerId, transactionId?, reste?, amount }

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line
  }, []);

  async function fetchAll() {
    await Promise.all([fetchPartners(), fetchProducts()]);
  }
  async function fetchPartners() {
    try {
      const res = await axios.get(`${apiBase}/partner`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      setPartners(res.data.partners || []);
    } catch (err) {
      console.error(err);
    }
  }
  async function fetchProducts() {
    try {
      const res = await axios.get(`${apiBase}/product/all`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      setProducts(res.data.products || []);
    } catch (err) {
      console.error(err);
    }
  }

  // CREATE partner
  async function handleCreatePartner(e) {
    e.preventDefault();
    if (!newPartner.name.trim()) return alert("Nom requis");
    try {
      await axios.post(`${apiBase}/partner`, newPartner, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      setShowCreatePartner(false);
      setNewPartner({ name: "", identifier: "", contact: "" });
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || "Erreur création partner");
    }
  }

  // OPEN transaction
  function openTx(partnerId) {
    setTx({
      type: "buy",
      productId: "",
      quantite: 1,
      prixUnitaire: 0,
      montantPaye: 0,
      isNewProduct: false,
      productData: {
        nom: "",
        marque: "",
        categorie: "",
        quantite: 0,
        prixAchat: 0,
        prixVente: 0,
      },
    });
    setTxPartnerId(partnerId);
    setShowTxModal(true);
  }

  async function submitTx(e) {
    e.preventDefault();
    if (!txPartnerId) return alert("Partner non sélectionné");
    const q = Number(tx.quantite || 0);
    if (!q || q <= 0) return alert("Quantité invalide");
    const payload = {
      type: tx.type,
      quantite: q,
      prixUnitaire: Number(tx.prixUnitaire || 0),
      montantPaye: Number(tx.montantPaye || 0),
    };

    if (tx.type === "buy") {
      if (!tx.productId)
        return alert("Sélectionnez un produit existant pour Achat");
      payload.productId = tx.productId;
    } else {
      if (tx.isNewProduct) {
        if (!tx.productData.nom) return alert("Nom du nouveau produit requis");
        payload.productData = {
          nom: tx.productData.nom,
          marque: tx.productData.marque,
          categorie: tx.productData.categorie,
          prixAchat: Number(tx.productData.prixAchat || 0),
          prixVente: Number(tx.productData.prixVente || 0),
        };
      } else {
        if (!tx.productId)
          return alert(
            "Sélectionnez un produit existant ou cochez 'Ajouter nouveau produit'"
          );
        payload.productId = tx.productId;
      }
    }

    try {
      await axios.post(
        `${apiBase}/partner/${txPartnerId}/transaction`,
        payload,
        { headers: { Authorization: token ? `Bearer ${token}` : "" } }
      );
      setShowTxModal(false);
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || "Erreur transaction");
    }
  }

  // PAYMENT: open modal for a single tx line
  function openPaymentForTx(partnerId, transactionId, reste) {
    setPaymentCtx({
      mode: "single",
      partnerId,
      transactionId,
      reste,
      amount: reste,
    });
    setShowPaymentModal(true);
  }

  // PAYMENT: open modal for net/difference (from the Net / Différence panel)
  function openPaymentForPartnerNet(partnerId, amount) {
    // amount = netReste (positive means we owe them? here we just pass absolute to distribute)
    setPaymentCtx({
      mode: "partnerNet",
      partnerId,
      amount: Number(amount || 0),
    });
    setShowPaymentModal(true);
  }

  // PAYMENT: open modal for invoice (from InvoiceModalPaper)
  function openPaymentForInvoice(partnerId, amount) {
    setPaymentCtx({ mode: "invoice", partnerId, amount: Number(amount || 0) });
    setShowPaymentModal(true);
  }

  // Confirm single tx payment
  async function confirmPaymentSingle() {
    if (!paymentCtx) return;
    const amount = Number(paymentCtx.amount || 0);
    if (!amount || amount <= 0) return alert("Montant invalide");
    try {
      await axios.put(
        `${apiBase}/partner/${paymentCtx.partnerId}/transaction/${paymentCtx.transactionId}/payment`,
        { additionalPayment: amount },
        { headers: { Authorization: token ? `Bearer ${token}` : "" } }
      );
      setShowPaymentModal(false);
      setPaymentCtx(null);
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || "Erreur paiement");
    }
  }

  // Distribute payment across pending transactions (oldest first)
  async function distributePayment(partnerId, amount) {
    let remaining = Number(amount || 0);
    if (!remaining || remaining <= 0) return alert("Montant invalide");
    const partner = partners.find((p) => p._id === partnerId);
    if (!partner) return alert("Partner introuvable");
    const pending = (partner.transactions || [])
      .filter((t) => Number(t.resteAPayer || 0) > 0)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    try {
      for (const tx of pending) {
        if (remaining <= 0) break;
        const need = Number(tx.resteAPayer || 0);
        const pay = Math.min(need, remaining);
        await axios.put(
          `${apiBase}/partner/${partnerId}/transaction/${tx._id}/payment`,
          { additionalPayment: pay },
          { headers: { Authorization: token ? `Bearer ${token}` : "" } }
        );
        remaining -= pay;
      }
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || "Erreur règlement");
    }
  }

  // BUILD invoice for modal (client-side)
  function buildInvoice(partner, type) {
    const items = (partner.transactions || [])
      .filter((t) => t.type === type)
      .map((t) => ({
        _id: t._id,
        product: t.product || {},
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
      invoiceNumber: `INV-${String(partner._id).slice(
        -6
      )}-${type.toUpperCase()}`,
      date: new Date(),
    };
  }
  function openInvoice(partner, type) {
    const inv = buildInvoice(partner, type);
    setInvoiceData(inv);
    setShowInvoice(true);
  }

  // Handler used when marking paid from invoice modal
  function handleMarkPaidFromInvoice(inv) {
    const amount = inv.totals.reste;
    if (!amount || amount <= 0) return alert("Aucun reste à payer");
    openPaymentForInvoice(inv.partner._id, amount);
  }

  const fmt = (n) => Number(n || 0).toFixed(2);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Partners</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreatePartner(true)}
            className="px-3 py-2 bg-green-600 text-white rounded flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Nouveau
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {partners.map((p) => {
          const supplies = (p.transactions || []).filter(
            (t) => t.type === "supply"
          );
          const buys = (p.transactions || []).filter((t) => t.type === "buy");
          const sums = (arr) =>
            arr.reduce(
              (acc, t) => {
                const total =
                  Number(t.montantTotal || t.prixUnitaire * t.quantite) || 0;
                const paid = Number(t.montantPaye || 0) || 0;
                acc.total += total;
                acc.paid += paid;
                acc.reste += Math.max(0, total - paid);
                return acc;
              },
              { total: 0, paid: 0, reste: 0 }
            );
          const sSup = sums(supplies);
          const sBuy = sums(buys);
          const net = sSup.total - sBuy.total;
          const netReste = sSup.reste - sBuy.reste;

          return (
            <div key={p._id} className="bg-white border rounded p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-semibold text-lg">{p.name}</div>
                  <div className="text-sm text-gray-500">
                    {p.identifier || ""} {p.contact ? `• ${p.contact}` : ""}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openTx(p._id)}
                    className="px-2 py-1 bg-blue-50 rounded"
                  >
                    + Transaction
                  </button>
                  <button
                    onClick={() => openInvoice(p, "supply")}
                    className="px-2 py-1 bg-green-50 rounded text-sm"
                  >
                    Facture (il nous a vendu)
                  </button>
                  <button
                    onClick={() => openInvoice(p, "buy")}
                    className="px-2 py-1 bg-yellow-50 rounded text-sm"
                  >
                    Facture (il a acheté)
                  </button>
                </div>
              </div>

              <div className="mt-4 grid md:grid-cols-3 gap-4">
                <div className="border rounded p-3">
                  <div className="font-semibold">Ventes (il nous a vendu)</div>
                  <div>Total: {fmt(sSup.total)}</div>
                  <div>Payé: {fmt(sSup.paid)}</div>
                  <div>Reste: {fmt(sSup.reste)}</div>
                </div>
                <div className="border rounded p-3">
                  <div className="font-semibold">Achats (il a acheté)</div>
                  <div>Total: {fmt(sBuy.total)}</div>
                  <div>Payé: {fmt(sBuy.paid)}</div>
                  <div>Reste: {fmt(sBuy.reste)}</div>
                </div>
                <div className="border rounded p-3">
                  <div className="font-semibold">Net / Différence</div>
                  {net > 0 ? (
                    <div>Nous lui devons: {fmt(net)}</div>
                  ) : (
                    <div>Il nous doit: {fmt(Math.abs(net))}</div>
                  )}
                  <div>Reste net: {fmt(netReste)}</div>
                  <div className="mt-2">
                    <button
                      onClick={() => openPaymentForPartnerNet(p._id, netReste)}
                      className="px-2 py-1 bg-purple-600 text-white rounded text-sm"
                    >
                      Régler
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-gray-500">
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Produit</th>
                      <th>Marque</th>
                      <th>Catégorie</th>
                      <th>Qte</th>
                      <th>PrixU</th>
                      <th>Total</th>
                      <th>Payé</th>
                      <th>Reste</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(p.transactions || []).map((t) => (
                      <tr key={t._id} className="border-t">
                        <td>{new Date(t.date).toLocaleString()}</td>
                        <td className="capitalize">{t.type}</td>
                        <td>{t.product?.nom || "-"}</td>
                        <td>{t.product?.marque || "-"}</td>
                        <td>{t.product?.categorie || "-"}</td>
                        <td>{t.quantite}</td>
                        <td>{fmt(t.prixUnitaire)}</td>
                        <td>{fmt(t.montantTotal)}</td>
                        <td>{fmt(t.montantPaye)}</td>
                        <td>{fmt(t.resteAPayer)}</td>
                        <td>
                          {Number(t.resteAPayer || 0) > 0 && (
                            <button
                              onClick={() =>
                                openPaymentForTx(
                                  p._id,
                                  t._id,
                                  Number(t.resteAPayer || 0)
                                )
                              }
                              className="px-2 py-1 bg-yellow-100 rounded text-xs"
                            >
                              Payer
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create partner modal */}
      {showCreatePartner && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleCreatePartner}
            className="bg-white rounded p-6 w-full max-w-md"
          >
            <h3 className="text-lg font-semibold mb-3">Créer un partner</h3>
            <input
              className="w-full border p-2 rounded mb-2"
              placeholder="Nom"
              value={newPartner.name}
              onChange={(e) =>
                setNewPartner({ ...newPartner, name: e.target.value })
              }
            />
            <input
              className="w-full border p-2 rounded mb-2"
              placeholder="Identifier"
              value={newPartner.identifier}
              onChange={(e) =>
                setNewPartner({ ...newPartner, identifier: e.target.value })
              }
            />
            <input
              className="w-full border p-2 rounded mb-4"
              placeholder="Contact"
              value={newPartner.contact}
              onChange={(e) =>
                setNewPartner({ ...newPartner, contact: e.target.value })
              }
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreatePartner(false)}
                className="px-4 py-2 border rounded"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Créer
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Transaction modal */}
      {showTxModal && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-auto">
          <form
            onSubmit={submitTx}
            className="bg-white rounded shadow-lg mt-8 w-full max-w-2xl p-6"
          >
            <h3 className="text-lg font-semibold mb-4">Ajouter transaction</h3>
            <div className="flex items-center gap-6 mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="type"
                  value="buy"
                  checked={tx.type === "buy"}
                  onChange={() =>
                    setTx({ ...tx, type: "buy", isNewProduct: false })
                  }
                />{" "}
                Achat
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="type"
                  value="supply"
                  checked={tx.type === "supply"}
                  onChange={() => setTx({ ...tx, type: "supply" })}
                />{" "}
                Fourniture
              </label>
            </div>
            <div className="flex items-center gap-4 mb-4">
              <select
                className="flex-1 border rounded p-2"
                value={tx.productId}
                onChange={(e) => setTx({ ...tx, productId: e.target.value })}
                disabled={tx.isNewProduct}
              >
                <option value="">-- Produit existant --</option>
                {products.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.nom} (stock: {p.quantite})
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={tx.isNewProduct}
                  onChange={(e) =>
                    setTx({
                      ...tx,
                      isNewProduct: e.target.checked,
                      productId: e.target.checked ? "" : tx.productId,
                    })
                  }
                />{" "}
                Ajouter nouveau produit
              </label>
            </div>

            {tx.isNewProduct && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <div>
                  <label className="block text-sm">Nom</label>
                  <input
                    type="text"
                    value={tx.productData.nom}
                    onChange={(e) =>
                      setTx({
                        ...tx,
                        productData: { ...tx.productData, nom: e.target.value },
                      })
                    }
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm">Marque</label>
                  <input
                    type="text"
                    value={tx.productData.marque}
                    onChange={(e) =>
                      setTx({
                        ...tx,
                        productData: {
                          ...tx.productData,
                          marque: e.target.value,
                        },
                      })
                    }
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm">Catégorie</label>
                  <input
                    type="text"
                    value={tx.productData.categorie}
                    onChange={(e) =>
                      setTx({
                        ...tx,
                        productData: {
                          ...tx.productData,
                          categorie: e.target.value,
                        },
                      })
                    }
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm">Quantité (arrivée)</label>
                  <input
                    type="number"
                    min="0"
                    value={tx.productData.quantite}
                    onChange={(e) => {
                      const q = Number(e.target.value || 0);
                      setTx({
                        ...tx,
                        productData: { ...tx.productData, quantite: q },
                        quantite: q,
                      });
                    }}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm">Prix d'achat (DT)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={tx.productData.prixAchat}
                    onChange={(e) => {
                      const pa = Number(e.target.value || 0);
                      setTx((prev) => ({
                        ...prev,
                        productData: { ...prev.productData, prixAchat: pa },
                        prixUnitaire:
                          prev.prixUnitaire === 0 ? pa : prev.prixUnitaire,
                      }));
                    }}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm">Prix de vente</label>
                  <input
                    type="number"
                    step="0.01"
                    value={tx.productData.prixVente || ""}
                    onChange={(e) =>
                      setTx({
                        ...tx,
                        productData: {
                          ...tx.productData,
                          prixVente: Number(e.target.value || 0),
                        },
                      })
                    }
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {!tx.isNewProduct ? (
                <div>
                  <label className="block text-sm">Quantité</label>
                  <input
                    type="number"
                    min="1"
                    value={tx.quantite}
                    onChange={(e) =>
                      setTx({ ...tx, quantite: Number(e.target.value || 0) })
                    }
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm">Quantité</label>
                  <input
                    readOnly
                    value={tx.productData.quantite}
                    className="w-full border rounded px-3 py-2 bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Utilisé comme quantité de transaction
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm">Prix unitaire</label>
                <input
                  type="number"
                  step="0.01"
                  value={tx.prixUnitaire}
                  onChange={(e) =>
                    setTx({ ...tx, prixUnitaire: Number(e.target.value || 0) })
                  }
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm">Montant payé</label>
                <input
                  type="number"
                  step="0.01"
                  value={tx.montantPaye}
                  onChange={(e) =>
                    setTx({ ...tx, montantPaye: Number(e.target.value || 0) })
                  }
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowTxModal(false)}
                className="px-4 py-2 border rounded"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Invoice modal (paper style) */}
      {showInvoice && invoiceData && (
        <InvoiceModalPaper
          visible={showInvoice}
          invoice={invoiceData}
          logoUrl={logoUrl}
          onClose={() => {
            setShowInvoice(false);
            setInvoiceData(null);
          }}
          onMarkPaid={(inv) => handleMarkPaidFromInvoice(inv)}
        />
      )}

      {/* Payment modal (shared for single / invoice / partnerNet) */}
      {showPaymentModal && paymentCtx && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-3">Paiement</h3>

            {paymentCtx.mode === "single" && (
              <div className="text-sm text-gray-700 mb-3">
                Transaction: <strong>{paymentCtx.transactionId}</strong> —
                Reste: <strong>{fmt(paymentCtx.reste)}</strong>
              </div>
            )}
            {paymentCtx.mode === "invoice" && (
              <div className="text-sm text-gray-700 mb-3">
                Règlement de la facture — Montant restant:{" "}
                <strong>{fmt(paymentCtx.amount)}</strong>
              </div>
            )}
            {paymentCtx.mode === "partnerNet" && (
              <div className="text-sm text-gray-700 mb-3">
                Règlement net/différence — Montant proposé:{" "}
                <strong>{fmt(paymentCtx.amount)}</strong>
              </div>
            )}

            <label className="block text-sm mb-1">Montant</label>
            <input
              type="number"
              step="0.01"
              value={paymentCtx.amount}
              onChange={(e) =>
                setPaymentCtx((prev) => ({
                  ...prev,
                  amount: Number(e.target.value || 0),
                }))
              }
              className="w-full border rounded p-2 mb-3"
            />

            <label className="block text-sm mb-1">Mode de paiement</label>
            <select
              className="w-full border rounded p-2 mb-4"
              defaultValue="cash"
            >
              <option value="cash">Espèces</option>
              <option value="bank">Virement</option>
              <option value="cheque">Chèque</option>
            </select>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentCtx(null);
                }}
                className="px-3 py-2 border rounded"
              >
                Annuler
              </button>
              <button
                onClick={async () => {
                  if (paymentCtx.mode === "single") {
                    await confirmPaymentSingle();
                  } else if (paymentCtx.mode === "invoice") {
                    await distributePayment(
                      paymentCtx.partnerId,
                      paymentCtx.amount
                    );
                    setShowPaymentModal(false);
                    setPaymentCtx(null);
                    setShowInvoice(false);
                    setInvoiceData(null);
                  } else if (paymentCtx.mode === "partnerNet") {
                    await distributePayment(
                      paymentCtx.partnerId,
                      paymentCtx.amount
                    );
                    setShowPaymentModal(false);
                    setPaymentCtx(null);
                  }
                }}
                className="px-3 py-2 bg-blue-600 text-white rounded"
              >
                Enregistrer le paiement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
