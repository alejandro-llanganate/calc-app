"use client";

import Link from "next/link";
import type { Debt, Purchase } from "@/lib/types";
import { debtPendingAmount } from "@/lib/debts";
import { formatDateTimeFull, formatMoney } from "@/lib/format";
import { formatPaymentMethod } from "@/lib/payment";

export type ActivityEntry =
  | { kind: "purchase"; id: string; at: string; purchase: Purchase }
  | { kind: "debt"; id: string; at: string; debt: Debt };

type Props = {
  entries: ActivityEntry[];
  currencySymbol: string;
  compact?: boolean;
  onRemovePurchase?: (id: string) => void;
  onUpdatePurchase?: (id: string, items: Purchase["items"]) => void;
  onMarkDebtPaid?: (id: string) => void;
  onRemoveDebt?: (id: string) => void;
  emptyMessage?: string;
};

export function ActivityHistoryList({
  entries,
  currencySymbol,
  compact,
  onRemovePurchase,
  onMarkDebtPaid,
  onRemoveDebt,
  emptyMessage = "Sin movimientos en este día.",
}: Props) {
  if (entries.length === 0) {
    return (
      <p
        className={`text-center text-[var(--calc-muted)] ${
          compact ? "py-6 text-base" : "py-10 text-sm"
        }`}
      >
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul className="divide-y divide-[var(--calc-border)]">
      {entries.map((entry) =>
        entry.kind === "purchase" ? (
          <PurchaseRow
            key={entry.id}
            purchase={entry.purchase}
            currencySymbol={currencySymbol}
            compact={compact}
            onRemove={onRemovePurchase}
          />
        ) : (
          <DebtRow
            key={entry.id}
            debt={entry.debt}
            currencySymbol={currencySymbol}
            compact={compact}
            onMarkPaid={onMarkDebtPaid}
            onRemove={onRemoveDebt}
          />
        ),
      )}
    </ul>
  );
}

function PurchaseRow({
  purchase: p,
  currencySymbol,
  compact,
  onRemove,
}: {
  purchase: Purchase;
  currencySymbol: string;
  compact?: boolean;
  onRemove?: (id: string) => void;
}) {
  const paymentLabel = formatPaymentMethod(p.paymentMethod);

  if (compact) {
    return (
      <li className="py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex rounded-full bg-[#deecf9] px-2 py-0.5 text-[10px] font-semibold text-[var(--calc-accent)]">
                Venta
              </span>
              <p className="text-sm capitalize text-[var(--calc-muted)]">
                {formatDateTimeFull(p.createdAt)}
              </p>
            </div>
            {p.registeredBy && (
              <p className="mt-0.5 text-sm font-medium text-[var(--calc-accent)]">
                {p.registeredBy}
              </p>
            )}
            {paymentLabel && (
              <p className="mt-0.5 text-sm text-[var(--calc-muted)]">
                {paymentLabel}
              </p>
            )}
            <p className="mt-1 text-2xl font-normal tabular-nums text-[#1a1a1a]">
              {formatMoney(p.total, currencySymbol)}
            </p>
            <p className="mt-0.5 text-sm text-[var(--calc-muted)]">
              {p.items.length}{" "}
              {p.items.length === 1 ? "artículo" : "artículos"}
            </p>
          </div>
          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(p.id)}
              className="shrink-0 text-xs text-red-600 hover:underline"
            >
              Quitar
            </button>
          )}
        </div>
      </li>
    );
  }

  return (
    <li className="grid gap-3 py-4 lg:grid-cols-[auto_1fr_auto_auto] lg:items-center lg:gap-6">
      <span className="inline-flex w-fit rounded-full bg-[#deecf9] px-3 py-1 text-xs font-semibold text-[var(--calc-accent)]">
        Venta
      </span>
      <div className="min-w-0">
        <p className="text-sm capitalize text-[var(--calc-muted)]">
          {formatDateTimeFull(p.createdAt)}
        </p>
        {p.registeredBy && (
          <p className="mt-0.5 text-sm text-[var(--calc-muted)]">
            Por {p.registeredBy}
          </p>
        )}
        {paymentLabel && (
          <p className="mt-0.5 text-sm text-[var(--calc-muted)]">
            Pago: {paymentLabel}
          </p>
        )}
        <p className="mt-1 text-sm text-[var(--calc-muted)]">
          {p.items.length}{" "}
          {p.items.length === 1 ? "artículo" : "artículos"}
        </p>
      </div>
      <p className="text-2xl font-light tabular-nums text-[#1a1a1a] lg:text-right">
        {formatMoney(p.total, currencySymbol)}
      </p>
      <div className="flex gap-2 lg:justify-end">
        {onRemove && (
          <button
            type="button"
            onClick={() => onRemove(p.id)}
            className="text-sm text-red-600 hover:underline"
          >
            Quitar
          </button>
        )}
      </div>
    </li>
  );
}

function DebtRow({
  debt: d,
  currencySymbol,
  compact,
  onMarkPaid,
  onRemove,
}: {
  debt: Debt;
  currencySymbol: string;
  compact?: boolean;
  onMarkPaid?: (id: string) => void;
  onRemove?: (id: string) => void;
}) {
  const pending = debtPendingAmount(d);
  const isPaid = d.status === "paid" || pending <= 0;
  const badge = (
    <span
      className={`inline-flex rounded-full font-semibold ${
        compact ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"
      } ${
        isPaid
          ? "bg-emerald-100 text-emerald-800"
          : "bg-[#fff4ce] text-[#835c00]"
      }`}
    >
      {isPaid ? "Debe pagado" : "Debe"}
    </span>
  );

  const actions = (
    <div className={`flex flex-wrap gap-2 ${compact ? "mt-2" : "lg:justify-end"}`}>
      {!isPaid && onMarkPaid && (
        <button
          type="button"
          onClick={() => onMarkPaid(d.id)}
          className={`rounded-lg bg-[var(--calc-accent)] text-white ${
            compact ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm"
          }`}
        >
          Marcar pagado
        </button>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={() => onRemove(d.id)}
          className={`text-red-600 hover:underline ${
            compact ? "text-xs" : "text-sm"
          }`}
        >
          Eliminar
        </button>
      )}
      {!compact && (
        <Link
          href="/panel/debe"
          className="text-sm text-[var(--calc-accent)] hover:underline"
        >
          Ver en Debe
        </Link>
      )}
    </div>
  );

  if (compact) {
    return (
      <li className="py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {badge}
              <p className="text-sm capitalize text-[var(--calc-muted)]">
                {formatDateTimeFull(
                  isPaid && d.paidAt ? d.paidAt : d.createdAt,
                )}
              </p>
            </div>
            <p className="mt-1 text-base font-medium text-[#1a1a1a]">
              {d.debtorName}
            </p>
            {d.registeredBy && (
              <p className="mt-0.5 text-sm text-[var(--calc-muted)]">
                Registró {d.registeredBy}
              </p>
            )}
            {d.note && (
              <p className="mt-0.5 text-sm text-[var(--calc-muted)]">
                {d.note}
              </p>
            )}
            <p className="mt-1 text-2xl font-normal tabular-nums text-[#1a1a1a]">
              {formatMoney(d.amount, currencySymbol)}
            </p>
            {!isPaid && (
              <p className="mt-0.5 text-sm font-medium text-orange-600">
                Pendiente: {formatMoney(pending, currencySymbol)}
              </p>
            )}
          </div>
        </div>
        {actions}
      </li>
    );
  }

  return (
    <li className="grid gap-3 py-4 lg:grid-cols-[auto_1fr_auto_auto] lg:items-center lg:gap-6">
      {badge}
      <div className="min-w-0">
        <p className="text-lg font-medium text-[#1a1a1a]">{d.debtorName}</p>
        <p className="mt-0.5 text-sm capitalize text-[var(--calc-muted)]">
          {formatDateTimeFull(d.createdAt)}
        </p>
        {d.registeredBy && (
          <p className="mt-0.5 text-sm text-[var(--calc-muted)]">
            Registró {d.registeredBy}
          </p>
        )}
        {d.note && (
          <p className="mt-1 text-sm text-[var(--calc-muted)]">{d.note}</p>
        )}
        {isPaid && d.paidAt && (
          <p className="mt-1 text-xs text-emerald-700">
            Pagado · {formatDateTimeFull(d.paidAt)}
          </p>
        )}
      </div>
      <div className="lg:text-right">
        <p className="text-2xl font-light tabular-nums text-[#1a1a1a]">
          {formatMoney(d.amount, currencySymbol)}
        </p>
        {!isPaid && (
          <p className="text-sm font-medium text-orange-600">
            Pendiente: {formatMoney(pending, currencySymbol)}
          </p>
        )}
      </div>
      {actions}
    </li>
  );
}
