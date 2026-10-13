import { describe, expect, it } from "vitest";
import type { BonusRule } from "./api/types";
import { bonusFor } from "./bonus";

const rule = (id: string, minPesos: number, bonusPesos: number, active = true): BonusRule => ({
  id,
  merchantId: "m1",
  minTopUp: minPesos * 100,
  bonusAmount: bonusPesos * 100,
  active,
});

describe("bonusFor", () => {
  const rules = [rule("a", 500, 50), rule("b", 1000, 200), rule("c", 2000, 500)];

  it("devuelve la regla de mayor mínimo que la carga alcanza", () => {
    expect(bonusFor(100000, rules)?.id).toBe("b");
    expect(bonusFor(150000, rules)?.id).toBe("b");
    expect(bonusFor(200000, rules)?.id).toBe("c");
    expect(bonusFor(50000, rules)?.id).toBe("a");
  });

  it("no da bono por debajo del mínimo más chico", () => {
    expect(bonusFor(49999, rules)).toBeNull();
    expect(bonusFor(0, rules)).toBeNull();
  });

  it("ignora las reglas desactivadas", () => {
    expect(bonusFor(100000, [rule("a", 500, 50), rule("b", 1000, 200, false)])?.id).toBe("a");
    expect(bonusFor(100000, [rule("b", 1000, 200, false)])).toBeNull();
  });

  it("ante un empate de mínimo gana la de menor id, como el backend", () => {
    expect(bonusFor(100000, [rule("z", 1000, 300), rule("m", 1000, 200)])?.id).toBe("m");
  });

  it("sin reglas no hay bono", () => {
    expect(bonusFor(100000, [])).toBeNull();
  });
});
