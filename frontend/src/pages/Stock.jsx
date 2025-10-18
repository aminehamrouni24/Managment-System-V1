import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
 
import { useLanguage } from '../contexts/LanguageContext';

export function Stock() {
  const { t } = useLanguage();
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   fetchMovements();
  // }, []);

  // async function fetchMovements() {
  //   try {
  //     const { data, error } = await supabase
  //       .from('stock_movements')
  //       .select(`
  //         *,
  //         products (name)
  //       `)
  //       .order('created_at', { ascending: false })
  //       .limit(50);

  //     if (error) throw error;
  //     setMovements(data || []);
  //   } catch (error) {
  //     console.error('Error fetching movements:', error);
  //   } finally {
  //     setLoading(false);
  //   }
  // }

  if (loading) return <div className="flex items-center justify-center h-64">{t.common.loading}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">{t.stock.title}</h1>

      {/* <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.stock.type}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.stock.product}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.stock.quantity}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.stock.date}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.stock.source}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {movements.map(movement => (
              <tr key={movement.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {movement.type === 'IN' ? (
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-600" />
                    )}
                    <span className={`font-medium ${movement.type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                      {movement.type === 'IN' ? t.stock.in : t.stock.out}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 font-medium text-gray-900">{movement.products?.name || 'N/A'}</td>
                <td className="px-6 py-4 text-gray-600">{movement.quantity}</td>
                <td className="px-6 py-4 text-gray-600">{new Date(movement.movement_date).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-gray-600">{movement.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div> */}
    </div>
  );
}
