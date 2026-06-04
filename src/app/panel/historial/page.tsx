"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PurchaseHistoryList } from "@/components/PurchaseHistoryList";
import { useAppData } from "@/context/AppDataProvider";
import { formatDateLabel, formatMoney } from "@/lib/format";
import { purchaseDateKey } from "@/lib/storage";

export default function HistorialPage() {
  const { ready, settings, purchases, purchasesForDate, removePurchase } =
    useAppData();
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const days = useMemo(() => {
    const keys = [
      ...new Set(purchases.map((p) => purchaseDateKey(p.createdAt))),
    ];
    return keys.sort().reverse();
  }, [purchases]);

  const activeDay = selectedDay ?? days[0] ?? null;
  const dayPurchases = activeDay ? purchasesForDate(activeDay) : [];
  const dayTotal = dayPurchases.reduce((s, p) => s + p.total, 0);

  if (!ready) {
    return (
      <AppShell>
        <p className="py-8 text-center text-stone-500">Cargando…</p>
      </AppShell>
    );
  }

  const symbol = settings.currencySymbol;

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(purchases, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `compras-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell>
      <div className="flex flex-1 flex-col gap-4">
        <h1 className="text-2xl font-bold text-stone-900">Historial</h1>
        <p className="text-sm text-stone-600">
          Cada registro es una compra completa con fecha y hora exacta al
          finalizar.
        </p>

        {days.length === 0 ? (
          <p className="text-sm text-stone-500">No hay compras guardadas.</p>
        ) : (
          <>
            <label className="block">
              <span className="text-sm text-stone-600">Día</span>
              <select
                value={activeDay ?? ""}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-3 text-base"
              >
                {days.map((d) => (
                  <option key={d} value={d}>
                    {formatDateLabel(d)}
                  </option>
                ))}
              </select>
            </label>

            <div className="rounded-2xl border border-stone-200 bg-white p-4">
              <p className="text-sm text-stone-500">Total del día</p>
              <p className="text-2xl font-bold">
                {formatMoney(dayTotal, symbol)}
              </p>
              <p className="mt-1 text-xs text-stone-500">
                {dayPurchases.length}{" "}
                {dayPurchases.length === 1 ? "compra" : "compras"}
              </p>
              <div className="mt-3">
                <PurchaseHistoryList
                  purchases={dayPurchases}
                  currencySymbol={symbol}
                  onRemove={removePurchase}
                  compact
                />
              </div>
            </div>
          </>
        )}

        <button
          type="button"
          onClick={exportJson}
          disabled={purchases.length === 0}
          className="rounded-xl border border-stone-300 py-3 text-sm font-medium text-stone-700 disabled:opacity-40"
        >
          Descargar respaldo (JSON)
        </button>
        <p className="text-xs text-stone-500">
          Los datos viven en este navegador (localStorage). Haz respaldos si
          cambias de dispositivo.
        </p>
      </div>
    </AppShell>
  );
}
