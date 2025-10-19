import { useEffect, useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import axios from "axios";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";

export function Suppliers() {
  const { t } = useLanguage();
  const { user, token } = useAuth();
  const isAdmin = user?.role === "admin";

  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  async function fetchSuppliers() {
    try {
      const res = await axios.get("http://localhost:5000/api/fournisseur", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuppliers(res.data.data || []);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    } finally {
      setLoading(false);
    }
  }

  function openModal(supplier = null) {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({
        name: supplier.name,
        contact: supplier.contact,
      });
    } else {
      setEditingSupplier(null);
      setFormData({ name: "", contact: "" });
    }
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingSupplier(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editingSupplier) {
        await axios.put(
          `http://localhost:5000/api/fournisseur/${editingSupplier._id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post("http://localhost:5000/api/fournisseur", formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      fetchSuppliers();
      closeModal();
    } catch (error) {
      console.error("Error saving supplier:", error);
      alert(error.response?.data?.message || "Erreur lors de la sauvegarde.");
    }
  }

  async function handleDelete(id) {
    if (!isAdmin || !window.confirm("Êtes-vous sûr de vouloir supprimer ?"))
      return;
    try {
      await axios.delete(`http://localhost:5000/api/fournisseur/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchSuppliers();
    } catch (error) {
      alert(error.response?.data?.message || "Erreur lors de la suppression.");
    }
  }

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        {t.common.loading}
      </div>
    );

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">
          {t.suppliers?.title || "Fournisseurs"}
        </h1>
        {isAdmin && (
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            <Plus className="w-5 h-5" />
            {t.suppliers?.addSupplier || "Ajouter un fournisseur"}
          </button>
        )}
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Nom
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Produits Fournis
              </th>
              {isAdmin && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {suppliers.map((supplier) => (
              <tr key={supplier._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">
                  {supplier.name}
                </td>
                <td className="px-6 py-4 text-gray-600">{supplier.contact}</td>
                <td className="px-6 py-4 text-gray-600">
                  {supplier.produitsFournis?.length || 0}
                </td>
                {isAdmin && (
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openModal(supplier)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(supplier._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold">
                {editingSupplier
                  ? "Modifier le fournisseur"
                  : "Ajouter un fournisseur"}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nom</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Contact
                </label>
                <input
                  type="text"
                  value={formData.contact}
                  onChange={(e) =>
                    setFormData({ ...formData, contact: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-2 border rounded-lg hover:bg-gray-50"
                >
                  {t.common?.cancel || "Annuler"}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  {t.common?.save || "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
