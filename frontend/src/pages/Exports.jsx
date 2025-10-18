import { Download } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export function Exports() {
  const { t } = useLanguage();

  const exportTypes = [
    { name: 'Products Export', description: 'Export all products to Excel' },
    { name: 'Sales Report', description: 'Export sales data with analytics' },
    { name: 'Stock Report', description: 'Current stock levels and movements' },
    { name: 'Customer List', description: 'Export customer database' }
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">{t.nav.exports}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {exportTypes.map((type, index) => (
          <div key={index} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{type.name}</h3>
                <p className="text-gray-600 text-sm">{type.description}</p>
              </div>
              <button className="p-3 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors">
                <Download className="w-6 h-6" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
