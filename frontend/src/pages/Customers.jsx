import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
// import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

export function Customers() {
  const { t } = useLanguage();
  const { isAdmin } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    address: ''
  });

  // useEffect(() => {
  //   fetchCustomers();
  // }, []);

  // async function fetchCustomers() {
  //   try {
  //     const { data, error } = await supabase
  //       .from('customers')
  //       .select('*')
  //       .order('created_at', { ascending: false });

  //     if (error) throw error;
  //     setCustomers(data || []);
  //   } catch (error) {
  //     console.error('Error fetching customers:', error);
  //   } finally {
  //     setLoading(false);
  //   }
  // }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editingCustomer) {
        const { error } = await supabase
          .from('customers')
          .update(formData)
          .eq('id', editingCustomer.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('customers')
          .insert([formData]);
        if (error) throw error;
      }
      // fetchCustomers();
      closeModal();
    } catch (error) {
      console.error('Error saving customer:', error);
      alert(error.message);
    }
  }

  // async function handleDelete(id) {
  //   if (!isAdmin) {
  //     alert('Only admins can delete customers');
  //     return;
  //   }
  //   if (!window.confirm('Are you sure?')) return;

  //   try {
  //     const { error } = await supabase
  //       .from('customers')
  //       .delete()
  //       .eq('id', id);
  //     if (error) throw error;
  //     fetchCustomers();
  //   } catch (error) {
  //     console.error('Error deleting customer:', error);
  //     alert(error.message);
  //   }
  // }

  function openModal(customer = null) {
    if (customer) {
      setEditingCustomer(customer);
      setFormData(customer);
    } else {
      setEditingCustomer(null);
      setFormData({ name: '', contact: '', address: '' });
    }
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingCustomer(null);
  }

  if (loading) return <div className="flex items-center justify-center h-64">{t.common.loading}</div>;

  return (
    <div className="space-y-6">
      {/* <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">{t.customers.title}</h1>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          <Plus className="w-5 h-5" />
          {t.customers.addCustomer}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.customers.name}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.customers.contact}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.customers.address}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.products.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {customers.map(customer => (
              <tr key={customer.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{customer.name}</td>
                <td className="px-6 py-4 text-gray-600">{customer.contact}</td>
                <td className="px-6 py-4 text-gray-600">{customer.address}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openModal(customer)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(customer.id)}
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
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold">{editingCustomer ? t.customers.editCustomer : t.customers.addCustomer}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t.customers.name}</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t.customers.contact}</label>
                <input
                  type="text"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t.customers.address}</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  rows="3"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={closeModal} className="px-6 py-2 border rounded-lg hover:bg-gray-50">
                  {t.common.cancel}
                </button>
                <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
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
