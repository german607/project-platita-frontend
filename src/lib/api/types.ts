// Tipos de lo que devuelve el backend. Fuente de verdad:
// ../project-platita-backend/docs/BACKEND.md. Los montos que SALEN de la API
// vienen en centésimos de peso; los que ENTRAN (ver endpoints.ts) van en pesos.

export type TransactionType = "TOPUP" | "BONUS" | "CHARGE" | "ADJUSTMENT";

export type MerchantCategory =
  | "CAFETERIA"
  | "BARBERIA_PELUQUERIA"
  | "PILATES_YOGA"
  | "PANADERIA"
  | "LAVADERO"
  | "OTRO";

export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

// Un tramo de horario, en hora de Montevideo: { from: "09:00", to: "13:00" }.
export interface TimeRange {
  from: string;
  to: string;
}

// La semana tipo del comercio. Lista vacía = cerrado. Siempre trae los 7 días.
export type OpeningHours = Record<Weekday, TimeRange[]>;

export interface Merchant {
  id: string;
  name: string;
  phone: string | null;
  plan: "BASIC" | "PRO" | "MULTI";
  createdAt: string;
  // Perfil público (lo edita el propio comercio, pestaña "Mi comercio").
  description: string | null;
  photoUrl: string | null;
  category: MerchantCategory | null;
  categoryChangedAt: string | null;
  visible: boolean; // "Aparecer en la app"
  openingHours: OpeningHours;
}

// Un local del comercio. Lo único que cambia entre locales es la dirección.
export interface Location {
  id: string;
  merchantId: string;
  label: string | null;
  address: string;
  active: boolean;
  createdAt: string;
}

// Lo que ve el cliente en la lista de Lugares (solo comercios visibles).
export interface Place {
  id: string;
  name: string;
  category: MerchantCategory;
  photoUrl: string | null;
  locations: { label: string | null; address: string }[];
  hasActivePromo: boolean;
}

// El detalle de un lugar. Las promos son solo las activas; montos en centésimos.
export interface PlaceDetail {
  id: string;
  name: string;
  category: MerchantCategory;
  description: string | null;
  photoUrl: string | null;
  locations: { label: string | null; address: string }[];
  openingHours: OpeningHours;
  promos: { id: string; name: string | null; description: string | null; minTopUp: number; bonusAmount: number }[];
}

export interface Customer {
  id: string;
  merchantId: string;
  phone: string; // +598XXXXXXXX
  name: string | null; // como lo anota el comercio
  userName?: string | null; // el nombre de la persona (User.name)
  createdAt: string;
  lastVisitAt: string | null;
}

export interface CustomerWithBalance extends Customer {
  balance: number; // centésimos
}

export interface BonusRule {
  id: string;
  merchantId: string;
  name: string | null;
  description: string | null;
  minTopUp: number; // centésimos
  bonusAmount: number; // centésimos
  active: boolean;
  // Cuántos bonos salieron de esta promo. No cuenta los anteriores a que el
  // backend guardara de qué promo salía cada bono.
  timesUsed: number;
}

export interface Transaction {
  id: string;
  customerId: string;
  type: TransactionType;
  amount: number; // centésimos; positivo suma saldo, negativo resta
  paidWith: string | null;
  note: string | null;
  // Solo en los BONUS: de qué promo salió. Null en los bonos viejos.
  bonusRuleId: string | null;
  createdAt: string;
}

// Un movimiento visto desde el comercio: trae a qué cliente pertenece.
export type MerchantTransaction = Transaction & {
  customer: { id: string; name: string | null; phone: string };
};

export interface Page<T> {
  data: T[];
  nextCursor: string | null;
}

// Clientes inactivos: ahora traen su saldo, y `total` cuenta a todos los
// inactivos, no solo a los de la página.
export type InactivePage = Page<CustomerWithBalance> & { total: number };

// Qué pasaría si se cargara `amount`: lo calcula el backend con la misma
// función que la carga real. Todo en centésimos.
export interface BonusPreview {
  amount: number;
  rule: { id: string; name: string | null; minTopUp: number; bonusAmount: number } | null;
  bonus: number;
  total: number;
}

export interface TopUpResult {
  topup: Transaction;
  bonus: Transaction | null;
  balance: number;
}

export interface MovementResult {
  transaction: Transaction;
  balance: number;
}

// La persona (cliente), identificada por su teléfono; es la misma en todos los
// comercios. Cada comercio tiene su ficha (Customer) con el saldo de ahí.
export interface User {
  id: string;
  phone: string; // +598XXXXXXXX
  name: string | null;
  createdAt: string;
}

// Saldo de la persona en un comercio. Incluye los de saldo 0 y comercios que
// pueden no estar en /places. Centésimos.
export interface UserBalance {
  merchant: { id: string; name: string; category: MerchantCategory | null; photoUrl: string | null };
  balance: number;
  lastVisitAt: string | null;
}
