"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  ChartShareButtons,
  ReportExportBar,
} from "@/components/ReportExportBar";
import { SalesBarChart } from "@/components/SalesBarChart";
import { useAppData } from "@/context/AppDataProvider";
import { formatDateLabel, formatMoney } from "@/lib/format";
import {
  formatChartWhatsApp,
  formatFullReportWhatsApp,
  openWhatsApp,
} from "@/lib/reportExport";
import { downloadReportPdf } from "@/lib/reportPdf.client";
import {
  getDailyReport,
  getDaysWithPurchases,
  getHourlyReport,
  getMonthlyReport,
  peakPoint,
  sumReport,
} from "@/lib/report";
import { todayKey as getTodayKey } from "@/lib/storage";
import { CalendarDays, Clock, TrendingUp } from "lucide-react";

export default function PanelPage() {
  const { ready, settings, todayTotal, todayPurchases, todayKey, purchases } =
    useAppData();
  const daysWithData = useMemo(
    () => getDaysWithPurchases(purchases),
    [purchases],
  );
  const [hourlyDay, setHourlyDay] = useState(getTodayKey());

  const dailyReport = useMemo(
    () => getDailyReport(purchases, 14),
    [purchases],
  );
  const hourlyReport = useMemo(
    () => getHourlyReport(purchases, hourlyDay),
    [purchases, hourlyDay],
  );
  const monthlyReport = useMemo(
    () => getMonthlyReport(purchases, 6),
    [purchases],
  );

  const symbol = settings?.currencySymbol ?? "$";
  const dailyTotal = sumReport(dailyReport);
  const monthlyTotal = sumReport(monthlyReport);
  const hourlyTotal = sumReport(hourlyReport);
  const bestDay = peakPoint(dailyReport.filter((d) => d.total > 0));
  const bestHour = peakPoint(hourlyReport.filter((h) => h.total > 0));
  const bestMonth = peakPoint(monthlyReport.filter((m) => m.total > 0));
  const hasSales = purchases.length > 0;

  const hourlyDayOptions =
    daysWithData.length > 0 ? daysWithData : [getTodayKey()];

  const pdfData = useMemo(
    () => ({
      storeName: settings?.storeName ?? "Mi tienda",
      symbol,
      todayTotal,
      todayCount: todayPurchases.length,
      dailyTotal,
      dailyReport,
      hourlyTotal,
      hourlyDay,
      hourlyReport,
      monthlyTotal,
      monthlyReport,
    }),
    [
      settings?.storeName,
      symbol,
      todayTotal,
      todayPurchases.length,
      dailyTotal,
      dailyReport,
      hourlyTotal,
      hourlyDay,
      hourlyReport,
      monthlyTotal,
      monthlyReport,
    ],
  );

  const handleDownloadPdf = useCallback(() => {
    downloadReportPdf(pdfData);
  }, [pdfData]);

  const handleShareFullWhatsApp = useCallback(() => {
    openWhatsApp(formatFullReportWhatsApp(pdfData));
  }, [pdfData]);

  const shareDaily = useCallback(() => {
    openWhatsApp(
      formatChartWhatsApp({
        title: "Ventas por día",
        subtitle: "Últimos 14 días",
        total: formatMoney(dailyTotal, symbol),
        symbol,
        hint:
          bestDay && bestDay.total > 0
            ? `Día más fuerte: ${formatDateLabel(bestDay.key)}`
            : undefined,
        data: dailyReport,
      }),
    );
  }, [dailyTotal, symbol, bestDay, dailyReport]);

  const shareHourly = useCallback(() => {
    openWhatsApp(
      formatChartWhatsApp({
        title: "Ventas por hora",
        subtitle: formatDateLabel(hourlyDay),
        total: formatMoney(hourlyTotal, symbol),
        symbol,
        hint:
          bestHour && bestHour.total > 0
            ? `Hora pico: ${bestHour.label}`
            : undefined,
        data: hourlyReport,
      }),
    );
  }, [hourlyDay, hourlyTotal, symbol, bestHour, hourlyReport]);

  const shareMonthly = useCallback(() => {
    openWhatsApp(
      formatChartWhatsApp({
        title: "Ventas por mes",
        subtitle: "Últimos 6 meses",
        total: formatMoney(monthlyTotal, symbol),
        symbol,
        hint:
          bestMonth && bestMonth.total > 0
            ? `Mejor mes: ${bestMonth.label}`
            : undefined,
        data: monthlyReport,
      }),
    );
  }, [monthlyTotal, symbol, bestMonth, monthlyReport]);

  if (!ready) {
    return (
      <AppShell>
        <p className="py-8 text-center text-stone-500">Cargando…</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex flex-1 flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Panel</h1>
          <p className="mt-1 text-sm text-stone-600">
            Reportes de ventas. La caja está en{" "}
            <Link href="/" className="font-medium text-emerald-700 underline">
              Caja
            </Link>
            .
          </p>
        </div>

        <ReportExportBar
          onDownloadPdf={handleDownloadPdf}
          onShareFullWhatsApp={handleShareFullWhatsApp}
          disabled={!hasSales}
        />

        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Hoy"
            value={formatMoney(todayTotal, symbol)}
            detail={`${todayPurchases.length} compras`}
          />
          <StatCard
            label="14 días"
            value={formatMoney(dailyTotal, symbol)}
            detail={
              bestDay
                ? `Mejor: ${formatDateLabel(bestDay.key)}`
                : "Sin datos"
            }
          />
        </div>

        <ReportSection
          icon={CalendarDays}
          title="Ventas por día"
          subtitle="Últimos 14 días"
          total={formatMoney(dailyTotal, symbol)}
          hint={
            bestDay && bestDay.total > 0
              ? `Día más fuerte: ${formatDateLabel(bestDay.key)} (${formatMoney(bestDay.total, symbol)})`
              : undefined
          }
          onShareWhatsApp={shareDaily}
          shareDisabled={!dailyReport.some((d) => d.total > 0)}
        >
          <SalesBarChart
            data={dailyReport}
            currencySymbol={symbol}
            barColor="#059669"
            xDataKey="shortLabel"
            scrollable
            barSlotWidth={48}
            height={210}
            emptyMessage="Registra compras en Caja para ver el gráfico diario"
          />
        </ReportSection>

        <ReportSection
          icon={Clock}
          title="Ventas por hora"
          subtitle={formatDateLabel(hourlyDay)}
          total={formatMoney(hourlyTotal, symbol)}
          hint={
            bestHour && bestHour.total > 0
              ? `Hora pico: ${bestHour.label} (${formatMoney(bestHour.total, symbol)})`
              : undefined
          }
          onShareWhatsApp={shareHourly}
          shareDisabled={!hourlyReport.some((h) => h.total > 0)}
          action={
            <select
              value={hourlyDay}
              onChange={(e) => setHourlyDay(e.target.value)}
              className="rounded-lg border border-stone-200 bg-stone-50 px-2 py-1 text-xs text-stone-700"
            >
              {hourlyDayOptions.map((d) => (
                <option key={d} value={d}>
                  {formatDateLabel(d)}
                </option>
              ))}
            </select>
          }
        >
          <SalesBarChart
            data={hourlyReport}
            currencySymbol={symbol}
            barColor="#0d9488"
            xInterval={2}
            emptyMessage="Sin ventas en este día"
          />
        </ReportSection>

        <ReportSection
          icon={TrendingUp}
          title="Ventas por mes"
          subtitle="Últimos 6 meses"
          total={formatMoney(monthlyTotal, symbol)}
          hint={
            bestMonth && bestMonth.total > 0
              ? `Mejor mes: ${bestMonth.label} (${formatMoney(bestMonth.total, symbol)})`
              : undefined
          }
          onShareWhatsApp={shareMonthly}
          shareDisabled={!monthlyReport.some((m) => m.total > 0)}
        >
          <SalesBarChart
            data={monthlyReport}
            currencySymbol={symbol}
            barColor="#047857"
            emptyMessage="Aún no hay ventas registradas por mes"
          />
        </ReportSection>

        <section className="rounded-2xl border border-stone-200 bg-white p-4">
          <h2 className="font-semibold text-stone-900">Accesos rápidos</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <QuickLink href="/panel/historial" label="Historial" />
            <QuickLink href="/panel/productos" label="Productos" />
            <QuickLink href="/panel/configuracion" label="Ajustes" />
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4">
      <p className="text-xs text-stone-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-stone-900">{value}</p>
      {detail && (
        <p className="mt-1 truncate text-xs text-stone-600">{detail}</p>
      )}
    </div>
  );
}

function ReportSection({
  icon: Icon,
  title,
  subtitle,
  total,
  hint,
  action,
  onShareWhatsApp,
  shareDisabled,
  children,
}: {
  icon: typeof CalendarDays;
  title: string;
  subtitle: string;
  total: string;
  hint?: string;
  action?: React.ReactNode;
  onShareWhatsApp?: () => void;
  shareDisabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex min-w-0 gap-3">
          <Icon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
          <div className="min-w-0">
            <h2 className="font-semibold text-stone-900">{title}</h2>
            <p className="text-xs text-stone-500">{subtitle}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          {action}
          {onShareWhatsApp && (
            <ChartShareButtons
              onShareWhatsApp={onShareWhatsApp}
              disabled={shareDisabled}
            />
          )}
        </div>
      </div>
      <p className="mb-1 text-2xl font-bold text-emerald-700">{total}</p>
      {hint && <p className="mb-3 text-xs text-stone-500">{hint}</p>}
      {!hint && <div className="mb-3" />}
      {children}
    </section>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-stone-100 px-3 py-2.5 text-center text-sm font-medium text-emerald-800 hover:bg-stone-50"
    >
      {label}
    </Link>
  );
}
