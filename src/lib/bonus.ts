import type { BonusRule } from "./api/types";

// VISTA PREVIA del bono, solo para mostrar antes de confirmar. El bono real
// lo decide y lo registra el backend al cargar (la respuesta de la carga
// trae el que se aplicó, y eso es lo que se muestra al terminar).
// Regla del backend (ledger/service.ts): de las reglas activas cuyo mínimo
// alcanza, gana la de mayor mínimo; si hay empate, la de menor id.
// Pedido al backend para que la vista previa venga del servidor: ver TODO §4.
export function bonusFor(amountCents: number, rules: BonusRule[]): BonusRule | null {
  let best: BonusRule | null = null;
  for (const rule of rules) {
    if (!rule.active || rule.minTopUp > amountCents) continue;
    if (!best || rule.minTopUp > best.minTopUp || (rule.minTopUp === best.minTopUp && rule.id < best.id)) {
      best = rule;
    }
  }
  return best;
}
