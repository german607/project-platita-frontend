// Formas de pago de una carga. Es solo informativo: Platita no toca la plata,
// la cobra el comercio. Los valores son los que guarda el backend (`paidWith`).
export const PAYMENT_METHODS = [
  { value: "efectivo", label: "Efectivo" },
  { value: "mercadopago", label: "Mercado Pago" },
  { value: "otro", label: "Otro" },
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]["value"];

// El nombre para mostrar de lo que vino del backend (puede ser cualquier texto).
export function paymentLabel(paidWith: string | null): string {
  if (!paidWith) return "";
  return PAYMENT_METHODS.find((m) => m.value === paidWith)?.label ?? paidWith;
}
