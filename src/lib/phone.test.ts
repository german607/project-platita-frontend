import { describe, expect, it } from "vitest";
import { formatUyPhone, isValidUyPhone, normalizeUyPhone } from "./phone";

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
