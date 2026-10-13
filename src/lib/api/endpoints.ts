import { api } from "./client";
import type {
  BonusPreview,
  BonusRule,
  CustomerWithBalance,
  InactivePage,
  Merchant,
  MerchantTransaction,
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

// Una clave de idempotencia por operación: si se corta la conexión, reenviar la
// MISMA clave con el MISMO cuerpo devuelve la respuesta original sin registrar
// otra vez. Es opcional en el backend, pero las pantallas que mueven saldo la
// mandan siempre (ver lib/idempotency.ts).
type MovementOptions = { idempotencyKey?: string };

const idempotencyHeaders = ({ idempotencyKey }: MovementOptions) =>
  idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined;

// ---------- Comercio ----------

export const getMerchant = (merchantId: string) => api<Merchant>(`/merchants/${merchantId}`);

// ---------- Clientes ----------

// Buscar o crear (no sirve para solo mirar: crea si no existe).
export const upsertCustomer = (merchantId: string, input: { phone: string; name?: string }) =>
  api<CustomerWithBalance>(`/merchants/${merchantId}/customers`, { method: "POST", body: input });

// `search`: nombre o teléfono en cualquier formato (también parcial). `phone`:
// teléfono exacto, sin crear nada.
export const listCustomers = (merchantId: string, params: PageParams & { search?: string; phone?: string } = {}) =>
  api<Page<CustomerWithBalance>>(`/merchants/${merchantId}/customers`, { query: params });

export const getCustomer = (customerId: string) => api<CustomerWithBalance>(`/customers/${customerId}`);

export const updateCustomer = (customerId: string, input: { name: string | null }) =>
  api<CustomerWithBalance>(`/customers/${customerId}`, { method: "PATCH", body: input });

export const listInactiveCustomers = (merchantId: string, params: PageParams & { days?: number } = {}) =>
  api<InactivePage>(`/merchants/${merchantId}/inactive`, { query: params });

// ---------- Saldo (libro mayor) ----------

export const topUp = (customerId: string, input: { amount: number; paidWith?: string }, options: MovementOptions = {}) =>
  api<TopUpResult>(`/customers/${customerId}/topups`, {
    method: "POST",
    body: input,
    headers: idempotencyHeaders(options),
  });

export const charge = (customerId: string, input: { amount: number; note?: string }, options: MovementOptions = {}) =>
  api<MovementResult>(`/customers/${customerId}/charges`, {
    method: "POST",
    body: input,
    headers: idempotencyHeaders(options),
  });

// amount con signo: positivo suma saldo, negativo resta. La nota es obligatoria.
export const adjust = (customerId: string, input: { amount: number; note: string }, options: MovementOptions = {}) =>
  api<MovementResult>(`/customers/${customerId}/adjustments`, {
    method: "POST",
    body: input,
    headers: idempotencyHeaders(options),
  });

export const listTransactions = (customerId: string, params: PageParams & { type?: TransactionType } = {}) =>
  api<Page<Transaction>>(`/customers/${customerId}/transactions`, { query: params });

// Movimientos de todo el comercio, del más nuevo al más viejo. `from` es
// inclusivo y `to` exclusivo: fechas ISO con zona horaria (ver `todayRange`).
export const listMerchantTransactions = (
  merchantId: string,
  params: PageParams & { from?: string; to?: string; type?: TransactionType } = {},
) => api<Page<MerchantTransaction>>(`/merchants/${merchantId}/transactions`, { query: params });

// ---------- Promos (reglas de bonificación) ----------

export const listBonusRules = (merchantId: string) =>
  api<{ data: BonusRule[] }>(`/merchants/${merchantId}/bonus-rules`);

// Qué bono daría una carga de `amount` pesos (no registra nada). Lo calcula el
// backend con la misma función que la carga real.
export const getBonusPreview = (merchantId: string, amount: number) =>
  api<BonusPreview>(`/merchants/${merchantId}/bonus-preview`, { query: { amount } });

export const createBonusRule = (
  merchantId: string,
  input: { minTopUp: number; bonusAmount: number; active?: boolean; name?: string; description?: string },
) =>
  api<BonusRule>(`/merchants/${merchantId}/bonus-rules`, { method: "POST", body: input });

export const updateBonusRule = (
  ruleId: string,
  // name y description aceptan null para borrarlos.
  input: {
    minTopUp?: number;
    bonusAmount?: number;
    active?: boolean;
    name?: string | null;
    description?: string | null;
  },
) => api<BonusRule>(`/bonus-rules/${ruleId}`, { method: "PATCH", body: input });
