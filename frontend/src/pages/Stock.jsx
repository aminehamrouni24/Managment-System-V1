// src/pages/Stock.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { FileText, Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";

export function Stock() {
  const { token } = useAuth();
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const res = await axios.get("http://localhost:5000/api/product/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(res.data.products || []);
    } catch (error) {
      console.error("Erreur lors du chargement des produits :", error);
    } finally {
      setLoading(false);
    }
  }

  function exportPDF() {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("KETHIRI AGRICULTURE", 105, 20, { align: "center" });
    doc.setFontSize(14);
    doc.text("Rapport du Stock", 105, 30, { align: "center" });
    doc.setFontSize(10);
    doc.text(`Date : ${new Date().toLocaleDateString()}`, 15, 45);

    const tableData = products.map((p) => [
      p.nom,
      p.marque,
      p.categorie,
      p.quantite,
      `${p.prixAchat.toFixed(2)} DT`,
      `${(p.quantite * p.prixAchat).toFixed(2)} DT`,
    ]);

    autoTable(doc, {
      startY: 55,
      head: [
        [
          "Nom",
          "Marque",
          "Catégorie",
          "Quantité",
          "Prix (DT)",
          "Valeur Totale (DT)",
        ],
      ],
      body: tableData,
    });

    const totalValeur = products.reduce(
      (sum, p) => sum + p.quantite * p.prixAchat,
      0
    );
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.text(
      `Valeur totale du stock : ${totalValeur.toFixed(2)} DT`,
      15,
      finalY
    );

    doc.save(`Rapport_Stock_${new Date().toLocaleDateString()}.pdf`);
  }

  function exportExcel() {
    const data = products.map((p) => ({
      Nom: p.nom,
      Marque: p.marque,
      Catégorie: p.categorie,
      Quantité: p.quantite,
      "Prix (DT)": p.prixAchat.toFixed(2),
      "Valeur Totale (DT)": (p.quantite * p.prixAchat).toFixed(2),
    }));

    const totalValeur = products.reduce(
      (sum, p) => sum + p.quantite * p.prixAchat,
      0
    );
    data.push({
      Nom: "—",
      Marque: "—",
      Catégorie: "—",
      Quantité: "—",
      "Prix (DT)": "—",
      "Valeur Totale (DT)": totalValeur.toFixed(2),
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Stock");

    XLSX.writeFile(
      workbook,
      `Rapport_Stock_${new Date().toLocaleDateString()}.xlsx`
    );
  }

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        {t.common.loading || "Chargement..."}
      </div>
    );

  const totalValeur = products.reduce(
    (sum, p) => sum + p.quantite * p.prixAchat,
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Gestion du Stock</h1>
        <div className="flex gap-3">
          <button
            onClick={exportPDF}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            <FileText className="w-5 h-5" />
            Exporter PDF
          </button>
          <button
            onClick={exportExcel}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            <Download className="w-5 h-5" />
            Exporter Excel
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
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
                Catégorie
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Quantité
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Prix (DT)
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Valeur Totale (DT)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.map((p) => (
              <tr key={p._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{p.nom}</td>
                <td className="px-6 py-4 text-gray-600">{p.marque}</td>
                <td className="px-6 py-4 text-gray-600">{p.categorie}</td>
                <td className="px-6 py-4 text-right text-gray-600">
                  {p.quantite}
                </td>
                <td className="px-6 py-4 text-right text-gray-600">
                  {p.prixAchat.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-right font-medium text-gray-900">
                  {(p.quantite * p.prixAchat).toFixed(2)}
                </td>
              </tr>
            ))}

            <tr className="bg-gray-100 font-semibold">
              <td colSpan={5} className="px-6 py-4 text-right">
                Valeur Totale du Stock :
              </td>
              <td className="px-6 py-4 text-right text-green-700">
                {totalValeur.toFixed(2)} DT
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
