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
import {
  debtPendingAmount,
  debtsToChartPoints,
} from "@/lib/debts";
import { formatDateLabel, formatDayChartTick, formatDateTimeFull, formatMoney } from "@/lib/format";
import {
  formatChartWhatsApp,
  formatFullReportWhatsApp,
  openWhatsApp,
  type ReportPdfData,
} from "@/lib/reportExport";
import { downloadReportPdf } from "@/lib/reportPdf.client";
import {
  getDailyReport,
  getDailyReportForRange,
  getDaysWithPurchases,
  getHourlyReport,
  getMonthlyReport,
  getWeeklyReport,
  peakPoint,
  purchasesInRange,
  sumReport,
} from "@/lib/report";
import { todayKey as getTodayKey } from "@/lib/storage";
import {
  CalendarDays,
  Clock,
  TrendingUp,
  Wallet,
} from "lucide-react";

type Period =
  | "today"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "custom";

const PERIOD_TABS: { id: Period; label: string }[] = [
  { id: "today", label: "Hoy" },
  { id: "hourly", label: "Hora" },
  { id: "daily", label: "Día" },
  { id: "weekly", label: "Semana" },
  { id: "monthly", label: "Mes" },
  { id: "custom", label: "Rango" },
];

export default function PanelPage() {
  const {
    ready,
    settings,
    todayTotal,
    todayPurchases,
    todayKey,
    purchases,
    debts,
    debtSummary,
  } = useAppData();

  const [period, setPeriod] = useState<Period>("daily");
  const [hourlyDay, setHourlyDay] = useState(getTodayKey());
  const [fromDate, setFromDate] = useState(getTodayKey());
  const [toDate, setToDate] = useState(getTodayKey());

  const daysWithData = useMemo(
    () => getDaysWithPurchases(purchases),
    [purchases],
  );

  const dailyReport = useMemo(
    () => getDailyReport(purchases, 14),
    [purchases],
  );
  const hourlyReport = useMemo(
    () => getHourlyReport(purchases, hourlyDay),
    [purchases, hourlyDay],
  );
  const weeklyReport = useMemo(
    () => getWeeklyReport(purchases, 8),
    [purchases],
  );
  const monthlyReport = useMemo(
    () => getMonthlyReport(purchases, 6),
    [purchases],
  );
  const customReport = useMemo(
    () => getDailyReportForRange(purchases, fromDate, toDate),
    [purchases, fromDate, toDate],
  );

  const debtChart = useMemo(() => debtsToChartPoints(debts), [debts]);

  const symbol = settings?.currencySymbol ?? "$";

  const { chartReport, chartTitle, chartSubtitle, periodTotal, periodCount } =
    useMemo(() => {
      switch (period) {
        case "today": {
          const todayTick = formatDayChartTick(todayKey);
          return {
            chartReport: [
              {
                key: todayKey,
                label: todayTick.full,
                shortLabel: todayTick.axis,
                weekday: todayTick.weekday,
                dayNum: todayTick.dayNum,
                total: todayTotal,
                count: todayPurchases.length,
              },
            ],
            chartTitle: "Ventas de hoy",
            chartSubtitle: todayTick.full,
            periodTotal: todayTotal,
            periodCount: todayPurchases.length,
          };
        }
        case "hourly":
          return {
            chartReport: hourlyReport,
            chartTitle: "Ventas por hora",
            chartSubtitle: formatDateLabel(hourlyDay),
            periodTotal: sumReport(hourlyReport),
            periodCount: hourlyReport.reduce((s, h) => s + h.count, 0),
          };
        case "weekly":
          return {
            chartReport: weeklyReport,
            chartTitle: "Ventas por semana",
            chartSubtitle: "Últimas 8 semanas",
            periodTotal: sumReport(weeklyReport),
            periodCount: weeklyReport.reduce((s, w) => s + w.count, 0),
          };
        case "monthly":
          return {
            chartReport: monthlyReport,
            chartTitle: "Ventas por mes",
            chartSubtitle: "Últimos 6 meses",
            periodTotal: sumReport(monthlyReport),
            periodCount: monthlyReport.reduce((s, m) => s + m.count, 0),
          };
        case "custom": {
          const rangePurchases = purchasesInRange(
            purchases,
            fromDate,
            toDate,
          );
          return {
            chartReport: customReport,
            chartTitle: "Ventas por fecha",
            chartSubtitle: `${formatDateLabel(fromDate)} — ${formatDateLabel(toDate)}`,
            periodTotal: rangePurchases.reduce((s, p) => s + p.total, 0),
            periodCount: rangePurchases.length,
          };
        }
        default:
          return {
            chartReport: dailyReport,
            chartTitle: "Ventas por día",
            chartSubtitle: "Últimos 14 días",
            periodTotal: sumReport(dailyReport),
            periodCount: dailyReport.reduce((s, d) => s + d.count, 0),
          };
      }
    }, [
      period,
      todayKey,
      todayTotal,
      todayPurchases.length,
      hourlyReport,
      hourlyDay,
      weeklyReport,
      monthlyReport,
      customReport,
      fromDate,
      toDate,
      purchases,
      dailyReport,
    ]);

  const peak = peakPoint(chartReport.filter((p) => p.total > 0));
  const hourlyDayOptions =
    daysWithData.length > 0 ? daysWithData : [getTodayKey()];
  const hasSales = purchases.length > 0;

  const pdfData: ReportPdfData = useMemo(
    () => ({
      storeName: settings?.storeName ?? "Mi tienda",
      symbol,
      periodLabel: chartSubtitle,
      todayTotal,
      todayCount: todayPurchases.length,
      periodTotal,
      periodCount,
      chartTitle,
      chartReport,
      dailyReport,
      hourlyDay,
      hourlyReport,
      weeklyReport,
      monthlyReport,
      debtSummary,
      debtChart,
      debtsList: debts.map((d) => ({
        name: d.debtorName,
        amount: d.amount,
        paid: d.amountPaid,
        pending: debtPendingAmount(d),
        status: d.status === "paid" ? "Pagado" : "Pendiente",
        date: formatDateTimeFull(d.createdAt),
      })),
    }),
    [
      settings?.storeName,
      symbol,
      chartSubtitle,
      todayTotal,
      todayPurchases.length,
      periodTotal,
      periodCount,
      chartTitle,
      chartReport,
      dailyReport,
      hourlyDay,
      hourlyReport,
      weeklyReport,
      monthlyReport,
      debtSummary,
      debtChart,
      debts,
    ],
  );

  const handleDownloadPdf = useCallback(() => {
    downloadReportPdf(pdfData);
  }, [pdfData]);

  const handleShareFullWhatsApp = useCallback(() => {
    openWhatsApp(formatFullReportWhatsApp(pdfData));
  }, [pdfData]);

  const shareChart = useCallback(() => {
    openWhatsApp(
      formatChartWhatsApp({
        title: chartTitle,
        subtitle: chartSubtitle,
        total: formatMoney(periodTotal, symbol),
        symbol,
        hint:
          peak && peak.total > 0
            ? `Mejor: ${peak.label} (${formatMoney(peak.total, symbol)})`
            : undefined,
        data: chartReport,
      }),
    );
  }, [chartTitle, chartSubtitle, periodTotal, symbol, peak, chartReport]);

  if (!ready) {
    return (
      <AppShell>
        <p className="py-8 text-center text-stone-500">Cargando…</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex flex-1 flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--calc-border)] pb-5">
          <div>
            <h1 className="text-3xl font-semibold text-[#1a1a1a]">Reportes</h1>
            <p className="mt-1 text-sm text-[var(--calc-muted)]">
              Ingresos por periodo y resumen de fiados.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="rounded-lg border border-[var(--calc-border)] bg-white px-4 py-2 text-sm font-medium hover:bg-[#f3f2f1]"
            >
              Ir a la calculadora
            </Link>
            <Link
              href="/panel/debe"
              className="rounded-lg bg-[#fff4ce] px-4 py-2 text-sm font-medium text-[#835c00]"
            >
              Ver Debe
            </Link>
            <ReportExportBar
              compact
              onDownloadPdf={handleDownloadPdf}
              onShareFullWhatsApp={handleShareFullWhatsApp}
              disabled={!hasSales && debts.length === 0}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-1 rounded-xl bg-[#f3f2f1] p-1">
          {PERIOD_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setPeriod(tab.id)}
              className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                period === tab.id
                  ? "bg-white text-[var(--calc-accent)] shadow-sm"
                  : "text-[var(--calc-muted)] hover:text-[#1a1a1a]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Hoy"
            value={formatMoney(todayTotal, symbol)}
            detail={`${todayPurchases.length} compras`}
          />
          <StatCard
            label="Periodo seleccionado"
            value={formatMoney(periodTotal, symbol)}
            detail={`${periodCount} compras`}
          />
          <StatCard
            label="Por cobrar"
            value={formatMoney(debtSummary.totalPending, symbol)}
            detail={`${debtSummary.countPending} pendientes`}
            accent="orange"
          />
          <StatCard
            label="Fiados cobrados"
            value={formatMoney(debtSummary.totalPaid, symbol)}
            detail={`${debtSummary.countPaid} pagados`}
            accent="green"
          />
        </div>

        <ReportSection
          icon={period === "hourly" ? Clock : CalendarDays}
          title={chartTitle}
          subtitle={chartSubtitle}
          total={formatMoney(periodTotal, symbol)}
          hint={
            peak && peak.total > 0
              ? `Pico: ${peak.label} · ${formatMoney(peak.total, symbol)}`
              : undefined
          }
          onShareWhatsApp={shareChart}
          shareDisabled={!chartReport.some((d) => d.total > 0)}
          action={
            period === "hourly" ? (
              <select
                value={hourlyDay}
                onChange={(e) => setHourlyDay(e.target.value)}
                className="rounded-lg border border-[var(--calc-border)] bg-white px-3 py-2 text-sm"
              >
                {hourlyDayOptions.map((d) => (
                  <option key={d} value={d}>
                    {formatDateLabel(d)}
                  </option>
                ))}
              </select>
            ) : period === "custom" ? (
              <div className="flex flex-wrap gap-2">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="rounded-lg border border-[var(--calc-border)] px-3 py-2 text-sm"
                />
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="rounded-lg border border-[var(--calc-border)] px-3 py-2 text-sm"
                />
              </div>
            ) : undefined
          }
          className="xl:col-span-2"
        >
          <SalesBarChart
            data={chartReport}
            currencySymbol={symbol}
            barColor="#0078d4"
            xDataKey={
              period === "daily" || period === "custom" ? "shortLabel" : "label"
            }
            scrollable={period === "daily" || period === "custom"}
            barSlotWidth={period === "hourly" ? 32 : 64}
            xInterval={period === "hourly" ? 1 : 0}
            height={340}
            emptyMessage="Sin ventas en este periodo"
          />
        </ReportSection>

        <div className="grid gap-6 xl:grid-cols-2">
          <ReportSection
            icon={Wallet}
            title="Debes por persona"
            subtitle="Montos pendientes de cobro"
            total={formatMoney(debtSummary.totalPending, symbol)}
            hint={`Prestado: ${formatMoney(debtSummary.totalLent, symbol)} · Cobrado: ${formatMoney(debtSummary.totalPaid, symbol)}`}
          >
            <SalesBarChart
              data={debtChart}
              currencySymbol={symbol}
              barColor="#d83b01"
              xDataKey="label"
              height={280}
              emptyMessage="No hay fiados pendientes"
            />
            <Link
              href="/panel/debe"
              className="mt-4 inline-flex rounded-lg bg-[#fff4ce] px-4 py-2 text-sm font-medium text-[#835c00]"
            >
              Gestionar debes →
            </Link>
          </ReportSection>

          <ReportSection
            icon={TrendingUp}
            title="Tendencia mensual"
            subtitle="Últimos 6 meses"
            total={formatMoney(sumReport(monthlyReport), symbol)}
          >
            <SalesBarChart
              data={monthlyReport}
              currencySymbol={symbol}
              barColor="#107c10"
              height={280}
              emptyMessage="Sin ventas por mes"
            />
          </ReportSection>
        </div>
      </div>
    </AppShell>
  );
}

function StatCard({
  label,
  value,
  detail,
  accent,
}: {
  label: string;
  value: string;
  detail?: string;
  accent?: "green" | "orange";
}) {
  return (
    <div className="rounded-xl border border-[var(--calc-border)] bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--calc-muted)]">
        {label}
      </p>
      <p
        className={`mt-2 text-2xl font-light tabular-nums xl:text-3xl ${
          accent === "green"
            ? "text-emerald-700"
            : accent === "orange"
              ? "text-orange-600"
              : "text-[#1a1a1a]"
        }`}
      >
        {value}
      </p>
      {detail && (
        <p className="mt-1 text-sm text-[var(--calc-muted)]">{detail}</p>
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
  className = "",
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
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`rounded-xl border border-[var(--calc-border)] bg-white p-6 shadow-sm ${className}`}
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#deecf9]">
            <Icon className="h-5 w-5 text-[var(--calc-accent)]" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-[#1a1a1a]">{title}</h2>
            <p className="text-sm text-[var(--calc-muted)]">{subtitle}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {action}
          {onShareWhatsApp && (
            <ChartShareButtons
              onShareWhatsApp={onShareWhatsApp}
              disabled={shareDisabled}
            />
          )}
        </div>
      </div>
      <p className="mb-1 text-4xl font-light tabular-nums text-[var(--calc-accent)]">
        {total}
      </p>
      {hint && (
        <p className="mb-5 text-sm text-[var(--calc-muted)]">{hint}</p>
      )}
      {!hint && <div className="mb-5" />}
      {children}
    </section>
  );
}
