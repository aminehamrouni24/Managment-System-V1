// src/pages/DeliveryNotes.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { FileText, Plus, Trash2 } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useAuth } from "../contexts/AuthContext";

export function DeliveryNotes() {
  const { token } = useAuth();
  const [bons, setBons] = useState([]);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    clientId: "",
    produits: [],
    adresseLivraison: "",
  });
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchInitialData() {
    await Promise.all([fetchBons(), fetchClients(), fetchProducts()]);
  }

  // try primary endpoint, fallback to /all if 404
  async function fetchBons() {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_REACT_APP_BACKEND_URL}/api/bonlivraison` ,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setBons(res.data.bons || res.data || []);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        // fallback
        try {
          const res2 = await axios.get(
             `${import.meta.env.VITE_REACT_APP_BACKEND_URL}/api/bonlivraison/all` ,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setBons(res2.data.bons || res2.data || []);
        } catch (err2) {
          console.error("Both bonlivraison endpoints failed:", err2);
          setBons([]);
        }
      } else {
        console.error("fetchBons error:", err);
        setBons([]);
      }
    }
  }

  async function fetchClients() {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_REACT_APP_BACKEND_URL}/api/client`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setClients(res.data.clients || res.data || []);
    } catch (err) {
      console.error("fetchClients error:", err);
      setClients([]);
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
      setProducts(res.data.products || res.data || []);
    } catch (err) {
      console.error("fetchProducts error:", err);
      setProducts([]);
    }
  }

  function addProductLine() {
    setFormData((prev) => ({
      ...prev,
      produits: [
        ...prev.produits,
        {
          productId: "",
          designation: "",
          quantite: 1,
          prixUnitaire: 0,
          total: 0,
        },
      ],
    }));
  }

  function removeProductLine(index) {
    setFormData((prev) => {
      const p = [...prev.produits];
      p.splice(index, 1);
      return { ...prev, produits: p };
    });
  }

  function updateProductLine(index, changes) {
    setFormData((prev) => {
      const p = [...prev.produits];
      p[index] = { ...p[index], ...changes };
      // recalc line total
      const qty = Number(p[index].quantite || 0);
      const pu = Number(p[index].prixUnitaire || 0);
      p[index].total = parseFloat((qty * pu).toFixed(2));
      return { ...prev, produits: p };
    });
  }

  function computeMontantTotal() {
    return formData.produits.reduce((s, it) => s + Number(it.total || 0), 0);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.clientId) {
      alert("Veuillez sélectionner un client.");
      return;
    }
    if (!formData.produits.length) {
      alert("Veuillez ajouter au moins un produit.");
      return;
    }

    const payload = {
      clientId: formData.clientId,
      adresseLivraison: formData.adresseLivraison || "",
      produits: formData.produits.map((p) => ({
        productId: p.productId,
        designation:
          p.designation ||
          products.find((x) => x._id === p.productId)?.nom ||
          "",
        quantite: Number(p.quantite),
        prixUnitaire: Number(p.prixUnitaire),
        total: Number(p.total),
      })),
      montantTotal: Number(computeMontantTotal().toFixed(2)),
    };

    try {
      setLoading(true);
      // try primary endpoint
      await axios.post(
         `${import.meta.env.VITE_REACT_APP_BACKEND_URL}/api/bonlivraison` ,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setShowModal(false);
      // refresh lists
      await fetchBons();
    } catch (err) {
      console.error("create bon error:", err);
      alert(
        err.response?.data?.message || "Erreur lors de la création du bon."
      );
    } finally {
      setLoading(false);
    }
  }

  // generate PDF from bon object (server shape expected)
  function generateBL(bl) {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("KETHIRI AGRICULTURE", 105, 20, { align: "center" });
    doc.setFontSize(14);
    doc.text(`BON DE LIVRAISON - ${bl.numeroBL || bl._id}`, 105, 30, {
      align: "center",
    });

    doc.setFontSize(10);
    doc.text(
      `Date : ${new Date(bl.createdAt || bl.createdAt).toLocaleDateString()}`,
      15,
      45
    );
    doc.text(`Client : ${bl.client?.name || bl.clientName || "N/A"}`, 15, 52);
    doc.text(
      `Adresse : ${bl.client?.address || bl.adresseLivraison || "N/A"}`,
      15,
      59
    );
    doc.text(
      `Téléphone : ${bl.client?.phone || bl.clientPhone || "N/A"}`,
      15,
      66
    );

    autoTable(doc, {
      startY: 80,
      head: [["Désignation", "Quantité", "Prix (DT)", "Total (DT)"]],
      body: (bl.produits || []).map((p) => [
        p.designation || p.product?.nom || "",
        p.quantite,
        (p.prixUnitaire || p.prixAchat || p.prix || 0).toFixed
          ? Number(p.prixUnitaire || p.prixAchat || p.prix || 0).toFixed(2)
          : String(p.prixUnitaire || p.prixAchat || p.prix || "0"),
        (p.total || p.montant || 0).toFixed
          ? Number(p.total || p.montant || 0).toFixed(2)
          : String(p.total || p.montant || 0),
      ]),
    });

    const finalY = doc.lastAutoTable?.finalY || 120;
    doc.text(
      `Montant total : ${Number(bl.montantTotal || bl.total || 0).toFixed(
        2
      )} DT`,
      15,
      finalY + 10
    );
    doc.text(
      `Livré à l'adresse du client : ${
        bl.adresseLivraison || bl.client?.address || ""
      }`,
      15,
      finalY + 18
    );

    doc.text("Signature Client : ____________________", 15, finalY + 36);
    doc.text("Signature Société : ____________________", 120, finalY + 36);

    doc.save(`BonLivraison_${bl.numeroBL || bl._id}.pdf`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Bons de Livraison</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          <Plus className="w-5 h-5" /> Nouveau Bon
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Numéro
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Client
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Montant Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {bons.map((bl) => (
              <tr key={bl._id}>
                <td className="px-6 py-4">{bl.numeroBL || bl._id}</td>
                <td className="px-6 py-4">
                  {bl.client?.name || bl.clientName}
                </td>
                <td className="px-6 py-4">
                  {Number(bl.montantTotal || bl.total || 0).toFixed(2)} DT
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => generateBL(bl)}
                    className="flex items-center gap-1 text-blue-600 hover:underline"
                  >
                    <FileText className="w-4 h-4" /> Télécharger
                  </button>
                </td>
              </tr>
            ))}
            {bons.length === 0 && (
              <tr>
                <td className="px-6 py-4" colSpan={4}>
                  Aucun bon trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-3xl p-6 overflow-y-auto max-h-[90vh]">
            <h2 className="text-2xl font-bold mb-4">
              Nouveau Bon de Livraison
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Client :
                </label>
                <select
                  value={formData.clientId}
                  onChange={(e) => {
                    const clientId = e.target.value;
                    const client = clients.find((c) => c._id === clientId);
                    setFormData({
                      ...formData,
                      clientId,
                      adresseLivraison: client?.address || "",
                    });
                  }}
                  className="w-full border px-3 py-2 rounded-lg"
                  required
                >
                  <option value="">-- Sélectionner un client --</option>
                  {clients.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} — {c.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Adresse de livraison (modifiable) :
                </label>
                <input
                  type="text"
                  value={formData.adresseLivraison}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      adresseLivraison: e.target.value,
                    })
                  }
                  className="w-full border px-3 py-2 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Produits :
                </label>
                <div className="space-y-2">
                  {formData.produits.map((p, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 border p-2 rounded"
                    >
                      <select
                        value={p.productId}
                        onChange={(e) => {
                          const prod = products.find(
                            (x) => x._id === e.target.value
                          );
                          updateProductLine(i, {
                            productId: e.target.value,
                            designation: prod?.nom || "",
                          });
                        }}
                        className="flex-1 border px-2 py-1 rounded"
                        required
                      >
                        <option value="">Produit</option>
                        {products.map((prod) => (
                          <option key={prod._id} value={prod._id}>
                            {prod.nom}
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        min="1"
                        value={p.quantite}
                        onChange={(e) =>
                          updateProductLine(i, {
                            quantite: Number(e.target.value),
                          })
                        }
                        className="w-20 border px-2 py-1 rounded"
                        required
                      />

                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={p.prixUnitaire}
                        onChange={(e) =>
                          updateProductLine(i, {
                            prixUnitaire: Number(e.target.value),
                          })
                        }
                        className="w-28 border px-2 py-1 rounded"
                        required
                      />

                      <div className="w-28 text-right">
                        {Number(p.total || 0).toFixed(2)} DT
                      </div>

                      <button
                        type="button"
                        onClick={() => removeProductLine(i)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-2">
                  <button
                    type="button"
                    onClick={addProductLine}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    + Ajouter un produit
                  </button>
                </div>
              </div>

              <div className="text-right">
                <div className="text-lg font-semibold">
                  Montant total: {computeMontantTotal().toFixed(2)} DT
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 border rounded-lg"
                >
                  Annuler
                </button>
                <button
                  disabled={loading}
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white rounded-lg"
                >
                  {loading ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
