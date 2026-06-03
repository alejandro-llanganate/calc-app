export type PurchaseItem = {
  id: string;
  amount: number;
  note?: string;
  productId?: string;
};

/** Compra completa guardada al pulsar Finalizar */
export type Purchase = {
  id: string;
  items: PurchaseItem[];
  total: number;
  createdAt: string;
};

export type Product = {
  id: string;
  name: string;
  price: number;
  barcode?: string;
};

export type AppSettings = {
  storeName: string;
  currencySymbol: string;
  features: {
    /** Nombres y sugerencias de producto al registrar en caja */
    itemDetails: boolean;
    /** Fase 2: escanear código de barras (no implementado) */
    barcodeScanner: boolean;
    /** Fase 3: emitir facturas (no implementado) */
    invoicing: boolean;
  };
};

export const DEFAULT_SETTINGS: AppSettings = {
  storeName: "Mi tienda",
  currencySymbol: "$",
  features: {
    itemDetails: false,
    barcodeScanner: false,
    invoicing: false,
  },
};
