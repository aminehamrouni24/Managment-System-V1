import { useLanguage } from '../contexts/LanguageContext';
import { BarChart3, TrendingUp, DollarSign } from 'lucide-react';

export function Reports() {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">{t.reports.title}</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            <h3 className="text-lg font-semibold">{t.reports.sales}</h3>
          </div>
          <p className="text-gray-600">{t.reports.sales} {t.reports.period}</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-8 h-8 text-green-600" />
            <h3 className="text-lg font-semibold">{t.reports.margins}</h3>
          </div>
          <p className="text-gray-600">{t.reports.margins} {t.reports.period}</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <DollarSign className="w-8 h-8 text-red-600" />
            <h3 className="text-lg font-semibold">{t.reports.debts}</h3>
          </div>
          <p className="text-gray-600">{t.reports.debts} {t.reports.period}</p>
        </div>
      </div>
    </div>
  );
}
