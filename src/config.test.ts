import { describe, expect, it } from "vitest";
import { parseConfig } from "./config";

describe("parseConfig", () => {
  it("sin variables usa /api", () => {
    expect(parseConfig({})).toEqual({ apiUrl: "/api", appName: "Ombú" });
  });

  it("las variables vacías (como queda al copiar .env.example) valen lo mismo que no estar", () => {
    expect(parseConfig({ VITE_API_URL: "", VITE_APP_NAME: "" })).toEqual({ apiUrl: "/api", appName: "Ombú" });
    expect(parseConfig({ VITE_API_URL: "  ", VITE_APP_NAME: "  " })).toEqual({ apiUrl: "/api", appName: "Ombú" });
  });

  it("toma la URL del backend sin la barra del final", () => {
    expect(parseConfig({ VITE_API_URL: "https://api.platita.uy/" }).apiUrl).toBe("https://api.platita.uy");
  });

  it("el nombre de la app se cambia por variable, sin espacios", () => {
    expect(parseConfig({ VITE_APP_NAME: " Queda " }).appName).toBe("Queda");
  });

  it("ignora las otras variables de Vite (también la vieja VITE_MERCHANT_ID)", () => {
    expect(parseConfig({ MODE: "development", DEV: true, VITE_X: "y", VITE_MERCHANT_ID: "m1" }).apiUrl).toBe("/api");
  });
});
