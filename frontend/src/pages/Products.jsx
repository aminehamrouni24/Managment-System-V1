import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import axios from "axios";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";

export function Products() {
  const { t } = useLanguage();
  const { token, user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    nom: "",
    marque: "",
    categorie: "",
    quantite: 0,
    prixAchat: 0,
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const res = await axios.get("http://localhost:5000/api/product/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(res.data.products || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editingProduct) {
        await axios.put(
          `http://localhost:5000/api/product/${editingProduct._id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post("http://localhost:5000/api/product", formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      fetchProducts();
      closeModal();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Erreur lors de la sauvegarde.");
    }
  }

  async function handleDelete(id) {
    if (!isAdmin || !window.confirm("Êtes-vous sûr de vouloir supprimer ?"))
      return;
    try {
      await axios.delete(`http://localhost:5000/api/product/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchProducts();
    } catch (error) {
      alert(error.response?.data?.message || "Erreur lors de la suppression.");
    }
  }

  function openModal(product = null) {
    if (product) {
      setEditingProduct(product);
      setFormData({
        nom: product.nom,
        marque: product.marque,
        categorie: product.categorie,
        quantite: product.quantite,
        prixAchat: product.prixAchat,
      });
    } else {
      setEditingProduct(null);
      setFormData({
        nom: "",
        marque: "",
        categorie: "",
        quantite: 0,
        prixAchat: 0,
      });
    }
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingProduct(null);
  }

  const filteredProducts = products.filter(
    (p) =>
      p.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.marque.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        {t.common.loading}
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t.products.title}</h1>
        {isAdmin && (
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            <Plus className="w-5 h-5" />
            {t.products.addProduct}
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="relative">
          <Search className="absolute top-3 left-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={t.products.search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Nom
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Marque
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Catégorie
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Quantité
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Prix d’achat (DT)
              </th>
              {isAdmin && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredProducts.map((product) => (
              <tr key={product._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{product.nom}</td>
                <td className="px-6 py-4 text-gray-600">{product.marque}</td>
                <td className="px-6 py-4">{product.categorie}</td>
                <td className="px-6 py-4">{product.quantite}</td>
                <td className="px-6 py-4 font-medium">
                  {product.prixAchat} DT
                </td>
                {isAdmin && (
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openModal(product)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product._id)}
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
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold">
                {editingProduct ? "Modifier le produit" : "Ajouter un produit"}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nom</label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) =>
                      setFormData({ ...formData, nom: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Marque
                  </label>
                  <input
                    type="text"
                    value={formData.marque}
                    onChange={(e) =>
                      setFormData({ ...formData, marque: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Catégorie
                  </label>
                  <input
                    type="text"
                    value={formData.categorie}
                    onChange={(e) =>
                      setFormData({ ...formData, categorie: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Quantité
                  </label>
                  <input
                    type="number"
                    value={formData.quantite}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quantite: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Prix d’achat (DT)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.prixAchat}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        prixAchat: parseFloat(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                    min="0"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-2 border rounded-lg hover:bg-gray-50"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  {t.common.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
