import type { Purchase } from "./types";
import { purchaseDateKey, todayKey } from "./storage";

export type ChartPoint = {
  key: string;
  label: string;
  /** Etiqueta corta para el eje X (evita solapamiento) */
  shortLabel?: string;
  total: number;
  count: number;
};

export function getDailyReport(
  purchases: Purchase[],
  days = 14,
): ChartPoint[] {
  const end = new Date();
  end.setHours(12, 0, 0, 0);
  const points: ChartPoint[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(d.getDate() - i);
    const key = toDateKey(d);
    const dayPurchases = purchases.filter(
      (p) => purchaseDateKey(p.createdAt) === key,
    );
    points.push({
      key,
      label: d.toLocaleDateString("es", { weekday: "short", day: "numeric" }),
      shortLabel: `${d.getDate()}/${d.getMonth() + 1}`,
      total: dayPurchases.reduce((s, p) => s + p.total, 0),
      count: dayPurchases.length,
    });
  }

  return points;
}

export function getHourlyReport(
  purchases: Purchase[],
  dateKey = todayKey(),
): ChartPoint[] {
  const buckets = Array.from({ length: 24 }, (_, hour) => ({
    key: String(hour),
    label: `${String(hour).padStart(2, "0")}h`,
    total: 0,
    count: 0,
  }));

  purchases
    .filter((p) => purchaseDateKey(p.createdAt) === dateKey)
    .forEach((p) => {
      const hour = new Date(p.createdAt).getHours();
      buckets[hour].total += p.total;
      buckets[hour].count += 1;
    });

  return buckets;
}

export function getMonthlyReport(
  purchases: Purchase[],
  months = 6,
): ChartPoint[] {
  const end = new Date();
  end.setDate(1);
  end.setHours(12, 0, 0, 0);
  const points: ChartPoint[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(end.getFullYear(), end.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const monthPurchases = purchases.filter((p) => {
      const date = new Date(p.createdAt);
      return (
        date.getFullYear() === d.getFullYear() &&
        date.getMonth() === d.getMonth()
      );
    });
    points.push({
      key,
      label: d.toLocaleDateString("es", { month: "short", year: "2-digit" }),
      total: monthPurchases.reduce((s, p) => s + p.total, 0),
      count: monthPurchases.length,
    });
  }

  return points;
}

export function getDaysWithPurchases(purchases: Purchase[]): string[] {
  return [...new Set(purchases.map((p) => purchaseDateKey(p.createdAt)))]
    .sort()
    .reverse();
}

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function sumReport(points: ChartPoint[]): number {
  return points.reduce((s, p) => s + p.total, 0);
}

export function peakPoint(points: ChartPoint[]): ChartPoint | null {
  if (points.length === 0) return null;
  return points.reduce((best, p) => (p.total > best.total ? p : best));
}

function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

function toDateKeyFromDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getDailyReportForRange(
  purchases: Purchase[],
  fromKey: string,
  toKey: string,
): ChartPoint[] {
  const from = parseDateKey(fromKey);
  const to = parseDateKey(toKey);
  if (from > to) return [];

  const points: ChartPoint[] = [];
  const cursor = new Date(from);
  while (cursor <= to) {
    const key = toDateKeyFromDate(cursor);
    const dayPurchases = purchases.filter(
      (p) => purchaseDateKey(p.createdAt) === key,
    );
    points.push({
      key,
      label: cursor.toLocaleDateString("es", {
        weekday: "short",
        day: "numeric",
      }),
      shortLabel: `${cursor.getDate()}/${cursor.getMonth() + 1}`,
      total: dayPurchases.reduce((s, p) => s + p.total, 0),
      count: dayPurchases.length,
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return points;
}

export function getWeeklyReport(
  purchases: Purchase[],
  weeks = 8,
): ChartPoint[] {
  const points: ChartPoint[] = [];
  const end = new Date();
  end.setHours(12, 0, 0, 0);

  for (let i = weeks - 1; i >= 0; i--) {
    const weekEnd = new Date(end);
    weekEnd.setDate(weekEnd.getDate() - i * 7);
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 6);

    const startKey = toDateKeyFromDate(weekStart);
    const endKey = toDateKeyFromDate(weekEnd);
    const weekPurchases = purchases.filter((p) => {
      const k = purchaseDateKey(p.createdAt);
      return k >= startKey && k <= endKey;
    });

    points.push({
      key: endKey,
      label: `${weekStart.getDate()}/${weekStart.getMonth() + 1}–${weekEnd.getDate()}/${weekEnd.getMonth() + 1}`,
      shortLabel: `S${weeks - i}`,
      total: weekPurchases.reduce((s, p) => s + p.total, 0),
      count: weekPurchases.length,
    });
  }

  return points;
}

export function purchasesInRange(
  purchases: Purchase[],
  fromKey: string,
  toKey: string,
): Purchase[] {
  return purchases.filter((p) => {
    const k = purchaseDateKey(p.createdAt);
    return k >= fromKey && k <= toKey;
  });
}
