import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
// import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';

export function Invoices() {
  const { t } = useLanguage();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   fetchInvoices();
  // }, []);

  // async function fetchInvoices() {
  //   try {
  //     const { data, error } = await supabase
  //       .from('customer_invoices')
  //       .select(`
  //         *,
  //         customers (name)
  //       `)
  //       .order('created_at', { ascending: false });

  //     if (error) throw error;
  //     setInvoices(data || []);
  //   } catch (error) {
  //     console.error('Error fetching invoices:', error);
  //   } finally {
  //     setLoading(false);
  //   }
  // }

  if (loading) return <div className="flex items-center justify-center h-64">{t.common.loading}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">{t.invoices.title}</h1>
      </div>

      {/* <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.invoices.customer}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.invoices.date}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.invoices.total}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.invoices.status}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {invoices.map(invoice => (
              <tr key={invoice.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-600">{invoice.id.slice(0, 8)}</td>
                <td className="px-6 py-4 font-medium text-gray-900">{invoice.customers?.name || 'N/A'}</td>
                <td className="px-6 py-4 text-gray-600">{new Date(invoice.invoice_date).toLocaleDateString()}</td>
                <td className="px-6 py-4 font-medium text-gray-900">{invoice.total} DH</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    invoice.status === 'PAID' ? 'bg-green-100 text-green-800' :
                    invoice.status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {t.invoices[`status${invoice.status.charAt(0) + invoice.status.slice(1).toLowerCase()}`] || invoice.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div> */}
    </div>
  );
}
