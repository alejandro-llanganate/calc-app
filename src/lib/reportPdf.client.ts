"use client";

import type { ReportPdfData } from "./reportExport";
import { formatDateLabel, formatMoney } from "./format";

export async function downloadReportPdf(data: ReportPdfData) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF();
  const { symbol } = data;
  const margin = 14;
  const pageW = doc.internal.pageSize.getWidth();
  let y = 0;

  const ensureSpace = (need: number) => {
    if (y + need > 285) {
      doc.addPage();
      y = margin;
    }
  };

  const drawHeader = () => {
    doc.setFillColor(0, 120, 212);
    doc.rect(0, 0, pageW, 36, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Reporte de ventas", margin, 16);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(data.storeName, margin, 24);
    doc.text(data.periodLabel, margin, 30);
    doc.text(
      `Generado: ${new Date().toLocaleString("es")}`,
      pageW - margin,
      30,
      { align: "right" },
    );
    y = 44;
    doc.setTextColor(30, 30, 30);
  };

  const drawStatRow = (label: string, value: string, x: number, w: number) => {
    doc.setFillColor(243, 242, 241);
    doc.roundedRect(x, y, w, 22, 2, 2, "F");
    doc.setFontSize(8);
    doc.setTextColor(96, 94, 92);
    doc.text(label, x + 4, y + 8);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text(value, x + 4, y + 17);
    doc.setFont("helvetica", "normal");
  };

  const drawSectionTitle = (title: string) => {
    ensureSpace(16);
    doc.setFillColor(222, 236, 249);
    doc.rect(margin, y, pageW - margin * 2, 8, "F");
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 90, 158);
    doc.text(title, margin + 3, y + 5.5);
    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 30);
  };

  const drawTable = (
    rows: { left: string; right: string; sub?: string }[],
    empty: string,
  ) => {
    if (rows.length === 0) {
      ensureSpace(10);
      doc.setFontSize(10);
      doc.setTextColor(120, 120, 120);
      doc.text(empty, margin, y);
      y += 8;
      return;
    }
    rows.forEach((row) => {
      ensureSpace(14);
      doc.setFontSize(10);
      doc.setTextColor(30, 30, 30);
      doc.text(row.left, margin, y);
      doc.text(row.right, pageW - margin, y, { align: "right" });
      y += 5;
      if (row.sub) {
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text(row.sub, margin, y);
        y += 5;
      }
      doc.setDrawColor(229, 229, 229);
      doc.line(margin, y, pageW - margin, y);
      y += 4;
    });
    y += 4;
  };

  drawHeader();

  const colW = (pageW - margin * 2 - 8) / 3;
  drawStatRow("Hoy", formatMoney(data.todayTotal, symbol), margin, colW);
  drawStatRow(
    "Periodo",
    formatMoney(data.periodTotal, symbol),
    margin + colW + 4,
    colW,
  );
  drawStatRow(
    "Por cobrar",
    formatMoney(data.debtSummary.totalPending, symbol),
    margin + (colW + 4) * 2,
    colW,
  );
  y += 28;

  drawSectionTitle(data.chartTitle);
  drawTable(
    data.chartReport
      .filter((r) => r.total > 0)
      .map((r) => ({
        left:
          r.key.includes("-") && r.key.length === 10
            ? formatDateLabel(r.key)
            : r.label,
        right: formatMoney(r.total, symbol),
        sub: `${r.count} ${r.count === 1 ? "compra" : "compras"}`,
      })),
    "Sin ventas en este periodo.",
  );

  drawSectionTitle("Resumen de debes");
  drawStatRow(
    "Prestado",
    formatMoney(data.debtSummary.totalLent, symbol),
    margin,
    colW,
  );
  drawStatRow(
    "Cobrado",
    formatMoney(data.debtSummary.totalPaid, symbol),
    margin + colW + 4,
    colW,
  );
  drawStatRow(
    "Pendiente",
    formatMoney(data.debtSummary.totalPending, symbol),
    margin + (colW + 4) * 2,
    colW,
  );
  y += 28;

  drawSectionTitle("Detalle de fiados");
  drawTable(
    data.debtsList.slice(0, 20).map((d) => ({
      left: d.name,
      right: formatMoney(d.amount, symbol),
      sub: `${d.status} · Debe ${formatMoney(d.pending, symbol)} · ${d.date}`,
    })),
    "Sin registros de debe.",
  );

  drawSectionTitle("Ventas por mes (6 meses)");
  drawTable(
    data.monthlyReport
      .filter((r) => r.total > 0)
      .map((r) => ({
        left: r.label,
        right: formatMoney(r.total, symbol),
        sub: `${r.count} compras`,
      })),
    "Sin datos mensuales.",
  );

  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  ensureSpace(10);
  doc.text("Caja Ventas — documento generado automáticamente", margin, 290);

  doc.save(
    `reporte-${data.storeName.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.pdf`,
  );
}
