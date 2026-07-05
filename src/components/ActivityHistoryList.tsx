"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { Debt, Purchase } from "@/lib/types";
import { debtPendingAmount } from "@/lib/debts";
import { formatDateTimeFull, formatMoney } from "@/lib/format";
import { formatPaymentMethod } from "@/lib/payment";
import { DebtPaymentModal } from "./DebtPaymentModal";

export type ActivityEntry =
  | { kind: "purchase"; id: string; at: string; purchase: Purchase }
  | { kind: "debt"; id: string; at: string; debt: Debt };

type Props = {
  entries: ActivityEntry[];
  currencySymbol: string;
  compact?: boolean;
  onRemovePurchase?: (id: string) => void;
  onUpdatePurchase?: (id: string, items: Purchase["items"]) => void;
  onAddDebtPayment?: (id: string, amount: number) => void;
  onMarkDebtPaid?: (id: string) => void;
  onRemoveDebt?: (id: string) => void;
  emptyMessage?: string;
};

export function ActivityHistoryList({
  entries,
  currencySymbol,
  compact,
  onRemovePurchase,
  onAddDebtPayment,
  onMarkDebtPaid,
  onRemoveDebt,
  emptyMessage = "Sin movimientos en este día.",
}: Props) {
  const [paymentDebt, setPaymentDebt] = useState<Debt | null>(null);

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
    <>
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
              onAbonar={
                onAddDebtPayment
                  ? () => setPaymentDebt(entry.debt)
                  : undefined
              }
              onMarkPaid={onMarkDebtPaid}
              onRemove={onRemoveDebt}
            />
          ),
        )}
      </ul>

      {onAddDebtPayment && (
        <DebtPaymentModal
          open={paymentDebt != null}
          debt={paymentDebt}
          currencySymbol={currencySymbol}
          onClose={() => setPaymentDebt(null)}
          onSubmit={(amount) => {
            if (paymentDebt) onAddDebtPayment(paymentDebt.id, amount);
          }}
          onPayFull={() => {
            if (paymentDebt && onMarkDebtPaid) {
              onMarkDebtPaid(paymentDebt.id);
              setPaymentDebt(null);
            }
          }}
        />
      )}
    </>
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
  const [expanded, setExpanded] = useState(true);
  const paymentLabel = formatPaymentMethod(p.paymentMethod);

  const displayItems =
    p.items.length > 0
      ? p.items
      : p.total > 0
        ? [
            {
              id: `${p.id}-resumen`,
              amount: p.total,
              note: "Venta registrada",
            },
          ]
        : [];

  const detail =
    displayItems.length > 0 ? (
      <ul
        className={`space-y-1.5 rounded-lg bg-[#faf9f8] ${
          compact ? "mt-3 p-3" : "mt-3 p-4"
        } ${!expanded ? "hidden" : ""}`}
      >
        {displayItems.map((item, i) => (
          <li
            key={item.id}
            className="flex items-start justify-between gap-3 border-b border-[var(--calc-border)] pb-2 last:border-0 last:pb-0"
          >
            <span className="min-w-0 text-sm text-[#1a1a1a]">
              {item.note || `Artículo ${i + 1}`}
            </span>
            <span className="shrink-0 text-sm font-medium tabular-nums text-[#1a1a1a]">
              {formatMoney(item.amount, currencySymbol)}
            </span>
          </li>
        ))}
      </ul>
    ) : null;

  const toggleLabel = expanded ? "Ocultar artículos" : "Ver artículos";

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
            {displayItems.length > 0 && (
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="mt-1 flex items-center gap-1 text-sm font-medium text-[var(--calc-accent)]"
              >
                {displayItems.length}{" "}
                {displayItems.length === 1 ? "artículo" : "artículos"} ·{" "}
                {toggleLabel}
                {expanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
            )}
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
        {detail}
      </li>
    );
  }

  return (
    <li className="py-4">
      <div className="grid gap-3 lg:grid-cols-[auto_1fr_auto_auto] lg:items-start lg:gap-6">
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
          {displayItems.length > 0 && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="mt-1 flex items-center gap-1 text-sm font-medium text-[var(--calc-accent)]"
            >
              {displayItems.length}{" "}
              {displayItems.length === 1 ? "artículo" : "artículos"} ·{" "}
              {toggleLabel}
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          )}
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
      </div>
      {detail}
    </li>
  );
}

function DebtRow({
  debt: d,
  currencySymbol,
  compact,
  onAbonar,
  onMarkPaid,
  onRemove,
}: {
  debt: Debt;
  currencySymbol: string;
  compact?: boolean;
  onAbonar?: () => void;
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
      {!isPaid && onAbonar && (
        <button
          type="button"
          onClick={onAbonar}
          className={`rounded-lg border border-[var(--calc-accent)] text-[var(--calc-accent)] ${
            compact ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm"
          }`}
        >
          Abonar
        </button>
      )}
      {!isPaid && onMarkPaid && (
        <button
          type="button"
          onClick={() => onMarkPaid(d.id)}
          className={`rounded-lg bg-[var(--calc-accent)] text-white ${
            compact ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm"
          }`}
        >
          Pagado total
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

  const paidInfo =
    d.amountPaid > 0 && !isPaid ? (
      <p className="mt-0.5 text-sm text-emerald-700">
        Abonado: {formatMoney(d.amountPaid, currencySymbol)}
      </p>
    ) : null;

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
            {paidInfo}
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
        {paidInfo}
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
