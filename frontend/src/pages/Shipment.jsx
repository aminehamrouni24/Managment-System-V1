import { useEffect, useState } from "react";
import axios from "axios";
import { Plus, CreditCard, FileText, Search, Download } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function Shipment() {
  const { token } = useAuth();
  const { t } = useLanguage();

  const [fournisseurs, setFournisseurs] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedFournisseur, setSelectedFournisseur] = useState(null);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [formData, setFormData] = useState({
    productId: "",
    quantite: "",
    prixAchat: "",
    montantPaye: "",
  });
  const [additionalPayment, setAdditionalPayment] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 5;

  useEffect(() => {
    fetchFournisseurs();
    fetchProducts();
    // fetchProduct();
  }, []);

  async function fetchFournisseurs() {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_REACT_APP_BACKEND_URL}/api/fournisseur`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const normalized = res.data.data.map((f) => ({
        ...f,
        contact: f.contact ? String(f.contact) : "",
        name: f.name || "",
      }));
      setFournisseurs(normalized || []);
    } catch (error) {
      console.error("Error fetching fournisseurs:", error);
    }
  }

  async function fetchProducts() {
    try {
      const res = await axios.get(
         `${import.meta.env.VITE_REACT_APP_BACKEND_URL}/api/product/all`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setProducts(res.data.products || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  }
  // Fetch a single product
//   async function fetchProduct(id) {
//     try {
//       const res = await axios.get(`http://localhost:5000/api/product/${id}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       setSelectedProduct(res.data || null); // make sure it's an object
//       console.log(res.data);
//     } catch (error) {
//       console.error("Error fetching product:", error);
//     }
//   }

  async function handleAddDelivery(e) {
    e.preventDefault();
    try {
      await axios.post(
        `${
          import.meta.env.VITE_REACT_APP_BACKEND_URL
        }/api/fournisseur/${selectedFournisseur}/produit`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      // ✅ After shipment added, update product stock
      // await axios.put(
      //   `http://localhost:5000/api/product/${formData.productId}/increase`,
      //   { quantite: parseInt(formData.quantite, 10) },
      //   { headers: { Authorization: `Bearer ${token}` } }
      // );
      closeModal();
      fetchFournisseurs();
    } catch (error) {
      alert(error.response?.data?.message || "Error adding delivery");
    }
  }

  async function handlePayment(e) {
    e.preventDefault();
    try {
      await axios.put(
        `${
          import.meta.env.VITE_REACT_APP_BACKEND_URL
        }/api/fournisseur/${selectedFournisseur}/produit/${selectedDelivery}/payment`,
        { additionalPayment: parseFloat(additionalPayment) },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      closePaymentModal();
      fetchFournisseurs();
    } catch (error) {
      alert(error.response?.data?.message || "Error updating payment");
    }
  }

  function generateFacture(fournisseur, delivery) {
    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("KETHIRI AGRICULTURE", 105, 20, { align: "center" });

    doc.setFontSize(14);
    doc.text("Facture Fournisseur", 105, 35, { align: "center" });

    doc.setFontSize(10);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 15, 45);
    doc.text(`Fournisseur: ${fournisseur.name}`, 15, 52);
    doc.text(`Contact: ${fournisseur.contact || "N/A"}`, 15, 59);

    autoTable(doc, {
      startY: 70,
      head: [
        ["Produit", "Quantité", "Prix Unitaire", "Total", "Payé", "Reste"],
      ],
      body: [
        [
          delivery.product?.nom || "—",
          delivery.quantite,
          `${delivery.prixAchat} DT`,
          `${delivery.montantTotal} DT`,
          `${delivery.montantPaye} DT`,
          `${delivery.resteAPayer} DT`,
        ],
      ],
    });

    doc.text(
      `Statut: ${delivery.status === "paid" ? "Payé" : "En attente"}`,
      15,
      doc.lastAutoTable.finalY + 10
    );

    doc.text("Merci pour votre confiance — KETHIRI AGRICULTURE", 105, 285, {
      align: "center",
    });

    doc.save(
      `Facture_${fournisseur.name}_${delivery.product?.nom || "Produit"}.pdf`
    );
  }

  function exportSummary() {
    const data = Array.isArray(fournisseurs) ? fournisseurs : [];
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("KETHIRI AGRICULTURE — Résumé Fournisseurs", 14, 20);

    const rows = data.map((f) => [
      f.name || "",
      f.contact || "",
      f.produitsFournis?.length || 0,
      (
        f.produitsFournis?.reduce((sum, d) => sum + (d.montantTotal || 0), 0) ||
        0
      ).toFixed(2),
      (
        f.produitsFournis?.reduce((sum, d) => sum + (d.montantPaye || 0), 0) ||
        0
      ).toFixed(2),
      (
        f.produitsFournis?.reduce((sum, d) => sum + (d.resteAPayer || 0), 0) ||
        0
      ).toFixed(2),
    ]);

    autoTable(doc, {
      startY: 30,
      head: [["Nom", "Contact", "Livraisons", "Total", "Payé", "Reste"]],
      body: rows,
    });

    doc.save("Résumé_Fournisseurs.pdf");
  }

  function openModal(fournisseurId) {
    setSelectedFournisseur(fournisseurId);
    setFormData({
      productId: "",
      quantite: "",
      prixAchat: "",
      montantPaye: "",
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setSelectedFournisseur(null);
  }

  function openPaymentModal(fournisseurId, deliveryId) {
    setSelectedFournisseur(fournisseurId);
    setSelectedDelivery(deliveryId);
    setAdditionalPayment("");
    setShowPaymentModal(true);
  }

  function closePaymentModal() {
    setShowPaymentModal(false);
    setSelectedDelivery(null);
  }

  const filteredFournisseurs = fournisseurs.filter((f) => {
    const lower = search.toLowerCase();
    return (
      (f.name || "").toLowerCase().includes(lower) ||
      (f.contact || "").toLowerCase().includes(lower)
    );
  });

  const paginatedFournisseurs = filteredFournisseurs.slice(
    (page - 1) * perPage,
    page * perPage
  );
  const totalPages = Math.ceil(filteredFournisseurs.length / perPage);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
        <h1 className="text-3xl font-bold text-gray-900">
          {t.shipments?.title || "Livraisons Fournisseur"}
        </h1>
        <div className="flex gap-2 items-center">
          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher un fournisseur..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <button
            onClick={exportSummary}
            className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Fournisseurs list */}
      {paginatedFournisseurs.map((fournisseur) => {
        const totals = fournisseur.produitsFournis?.reduce(
          (acc, d) => {
            acc.total += d.montantTotal || 0;
            acc.paye += d.montantPaye || 0;
            acc.reste += d.resteAPayer || 0;
            return acc;
          },
          { total: 0, paye: 0, reste: 0 }
        );

        return (
          <div key={fournisseur._id} className="bg-white rounded-xl shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-800">
                {fournisseur.name} — {fournisseur.contact}
              </h2>
              <button
                onClick={() => openModal(fournisseur._id)}
                className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700"
              >
                <Plus className="w-4 h-4" />
                Ajouter une fourniture
              </button>
            </div>

            <table className="w-full border rounded-lg text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-2 text-left">Produit</th>
                  <th className="px-4 py-2 text-left">Quantité</th>
                  <th className="px-4 py-2 text-left">Prix Unitaire</th>
                  <th className="px-4 py-2 text-left">Total</th>
                  <th className="px-4 py-2 text-left">Payé</th>
                  <th className="px-4 py-2 text-left">Reste</th>
                  <th className="px-4 py-2 text-left">Statut</th>
                  <th className="px-4 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {fournisseur.produitsFournis?.map((delivery) => (
                  <tr key={delivery._id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">{delivery.product?.nom}</td>
                    <td className="px-4 py-2">{delivery.quantite}</td>
                    <td className="px-4 py-2">{delivery.prixAchat} DT</td>
                    <td className="px-4 py-2">{delivery.montantTotal} DT</td>
                    <td className="px-4 py-2">{delivery.montantPaye} DT</td>
                    <td className="px-4 py-2">{delivery.resteAPayer} DT</td>
                    <td
                      className={`px-4 py-2 font-semibold ${
                        delivery.status === "paid"
                          ? "text-green-600"
                          : "text-yellow-600"
                      }`}
                    >
                      {delivery.status === "paid" ? "Payé" : "En attente"}
                    </td>
                    <td className="px-4 py-2 flex justify-center gap-2">
                      <button
                        onClick={() =>
                          openPaymentModal(fournisseur._id, delivery._id)
                        }
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <CreditCard className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => generateFacture(fournisseur, delivery)}
                        className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {/* Totals Row */}
                <tr className="bg-gray-100 font-semibold">
                  <td className="px-4 py-2 text-right" colSpan={3}>
                    Totaux:
                  </td>
                  <td className="px-4 py-2">{totals.total.toFixed(2)} DT</td>
                  <td className="px-4 py-2">{totals.paye.toFixed(2)} DT</td>
                  <td className="px-4 py-2">{totals.reste.toFixed(2)} DT</td>
                  <td colSpan={2}></td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      })}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-4">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            ← Précédent
          </button>
          <span>
            Page {page} sur {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Suivant →
          </button>
        </div>
      )}

      {/* Add Delivery Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold">Ajouter une fourniture</h2>
            </div>
            <form onSubmit={handleAddDelivery} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Produit
                </label>
                <select
                  value={formData.productId}
                  onChange={(e) =>
                    setFormData({ ...formData, productId: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2"
                  required
                >
                  <option value="">Sélectionner un produit</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.nom}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4">
                <input
                  type="number"
                  placeholder="Quantité"
                  value={formData.quantite}
                  onChange={(e) =>
                    setFormData({ ...formData, quantite: e.target.value })
                  }
                  className="w-1/2 border rounded-lg px-3 py-2"
                  required
                />
                <input
                  type="number"
                  placeholder="Prix Unitaire"
                  value={formData.prixAchat}
                  onChange={(e) =>
                    setFormData({ ...formData, prixAchat: e.target.value })
                  }
                  className="w-1/2 border rounded-lg px-3 py-2"
                  required
                />
              </div>

              <input
                type="number"
                placeholder="Montant Payé"
                value={formData.montantPaye}
                onChange={(e) =>
                  setFormData({ ...formData, montantPaye: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2"
                required
              />

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold">Ajouter un paiement</h2>
            </div>
            <form onSubmit={handlePayment} className="p-6 space-y-4">
              <input
                type="number"
                placeholder="Montant supplémentaire"
                value={additionalPayment}
                onChange={(e) => setAdditionalPayment(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closePaymentModal}
                  className="px-5 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Confirmer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
