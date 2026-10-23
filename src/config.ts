import { z } from "zod";

// Toda variable de entorno se lee acá, validada. Nada de import.meta.env suelto
// en el resto del código: si se suma configuración, se suma a este esquema.
// Las variables están documentadas en docs/FRONTEND.md.
const schema = z.object({
  VITE_API_URL: z.string().optional(),
});

// Una variable vacía (como queda al copiar .env.example) vale lo mismo que una
// que no está: se usa el valor por defecto.
export function parseConfig(env: Record<string, unknown>) {
  const parsed = schema.parse(env);
  return {
    // Por defecto /api: el proxy de Vite hacia el backend (ver vite.config.ts).
    apiUrl: (parsed.VITE_API_URL?.trim() || "/api").replace(/\/$/, ""),
  };
}

export const config = parseConfig(import.meta.env);
