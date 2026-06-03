"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { SalesBarChart } from "@/components/SalesBarChart";
import { useAppData } from "@/context/AppDataProvider";
import { formatDateLabel, formatMoney } from "@/lib/format";
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

  if (!ready) {
    return (
      <AppShell>
        <p className="py-8 text-center text-stone-500">Cargando…</p>
      </AppShell>
    );
  }

  const symbol = settings.currencySymbol;
  const dailyTotal = sumReport(dailyReport);
  const monthlyTotal = sumReport(monthlyReport);
  const hourlyTotal = sumReport(hourlyReport);
  const bestDay = peakPoint(dailyReport.filter((d) => d.total > 0));
  const bestHour = peakPoint(hourlyReport.filter((h) => h.total > 0));
  const bestMonth = peakPoint(monthlyReport.filter((m) => m.total > 0));

  const hourlyDayOptions =
    daysWithData.length > 0 ? daysWithData : [getTodayKey()];

  return (
    <AppShell>
      <div className="flex flex-1 flex-col gap-4 pb-24">
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
  children,
}: {
  icon: typeof CalendarDays;
  title: string;
  subtitle: string;
  total: string;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex gap-3">
          <Icon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
          <div>
            <h2 className="font-semibold text-stone-900">{title}</h2>
            <p className="text-xs text-stone-500">{subtitle}</p>
          </div>
        </div>
        {action}
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
