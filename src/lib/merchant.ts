import { config } from "../config";

// El comercio con el que se trabaja. Mientras no haya login sale de la
// configuración (VITE_MERCHANT_ID). Layout no muestra ninguna pantalla si
// falta, así que acá es seguro exigirlo.
export function useMerchantId(): string {
  if (!config.merchantId) throw new Error("Falta configurar VITE_MERCHANT_ID");
  return config.merchantId;
}
