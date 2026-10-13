// Tipos de lo que devuelve el backend. Fuente de verdad:
// ../project-platita-backend/docs/BACKEND.md. Los montos que SALEN de la API
// vienen en centésimos de peso; los que ENTRAN (ver endpoints.ts) van en pesos.

export type TransactionType = "TOPUP" | "BONUS" | "CHARGE" | "ADJUSTMENT";

export interface Merchant {
  id: string;
  name: string;
  phone: string | null;
  plan: "BASIC" | "PRO" | "MULTI";
  createdAt: string;
}

export interface Customer {
  id: string;
  merchantId: string;
  phone: string; // +598XXXXXXXX
  name: string | null;
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
