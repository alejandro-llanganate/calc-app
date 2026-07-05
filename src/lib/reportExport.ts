import type { ChartPoint } from "./report";
import type { DebtSummary } from "./types";
import { formatDateLabel, formatMoney } from "./format";

export function openWhatsApp(text: string) {
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

export function formatChartWhatsApp(opts: {
  title: string;
  subtitle: string;
  total: string;
  symbol: string;
  hint?: string;
  data: ChartPoint[];
}): string {
  const lines = [
    `📊 *${opts.title}*`,
    opts.subtitle,
    `Total: *${opts.total}*`,
  ];

  if (opts.hint) lines.push(opts.hint);

  const withSales = opts.data.filter((d) => d.total > 0);
  if (withSales.length > 0) {
    lines.push("");
    lines.push("Detalle:");
    withSales.slice(0, 12).forEach((d) => {
      const label =
        d.key.includes("-") && d.key.length === 10
          ? formatDateLabel(d.key)
          : d.label;
      lines.push(
        `• ${label}: ${formatMoney(d.total, opts.symbol)} (${d.count} ${d.count === 1 ? "compra" : "compras"})`,
      );
    });
    if (withSales.length > 12) {
      lines.push(`… y ${withSales.length - 12} más`);
    }
  }

  lines.push("", "_Caja Ventas_");
  return lines.join("\n");
}

export type ReportPdfData = {
  storeName: string;
  symbol: string;
  periodLabel: string;
  todayTotal: number;
  todayCount: number;
  periodTotal: number;
  periodCount: number;
  chartTitle: string;
  chartReport: ChartPoint[];
  dailyReport: ChartPoint[];
  hourlyDay: string;
  hourlyReport: ChartPoint[];
  weeklyReport: ChartPoint[];
  monthlyReport: ChartPoint[];
  debtSummary: DebtSummary;
  debtChart: ChartPoint[];
  debtsList: {
    name: string;
    amount: number;
    paid: number;
    pending: number;
    status: string;
    date: string;
  }[];
};

export function formatFullReportWhatsApp(data: ReportPdfData): string {
  const { symbol } = data;
  const lines = [
    `📈 *Reporte de ventas*`,
    data.storeName,
    data.periodLabel,
    `Generado: ${new Date().toLocaleString("es")}`,
    "",
    `*Hoy:* ${formatMoney(data.todayTotal, symbol)} (${data.todayCount} compras)`,
    `*Periodo:* ${formatMoney(data.periodTotal, symbol)} (${data.periodCount} compras)`,
    "",
    `*Debes — prestado:* ${formatMoney(data.debtSummary.totalLent, symbol)}`,
    `*Cobrado:* ${formatMoney(data.debtSummary.totalPaid, symbol)}`,
    `*Por cobrar:* ${formatMoney(data.debtSummary.totalPending, symbol)}`,
    "",
    "_Caja Ventas_",
  ];
  return lines.join("\n");
}
