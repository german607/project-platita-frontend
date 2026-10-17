import { describe, expect, it } from "vitest";
import { customerNames } from "./customerName";

describe("customerNames", () => {
  it("el comercio lo anota distinto: muestra los dos", () => {
    expect(customerNames({ name: "Juanito", userName: "Juan" }, "Sin nombre")).toEqual({ main: "Juanito", alias: "Juan" });
  });

  it("si coinciden (sin mayúsculas ni tildes) muestra uno solo", () => {
    expect(customerNames({ name: "José Pérez", userName: "jose perez " }, "Sin nombre")).toEqual({ main: "José Pérez", alias: null });
  });

  it("si el comercio no lo anotó, usa el nombre de la persona", () => {
    expect(customerNames({ name: null, userName: "Juan" }, "Sin nombre")).toEqual({ main: "Juan", alias: null });
  });

  it("sin ningún nombre (o sin el de la persona) usa lo que haya", () => {
    expect(customerNames({ name: null }, "Sin nombre")).toEqual({ main: "Sin nombre", alias: null });
    expect(customerNames({ name: "Juanito", userName: null }, "x")).toEqual({ main: "Juanito", alias: null });
  });
});
