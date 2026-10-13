import { describe, expect, it } from "vitest";
import { daysSince, visitLabel } from "./dates";

// "Ahora": 13 de octubre de 2026, mediodía (hora local).
const now = new Date(2026, 9, 13, 12, 0, 0);
const at = (month: number, day: number, hour = 12) => new Date(2026, month, day, hour).toISOString();

describe("visitLabel", () => {
  it("cuenta días de calendario, no horas", () => {
    expect(visitLabel(at(9, 13, 8), now)).toBe("Vino hoy");
    expect(visitLabel(at(9, 12, 23), now)).toBe("Vino ayer");
    expect(visitLabel(at(9, 1, 23), now)).toBe("Vino hace 12 días");
  });

  it("avisa cuando nunca vino", () => {
    expect(visitLabel(null, now)).toBe("Todavía no vino");
  });

  it("no muestra días negativos si el reloj del servidor se adelanta", () => {
    expect(visitLabel(at(9, 14), now)).toBe("Vino hoy");
  });
});

describe("daysSince", () => {
  it("cruza el cambio de mes", () => {
    expect(daysSince(at(8, 30), now)).toBe(13);
  });
});
