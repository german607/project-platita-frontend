import { describe, expect, it } from "vitest";
import { decidirDestino } from "./destino";

const a = { id: "m1", name: "Café Don Pedro" };
const b = { id: "m2", name: "Peluquería Lucía" };

describe("decidirDestino", () => {
  it("sin comercios es solo cliente", () => {
    expect(decidirDestino([], null)).toEqual({ tipo: "cliente" });
    expect(decidirDestino([], { comercioId: "m9" })).toEqual({ tipo: "cliente" });
  });

  it("con un comercio, entra directo", () => {
    expect(decidirDestino([a], null)).toEqual({ tipo: "comercio", comercioId: "m1" });
  });

  it("con varios y sin recuerdo, pregunta a cuál", () => {
    expect(decidirDestino([a, b], null)).toEqual({ tipo: "elegir" });
  });

  it("recuerda lo último que eligió", () => {
    expect(decidirDestino([a, b], { comercioId: "m2" })).toEqual({ tipo: "comercio", comercioId: "m2" });
    expect(decidirDestino([a, b], "cliente")).toEqual({ tipo: "cliente" });
    expect(decidirDestino([a], "cliente")).toEqual({ tipo: "cliente" });
  });

  it("si el comercio recordado ya no es suyo, no lo usa", () => {
    expect(decidirDestino([a, b], { comercioId: "m9" })).toEqual({ tipo: "elegir" });
    expect(decidirDestino([a], { comercioId: "m9" })).toEqual({ tipo: "comercio", comercioId: "m1" });
  });
});
