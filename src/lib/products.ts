import type { Product } from "./types";

export function suggestProducts(
  products: Product[],
  opts: { amount: number | null; nameQuery: string },
): Product[] {
  const query = opts.nameQuery.trim().toLowerCase();
  const seen = new Set<string>();
  const results: Product[] = [];

  const push = (p: Product) => {
    if (!seen.has(p.id)) {
      seen.add(p.id);
      results.push(p);
    }
  };

  if (query) {
    products
      .filter((p) => p.name.toLowerCase().includes(query))
      .forEach(push);
  }

  if (opts.amount != null) {
    products
      .filter((p) => Math.abs(p.price - opts.amount!) < 0.001)
      .forEach(push);
  }

  return results.slice(0, 6);
}

export function findProductByName(
  products: Product[],
  name: string,
): Product | undefined {
  const q = name.trim().toLowerCase();
  if (!q) return undefined;
  return products.find((p) => p.name.toLowerCase() === q);
}

export function normalizeBarcode(code: string): string {
  return code.replace(/\s/g, "").trim();
}

export function findProductByBarcode(
  products: Product[],
  barcode: string,
): Product | undefined {
  const q = normalizeBarcode(barcode);
  if (!q) return undefined;
  return products.find((p) => p.barcode && normalizeBarcode(p.barcode) === q);
}
