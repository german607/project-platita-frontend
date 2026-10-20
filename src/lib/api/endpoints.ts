import { api } from "./client";
import type {
  AuthConfig,
  AuthSession,
  BonusPreview,
  BonusRule,
  CustomerWithBalance,
  InactivePage,
  Location,
  Merchant,
  MerchantTransaction,
  MerchantCategory,
  MovementResult,
  OpeningHours,
  Page,
  Place,
  PlaceDetail,
  TopUpResult,
  User,
  UserBalance,
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

// Perfil público del comercio. Solo se manda lo que cambió. description y
// photoUrl aceptan null para borrarlos; `openingHours` reemplaza la semana
// completa; `category` no se puede borrar y solo se cambia cada 90 días.
export type MerchantProfileChanges = {
  description?: string | null;
  photoUrl?: string | null;
  category?: MerchantCategory;
  visible?: boolean;
  openingHours?: OpeningHours;
};

export const updateMerchant = (merchantId: string, changes: MerchantProfileChanges) =>
  api<Merchant>(`/merchants/${merchantId}`, { method: "PATCH", body: changes });

// ---------- Locales ----------

export const listLocations = (merchantId: string) => api<{ data: Location[] }>(`/merchants/${merchantId}/locations`);

export const createLocation = (merchantId: string, input: { label?: string; address: string }) =>
  api<Location>(`/merchants/${merchantId}/locations`, { method: "POST", body: input });

// No hay DELETE: un local se da de baja con active: false.
export const updateLocation = (
  locationId: string,
  changes: { label?: string | null; address?: string; active?: boolean },
) => api<Location>(`/locations/${locationId}`, { method: "PATCH", body: changes });

// ---------- Lugares (lo que ve el cliente; sin login, sin datos de clientes) ----------

export const listPlaces = (params: PageParams & { category?: MerchantCategory; search?: string } = {}) =>
  api<Page<Place>>("/places", { query: params });

export const getPlace = (merchantId: string) => api<PlaceDetail>(`/places/${merchantId}`);

// ---------- Ingreso y cuenta de la persona (cliente) ----------

export const getAuthConfig = () => api<AuthConfig>("/auth/config");

// Manda el código por mensaje. 204 sin cuerpo; los límites los pone el backend
// (429 TOO_MANY_REQUESTS con details.retryAfterSeconds).
export const requestCode = (phone: string) =>
  api<void>("/auth/request-code", { method: "POST", body: { phone } });

// Verifica el código y devuelve la sesión; si la persona no existía, la crea.
export const verifyCode = (phone: string, code: string) =>
  api<AuthSession>("/auth/verify-code", { method: "POST", body: { phone, code } });

export const logout = () => api<void>("/auth/logout", { method: "POST", auth: true });

// Todo lo que sigue sale del usuario de la sesión (nunca de un id que mande el front).
export const getMe = () => api<User>("/me", { auth: true });

export const updateMe = (input: { name: string | null }) =>
  api<User>("/me", { method: "PATCH", body: input, auth: true });

// Un elemento por comercio con ficha, también con saldo 0.
export const listMyBalances = () => api<{ data: UserBalance[] }>("/me/balances", { auth: true });

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
