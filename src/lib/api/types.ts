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
  minTopUp: number; // centésimos
  bonusAmount: number; // centésimos
  active: boolean;
}

export interface Transaction {
  id: string;
  customerId: string;
  type: TransactionType;
  amount: number; // centésimos; positivo suma saldo, negativo resta
  paidWith: string | null;
  note: string | null;
  createdAt: string;
}

export interface Page<T> {
  data: T[];
  nextCursor: string | null;
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
