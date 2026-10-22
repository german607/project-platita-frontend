import { describe, expect, it } from "vitest";
import { parseConfig } from "./config";

describe("parseConfig", () => {
  it("sin variables usa /api", () => {
    expect(parseConfig({})).toEqual({ apiUrl: "/api" });
  });

  it("las variables vacías (como queda al copiar .env.example) valen lo mismo que no estar", () => {
    expect(parseConfig({ VITE_API_URL: "" })).toEqual({ apiUrl: "/api" });
    expect(parseConfig({ VITE_API_URL: "  " })).toEqual({ apiUrl: "/api" });
  });

  it("toma la URL del backend sin la barra del final", () => {
    expect(parseConfig({ VITE_API_URL: "https://api.platita.uy/" }).apiUrl).toBe("https://api.platita.uy");
  });

  it("ignora las otras variables de Vite (también la vieja VITE_MERCHANT_ID)", () => {
    expect(parseConfig({ MODE: "development", DEV: true, VITE_X: "y", VITE_MERCHANT_ID: "m1" }).apiUrl).toBe("/api");
  });
});
