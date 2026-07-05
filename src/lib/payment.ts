import type { PaymentMethod } from "./types";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
};

export function formatPaymentMethod(method?: PaymentMethod): string | null {
  if (!method) return null;
  return PAYMENT_METHOD_LABELS[method];
}
