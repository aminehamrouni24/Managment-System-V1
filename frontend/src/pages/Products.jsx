import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Search } from "lucide-react";
// import { supabase } from "../lib/supabase";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";

export function Products() {
  const { t } = useLanguage();
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    category: "",
    quantity: 0,
    purchase_price: 0,
    sale_price: 0,
    barcode: "",
    min_stock_alert: 10,
  });

  // useEffect(() => {
  //   fetchProducts();
  // }, []);

  // async function fetchProducts() {
  //   try {
  //     const { data, error } = await supabase
  //       .from("products")
  //       .select("*")
  //       .order("created_at", { ascending: false });
  //     if (error) throw error;
  //     setProducts(data || []);
  //   } catch (error) {
  //     console.error("Error:", error);
  //   } finally {
  //     setLoading(false);
  //   }
  // }

  // async function handleSubmit(e) {
  //   e.preventDefault();
  //   try {
  //     if (editingProduct) {
  //       const { error } = await supabase
  //         .from("products")
  //         .update(formData)
  //         .eq("id", editingProduct.id);
  //       if (error) throw error;
  //     } else {
  //       const { error } = await supabase.from("products").insert([formData]);
  //       if (error) throw error;
  //     }
  //     fetchProducts();
  //     closeModal();
  //   } catch (error) {
  //     alert(error.message);
  //   }
  // }

  // async function handleDelete(id) {
  //   if (!isAdmin || !window.confirm("Are you sure?")) return;
  //   try {
  //     const { error } = await supabase.from("products").delete().eq("id", id);
  //     if (error) throw error;
  //     fetchProducts();
  //   } catch (error) {
  //     alert(error.message);
  //   }
  // }

  // function openModal(product = null) {
  //   if (product) {
  //     setEditingProduct(product);
  //     setFormData(product);
  //   } else {
  //     setEditingProduct(null);
  //     setFormData({
  //       name: "",
  //       brand: "",
  //       category: "",
  //       quantity: 0,
  //       purchase_price: 0,
  //       sale_price: 0,
  //       barcode: "",
  //       min_stock_alert: 10,
  //     });
  //   }
  //   setShowModal(true);
  // }

  // function closeModal() {
  //   setShowModal(false);
  //   setEditingProduct(null);
  // }

  // const filteredProducts = products.filter(
  //   (p) =>
  //     p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //     p.brand.toLowerCase().includes(searchTerm.toLowerCase())
  // );

  // if (loading)
  //   return (
  //     <div className="flex items-center justify-center h-64">
  //       {t.common.loading}
  //     </div>
  //   );

  return (
    <div className="space-y-6">
      {/* <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t.products.title}</h1>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          <Plus className="w-5 h-5" />
          {t.products.addProduct}
        </button>
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
                {t.products.name}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {t.products.brand}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {t.products.category}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {t.products.quantity}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {t.products.purchasePrice}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {t.products.salePrice}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {t.products.actions}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredProducts.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{product.name}</td>
                <td className="px-6 py-4 text-gray-600">{product.brand}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                    {product.category}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={
                      product.quantity <= product.min_stock_alert
                        ? "font-medium text-red-600"
                        : ""
                    }
                  >
                    {product.quantity}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {product.purchase_price} DH
                </td>
                <td className="px-6 py-4 font-medium">
                  {product.sale_price} DH
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openModal(product)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold">
                {editingProduct
                  ? t.products.editProduct
                  : t.products.addProduct}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t.products.name}
                  </label>
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
                    {t.products.brand}
                  </label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) =>
                      setFormData({ ...formData, brand: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t.products.category}
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t.products.quantity}
                  </label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quantity: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t.products.purchasePrice}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.purchase_price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        purchase_price: parseFloat(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t.products.salePrice}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.sale_price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sale_price: parseFloat(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t.products.barcode}
                  </label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) =>
                      setFormData({ ...formData, barcode: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t.products.minStock}
                  </label>
                  <input
                    type="number"
                    value={formData.min_stock_alert}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        min_stock_alert: parseInt(e.target.value),
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
      )} */}
    </div>
  );
}
