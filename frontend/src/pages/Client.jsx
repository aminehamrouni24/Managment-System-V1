import { useEffect, useState } from "react";
import axios from "axios";
import { Plus, CreditCard, FileText, Search } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function Client() {
  const { token } = useAuth();
  const { t } = useLanguage();

  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [formData, setFormData] = useState({
    productId: "",
    quantite: "",
    prixVente: "", // added
    montantPaye: "",
  });
  const [additionalPayment, setAdditionalPayment] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 5;

  // 🟢 Fetch clients and products
  useEffect(() => {
    fetchClients();
    fetchProducts();
  }, []);

  async function fetchClients() {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_REACT_APP_BACKEND_URL}/api/client`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setClients(res.data.clients || []);
    } catch (error) {
      console.error("Error fetching clients:", error);
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

  // 🛒 Add purchase
  async function handleAddPurchase(e) {
    e.preventDefault();
    try {
      await axios.post(
        `${
          import.meta.env.VITE_REACT_APP_BACKEND_URL
        }/api/client/${selectedClient}/purchase`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      closeModal();
      fetchClients();
    } catch (error) {
      alert(error.response?.data?.message || "Erreur lors de l'ajout d'achat");
    }
  }

  // 💰 Update payment
  async function handlePayment(e) {
    e.preventDefault();
    try {
      await axios.put(
        `${
          import.meta.env.VITE_REACT_APP_BACKEND_URL
        }/api/client/${selectedClient}/purchase/${selectedPurchase}/payment`,
        { additionalPayment: parseFloat(additionalPayment) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      closePaymentModal();
      fetchClients();
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Erreur lors de la mise à jour du paiement"
      );
    }
  }

  // 🧾 Generate facture
  function generateFacture(client, purchase) {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("KETHIRI AGRICULTURE", 105, 20, { align: "center" });
    doc.setFontSize(14);
    doc.text("Facture Client", 105, 35, { align: "center" });
    doc.setFontSize(10);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 15, 45);
    doc.text(`Client: ${client.name}`, 15, 52);
    doc.text(`Email: ${client.email}`, 15, 59);

    autoTable(doc, {
      startY: 70,
      head: [
        [
          "Produit",
          "Quantité",
          "Prix Achat",
          "Prix Vente",
          "Total",
          "Payé",
          "Reste",
        ],
      ],
      body: [
        [
          purchase.product?.nom || "—",
          purchase.quantite,
          `${purchase.prixAchat} DT`,
          `${purchase.prixVente || "-"} DT`,
          `${purchase.montantTotal} DT`,
          `${purchase.montantPaye} DT`,
          `${purchase.resteAPayer} DT`,
        ],
      ],
    });

    doc.text("Merci pour votre achat — KETHIRI AGRICULTURE", 105, 285, {
      align: "center",
    });

    doc.save(
      `Facture_${client.name}_${purchase.product?.nom || "Produit"}.pdf`
    );
  }

  // 🔍 Filtering & pagination
  const filteredClients = clients.filter((c) =>
    (c.name || "").toLowerCase().includes(search.toLowerCase())
  );
  const paginatedClients = filteredClients.slice(
    (page - 1) * perPage,
    page * perPage
  );
  const totalPages = Math.ceil(filteredClients.length / perPage);

  // 🔘 Modal handlers
  function openModal(clientId) {
    setSelectedClient(clientId);
    setFormData({
      productId: "",
      quantite: "",
      prixVente: "",
      montantPaye: "",
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setSelectedClient(null);
  }

  function openPaymentModal(clientId, purchaseId) {
    setSelectedClient(clientId);
    setSelectedPurchase(purchaseId);
    setAdditionalPayment("");
    setShowPaymentModal(true);
  }

  function closePaymentModal() {
    setShowPaymentModal(false);
    setSelectedPurchase(null);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
        <h1 className="text-3xl font-bold text-gray-900">
          {t.clients?.title || "Achats Clients"}
        </h1>
        <div className="relative w-64">
          <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher un client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>
      </div>

      {/* Client list */}
      {paginatedClients.map((client) => {
        const totals = client.produitsAchetes?.reduce(
          (acc, p) => {
            acc.total += p.montantTotal || 0;
            acc.paye += p.montantPaye || 0;
            acc.reste += p.resteAPayer || 0;
            return acc;
          },
          { total: 0, paye: 0, reste: 0 }
        );

        return (
          <div key={client._id} className="bg-white rounded-xl shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-800">
                {client.name} — {client.email}
              </h2>
              <button
                onClick={() => openModal(client._id)}
                className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700"
              >
                <Plus className="w-4 h-4" /> Ajouter un achat
              </button>
            </div>

            <table className="w-full border rounded-lg text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-2 text-left">Produit</th>
                  <th className="px-4 py-2 text-left">Quantité</th>
                  <th className="px-4 py-2 text-left">Prix Achat</th>
                  <th className="px-4 py-2 text-left">Prix Vente</th>
                  <th className="px-4 py-2 text-left">Marge</th>
                  <th className="px-4 py-2 text-left">Total</th>
                  <th className="px-4 py-2 text-left">Payé</th>
                  <th className="px-4 py-2 text-left">Reste</th>
                  <th className="px-4 py-2 text-left">Statut</th>
                  <th className="px-4 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {client.produitsAchetes?.map((p) => (
                  <tr key={p._id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">{p.product?.nom}</td>
                    <td className="px-4 py-2">{p.quantite}</td>
                    <td className="px-4 py-2">{p.prixAchat} DT</td>
                    <td className="px-4 py-2">
                      {p.prixVente ? `${p.prixVente} DT` : "-"}
                    </td>
                    <td className="px-4 py-2">
                      {p.prixVente
                        ? `${(p.prixVente - p.prixAchat).toFixed(2)} DT`
                        : "-"}
                    </td>
                    <td className="px-4 py-2">{p.montantTotal} DT</td>
                    <td className="px-4 py-2">{p.montantPaye} DT</td>
                    <td className="px-4 py-2">{p.resteAPayer} DT</td>
                    <td
                      className={`px-4 py-2 font-semibold ${
                        p.resteAPayer <= 0
                          ? "text-green-600"
                          : "text-yellow-600"
                      }`}
                    >
                      {p.resteAPayer <= 0 ? "Payé" : "En attente"}
                    </td>
                    <td className="px-4 py-2 flex justify-center gap-2">
                      <button
                        onClick={() =>
                          openPaymentModal(client._id, p.product?._id)
                        }
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Mettre à jour le paiement"
                      >
                        <CreditCard className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => generateFacture(client, p)}
                        className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                        title="Télécharger la facture"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {/* Totals */}
                <tr className="bg-gray-100 font-semibold">
                  <td colSpan={5} className="text-right px-4 py-2">
                    Totaux :
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

      {/* Add Purchase Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold">Ajouter un achat</h2>
            </div>
            <form onSubmit={handleAddPurchase} className="p-6 space-y-4">
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
                      {p.nom} ({p.quantite} en stock)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex gap-4">
                  <input
                    type="number"
                    placeholder="Quantité"
                    value={formData.quantite}
                    onChange={(e) =>
                      setFormData({ ...formData, quantite: e.target.value })
                    }
                    className="w-1/3 border rounded-lg px-3 py-2"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Prix de vente (DT)"
                    value={formData.prixVente}
                    onChange={(e) =>
                      setFormData({ ...formData, prixVente: e.target.value })
                    }
                    className="w-1/3 border rounded-lg px-3 py-2"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Montant Payé"
                    value={formData.montantPaye}
                    onChange={(e) =>
                      setFormData({ ...formData, montantPaye: e.target.value })
                    }
                    className="w-1/3 border rounded-lg px-3 py-2"
                    required
                  />
                </div>
              </div>

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
