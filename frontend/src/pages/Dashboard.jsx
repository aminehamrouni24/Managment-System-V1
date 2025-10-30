import { useEffect, useState } from "react";
import {
  Package,
  Users,
  Factory,
  FileText,
  UserCheck,
  UserMinus,
  DollarSign,
  TrendingUp,
  BarChart3,
  Banknote
} from "lucide-react";
import axios from "axios";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";

export function Dashboard() {
  const { t } = useLanguage();
  const { token } = useAuth();
  const [stats, setStats] = useState({
    totalProduits: 0,
    totalClients: 0,
    totalFournisseurs: 0,
    totalFactures: 0,
    facturesClients: 0,
    facturesFournisseurs: 0,
    valeurProduits: 0,
    ventesMensuelles: 0,
    margesMensuelles: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const res = await axios.get(
         `${import.meta.env.VITE_REACT_APP_BACKEND_URL}/api/stats` ,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setStats(res.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-600">
        {t.common.loading}
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Produits",
      value: stats.totalProduits,
      icon: Package,
      color: "blue",
    },
    {
      title: "Total Clients",
      value: stats.totalClients,
      icon: Users,
      color: "green",
    },
    {
      title: "Total Fournisseurs",
      value: stats.totalFournisseurs,
      icon: Factory,
      color: "red",
    },
    {
      title: "Valeur Produits (DT)",
      value: stats.valeurProduits.toLocaleString("fr-FR", {
        minimumFractionDigits: 2,
      }),
      icon: Banknote,
      color: "green",
    },
    {
      title: "Ventes Mensuelles (DT)",
      value: stats.ventesMensuelles.toLocaleString("fr-FR", {
        minimumFractionDigits: 2,
      }),
      icon: BarChart3,
      color: "red",
    },
    {
      title: "Marges Mensuelles (DT)",
      value: stats.margesMensuelles.toLocaleString("fr-FR", {
        minimumFractionDigits: 2,
      }),
      icon: TrendingUp,
      color: stats.margesMensuelles >= 0 ? "brown" : "red",
    },
    
     
     
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="mt-2 text-gray-600">
          Vue d’ensemble des statistiques principales
        </p>
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
    </div>
  );
}
