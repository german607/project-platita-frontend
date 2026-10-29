import { z } from "zod";
import { DEFAULT_APP_NAME } from "./brand";

// Toda variable de entorno se lee acá, validada. Nada de import.meta.env suelto
// en el resto del código: si se suma configuración, se suma a este esquema.
// Las variables están documentadas en docs/FRONTEND.md.
const schema = z.object({
  VITE_API_URL: z.string().optional(),
  VITE_APP_NAME: z.string().optional(),
});

// Una variable vacía (como queda al copiar .env.example) vale lo mismo que una
// que no está: se usa el valor por defecto.
export function parseConfig(env: Record<string, unknown>) {
  const parsed = schema.parse(env);
  return {
    // Por defecto /api: el proxy de Vite hacia el backend (ver vite.config.ts).
    apiUrl: (parsed.VITE_API_URL?.trim() || "/api").replace(/\/$/, ""),
    // El nombre que se muestra en pantalla (logo, título, textos). Provisional.
    appName: parsed.VITE_APP_NAME?.trim() || DEFAULT_APP_NAME,
  };
}

export const config = parseConfig(import.meta.env);
