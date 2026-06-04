import type { ChartPoint } from "./report";
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

export function formatFullReportWhatsApp(opts: {
  storeName: string;
  symbol: string;
  todayTotal: number;
  todayCount: number;
  dailyTotal: number;
  dailyReport: ChartPoint[];
  hourlyTotal: number;
  hourlyDay: string;
  hourlyReport: ChartPoint[];
  monthlyTotal: number;
  monthlyReport: ChartPoint[];
}): string {
  const { symbol } = opts;
  const lines = [
    `📈 *Reporte de ventas*`,
    opts.storeName,
    `Generado: ${new Date().toLocaleString("es")}`,
    "",
    `*Hoy:* ${formatMoney(opts.todayTotal, symbol)} (${opts.todayCount} compras)`,
    `*14 días:* ${formatMoney(opts.dailyTotal, symbol)}`,
    `*${formatDateLabel(opts.hourlyDay)}:* ${formatMoney(opts.hourlyTotal, symbol)}`,
    `*6 meses:* ${formatMoney(opts.monthlyTotal, symbol)}`,
    "",
    "*Por día (con ventas):*",
  ];

  opts.dailyReport
    .filter((d) => d.total > 0)
    .slice(-7)
    .forEach((d) => {
      lines.push(
        `• ${formatDateLabel(d.key)}: ${formatMoney(d.total, symbol)}`,
      );
    });

  lines.push("", "_Caja Ventas_");
  return lines.join("\n");
}

export type ReportPdfData = {
  storeName: string;
  symbol: string;
  todayTotal: number;
  todayCount: number;
  dailyTotal: number;
  dailyReport: ChartPoint[];
  hourlyTotal: number;
  hourlyDay: string;
  hourlyReport: ChartPoint[];
  monthlyTotal: number;
  monthlyReport: ChartPoint[];
};
