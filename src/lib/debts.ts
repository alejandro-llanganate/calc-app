import type { Debt, DebtSummary } from "./types";

export function debtPendingAmount(debt: Debt): number {
  return Math.max(0, Math.round((debt.amount - debt.amountPaid) * 100) / 100);
}

export function summarizeDebts(debts: Debt[]): DebtSummary {
  return debts.reduce(
    (acc, d) => {
      acc.totalLent += d.amount;
      acc.totalPaid += d.amountPaid;
      const pending = debtPendingAmount(d);
      acc.totalPending += pending;
      if (d.status === "paid" || pending <= 0) acc.countPaid += 1;
      else acc.countPending += 1;
      return acc;
    },
    {
      totalLent: 0,
      totalPaid: 0,
      totalPending: 0,
      countPending: 0,
      countPaid: 0,
    },
  );
}

export function filterDebtsByStatus(
  debts: Debt[],
  filter: "all" | "pending" | "paid",
): Debt[] {
  if (filter === "all") return debts;
  if (filter === "paid") {
    return debts.filter((d) => d.status === "paid" || debtPendingAmount(d) <= 0);
  }
  return debts.filter((d) => d.status === "pending" && debtPendingAmount(d) > 0);
}

export function debtsToChartPoints(debts: Debt[]): {
  key: string;
  label: string;
  total: number;
  count: number;
}[] {
  const pending = filterDebtsByStatus(debts, "pending");
  const byName = new Map<string, number>();
  pending.forEach((d) => {
    const name = d.debtorName.trim() || "Sin nombre";
    byName.set(name, (byName.get(name) ?? 0) + debtPendingAmount(d));
  });
  return [...byName.entries()]
    .map(([name, total]) => ({
      key: name,
      label: name.length > 12 ? `${name.slice(0, 11)}…` : name,
      total,
      count: 1,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 12);
}
