"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageNav } from "@/components/PageNav";
import { useAppData } from "@/context/AppDataProvider";
import {
  debtPendingAmount,
  filterDebtsByStatus,
} from "@/lib/debts";
import { formatDateTimeFull, formatMoney } from "@/lib/format";

type Filter = "all" | "pending" | "paid";

export default function DebePage() {
  const {
    ready,
    settings,
    debts,
    debtSummary,
    markDebtPaid,
    removeDebt,
  } = useAppData();
  const [filter, setFilter] = useState<Filter>("pending");

  const symbol = settings?.currencySymbol ?? "$";

  const filtered = useMemo(
    () =>
      [...filterDebtsByStatus(debts, filter)].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [debts, filter],
  );

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
        <PageNav
          backHref="/"
          backLabel="Volver a la calculadora"
          actionHref="/panel/historial"
          actionLabel="Ver historial"
        />

        <div>
          <h1 className="text-3xl font-semibold text-[#1a1a1a]">Debe</h1>
          <p className="mt-1 text-sm text-[var(--calc-muted)]">
            Fiados y créditos. Al marcar pagado el registro permanece en el
            historial.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <SummaryCard
            label="Prestado"
            value={formatMoney(debtSummary.totalLent, symbol)}
          />
          <SummaryCard
            label="Cobrado"
            value={formatMoney(debtSummary.totalPaid, symbol)}
            accent="green"
          />
          <SummaryCard
            label="Por cobrar"
            value={formatMoney(debtSummary.totalPending, symbol)}
            accent="orange"
          />
        </div>

        <div className="flex gap-1 rounded-xl bg-[#f3f2f1] p-1 sm:inline-flex sm:w-auto">
          {(
            [
              ["pending", "Por cobrar"],
              ["paid", "Pagados"],
              ["all", "Todos"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`rounded-lg px-5 py-2.5 text-sm font-medium transition-colors ${
                filter === key
                  ? "bg-white text-[var(--calc-accent)] shadow-sm"
                  : "text-[var(--calc-muted)] hover:text-[#1a1a1a]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <section className="overflow-hidden rounded-xl border border-[var(--calc-border)] bg-white shadow-sm">
          <div className="hidden border-b border-[var(--calc-border)] bg-[#faf9f8] px-5 py-3 text-xs font-medium uppercase tracking-wide text-[var(--calc-muted)] lg:grid lg:grid-cols-[1fr_140px_140px_180px] lg:gap-4">
            <span>Persona</span>
            <span className="text-right">Monto</span>
            <span className="text-right">Estado</span>
            <span className="text-right">Acciones</span>
          </div>

          {filtered.length === 0 ? (
            <p className="px-5 py-16 text-center text-sm text-[var(--calc-muted)]">
              No hay registros en esta vista.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--calc-border)]">
              {filtered.map((debt) => {
                const pending = debtPendingAmount(debt);
                const isPaid = debt.status === "paid" || pending <= 0;
                return (
                  <li
                    key={debt.id}
                    className="px-5 py-4 lg:grid lg:grid-cols-[1fr_140px_140px_180px] lg:items-center lg:gap-4"
                  >
                    <div className="min-w-0">
                      <p className="text-lg font-medium text-[#1a1a1a]">
                        {debt.debtorName}
                      </p>
                      <p className="mt-0.5 text-sm capitalize text-[var(--calc-muted)]">
                        {formatDateTimeFull(debt.createdAt)}
                      </p>
                      {debt.registeredBy && (
                        <p className="mt-0.5 text-xs text-[var(--calc-accent)]">
                          {debt.registeredBy}
                        </p>
                      )}
                      {debt.note && (
                        <p className="mt-1 text-sm text-[var(--calc-muted)]">
                          {debt.note}
                        </p>
                      )}
                      {isPaid && debt.paidAt && (
                        <p className="mt-1 text-xs text-emerald-700">
                          Pagado · {formatDateTimeFull(debt.paidAt)}
                        </p>
                      )}
                    </div>
                    <div className="mt-3 lg:mt-0 lg:text-right">
                      <p className="text-xl font-light tabular-nums text-[#1a1a1a]">
                        {formatMoney(debt.amount, symbol)}
                      </p>
                      {!isPaid && (
                        <p className="text-sm text-orange-600">
                          {formatMoney(pending, symbol)}
                        </p>
                      )}
                    </div>
                    <div className="mt-2 lg:mt-0 lg:text-right">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          isPaid
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-[#fff4ce] text-[#835c00]"
                        }`}
                      >
                        {isPaid ? "Pagado" : "Pendiente"}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 lg:mt-0 lg:justify-end">
                      {!isPaid && (
                        <button
                          type="button"
                          onClick={() => markDebtPaid(debt.id)}
                          className="rounded-lg bg-[var(--calc-accent)] px-3 py-1.5 text-sm font-medium text-white"
                        >
                          Pagado
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeDebt(debt.id)}
                        className="rounded-lg border border-[var(--calc-border)] px-3 py-1.5 text-sm text-red-600"
                      >
                        Eliminar
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "green" | "orange";
}) {
  return (
    <div className="rounded-xl border border-[var(--calc-border)] bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--calc-muted)]">
        {label}
      </p>
      <p
        className={`mt-2 text-2xl font-light tabular-nums ${
          accent === "green"
            ? "text-emerald-700"
            : accent === "orange"
              ? "text-orange-600"
              : "text-[#1a1a1a]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
