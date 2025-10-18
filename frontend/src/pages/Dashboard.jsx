import { useEffect, useState } from "react";
import myLogo from "../../assets/KETHIRI.svg";

import {
  TrendingUp,
  Package,
  Users,
  AlertTriangle,
  DollarSign,
} from "lucide-react";
import axios from "axios";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";

export function Dashboard() {
  const { t } = useLanguage();
  const { user, token } = useAuth();
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStock: 0,
    totalClients: 0,
    totalSuppliers: 0,
    totalSales: 0,
    pendingDebts: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const res = await axios.get("http://localhost:5000/api/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = res.data;
      setStats({
        totalProducts: data.totalProducts || 0,
        lowStock: data.lowStock || 0,
        totalClients: data.totalClients || 0,
        totalSuppliers: data.totalSuppliers || 0,
        totalSales: data.totalSales || 0,
        pendingDebts: data.pendingDebts || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        {t.common.loading}
      </div>
    );

  const statCards = [
    {
      title: t.dashboard.totalProducts,
      value: stats.totalProducts,
      icon: Package,
      color: "blue",
    },
    {
      title: t.dashboard.lowStock,
      value: stats.lowStock,
      icon: AlertTriangle,
      color: "red",
    },
    {
      title: t.dashboard.totalClients,
      value: stats.totalClients,
      icon: Users,
      color: "green",
    },
    {
      title: t.dashboard.totalSuppliers,
      value: stats.totalSuppliers,
      icon: Users,
      color: "emerald",
    },
    {
      title: t.dashboard.totalSales,
      value: stats.totalSales.toFixed(2) + " DH",
      icon: DollarSign,
      color: "indigo",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {t.dashboard.title}
        </h1>
        <p className="mt-2 text-gray-600">{t.dashboard.overview}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
                <div className={`bg-${stat.color}-50 p-3 rounded-lg`}>
                  <Icon className={`w-8 h-8 text-${stat.color}-600`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {stats.pendingDebts > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-600" />
            <div>
              <h3 className="font-semibold text-yellow-900">
                {t.dashboard.pendingPayments}
              </h3>
              <p className="text-yellow-700 mt-1">
                {stats.pendingDebts.toFixed(2)} DH
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
