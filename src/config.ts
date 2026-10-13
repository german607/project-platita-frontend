import { z } from "zod";

// Toda variable de entorno se lee acá, validada. Nada de import.meta.env suelto
// en el resto del código: si se suma configuración, se suma a este esquema.
// Las variables están documentadas en docs/FRONTEND.md.
const schema = z.object({
  VITE_API_URL: z.string().default("/api"),
  VITE_MERCHANT_ID: z.string().optional(),
});

const env = schema.parse(import.meta.env);

export const config = {
  apiUrl: env.VITE_API_URL.replace(/\/$/, ""),
  // Mientras no haya login, el comercio se fija por configuración.
  merchantId: env.VITE_MERCHANT_ID?.trim() || undefined,
};
