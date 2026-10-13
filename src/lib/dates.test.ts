import { describe, expect, it } from "vitest";
import { daysAgo, daysSince, formatTime, formatWhen, todayRange, visitLabel, visitShort } from "./dates";

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

describe("formatWhen", () => {
  it("dice hoy y ayer con la hora", () => {
    expect(formatWhen(at(9, 13, 11), now)).toBe("Hoy 11:00");
    expect(formatWhen(new Date(2026, 9, 12, 9, 5).toISOString(), now)).toBe("Ayer 09:05");
  });

  it("usa día y mes para fechas más viejas", () => {
    expect(formatWhen(at(9, 2), now)).toBe("2 oct");
    expect(formatWhen(at(8, 28), now)).toBe("28 sep");
  });

  it("agrega el año si es de otro año", () => {
    expect(formatWhen(new Date(2025, 11, 31, 10).toISOString(), now)).toBe("31 dic 2025");
  });
});

describe("visitShort", () => {
  const ago = (days: number) => new Date(2026, 9, 13 - days, 10).toISOString();

  it("resume la última visita", () => {
    expect(visitShort(ago(0), now)).toBe("Hoy");
    expect(visitShort(ago(1), now)).toBe("Ayer");
    expect(visitShort(ago(3), now)).toBe("Hace 3 días");
    expect(visitShort(ago(7), now)).toBe("Hace 1 semana");
    expect(visitShort(ago(14), now)).toBe("Hace 2 semanas");
    expect(visitShort(ago(45), now)).toBe("Hace 1 mes");
    expect(visitShort(ago(95), now)).toBe("Hace 3 meses");
  });

  it("avisa cuando nunca vino", () => {
    expect(visitShort(null, now)).toBe("Todavía no vino");
  });
});

describe("daysAgo", () => {
  const ago = (days: number) => new Date(2026, 9, 13 - days, 10).toISOString();

  it("dice la cantidad exacta de días", () => {
    expect(daysAgo(ago(74), now)).toBe("Hace 74 días");
    expect(daysAgo(ago(2), now)).toBe("Hace 2 días");
  });

  it("dice hoy y ayer", () => {
    expect(daysAgo(ago(0), now)).toBe("Hoy");
    expect(daysAgo(ago(1), now)).toBe("Ayer");
  });
});

describe("formatTime", () => {
  it("da la hora con dos dígitos", () => {
    expect(formatTime(new Date(2026, 9, 13, 9, 5).toISOString())).toBe("09:05");
    expect(formatTime(new Date(2026, 9, 13, 23, 40).toISOString())).toBe("23:40");
  });
});

describe("todayRange", () => {
  it("va de la medianoche de hoy a la de mañana, con zona horaria", () => {
    const { from, to } = todayRange(new Date(2026, 9, 13, 15, 30));

    expect(from).toMatch(/^2026-10-13T00:00:00[+-]\d{2}:\d{2}$/);
    expect(to).toMatch(/^2026-10-14T00:00:00[+-]\d{2}:\d{2}$/);
    // Sin importar la zona de la máquina, son las medianoches locales.
    expect(new Date(from).getTime()).toBe(new Date(2026, 9, 13).getTime());
    expect(new Date(to).getTime()).toBe(new Date(2026, 9, 14).getTime());
  });

  it("cruza el fin de mes", () => {
    const { from, to } = todayRange(new Date(2026, 9, 31, 12));
    expect(from).toMatch(/^2026-10-31T00:00:00/);
    expect(to).toMatch(/^2026-11-01T00:00:00/);
  });
});
