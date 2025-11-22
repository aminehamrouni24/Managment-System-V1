// src/pages/Products.jsx
import { useEffect, useState, useMemo } from "react";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import axios from "axios";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";

/**
 * Products avec pagination côté client
 *
 * - fetchProducts() récupère tous les produits (comme avant)
 * - pagination client : page, pageSize, controls Prev/Next, goto page
 * - recherche/refinement fonctionne sur l'ensemble avant pagination
 *
 * Si tu veux pagination côté serveur (fetch par page), dis-le et je l'implémente.
 */

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
    quantite: 0,
    prixAchat: 0,
  });

  // pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10); // par défaut 10 lignes par page

  // fetch products (client-side approach)
  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line
  }, []);

  async function fetchProducts() {
    setLoading(true);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_REACT_APP_BACKEND_URL}/api/product/all`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setProducts(res.data.products || []);
      // reset page if needed
      setPage(1);
    } catch (error) {
      console.error("Error fetching products:", error);
      alert("Erreur lors du chargement des produits");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        quantite: Number(formData.quantite),
        prixAchat: Number(formData.prixAchat),
      };

      if (editingProduct) {
        await axios.put(
          `${import.meta.env.VITE_REACT_APP_BACKEND_URL}/api/product/${
            editingProduct._id
          }`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        // Optional merge logic (existing product) preserved
        const existing = products.find(
          (p) => p.nom === payload.nom && p.marque === payload.marque
        );

        if (existing) {
          // si existe, update en fusionnant les quantités
          const newQuantite =
            Number(existing.quantite || 0) + Number(payload.quantite || 0);
          await axios.put(
            `${import.meta.env.VITE_REACT_APP_BACKEND_URL}/api/product/${
              existing._id
            }`,
            {
              ...existing,
              quantite: newQuantite,
              prixAchat: Number(payload.prixAchat),
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } else {
          await axios.post(
            `${import.meta.env.VITE_REACT_APP_BACKEND_URL}/api/product`,
            payload,
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }
      }

      await fetchProducts();
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
      await axios.delete(
        `${import.meta.env.VITE_REACT_APP_BACKEND_URL}/api/product/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // si on est sur dernière page et on perd tout, repositionner page
      const newProducts = products.filter((p) => p._id !== id);
      setProducts(newProducts);
      // adjust page if needed
      const totalPagesAfterDelete = Math.max(
        1,
        Math.ceil(newProducts.length / pageSize)
      );
      if (page > totalPagesAfterDelete) setPage(totalPagesAfterDelete);
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
        quantite: Number(product.quantite),
        prixAchat: Number(product.prixAchat),
      });
    } else {
      setEditingProduct(null);
      setFormData({ nom: "", marque: "", quantite: 0, prixAchat: 0 });
    }
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingProduct(null);
  }

  // recherche sur nom / marque
  const filteredProducts = useMemo(() => {
    const term = (searchTerm || "").trim().toLowerCase();
    if (!term) return products;
    return products.filter(
      (p) =>
        (p.nom || "").toString().toLowerCase().includes(term) ||
        (p.marque || "").toString().toLowerCase().includes(term)
    );
  }, [products, searchTerm]);

  // pagination calculations
  const total = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPageSafe = Math.min(Math.max(1, page), totalPages);

  const pageStartIndex = (currentPageSafe - 1) * pageSize;
  const pageEndIndex = Math.min(pageStartIndex + pageSize, total);

  const pageItems = filteredProducts.slice(pageStartIndex, pageEndIndex);

  // utility: goToPage
  function goToPage(n) {
    const pn = Math.min(Math.max(1, n), totalPages);
    setPage(pn);
    // scroll to top of table area (optional)
    const el = document.querySelector(".products-table-top");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        {t.common.loading}
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          {t.products?.title || "Produits"}
        </h1>
        {isAdmin && (
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            <Plus className="w-5 h-5" />
            {t.products?.addProduct || "Ajouter produit"}
          </button>
        )}
      </div>

      {/* Search / page size */}
      <div className="bg-white rounded-xl shadow-md p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="relative w-full md:w-1/2">
          <Search className="absolute top-3 left-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={
              t.products?.search || "Rechercher par nom ou marque..."
            }
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1); // reset page on new search
            }}
            className="w-full pl-10 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-600">Afficher</div>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="border rounded px-2 py-1"
          >
            {[5, 10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <div className="text-sm text-gray-600">résultats</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="products-table-top" />

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
            {pageItems.length === 0 ? (
              <tr>
                <td
                  colSpan={isAdmin ? 5 : 4}
                  className="py-6 text-center text-gray-500"
                >
                  Aucune donnée
                </td>
              </tr>
            ) : (
              pageItems.map((product) => (
                <tr key={product._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{product.nom}</td>
                  <td className="px-6 py-4 text-gray-600">{product.marque}</td>
                  <td className="px-6 py-4">{Number(product.quantite)}</td>
                  <td className="px-6 py-4 font-medium">
                    {Number(product.prixAchat).toFixed(2)} DT
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
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      <div className="flex items-center justify-between mt-3">
        <div className="text-sm text-gray-600">
          Affichage <strong>{pageStartIndex + 1}</strong> -{" "}
          <strong>{pageEndIndex}</strong> sur <strong>{total}</strong>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => goToPage(1)}
            disabled={currentPageSafe === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            « Première
          </button>
          <button
            onClick={() => goToPage(currentPageSafe - 1)}
            disabled={currentPageSafe === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            ‹ Préc
          </button>

          {/* page numbers (show limited range) */}
          <div className="flex items-center gap-1 px-2">
            {Array.from({ length: totalPages }).map((_, i) => {
              const pNum = i + 1;
              // show if near current page or first/last
              if (
                pNum === 1 ||
                pNum === totalPages ||
                (pNum >= currentPageSafe - 2 && pNum <= currentPageSafe + 2)
              ) {
                return (
                  <button
                    key={pNum}
                    onClick={() => goToPage(pNum)}
                    className={`px-3 py-1 rounded ${
                      pNum === currentPageSafe
                        ? "bg-green-600 text-white"
                        : "border"
                    }`}
                  >
                    {pNum}
                  </button>
                );
              }
              // render an ellipsis only when needed
              if (
                pNum === currentPageSafe - 3 ||
                pNum === currentPageSafe + 3
              ) {
                return (
                  <span key={"ell-" + pNum} className="px-2 text-gray-400">
                    ...
                  </span>
                );
              }
              return null;
            })}
          </div>

          <button
            onClick={() => goToPage(currentPageSafe + 1)}
            disabled={currentPageSafe === totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Suiv ›
          </button>
          <button
            onClick={() => goToPage(totalPages)}
            disabled={currentPageSafe === totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Dernière »
          </button>
        </div>
      </div>

      {/* Modal */}
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
                    Quantité
                  </label>
                  <input
                    type="number"
                    value={formData.quantite}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quantite: parseInt(e.target.value || 0, 10),
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
                        prixAchat: parseFloat(e.target.value || 0),
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

export default Products;
