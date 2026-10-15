import { describe, expect, it } from "vitest";
import type { OpeningHours } from "./api/types";
import {
  copyToAllDays,
  dayErrors,
  emptyHours,
  hasHoursErrors,
  hoursErrors,
  isOpenNow,
  nextRange,
  sameHours,
  sortedHours,
} from "./hours";

const r = (from: string, to: string) => ({ from, to });

describe("dayErrors", () => {
  it("un día sin tramos o con tramos bien armados no tiene errores", () => {
    expect(dayErrors([])).toEqual([]);
    expect(dayErrors([r("09:00", "13:00"), r("16:00", "20:00")])).toEqual([null, null]);
  });

  it("'hasta' tiene que ser después de 'desde'", () => {
    expect(dayErrors([r("13:00", "09:00")])).toEqual(["“Hasta” tiene que ser después de “desde”"]);
    expect(dayErrors([r("09:00", "09:00")])[0]).toContain("después");
  });

  it("avisa cuando se superpone con el tramo anterior", () => {
    expect(dayErrors([r("09:00", "13:00"), r("12:00", "20:00")])).toEqual([
      null,
      "Se superpone con el tramo anterior (09:00 a 13:00)",
    ]);
  });

  it("que un tramo termine justo donde empieza el otro está bien, como en el backend", () => {
    expect(dayErrors([r("09:00", "13:00"), r("13:00", "20:00")])).toEqual([null, null]);
  });

  it("acepta 24:00 como cierre y pide la hora si falta", () => {
    expect(dayErrors([r("18:00", "24:00")])).toEqual([null]);
    expect(dayErrors([r("", "13:00")])).toEqual(["Elegí la hora"]);
    expect(dayErrors([r("09:00", "25:00")])).toEqual(["Elegí la hora"]);
    // 24:00 solo vale para cerrar, no para abrir.
    expect(dayErrors([r("24:00", "24:00")])).toEqual(["Elegí la hora"]);
  });
});

describe("hoursErrors y hasHoursErrors", () => {
  it("detecta el error en el día que corresponde", () => {
    const hours: OpeningHours = { ...emptyHours(), wed: [r("13:00", "09:00")], thu: [r("09:00", "13:00")] };
    expect(hoursErrors(hours).wed[0]).toContain("después");
    expect(hoursErrors(hours).thu).toEqual([null]);
    expect(hasHoursErrors(hours)).toBe(true);
    expect(hasHoursErrors(emptyHours())).toBe(false);
  });
});

describe("sameHours y sortedHours", () => {
  it("no distingue el orden de los tramos de un día", () => {
    const a: OpeningHours = { ...emptyHours(), mon: [r("16:00", "20:00"), r("09:00", "13:00")] };
    const b: OpeningHours = { ...emptyHours(), mon: [r("09:00", "13:00"), r("16:00", "20:00")] };
    expect(sameHours(a, b)).toBe(true);
    expect(sortedHours(a).mon[0].from).toBe("09:00");
    expect(sameHours(a, emptyHours())).toBe(false);
  });
});

describe("copyToAllDays", () => {
  it("copia los tramos de un día a todos los demás, sin compartir los objetos", () => {
    const hours: OpeningHours = { ...emptyHours(), mon: [r("09:00", "13:00")], sat: [r("10:00", "12:00")] };
    const copied = copyToAllDays(hours, "mon");

    expect(copied.sun).toEqual([r("09:00", "13:00")]);
    expect(copied.sat).toEqual([r("09:00", "13:00")]);
    copied.tue[0].to = "14:00";
    expect(copied.wed[0].to).toBe("13:00");
  });
});

describe("nextRange", () => {
  it("propone una mañana si no hay tramos, y una tarde después", () => {
    expect(nextRange([])).toEqual(r("09:00", "13:00"));
    expect(nextRange([r("09:00", "13:00")])).toEqual(r("16:00", "20:00"));
  });

  it("si el último termina tarde, sigue desde ahí", () => {
    expect(nextRange([r("09:00", "18:00")])).toEqual(r("18:00", "23:59"));
  });
});

describe("isOpenNow", () => {
  // 13 de octubre de 2026 es martes.
  const hours: OpeningHours = { ...emptyHours(), tue: [r("09:00", "13:00"), r("16:00", "20:00")] };

  it("está abierto dentro de un tramo, con el cierre excluido", () => {
    expect(isOpenNow(hours, new Date(2026, 9, 13, 9, 0))).toBe(true);
    expect(isOpenNow(hours, new Date(2026, 9, 13, 12, 59))).toBe(true);
    expect(isOpenNow(hours, new Date(2026, 9, 13, 13, 0))).toBe(false);
    expect(isOpenNow(hours, new Date(2026, 9, 13, 17, 30))).toBe(true);
  });

  it("está cerrado fuera de los tramos y los días sin horario", () => {
    expect(isOpenNow(hours, new Date(2026, 9, 13, 14, 0))).toBe(false);
    expect(isOpenNow(hours, new Date(2026, 9, 14, 10, 0))).toBe(false);
  });
});
