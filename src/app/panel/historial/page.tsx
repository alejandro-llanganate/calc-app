"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { ActivityHistoryList, type ActivityEntry } from "@/components/ActivityHistoryList";
import { PageNav } from "@/components/PageNav";
import { useAppData } from "@/context/AppDataProvider";
import { debtPendingAmount } from "@/lib/debts";
import {
  formatDateLabel,
  formatMoney,
} from "@/lib/format";
import { purchaseDateKey } from "@/lib/storage";

export default function HistorialPage() {
  const {
    ready,
    settings,
    purchases,
    debts,
    purchasesForDate,
    removePurchase,
    addDebtPayment,
    markDebtPaid,
    removeDebt,
  } = useAppData();
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const days = useMemo(() => {
    const purchaseDays = purchases.map((p) => purchaseDateKey(p.createdAt));
    const debtDays = debts.map((d) => purchaseDateKey(d.createdAt));
    const paidDays = debts
      .filter((d) => d.paidAt)
      .map((d) => purchaseDateKey(d.paidAt!));
    return [...new Set([...purchaseDays, ...debtDays, ...paidDays])].sort().reverse();
  }, [purchases, debts]);

  const activeDay = selectedDay ?? days[0] ?? null;
  const dayPurchases = activeDay ? purchasesForDate(activeDay) : [];

  const dayDebts = useMemo(() => {
    if (!activeDay) return [];
    return debts.filter((d) => {
      const created = purchaseDateKey(d.createdAt);
      const paid = d.paidAt ? purchaseDateKey(d.paidAt) : null;
      return created === activeDay || paid === activeDay;
    });
  }, [debts, activeDay]);

  const entries = useMemo((): ActivityEntry[] => {
    const list: ActivityEntry[] = [
      ...dayPurchases.map((p) => ({
        kind: "purchase" as const,
        id: p.id,
        at: p.createdAt,
        purchase: p,
      })),
      ...dayDebts.map((d) => ({
        kind: "debt" as const,
        id: d.id,
        at: d.paidAt && activeDay === purchaseDateKey(d.paidAt)
          ? d.paidAt
          : d.createdAt,
        debt: d,
      })),
    ];
    return list.sort(
      (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
    );
  }, [dayPurchases, dayDebts, activeDay]);

  const daySalesTotal = dayPurchases.reduce((s, p) => s + p.total, 0);
  const dayDebtPending = dayDebts.reduce(
    (s, d) => s + debtPendingAmount(d),
    0,
  );

  if (!ready) {
    return (
      <AppShell>
        <p className="py-8 text-center text-stone-500">Cargando…</p>
      </AppShell>
    );
  }

  const symbol = settings.currencySymbol;

  const exportJson = () => {
    const blob = new Blob(
      [JSON.stringify({ purchases, debts }, null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `historial-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell>
      <div className="flex flex-1 flex-col gap-6">
        <PageNav
          backHref="/"
          backLabel="Volver a la calculadora"
          actionHref="/panel/debe"
          actionLabel="Ir a Debe"
          actionIcon="debe"
        />

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-[#1a1a1a]">Historial</h1>
            <p className="mt-1 text-sm text-[var(--calc-muted)]">
              Ventas y operaciones de fiado en un solo lugar.
            </p>
          </div>
          {days.length > 0 && (
            <label className="block min-w-[220px]">
              <span className="text-xs font-medium text-[var(--calc-muted)]">
                Día
              </span>
              <select
                value={activeDay ?? ""}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--calc-border)] bg-white px-3 py-2.5 text-sm"
              >
                {days.map((d) => (
                  <option key={d} value={d}>
                    {formatDateLabel(d)}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        {days.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--calc-border)] bg-white px-6 py-16 text-center">
            <p className="text-[var(--calc-muted)]">
              No hay movimientos guardados.
            </p>
            <Link
              href="/"
              className="mt-4 inline-flex text-sm font-medium text-[var(--calc-accent)] hover:underline"
            >
              Ir a la calculadora
            </Link>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <SummaryTile
                label="Ventas del día"
                value={formatMoney(daySalesTotal, symbol)}
                detail={`${dayPurchases.length} compras`}
              />
              <SummaryTile
                label="Debe pendiente"
                value={formatMoney(dayDebtPending, symbol)}
                detail={`${dayDebts.filter((d) => debtPendingAmount(d) > 0).length} activos`}
                accent="orange"
              />
              <SummaryTile
                label="Movimientos"
                value={String(entries.length)}
                detail="Ventas + fiados"
              />
            </div>

            <section className="overflow-hidden rounded-xl border border-[var(--calc-border)] bg-white shadow-sm">
              <div className="border-b border-[var(--calc-border)] bg-[#faf9f8] px-5 py-3">
                <h2 className="font-medium text-[#1a1a1a]">
                  {activeDay ? formatDateLabel(activeDay) : "—"}
                </h2>
                <p className="text-xs text-[var(--calc-muted)]">
                  Ordenado del más reciente al más antiguo
                </p>
              </div>
              <div className="px-5">
                <ActivityHistoryList
                  entries={entries}
                  currencySymbol={symbol}
                  onRemovePurchase={removePurchase}
                  onAddDebtPayment={addDebtPayment}
                  onMarkDebtPaid={markDebtPaid}
                  onRemoveDebt={removeDebt}
                />
              </div>
            </section>
          </>
        )}

        <div className="flex flex-wrap gap-3 border-t border-[var(--calc-border)] pt-6">
          <button
            type="button"
            onClick={exportJson}
            disabled={purchases.length === 0 && debts.length === 0}
            className="rounded-lg border border-[var(--calc-border)] bg-white px-4 py-2.5 text-sm font-medium disabled:opacity-40"
          >
            Descargar respaldo (JSON)
          </button>
          <Link
            href="/panel/debe"
            className="rounded-lg bg-[#fff4ce] px-4 py-2.5 text-sm font-medium text-[#835c00]"
          >
            Gestionar todos los debes
          </Link>
        </div>
      </div>
    </AppShell>
  );
}

function SummaryTile({
  label,
  value,
  detail,
  accent,
}: {
  label: string;
  value: string;
  detail?: string;
  accent?: "orange";
}) {
  return (
    <div className="rounded-xl border border-[var(--calc-border)] bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--calc-muted)]">
        {label}
      </p>
      <p
        className={`mt-2 text-2xl font-light tabular-nums ${
          accent === "orange" ? "text-orange-600" : "text-[#1a1a1a]"
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
