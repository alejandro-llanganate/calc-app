export type PurchaseItem = {
  id: string;
  amount: number;
  note?: string;
  productId?: string;
};

export type PaymentMethod = "cash" | "transfer";

/** Compra completa guardada al pulsar Finalizar */
export type Purchase = {
  id: string;
  items: PurchaseItem[];
  total: number;
  createdAt: string;
  /** Nombre de quien registró la venta */
  registeredBy?: string;
  registeredById?: string;
  /** Forma de pago (opcional al finalizar) */
  paymentMethod?: PaymentMethod;
};

export type CashierUser = {
  id: string;
  name: string;
  /** Cédula o documento de identidad */
  cedula?: string;
};

export const DEFAULT_CASHIER_USERS: CashierUser[] = [
  { id: "user-alejandro", name: "Alejandro" },
  { id: "user-maria", name: "María" },
  { id: "user-luis", name: "Luis" },
];

export type DebtStatus = "pending" | "paid";

/** Crédito / fiado registrado desde caja o panel Debe */
export type Debt = {
  id: string;
  debtorName: string;
  amount: number;
  amountPaid: number;
  status: DebtStatus;
  note?: string;
  createdAt: string;
  paidAt?: string;
  registeredBy?: string;
  registeredById?: string;
};

export type DebtSummary = {
  totalLent: number;
  totalPaid: number;
  totalPending: number;
  countPending: number;
  countPaid: number;
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
    /** Escáner de código de barras en caja (catálogo ya lo soporta) */
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
