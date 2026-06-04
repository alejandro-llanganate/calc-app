"use client";

import type { ChartPoint } from "./report";
import type { ReportPdfData } from "./reportExport";
import { formatDateLabel, formatMoney } from "./format";

export async function downloadReportPdf(data: ReportPdfData) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF();
  const { symbol } = data;
  let y = 14;

  const addLine = (text: string, size = 10, bold = false) => {
    doc.setFontSize(size);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    const lines = doc.splitTextToSize(text, 190);
    lines.forEach((line: string) => {
      if (y > 280) {
        doc.addPage();
        y = 14;
      }
      doc.text(line, 10, y);
      y += size * 0.45 + 2;
    });
  };

  const addSection = (title: string, rows: ChartPoint[]) => {
    addLine(title, 12, true);
    const withSales = rows.filter((r) => r.total > 0);
    if (withSales.length === 0) {
      addLine("Sin ventas en este periodo.");
      return;
    }
    withSales.forEach((r) => {
      const label =
        r.key.includes("-") && r.key.length === 10
          ? formatDateLabel(r.key)
          : r.label;
      addLine(
        `${label}: ${formatMoney(r.total, symbol)} — ${r.count} ${r.count === 1 ? "compra" : "compras"}`,
      );
    });
    y += 2;
  };

  addLine("Reporte de ventas", 16, true);
  addLine(data.storeName, 11);
  addLine(`Generado: ${new Date().toLocaleString("es")}`, 9);
  y += 4;

  addLine(
    `Hoy: ${formatMoney(data.todayTotal, symbol)} (${data.todayCount} compras)`,
    11,
    true,
  );
  addLine(`Total 14 días: ${formatMoney(data.dailyTotal, symbol)}`, 10);
  addLine(
    `${formatDateLabel(data.hourlyDay)}: ${formatMoney(data.hourlyTotal, symbol)}`,
    10,
  );
  addLine(`Total 6 meses: ${formatMoney(data.monthlyTotal, symbol)}`, 10);
  y += 4;

  addSection("Ventas por día (14 días)", data.dailyReport);
  addSection(
    `Ventas por hora — ${formatDateLabel(data.hourlyDay)}`,
    data.hourlyReport,
  );
  addSection("Ventas por mes (6 meses)", data.monthlyReport);

  doc.save(
    `reporte-${data.storeName.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.pdf`,
  );
}
