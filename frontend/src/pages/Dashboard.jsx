// src/pages/Dashboard.jsx
import React, { useEffect, useState, useMemo } from "react";
import {
  Package,
  Users,
  Factory,
  Banknote,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import axios from "axios";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";

/**
 * Dashboard complet (frontend)
 * - GET /api/stats   -> doit renvoyer ventesMensuelles, achatsMensuels, margesMensuelles, todayJournal (items peuplés)
 * - GET /api/partner -> fallback : array partners[] contenant transactions si /api/stats ne contient pas todayJournal
 *
 * NOTE: logoUrl pointe vers le fichier uploadé dans la session (chemin local).
 */

export function Dashboard() {
  const { t } = useLanguage?.() || { t: (k) => k };
  const { token } = useAuth?.() || { token: "" };
  const apiBase = `${import.meta.env.VITE_REACT_APP_BACKEND_URL || ""}/api`;

  const [stats, setStats] = useState(null);
  const [partners, setPartners] = useState([]);
  const [todayJournal, setTodayJournal] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPartners, setLoadingPartners] = useState(false);
  const [error, setError] = useState(null);

  // local logo file you uploaded earlier
  const logoUrl = "/mnt/data/410c94a7-2531-4948-adb1-987d0fafbb2c.png";

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line
  }, []);

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchStats(), fetchPartners()]);
    } catch (err) {
      console.error("loadAll error", err);
      setError("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  }

  async function fetchStats() {
    try {
      const res = await axios.get(`${apiBase}/stats`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      console.log("DEBUG /api/stats:", res.data);
      setStats(res.data || {});
      if (
        res.data &&
        Array.isArray(res.data.todayJournal) &&
        res.data.todayJournal.length > 0
      ) {
        setTodayJournal(res.data.todayJournal);
      }
    } catch (err) {
      console.error("fetchStats error", err);
      // don't throw — we still want to try partners fallback
      setStats(null);
    }
  }

  async function fetchPartners() {
    setLoadingPartners(true);
    try {
      const res = await axios.get(`${apiBase}/partner`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      setPartners(res.data.partners || []);
      // If stats didn't provide a todayJournal, build a local journal from partners
      if (
        !(
          stats &&
          Array.isArray(stats.todayJournal) &&
          stats.todayJournal.length > 0
        )
      ) {
        const local = buildTodayJournalFromPartners(res.data.partners || []);
        setTodayJournal(local);
      }
    } catch (err) {
      console.error("fetchPartners error", err);
      setPartners([]);
    } finally {
      setLoadingPartners(false);
    }
  }

  // --- helpers date ---
  function isToday(dateLike) {
    if (!dateLike) return false;
    const d = new Date(dateLike);
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  }
  function isInCurrentMonth(dateLike) {
    if (!dateLike) return false;
    const d = new Date(dateLike);
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    );
  }

  // fallback sum from partners if server stats missing some fields
  const localMonthSummary = useMemo(() => {
    let ventes = 0;
    let achats = 0;
    let ventesPayes = 0;
    let achatsPayes = 0;

    for (const p of partners || []) {
      for (const t of p.transactions || []) {
        if (!isInCurrentMonth(t.date)) continue;
        const total =
          Number(t.montantTotal ?? t.prixUnitaire * t.quantite) || 0;
        const paid = Number(t.montantPaye || 0) || 0;
        if (t.type === "supply") {
          ventes += total;
          ventesPayes += paid;
        } else if (t.type === "buy") {
          achats += total;
          achatsPayes += paid;
        }
      }
    }
    return {
      ventes,
      achats,
      marge: ventes - achats,
      ventesPayes,
      achatsPayes,
    };
  }, [partners]);

  // build today journal from partners fallback, trying to read product object (or id)
  function buildTodayJournalFromPartners(parts) {
    const rows = [];
    for (const p of parts || []) {
      for (const t of p.transactions || []) {
        if (!isToday(t.date)) continue;

        // product may be an object (populated) or just an id or a nested object
        const prod = t.product || t.productId || t.productObj || null;
        const productName =
          (prod && (prod.nom || prod.name)) ||
          t.nom ||
          t.designation ||
          t.productName ||
          "-";
        const q = Number(t.quantite || t.qty || 0);
        const pu = Number(t.prixUnitaire || t.prix || t.prixAchat || 0);
        const total = Number(t.montantTotal ?? pu * q) || 0;
        const paid = Number(t.montantPaye || t.paid || 0) || 0;

        rows.push({
          transactionId: t._id || t.id || `${p._id}-${Date.now()}`,
          type: t.type,
          partnerId: p._id,
          partnerName: p.name,
          date: t.date || t.createdAt || new Date(),
          productName,
          quantite: q,
          prixUnitaire: pu,
          montantTotal: total,
          montantPaye: paid,
        });
      }
    }
    // sort desc
    rows.sort((a, b) => new Date(b.date) - new Date(a.date));
    return rows;
  }

  // Use server stats when available, else fallback to localMonthSummary
  const ventesMensuelles = Number(
    stats?.ventesMensuelles ?? localMonthSummary.ventes ?? 0
  );
  const achatsMensuels = Number(
    stats?.achatsMensuels ?? localMonthSummary.achats ?? 0
  );
  const margesMensuelles = Number(
    stats?.margesMensuelles ?? localMonthSummary.marge ?? 0
  );

  // unify journal: prefer server's todayJournal (mapped), otherwise use built todayJournal
  const journal =
    stats && Array.isArray(stats.todayJournal) && stats.todayJournal.length > 0
      ? stats.todayJournal.map((f) => {
          // normalize server factures into display row(s)
          const firstItem = f.items && f.items.length > 0 ? f.items[0] : null;
          const productName = firstItem
            ? firstItem.productName ||
              firstItem.nom ||
              firstItem.designation ||
              "-"
            : (f.product && (f.product.nom || f.product.name)) || "-";
          const qty = firstItem
            ? firstItem.quantite || firstItem.qty || 0
            : f.quantite || 0;
          const pu = firstItem
            ? firstItem.prixUnitaire || firstItem.price || 0
            : f.prixUnitaire || 0;
          const total =
            f.montantTotal ?? (firstItem ? firstItem.montantTotal : 0);
          const paid = f.montantPaye ?? f.montantPaye ?? 0;
          return {
            id: f.factureId || f._id,
            date: f.createdAt,
            type: f.type,
            partnerName:
              (f.partner && (f.partner.name || f.partner)) ||
              (f.client && (f.client.name || f.client)) ||
              (f.fournisseur && (f.fournisseur.name || f.fournisseur)) ||
              "",
            productName,
            quantite: qty,
            prixUnitaire: pu,
            montantTotal: total,
            montantPaye: paid,
          };
        })
      : todayJournal.map((r) => ({
          id: r.transactionId || r.id,
          date: r.date || r.createdAt,
          type: r.type,
          partnerName: r.partnerName || (r.partner && r.partner.name) || "",
          productName: r.productName || r.items?.[0]?.productName || "-",
          quantite: r.quantite || r.items?.[0]?.quantite || 0,
          prixUnitaire: r.prixUnitaire || r.items?.[0]?.prixUnitaire || 0,
          montantTotal: r.montantTotal || r.items?.[0]?.montantTotal || 0,
          montantPaye: r.montantPaye || r.items?.[0]?.montantPaye || 0,
        }));

  if (loading || loadingPartners) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-600">
        {t.common?.loading || "Chargement..."}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img
            src={logoUrl}
            alt="logo"
            className="h-14 w-14 object-contain"
            onError={(e) => (e.target.style.display = "none")}
          />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Tableau de bord
            </h1>
            <p className="text-sm text-gray-600">
              Vue d’ensemble des statistiques principales
            </p>
          </div>
        </div>
        <div>
          <button
            onClick={loadAll}
            className="px-3 py-2 bg-white border rounded"
          >
            Rafraîchir
          </button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          {
            title: "Total Produits",
            value: stats?.totalProduits ?? 0,
            icon: Package,
            color: "blue",
          },
          {
            title: "Total Clients",
            value: stats?.totalClients ?? 0,
            icon: Users,
            color: "green",
          },
          {
            title: "Total Fournisseurs",
            value: stats?.totalFournisseurs ?? 0,
            icon: Factory,
            color: "red",
          },
          {
            title: "Valeur Produits (DT)",
            value: Number(stats?.valeurProduits ?? 0).toLocaleString("fr-FR", {
              minimumFractionDigits: 2,
            }),
            icon: Banknote,
            color: "green",
          },
          {
            title: "Ventes Mensuelles (DT)",
            value: Number(ventesMensuelles).toLocaleString("fr-FR", {
              minimumFractionDigits: 2,
            }),
            icon: BarChart3,
            color: "red",
          },
          {
            title: "Marges Mensuelles (DT)",
            value: Number(margesMensuelles).toLocaleString("fr-FR", {
              minimumFractionDigits: 2,
            }),
            icon: TrendingUp,
            color: "green",
          },
        ].map((s, i) => {
          const Icon = s.icon;
          const bg =
            s.color === "blue"
              ? "bg-blue-50"
              : s.color === "green"
              ? "bg-green-50"
              : "bg-red-50";
          const txt =
            s.color === "blue"
              ? "text-blue-600"
              : s.color === "green"
              ? "text-green-600"
              : "text-red-600";
          return (
            <div
              key={i}
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{s.title}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {s.value}
                  </p>
                </div>
                <div className={`${bg} p-3 rounded-lg`}>
                  <Icon className={`w-8 h-8 ${txt}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* month detail + journal */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded p-4 shadow">
          <h3 className="font-semibold mb-3">Détail du mois courant</h3>
          <div className="text-sm text-gray-600 mb-1">
            Ventes totales (mois) :{" "}
            <strong>{ventesMensuelles.toFixed(2)}</strong>
          </div>
          <div className="text-sm text-gray-600 mb-3">
            Achats totaux (mois) : <strong>{achatsMensuels.toFixed(2)}</strong>
          </div>
          <div className="text-sm mb-2">
            Marge (ventes - achats) :{" "}
            <strong
              className={
                margesMensuelles >= 0 ? "text-emerald-600" : "text-red-600"
              }
            >
              {margesMensuelles.toFixed(2)}
            </strong>
          </div>
          <div className="text-xs text-gray-500">
            Si les chiffres semblent incorrects, vérifiez les{" "}
            <code>createdAt</code> et le champ <code>type</code> de vos
            factures/transactions (client/fournisseur ou buy/supply).
          </div>

          <div className="mt-4">
            <h4 className="font-medium mb-2">Détail par partner (mois)</h4>
            <div className="max-h-48 overflow-auto">
              <table className="w-full text-sm">
                <thead className="text-gray-500">
                  <tr>
                    <th>Partner</th>
                    <th className="text-right">Ventes</th>
                    <th className="text-right">Achats</th>
                    <th className="text-right">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {partners.map((p) => {
                    let pV = 0,
                      pA = 0;
                    for (const t of p.transactions || []) {
                      if (!isInCurrentMonth(t.date)) continue;
                      const total =
                        Number(t.montantTotal ?? t.prixUnitaire * t.quantite) ||
                        0;
                      if (t.type === "supply") pV += total;
                      if (t.type === "buy") pA += total;
                    }
                    const net = pV - pA;
                    if (pV === 0 && pA === 0) return null;
                    return (
                      <tr key={p._id} className="border-t">
                        <td className="py-2">{p.name}</td>
                        <td className="py-2 text-right">{pV.toFixed(2)}</td>
                        <td className="py-2 text-right">{pA.toFixed(2)}</td>
                        <td
                          className={`py-2 text-right ${
                            net >= 0 ? "text-emerald-600" : "text-red-600"
                          }`}
                        >
                          {net.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="bg-white rounded p-4 shadow">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold">Journal — Aujourd'hui</h3>
            <div className="text-sm text-gray-500">
              {new Date().toLocaleDateString()}
            </div>
          </div>

          <div className="max-h-[60vh] overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-gray-500">
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Partner</th>
                  <th>Produit</th>
                  <th className="text-right">Qte</th>
                  <th className="text-right">PU</th>
                  <th className="text-right">Total</th>
                  <th className="text-right">Payé</th>
                </tr>
              </thead>
              <tbody>
                {!journal || journal.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-gray-500">
                      Aucune transaction aujourd'hui
                    </td>
                  </tr>
                ) : (
                  journal.map((r, idx) => {
                    const date = r.date ? new Date(r.date) : new Date();
                    return (
                      <tr key={r.id || idx} className="border-t">
                        <td className="py-2">{date.toLocaleTimeString()}</td>
                        <td className="py-2 capitalize">
                          {String(r.type || "").replace(/[^a-z0-9\-_]/gi, "")}
                        </td>
                        <td className="py-2">{r.partnerName || "-"}</td>
                        <td className="py-2">{r.productName || "-"}</td>
                        <td className="py-2 text-right">
                          {Number(r.quantite || 0)}
                        </td>
                        <td className="py-2 text-right">
                          {Number(r.prixUnitaire || 0).toFixed(2)}
                        </td>
                        <td className="py-2 text-right">
                          {Number(r.montantTotal || 0).toFixed(2)}
                        </td>
                        <td className="py-2 text-right">
                          {Number(r.montantPaye || 0).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {error && <div className="text-red-600">{error}</div>}
    </div>
  );
}

export default Dashboard;
