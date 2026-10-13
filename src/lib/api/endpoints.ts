import { api } from "./client";
import type {
  BonusRule,
  Customer,
  CustomerWithBalance,
  Merchant,
  MovementResult,
  Page,
  TopUpResult,
  Transaction,
  TransactionType,
} from "./types";

// Una función por endpoint que usa la interfaz. Los montos que ENTRAN van en
// PESOS (como espera el backend); los que salen vienen en centésimos.
// Al sumar un endpoint: acá, en docs/DISENO.md (mapa pantalla → endpoint) y
// si hace falta un tipo nuevo, en types.ts.

// `type` y no `interface`: una interface no es asignable al objeto de claves
// libres que espera `query` en client.ts.
type PageParams = {
  limit?: number;
  cursor?: string;
};

// ---------- Comercio ----------

export const getMerchant = (merchantId: string) => api<Merchant>(`/merchants/${merchantId}`);

// ---------- Clientes ----------

// Buscar o crear (no sirve para solo mirar: crea si no existe).
export const upsertCustomer = (merchantId: string, input: { phone: string; name?: string }) =>
  api<CustomerWithBalance>(`/merchants/${merchantId}/customers`, { method: "POST", body: input });

export const listCustomers = (merchantId: string, params: PageParams & { search?: string } = {}) =>
  api<Page<CustomerWithBalance>>(`/merchants/${merchantId}/customers`, { query: params });

export const getCustomer = (customerId: string) => api<CustomerWithBalance>(`/customers/${customerId}`);

export const updateCustomer = (customerId: string, input: { name: string | null }) =>
  api<CustomerWithBalance>(`/customers/${customerId}`, { method: "PATCH", body: input });

export const listInactiveCustomers = (merchantId: string, params: PageParams & { days?: number } = {}) =>
  api<Page<Customer>>(`/merchants/${merchantId}/inactive`, { query: params });

// ---------- Saldo (libro mayor) ----------

export const topUp = (customerId: string, input: { amount: number; paidWith?: string }) =>
  api<TopUpResult>(`/customers/${customerId}/topups`, { method: "POST", body: input });

export const charge = (customerId: string, input: { amount: number; note?: string }) =>
  api<MovementResult>(`/customers/${customerId}/charges`, { method: "POST", body: input });

// amount con signo: positivo suma saldo, negativo resta. La nota es obligatoria.
export const adjust = (customerId: string, input: { amount: number; note: string }) =>
  api<MovementResult>(`/customers/${customerId}/adjustments`, { method: "POST", body: input });

export const listTransactions = (customerId: string, params: PageParams & { type?: TransactionType } = {}) =>
  api<Page<Transaction>>(`/customers/${customerId}/transactions`, { query: params });

// ---------- Promos (reglas de bonificación) ----------

export const listBonusRules = (merchantId: string) =>
  api<{ data: BonusRule[] }>(`/merchants/${merchantId}/bonus-rules`);

export const createBonusRule = (merchantId: string, input: { minTopUp: number; bonusAmount: number; active?: boolean }) =>
  api<BonusRule>(`/merchants/${merchantId}/bonus-rules`, { method: "POST", body: input });

export const updateBonusRule = (
  ruleId: string,
  input: { minTopUp?: number; bonusAmount?: number; active?: boolean },
) => api<BonusRule>(`/bonus-rules/${ruleId}`, { method: "PATCH", body: input });
