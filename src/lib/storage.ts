import type { AppSettings, Product, Purchase, PurchaseItem } from "./types";
import { DEFAULT_SETTINGS } from "./types";

const KEYS = {
  purchases: "ventas-calc:purchases",
  salesLegacy: "ventas-calc:sales",
  products: "ventas-calc:products",
  settings: "ventas-calc:settings",
} as const;

type LegacySale = {
  id: string;
  amount: number;
  createdAt: string;
  note?: string;
  productId?: string;
};

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

function migrateLegacySales(): Purchase[] {
  const legacy = readJson<LegacySale[]>(KEYS.salesLegacy, []);
  if (legacy.length === 0) return [];

  const purchases: Purchase[] = legacy.map((sale) => ({
    id: sale.id,
    total: sale.amount,
    createdAt: sale.createdAt,
    items: [
      {
        id: generateId(),
        amount: sale.amount,
        note: sale.note,
        productId: sale.productId,
      },
    ],
  }));

  writeJson(KEYS.purchases, purchases);
  localStorage.removeItem(KEYS.salesLegacy);
  return purchases;
}

export function getPurchases(): Purchase[] {
  const stored = readJson<Purchase[]>(KEYS.purchases, []);
  if (stored.length > 0) return stored;
  return migrateLegacySales();
}

export function savePurchases(purchases: Purchase[]): void {
  writeJson(KEYS.purchases, purchases);
}

export function getProducts(): Product[] {
  return readJson<Product[]>(KEYS.products, []);
}

export function saveProducts(products: Product[]): void {
  writeJson(KEYS.products, products);
}

export function getSettings(): AppSettings {
  const stored = readJson<Partial<AppSettings>>(KEYS.settings, {});
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    features: {
      ...DEFAULT_SETTINGS.features,
      ...stored.features,
    },
  };
}

export function saveSettings(settings: AppSettings): void {
  writeJson(KEYS.settings, settings);
}

export function purchaseDateKey(iso: string): string {
  return iso.slice(0, 10);
}

export function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function purchaseTotal(items: PurchaseItem[]): number {
  return items.reduce((sum, item) => sum + item.amount, 0);
}
