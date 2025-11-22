// src/components/InvoiceModalPaper.jsx
import React, { useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/**
 * InvoiceModalPaper
 * Props:
 * - visible (bool)
 * - invoice: { partner, type, items: [...], totals: { total, paid, reste }, invoiceNumber, date }
 * - logoUrl (string) optional
 * - onClose()
 * - onMarkPaid(invoice) optional
 */
export default function InvoiceModalPaper({
  visible,
  invoice,
  logoUrl,
  onClose,
  onMarkPaid,
}) {
  const ref = useRef();

  if (!visible || !invoice) return null;

  const format = (n) =>
    Number(n || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  // helper: hide .no-export elements, capture, then restore
  async function downloadPDFClient() {
    try {
      const element = ref.current;
      if (!element) return;

      // hide all elements with .no-export before capture
      const exportedNodes = Array.from(element.querySelectorAll(".no-export"));
      const previousDisplays = exportedNodes.map((el) => {
        const prev = el.style.display;
        el.style.display = "none";
        return prev;
      });

      // capture
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const usableWidth = pageWidth - margin * 2;
      const imgProps = pdf.getImageProperties(imgData);
      const imgWidth = usableWidth;
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

      if (imgHeight <= pageHeight - margin * 2) {
        pdf.addImage(imgData, "PNG", margin, margin, imgWidth, imgHeight);
      } else {
        // slicing for multi-page
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const pxPerMm = canvasWidth / imgWidth;
        const sliceHeightPx = Math.floor((pageHeight - margin * 2) * pxPerMm);
        let y = 0;
        while (y < canvasHeight) {
          const sliceCanvas = document.createElement("canvas");
          sliceCanvas.width = canvasWidth;
          sliceCanvas.height = Math.min(sliceHeightPx, canvasHeight - y);
          const ctx = sliceCanvas.getContext("2d");
          ctx.drawImage(
            canvas,
            0,
            y,
            canvasWidth,
            sliceCanvas.height,
            0,
            0,
            canvasWidth,
            sliceCanvas.height
          );
          const sliceData = sliceCanvas.toDataURL("image/png");
          const sliceImgProps = {
            width: sliceCanvas.width,
            height: sliceCanvas.height,
          };
          const sliceHeightMm =
            (sliceImgProps.height * imgWidth) / sliceImgProps.width;
          pdf.addImage(
            sliceData,
            "PNG",
            margin,
            margin,
            imgWidth,
            sliceHeightMm
          );
          y += sliceCanvas.height;
          if (y < canvasHeight) pdf.addPage();
        }
      }

      const filename = `FACTURE_${invoice.invoiceNumber || "000"}.pdf`;
      pdf.save(filename);

      // restore display
      exportedNodes.forEach((el, i) => {
        el.style.display = previousDisplays[i] || "";
      });
    } catch (err) {
      console.error("PDF client generation failed", err);
      // restore anything hidden on error
      const exportedNodes = Array.from(
        ref.current?.querySelectorAll(".no-export") || []
      );
      exportedNodes.forEach((el) => (el.style.display = ""));
      alert("Erreur génération PDF client — essayez Imprimer.");
      window.print();
    }
  }

  // window.print() will use @media print CSS below to hide .no-print elements
  return (
    <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-4 overflow-auto">
      {/* print CSS: hide .no-print on print */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
        }
      `}</style>

      <div
        ref={ref}
        className="bg-white shadow-lg rounded w-full max-w-3xl p-6 print:p-0 print:mx-6"
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div style={{ width: "45%" }}></div>

          <div style={{ width: "35%", textAlign: "center" }}>
            {logoUrl && (
              <img
                src={logoUrl}
                alt="logo"
                style={{ maxHeight: 60, objectFit: "contain", marginBottom: 6 }}
                onError={(e) => {
                  // si le chemin local n'est pas accessible dans le navigateur, on ignore l'erreur
                  e.target.style.display = "none";
                }}
              />
            )}
            <div style={{ fontSize: 22, fontWeight: 800 }}>Kethiri</div>
            <div style={{ fontSize: 12, marginTop: 6 }}>
              Amdoune • MF : 02192450
            </div>
          </div>

          <div style={{ width: "20%", textAlign: "right", fontSize: 12 }}></div>
        </div>

        {/* Boxes: Livraison / Client */}
        <div className="mb-4" style={{ display: "flex", gap: 12 }}>
          <div style={{ border: "1px solid #ccc", padding: 12, width: "48%" }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>LIVRAISON</div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
              }}
            >
              <div>
                <div>
                  <strong>Date :</strong>
                </div>
                <div style={{ marginTop: 6 }}>
                  {new Date(invoice.date).toLocaleString()}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div>
                  <strong>Numéro :</strong>
                </div>
                <div style={{ marginTop: 6 }}>{invoice.invoiceNumber}</div>
              </div>
            </div>
          </div>

          <div style={{ border: "1px solid #ccc", padding: 12, width: "48%" }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>CLIENT</div>
            <div style={{ fontSize: 13 }}>
              <div>
                <strong>Nom :</strong> {invoice.partner?.name || "-"}
              </div>
              {invoice.partner?.identifier && (
                <div>
                  <strong>ID :</strong> {invoice.partner.identifier}
                </div>
              )}
              {invoice.partner?.contact && (
                <div>
                  <strong>Contact :</strong> {invoice.partner.contact}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto mb-4">
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
          >
            <thead>
              <tr style={{ background: "#fafafa" }}>
                <th
                  style={{
                    border: "1px solid #aaa",
                    padding: "8px 10px",
                    textAlign: "left",
                    width: "4%",
                  }}
                >
                  #
                </th>
                <th
                  style={{
                    border: "1px solid #aaa",
                    padding: "8px 10px",
                    textAlign: "left",
                  }}
                >
                  Désignation
                </th>
                <th
                  style={{
                    border: "1px solid #aaa",
                    padding: "8px 10px",
                    textAlign: "left",
                    width: "15%",
                  }}
                >
                  Marque
                </th>
                <th
                  style={{
                    border: "1px solid #aaa",
                    padding: "8px 10px",
                    textAlign: "left",
                    width: "15%",
                  }}
                >
                  Catégorie
                </th>
                <th
                  style={{
                    border: "1px solid #aaa",
                    padding: "8px 10px",
                    textAlign: "right",
                    width: "10%",
                  }}
                >
                  Quantité (T)
                </th>
                <th
                  style={{
                    border: "1px solid #aaa",
                    padding: "8px 10px",
                    textAlign: "right",
                    width: "12%",
                  }}
                >
                  Prix Unitaire
                </th>
                <th
                  style={{
                    border: "1px solid #aaa",
                    padding: "8px 10px",
                    textAlign: "right",
                    width: "14%",
                  }}
                >
                  Montant HT
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.items && invoice.items.length > 0 ? (
                invoice.items.map((it, idx) => (
                  <tr key={it._id || idx}>
                    <td
                      style={{ border: "1px solid #ddd", padding: "8px 10px" }}
                    >
                      {idx + 1}
                    </td>
                    <td
                      style={{ border: "1px solid #ddd", padding: "8px 10px" }}
                    >
                      {it.product?.nom || "-"}
                    </td>
                    <td
                      style={{ border: "1px solid #ddd", padding: "8px 10px" }}
                    >
                      {it.product?.marque || "-"}
                    </td>
                    <td
                      style={{ border: "1px solid #ddd", padding: "8px 10px" }}
                    >
                      {it.product?.categorie || "-"}
                    </td>
                    <td
                      style={{
                        border: "1px solid #ddd",
                        padding: "8px 10px",
                        textAlign: "right",
                      }}
                    >
                      {it.quantite}
                    </td>
                    <td
                      style={{
                        border: "1px solid #ddd",
                        padding: "8px 10px",
                        textAlign: "right",
                      }}
                    >
                      {format(it.prixUnitaire)}
                    </td>
                    <td
                      style={{
                        border: "1px solid #ddd",
                        padding: "8px 10px",
                        textAlign: "right",
                      }}
                    >
                      {format(it.montantTotal)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      border: "1px solid #ddd",
                      padding: "26px 10px",
                      textAlign: "center",
                    }}
                  >
                    Aucun article
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={5} style={{ border: "none" }}></td>
                <td
                  style={{
                    border: "none",
                    padding: "8px 10px",
                    textAlign: "right",
                    fontWeight: 600,
                  }}
                >
                  Total HT:
                </td>
                <td
                  style={{
                    border: "1px solid #aaa",
                    padding: "8px 10px",
                    textAlign: "right",
                    fontWeight: 700,
                  }}
                >
                  {format(invoice.totals.total)}
                </td>
              </tr>
              <tr>
                <td colSpan={5}></td>
                <td
                  style={{
                    border: "none",
                    padding: "8px 10px",
                    textAlign: "right",
                  }}
                >
                  Payé:
                </td>
                <td
                  style={{
                    border: "1px solid #aaa",
                    padding: "8px 10px",
                    textAlign: "right",
                  }}
                >
                  {format(invoice.totals.paid)}
                </td>
              </tr>
              <tr>
                <td colSpan={5}></td>
                <td
                  style={{
                    border: "none",
                    padding: "8px 10px",
                    textAlign: "right",
                    color: "#c00",
                  }}
                >
                  Reste:
                </td>
                <td
                  style={{
                    border: "1px solid #aaa",
                    padding: "8px 10px",
                    textAlign: "right",
                    color: "#c00",
                    fontWeight: 700,
                  }}
                >
                  {format(invoice.totals.reste)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Signatures */}
        <div style={{ display: "flex", gap: 24, marginTop: 18 }}>
          <div
            style={{
              flex: 1,
              borderTop: "1px solid #ddd",
              paddingTop: 8,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 12 }}>Signature Société</div>
          </div>
          <div
            style={{
              flex: 1,
              borderTop: "1px solid #ddd",
              paddingTop: 8,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 12 }}>Signature Client</div>
          </div>
        </div>

        {/* Actions: hidden on print and removed for export */}
        <div
          className="mt-6 no-print no-export"
          style={{ display: "flex", justifyContent: "flex-start", gap: 12 }}
        >
          <button
            onClick={downloadPDFClient}
            className="px-4 py-2 bg-gray-100 rounded"
          >
            Télécharger PDF (client)
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 border rounded"
          >
            Imprimer
          </button>
          {onMarkPaid && (
            <button
              onClick={() => onMarkPaid(invoice)}
              className="px-4 py-2 bg-green-600 text-white rounded"
            >
              Marquer payé
            </button>
          )}
          <button onClick={onClose} className="px-4 py-2 border rounded">
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
