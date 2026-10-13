import { describe, expect, it } from "vitest";
import { centsToPesos, formatPesos, formatSigned, parsePesos, pesosToCents } from "./money";

describe("formatPesos", () => {
  it("no muestra decimales si el monto es entero", () => {
    expect(formatPesos(120000)).toBe("$1.200");
    expect(formatPesos(0)).toBe("$0");
    expect(formatPesos(40000)).toBe("$400");
  });

  it("usa punto de miles", () => {
    expect(formatPesos(100000000)).toBe("$1.000.000");
  });

  it("usa coma y dos dígitos cuando hay centésimos", () => {
    expect(formatPesos(150)).toBe("$1,50");
    expect(formatPesos(100050)).toBe("$1.000,50");
    expect(formatPesos(5)).toBe("$0,05");
  });

  it("formatea negativos", () => {
    expect(formatPesos(-15000)).toBe("-$150");
  });
});

describe("parsePesos", () => {
  it("entiende enteros y miles con punto", () => {
    expect(parsePesos("1200")).toBe(1200);
    expect(parsePesos("1.200")).toBe(1200);
    expect(parsePesos("$ 1.200")).toBe(1200);
    expect(parsePesos("1.000.000")).toBe(1000000);
  });

  it("entiende decimales con coma", () => {
    expect(parsePesos("1200,50")).toBe(1200.5);
    expect(parsePesos("1.200,50")).toBe(1200.5);
    expect(parsePesos("1,5")).toBe(1.5);
  });

  it("entiende un punto decimal que no tiene forma de miles", () => {
    expect(parsePesos("12.5")).toBe(12.5);
  });

  it("rechaza lo que no se entiende", () => {
    expect(parsePesos("")).toBeNull();
    expect(parsePesos("abc")).toBeNull();
    expect(parsePesos("-5")).toBeNull();
    expect(parsePesos("1,234,5")).toBeNull();
    expect(parsePesos("1,234")).toBeNull();
  });
});

describe("conversión pesos ↔ centésimos", () => {
  it("convierte sin errores de punto flotante", () => {
    expect(pesosToCents(1200)).toBe(120000);
    expect(pesosToCents(19.99)).toBe(1999);
    expect(pesosToCents(0.07)).toBe(7);
    expect(centsToPesos(120000)).toBe(1200);
  });
});

describe("formatSigned", () => {
  it("pone el signo y el formato de pesos", () => {
    expect(formatSigned(100000)).toBe("+$1.000");
    expect(formatSigned(-80000)).toBe("-$800");
    expect(formatSigned(5)).toBe("+$0,05");
    expect(formatSigned(0)).toBe("$0");
  });
});
