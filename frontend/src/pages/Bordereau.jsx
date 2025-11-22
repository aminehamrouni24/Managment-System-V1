// src/pages/Bordereau.jsx
import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  Plus,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import myLogo from '../../assets/KETHIRI.svg'
/**
 * Bordereau component - Complete frontend
 * - CRUD (list, create, update, delete)
 * - modal form (create/edit)
 * - PDF export with a printable layout matching the provided sample
 *
 * Requirements:
 * - backend endpoints:
 *    GET  /api/bordereau?page=&limit=
 *    POST /api/bordereau
 *    PUT  /api/bordereau/:id
 *    DELETE /api/bordereau/:id
 *
 * Adjust `apiBase` if needed.
 */

export function Bordereau() {
  const { token } = useAuth?.() || { token: "" };
  const { t } = useLanguage?.() || { t: (k) => k };
  const apiBase = `${import.meta.env.VITE_REACT_APP_BACKEND_URL || ""}/api`;

  // list/pagination
  const [bordereaux, setBordereaux] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const perPage = 6;
  const [loading, setLoading] = useState(true);

  // modal & form
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const emptyForm = {
    type: "facture", // use backend enum values
    numero: "",
    date: new Date().toISOString().slice(0, 16),
    company: { name: "", address: "", phone: "", mf: "" },
    partner: { name: "", idNumber: "", contact: "", address: "" },
    livraison: {
      date: new Date().toISOString(),
      numero: "",
      transporteur: "",
      camion: "",
      cin: "",
    },
    items: [],
    totals: { totalHT: 0, payé: 0, reste: 0 },
    notes: "",
  };
  const [form, setForm] = useState(emptyForm);

   

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line
  }, [page]);

  async function fetchList() {
    setLoading(true);
    try {
      const res = await axios.get(
        `${apiBase}/bordereau?page=${page}&limit=${perPage}`,
        {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        }
      );
      // backend returns { data, totalCount, page, limit } per backend you posted
      if (res.data) {
        setBordereaux(res.data.data || res.data.bordereaux || []);
        setCount(res.data.totalCount ?? (res.data.data || []).length);
      } else {
        setBordereaux([]);
        setCount(0);
      }
    } catch (err) {
      console.error("fetchList error", err);
      // fallback: try get all then paginate
      try {
        const res2 = await axios.get(`${apiBase}/bordereau`, {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        });
        const all = res2.data.data || res2.data || [];
        setCount(all.length);
        const start = (page - 1) * perPage;
        setBordereaux(all.slice(start, start + perPage));
      } catch (e) {
        console.error(e);
        setBordereaux([]);
        setCount(0);
      }
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm, date: new Date().toISOString().slice(0, 16) });
    setShowModal(true);
  }

  function openEdit(b) {
    // map backend -> form
    setEditing(b);
    setForm({
      type: b.type || "facture",
      numero: b.livraison?.numero || b.numero || "",
      date:
        (b.livraison?.date &&
          new Date(b.livraison.date).toISOString().slice(0, 16)) ||
        (b.date && new Date(b.date).toISOString().slice(0, 16)) ||
        new Date().toISOString().slice(0, 16),
      company: b.company || emptyForm.company,
      partner: b.partner || emptyForm.partner,
      livraison: {
        date:
          b.livraison?.date || b.livraison?.date || new Date().toISOString(),
        numero: b.livraison?.numero || "",
        transporteur: b.livraison?.transporteur || "",
        camion: b.livraison?.camion || "",
        cin: b.livraison?.cin || "",
      },
      items: (b.items || []).map((it) => ({
        designation: it.designation || "",
        marque: it.marque || "",
        categorie: it.categorie || "",
        quantite: Number(it.quantite || 0),
        prixUnitaire: Number(it.prixUnitaire || 0),
        montant: Number(
          it.montant || (it.prixUnitaire || 0) * (it.quantite || 0)
        ),
      })),
      totals: b.totals || emptyForm.totals,
      notes: b.notes || "",
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditing(null);
  }

  function addArticle() {
    setForm({
      ...form,
      items: [
        ...(form.items || []),
        {
          designation: "",
          marque: "",
          categorie: "",
          quantite: 1,
          prixUnitaire: 0,
          montant: 0,
        },
      ],
    });
  }
  function updateArticle(idx, key, value) {
    const arr = [...(form.items || [])];
    arr[idx] = { ...arr[idx], [key]: value };
    // recalc montant for that item
    arr[idx].montant =
      Number(arr[idx].prixUnitaire || 0) * Number(arr[idx].quantite || 0);
    setForm({ ...form, items: arr });
  }
  function removeArticle(idx) {
    const arr = [...(form.items || [])];
    arr.splice(idx, 1);
    setForm({ ...form, items: arr });
  }

  function calcTotals(fromForm = form) {
    const totalHT = (fromForm.items || []).reduce(
      (s, it) =>
        s + Number(it.montant || (it.prixUnitaire || 0) * (it.quantite || 0)),
      0
    );
    const payé = Number(fromForm.totals?.payé ?? fromForm.totals?.paye ?? 0);
    const reste = Math.max(0, totalHT - payé);
    return { totalHT, payé, reste };
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.partner?.name) return alert("Nom client requis");
    if ((form.items || []).length === 0)
      return alert("Au moins un article requis");

    // prepare payload according to backend model
    const payload = {
      type: form.type,
      company: form.company,
      partner: form.partner,
      livraison: {
        date: form.date
          ? new Date(form.date).toISOString()
          : new Date().toISOString(),
        numero: form.numero || "",
        transporteur:
          form.livraison?.transporteur || form.livraison?.transporteur,
        camion: form.livraison?.camion || form.livraison?.camion,
        cin: form.livraison?.cin || form.livraison?.cin,
      },
      items: (form.items || []).map((it) => ({
        designation: it.designation,
        marque: it.marque,
        categorie: it.categorie,
        quantite: Number(it.quantite || 0),
        prixUnitaire: Number(it.prixUnitaire || 0),
        montant: Number(it.prixUnitaire || 0) * Number(it.quantite || 0),
      })),
      totals: {
        totalHT: calcTotals(form).totalHT,
        payé: Number(form.totals?.payé || 0),
        reste: calcTotals(form).totalHT - Number(form.totals?.payé || 0),
      },
      notes: form.notes,
    };

    try {
      if (editing && editing._id) {
        await axios.put(`${apiBase}/bordereau/${editing._id}`, payload, {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        });
        alert("Mis à jour");
      } else {
        await axios.post(`${apiBase}/bordereau`, payload, {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        });
        alert("Créé");
      }
      closeModal();
      fetchList();
    } catch (err) {
      console.error("save error", err);
      alert(err.response?.data?.message || "Erreur sauvegarde");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Supprimer ce bordereau ?")) return;
    try {
      await axios.delete(`${apiBase}/bordereau/${id}`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      alert("Supprimé");
      fetchList();
    } catch (err) {
      console.error("delete error", err);
      alert(err.response?.data?.message || "Erreur suppression");
    }
  }

  // PDF export - build a printable HTML string styled to match your sample
  function buildPrintableHtml(doc) {
    const data = doc || form;
    const items = data.items || [];
    const totals = data.totals || calcTotals(data);
    const paid = totals.payé ?? 0;
    const reste = totals.reste ?? totals.totalHT - paid;

    const esc = (s) =>
      (s || "")
        .toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    // inline CSS tuned to produce a similar printed look
    return `
      <div style="font-family: Arial, Helvetica, sans-serif; color:#111; padding:20px; width:210mm; box-sizing:border-box;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div style="max-width:55%;">
            <div style="font-weight:700; font-size:18px;">${esc(
              data.company?.name || "Votre Société"
            )}</div>
            <div style="margin-top:6px;">${esc(
              data.company?.address || ""
            )}</div>
            <div style="margin-top:4px;">${esc(data.company?.phone || "")}</div>
            <div style="margin-top:4px; font-weight:600;">MF: ${esc(
              data.company?.mf || ""
            )}</div>
          </div>

          <div style="text-align:right; max-width:40%;">
            <div style="font-size:22px; font-weight:700;">${(
              data.type || ""
            ).toUpperCase()}</div>
            <div style="margin-top:6px;">Date : ${new Date(
              data.livraison?.date || data.date || Date.now()
            ).toLocaleString()}</div>
            <div> N°: ${esc(data.numero || data.livraison?.numero || "")}</div>
          </div>
        </div>

        <div style="display:flex; gap:20px; margin-top:18px;">
          <div style="flex:1; border:1px solid #cfcfcf; padding:10px;">
            <div style="font-weight:700; margin-bottom:6px;">CLIENT</div>
            <div>Nom : ${esc(data.partner?.name || "")}</div>
            <div>ID : ${esc(data.partner?.idNumber || "")}</div>
            <div>Contact : ${esc(data.partner?.contact || "")}</div>
            <div>Adresse : ${esc(data.partner?.address || "")}</div>
          </div>

          <div style="width:320px; border:1px solid #cfcfcf; padding:10px;">
            <div style="font-weight:700; margin-bottom:6px;">LIVRAISON</div>
            <div>Transporteur: ${esc(data.livraison?.transporteur || "")}</div>
            <div>Camion: ${esc(data.livraison?.camion || "")}</div>
            <div>CIN: ${esc(data.livraison?.cin || "")}</div>
          </div>
        </div>

        <table style="width:100%; border-collapse:collapse; margin-top:18px; border:1px solid #999;">
          <thead>
            <tr style="background:#f7f7f7;">
              <th style="padding:8px; border-right:1px solid #ddd; text-align:left; width:40px;">#</th>
              <th style="padding:8px; border-right:1px solid #ddd; text-align:left;">Désignation</th>
              <th style="padding:8px; border-right:1px solid #ddd; text-align:left; width:120px;">Marque</th>
              <th style="padding:8px; border-right:1px solid #ddd; text-align:left; width:120px;">Catégorie</th>
              <th style="padding:8px; border-right:1px solid #ddd; text-align:right; width:80px;">Qte</th>
              <th style="padding:8px; border-right:1px solid #ddd; text-align:right; width:100px;">PU</th>
              <th style="padding:8px; text-align:right; width:120px;">Montant HT</th>
            </tr>
          </thead>
          <tbody>
            ${items
              .map(
                (it, i) => `
              <tr>
                <td style="padding:8px; border-top:1px solid #eee;">${
                  i + 1
                }</td>
                <td style="padding:8px; border-top:1px solid #eee;">${esc(
                  it.designation
                )}</td>
                <td style="padding:8px; border-top:1px solid #eee;">${esc(
                  it.marque
                )}</td>
                <td style="padding:8px; border-top:1px solid #eee;">${esc(
                  it.categorie
                )}</td>
                <td style="padding:8px; border-top:1px solid #eee; text-align:right;">${Number(
                  it.quantite || 0
                ).toLocaleString()}</td>
                <td style="padding:8px; border-top:1px solid #eee; text-align:right;">${Number(
                  it.prixUnitaire || 0
                ).toFixed(2)}</td>
                <td style="padding:8px; border-top:1px solid #eee; text-align:right;">${Number(
                  it.montant || (it.prixUnitaire || 0) * (it.quantite || 0)
                ).toFixed(2)}</td>
              </tr>
            `
              )
              .join("")}
            <!-- spacer row -->
            <tr><td colspan="7" style="padding:16px 8px 0 8px; border-top:1px solid #ddd;"></td></tr>
            <!-- totals row with border top -->
            <tr>
              <td colspan="4" style="padding:8px;"></td>
              <td colspan="2" style="padding:8px; text-align:right; font-weight:700;">Total HT:</td>
              <td style="padding:8px; text-align:right; font-weight:700;">${Number(
                totals.totalHT
              ).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <div style="display:flex; justify-content:space-between; margin-top:22px; align-items:flex-start;">
          <div style="flex:1;">
            <div style="height:80px;"></div>
            <div>Signature Société</div>
            <div style="margin-top:12px;">Note: ${esc(data.notes || "")}</div>
          </div>

          <div style="width:260px; border:1px solid #ddd; padding:12px;">
            <div style="text-align:right; font-weight:700;">Total HT: ${Number(
              totals.totalHT
            ).toFixed(2)}</div>
            <div style="text-align:right; margin-top:6px;">Payé: ${Number(
              paid
            ).toFixed(2)}</div>
            <div style="text-align:right; color:red; font-weight:700; margin-top:6px;">Reste: ${Number(
              reste
            ).toFixed(2)}</div>
          </div>
        </div>

        <div style="margin-top:18px; border-top:1px solid #eee; padding-top:12px;">
          <div style="display:flex; gap:20px;">
            <div style="flex:1; border:1px solid #ccc; padding:10px;">Transporteur: ${esc(
              data.livraison?.transporteur || ""
            )}</div>
            <div style="width:200px; border:1px solid #ccc; padding:10px;">Camion: ${esc(
              data.livraison?.camion || ""
            )}</div>
            <div style="width:150px; border:1px solid #ccc; padding:10px;">CIN: ${esc(
              data.livraison?.cin || ""
            )}</div>
          </div>
        </div>

      </div>
    `;
  }

  // export to PDF using html2canvas + jsPDF
  async function exportToPDF(doc) {
    const html = buildPrintableHtml(doc);
    const wrapper = document.createElement("div");
    wrapper.style.position = "fixed";
    wrapper.style.left = "-9999px";
    wrapper.style.top = "0";
    wrapper.innerHTML = html;
    document.body.appendChild(wrapper);

    // wait images load (if any)
    await new Promise((r) => setTimeout(r, 300));
    try {
      const canvas = await html2canvas(wrapper, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        unit: "mm",
        format: "a4",
        orientation: "portrait",
      });
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      const filename = `${doc.type || "bordereau"}-${doc.numero || "no"}.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error("export error:", err);
      alert("Erreur export PDF");
    } finally {
      document.body.removeChild(wrapper);
    }
  }

  const totalPages = Math.max(1, Math.ceil(count / perPage));
  function prevPage() {
    if (page > 1) setPage(page - 1);
  }
  function nextPage() {
    if (page < totalPages) setPage(page + 1);
  }

  const previewTotals = useMemo(() => calcTotals(form), [form]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Bordereaux / Factures</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={openCreate}
            className="px-3 py-2 bg-green-600 text-white rounded flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Nouveau
          </button>
          <div className="text-sm text-gray-600">{count} éléments</div>
        </div>
      </div>

      <div className="bg-white rounded shadow p-4">
        {loading ? (
          <div>Chargement...</div>
        ) : bordereaux.length === 0 ? (
          <div>Aucun bordereau</div>
        ) : (
          <div className="space-y-3">
            {bordereaux.map((b) => (
              <div
                key={b._id}
                className="border rounded p-3 flex justify-between items-center"
              >
                <div>
                  <div className="font-semibold">
                    {b.type} — {b.livraison?.numero || b.numero}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(
                      b.livraison?.date || b.createdAt
                    ).toLocaleString()}
                  </div>
                  <div className="text-sm">
                    Client: {b.partner?.name || "—"}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEdit(b)}
                    className="px-2 py-1 bg-blue-50 rounded"
                  >
                    Voir / Éditer
                  </button>
                  <button
                    onClick={() => exportToPDF(b)}
                    className="px-2 py-1 bg-gray-50 rounded flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Télécharger
                  </button>
                  <button
                    onClick={() => handleDelete(b._id)}
                    className="px-2 py-1 bg-red-50 rounded"
                  >
                    Suppr
                  </button>
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between mt-2">
              <div className="text-sm text-gray-600">
                Page {page} / {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={prevPage}
                  disabled={page === 1}
                  className="px-2 py-1 border rounded disabled:opacity-50"
                >
                  <ChevronLeft />
                </button>
                <button
                  onClick={nextPage}
                  disabled={page === totalPages}
                  className="px-2 py-1 border rounded disabled:opacity-50"
                >
                  <ChevronRight />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/40">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">
                {editing ? "Modifier Bordereau" : "Nouveau Bordereau"}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => exportToPDF(editing || form)}
                  className="px-3 py-1 rounded bg-gray-100 flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" /> PDF
                </button>
                <button
                  onClick={closeModal}
                  className="px-3 py-1 rounded bg-white border"
                >
                  Fermer
                </button>
              </div>
            </div>

            <form onSubmit={handleSave} className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <select
                  className="border p-2 rounded"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="facture">Facture</option>
                  <option value="bon_de_livraison">Bon de livraison</option>
                  <option value="bordereau">Bordereau</option>
                </select>
                <input
                  className="border p-2 rounded"
                  placeholder="Numéro"
                  value={form.numero}
                  onChange={(e) => setForm({ ...form, numero: e.target.value })}
                />
                <input
                  type="datetime-local"
                  className="border p-2 rounded"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="border p-3 rounded">
                  <h4 className="font-medium mb-2">Votre Société</h4>
                  <input
                    className="w-full mb-2 border p-2 rounded"
                    placeholder="Nom société"
                    value={form.company.name}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        company: { ...form.company, name: e.target.value },
                      })
                    }
                  />
                  <input
                    className="w-full mb-2 border p-2 rounded"
                    placeholder="Adresse"
                    value={form.company.address}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        company: { ...form.company, address: e.target.value },
                      })
                    }
                  />
                  <div className="flex gap-2">
                    <input
                      className="w-1/2 border p-2 rounded"
                      placeholder="Téléphone"
                      value={form.company.phone}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          company: { ...form.company, phone: e.target.value },
                        })
                      }
                    />
                    <input
                      className="w-1/2 border p-2 rounded"
                      placeholder="MF"
                      value={form.company.mf}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          company: { ...form.company, mf: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>

                <div className="border p-3 rounded">
                  <h4 className="font-medium mb-2">Client / Partner</h4>
                  <input
                    className="w-full mb-2 border p-2 rounded"
                    placeholder="Nom"
                    value={form.partner.name}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        partner: { ...form.partner, name: e.target.value },
                      })
                    }
                  />
                  <input
                    className="w-full mb-2 border p-2 rounded"
                    placeholder="ID (CIN)"
                    value={form.partner.idNumber}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        partner: { ...form.partner, idNumber: e.target.value },
                      })
                    }
                  />
                  <input
                    className="w-full mb-2 border p-2 rounded"
                    placeholder="Contact"
                    value={form.partner.contact}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        partner: { ...form.partner, contact: e.target.value },
                      })
                    }
                  />
                  <input
                    className="w-full border p-2 rounded"
                    placeholder="Adresse"
                    value={form.partner.address}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        partner: { ...form.partner, address: e.target.value },
                      })
                    }
                  />
                </div>
              </div>

              <div className="border p-3 rounded">
                <h4 className="font-medium mb-2">Transporteur</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    className="border p-2 rounded"
                    placeholder="Transporteur"
                    value={form.livraison.transporteur}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        livraison: {
                          ...form.livraison,
                          transporteur: e.target.value,
                        },
                      })
                    }
                  />
                  <input
                    className="border p-2 rounded"
                    placeholder="Camion"
                    value={form.livraison.camion}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        livraison: {
                          ...form.livraison,
                          camion: e.target.value,
                        },
                      })
                    }
                  />
                  <input
                    className="border p-2 rounded"
                    placeholder="CIN"
                    value={form.livraison.cin}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        livraison: { ...form.livraison, cin: e.target.value },
                      })
                    }
                  />
                </div>
              </div>

              <div className="border p-3 rounded">
                <h4 className="font-medium mb-2">Articles</h4>
                {form.items.length === 0 && (
                  <div className="text-sm text-gray-500 mb-2">
                    Aucun article
                  </div>
                )}
                {form.items.map((a, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-1 md:grid-cols-6 gap-2 items-center mb-2"
                  >
                    <input
                      className="col-span-1 md:col-span-2 border p-2 rounded"
                      placeholder="Désignation"
                      value={a.designation}
                      onChange={(e) =>
                        updateArticle(idx, "designation", e.target.value)
                      }
                    />
                    <input
                      className="border p-2 rounded"
                      placeholder="Marque"
                      value={a.marque}
                      onChange={(e) =>
                        updateArticle(idx, "marque", e.target.value)
                      }
                    />
                    <input
                      className="border p-2 rounded"
                      placeholder="Catégorie"
                      value={a.categorie}
                      onChange={(e) =>
                        updateArticle(idx, "categorie", e.target.value)
                      }
                    />
                    <input
                      type="number"
                      className="border p-2 rounded"
                      placeholder="Qte"
                      value={a.quantite}
                      onChange={(e) =>
                        updateArticle(
                          idx,
                          "quantite",
                          Number(e.target.value || 0)
                        )
                      }
                    />
                    <input
                      type="number"
                      step="0.01"
                      className="border p-2 rounded"
                      placeholder="PU"
                      value={a.prixUnitaire}
                      onChange={(e) =>
                        updateArticle(
                          idx,
                          "prixUnitaire",
                          Number(e.target.value || 0)
                        )
                      }
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => removeArticle(idx)}
                        className="px-3 py-1 bg-red-50 text-red-600 rounded"
                      >
                        Suppr
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addArticle}
                  className="px-3 py-2 bg-blue-50 rounded text-blue-600"
                >
                  Ajouter article
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                <textarea
                  rows="3"
                  className="border p-2 rounded md:col-span-2"
                  placeholder="Note"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
                <div className="border p-3 rounded">
                  <div className="text-sm">
                    Total HT:{" "}
                    <strong>{previewTotals.totalHT.toFixed(2)}</strong>
                  </div>
                  <div className="text-sm mt-2">Payé:</div>
                  <input
                    type="number"
                    className="border p-2 rounded w-full"
                    value={form.totals?.payé || form.totals?.paye || 0}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        totals: {
                          ...form.totals,
                          payé: Number(e.target.value || 0),
                        },
                      })
                    }
                  />
                  <div className="text-sm mt-2">
                    Reste:{" "}
                    <strong className="text-red-600">
                      {(
                        previewTotals.totalHT - Number(form.totals?.payé || 0)
                      ).toFixed(2)}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border rounded"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Bordereau;
