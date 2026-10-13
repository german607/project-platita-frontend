import { describe, expect, it } from "vitest";
import { customerSearchTerm, formatUyPhone, isValidUyPhone, normalizeUyPhone } from "./phone";

describe("normalizeUyPhone", () => {
  it("lleva todas las formas habituales al mismo valor", () => {
    for (const raw of ["099123456", "099 123 456", "99123456", "+59899123456", "+598 99 123 456", "00598 99123456"]) {
      expect(normalizeUyPhone(raw)).toBe("+59899123456");
    }
  });

  it("acepta fijos de Montevideo", () => {
    expect(normalizeUyPhone("2400 1234")).toBe("+59824001234");
  });

  it("rechaza lo que no es un teléfono uruguayo", () => {
    expect(normalizeUyPhone("123")).toBeNull();
    expect(normalizeUyPhone("")).toBeNull();
    expect(normalizeUyPhone("08812345")).toBeNull();
    expect(isValidUyPhone("abc")).toBe(false);
    expect(isValidUyPhone("099123456")).toBe(true);
  });
});

describe("formatUyPhone", () => {
  it("formatea celulares y fijos", () => {
    expect(formatUyPhone("+59899123456")).toBe("099 123 456");
    expect(formatUyPhone("+59824001234")).toBe("2400 1234");
  });

  it("devuelve tal cual lo que no reconoce", () => {
    expect(formatUyPhone("lo que sea")).toBe("lo que sea");
  });
});

describe("customerSearchTerm", () => {
  it("manda los nombres tal cual", () => {
    expect(customerSearchTerm("  Marta ")).toBe("Marta");
    expect(customerSearchTerm("marta 099")).toBe("marta 099");
  });

  it("saca ceros y prefijo de país a los números, como se guarda el teléfono", () => {
    expect(customerSearchTerm("099 123")).toBe("99123");
    expect(customerSearchTerm("+598 99 123")).toBe("99123");
    expect(customerSearchTerm("00598 99 1")).toBe("991");
    expect(customerSearchTerm("99123")).toBe("99123");
  });

  it("no busca nada si no queda nada", () => {
    expect(customerSearchTerm("")).toBeUndefined();
    expect(customerSearchTerm("   ")).toBeUndefined();
    expect(customerSearchTerm("0")).toBeUndefined();
  });
});
