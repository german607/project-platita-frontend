import { describe, expect, it } from "vitest";
import { parseConfig } from "./config";

describe("parseConfig", () => {
  it("sin variables usa /api y no tiene comercio", () => {
    expect(parseConfig({})).toEqual({ apiUrl: "/api", merchantId: undefined });
  });

  it("las variables vacías (como queda al copiar .env.example) valen lo mismo que no estar", () => {
    expect(parseConfig({ VITE_API_URL: "", VITE_MERCHANT_ID: "" })).toEqual({
      apiUrl: "/api",
      merchantId: undefined,
    });
    expect(parseConfig({ VITE_API_URL: "  ", VITE_MERCHANT_ID: "  " })).toEqual({
      apiUrl: "/api",
      merchantId: undefined,
    });
  });

  it("toma la URL del backend sin la barra del final", () => {
    expect(parseConfig({ VITE_API_URL: "https://api.platita.uy/" }).apiUrl).toBe("https://api.platita.uy");
  });

  it("toma el comercio sin espacios", () => {
    expect(parseConfig({ VITE_MERCHANT_ID: " cmv6yjfjt0000350k0pbbrjwk " }).merchantId).toBe("cmv6yjfjt0000350k0pbbrjwk");
  });

  it("ignora las otras variables de Vite", () => {
    expect(parseConfig({ MODE: "development", DEV: true, VITE_X: "y" }).apiUrl).toBe("/api");
  });
});
