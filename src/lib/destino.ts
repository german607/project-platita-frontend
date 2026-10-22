import type { Me } from "./api/types";
import type { Cuenta } from "./sesion";

// A dónde lleva la entrada a una persona, según los comercios de los que es dueña
// (GET /me) y lo último que eligió. Pura, para probarla sin pantalla.
export type Destino =
  | { tipo: "cliente" }
  | { tipo: "comercio"; comercioId: string }
  | { tipo: "elegir" };

export function decidirDestino(merchants: Me["merchants"], recordada: Cuenta | null): Destino {
  if (merchants.length === 0) return { tipo: "cliente" };
  if (recordada === "cliente") return { tipo: "cliente" };
  if (recordada && merchants.some((m) => m.id === recordada.comercioId)) {
    return { tipo: "comercio", comercioId: recordada.comercioId };
  }
  if (merchants.length === 1) return { tipo: "comercio", comercioId: merchants[0].id };
  return { tipo: "elegir" };
}
