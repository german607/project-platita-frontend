import { useRef } from "react";

// Claves de idempotencia para cargas, cobros y ajustes. Mandar la misma clave con
// el mismo cuerpo es seguro aunque se corte la conexión: el backend devuelve
// la respuesta original en vez de registrar el movimiento otra vez.

// Un UUID v4. `randomUUID` solo existe en contextos seguros (https o
// localhost): al probar desde el celular por la red local (http://192.168…)
// hay que armarlo a mano.
export function newIdempotencyKey(): string {
  const c = globalThis.crypto;
  if (typeof c?.randomUUID === "function") return c.randomUUID();
  if (typeof c?.getRandomValues === "function") {
    const b = c.getRandomValues(new Uint8Array(16));
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  }
  return `k-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

// Una clave por operación. `keyFor(firma)` devuelve la misma clave mientras la
// firma (lo que define la operación: monto, nota, forma de pago…) no cambie, así
// "Reintentar" reenvía la misma clave. Si la persona cambia algo, es otra
// operación y sale una clave nueva. Después de un éxito se llama `reset()`.
export function useIdempotencyKey() {
  const current = useRef<{ signature: string; key: string } | null>(null);

  return {
    keyFor(signature: string): string {
      if (current.current?.signature !== signature) {
        current.current = { signature, key: newIdempotencyKey() };
      }
      return current.current.key;
    },
    reset() {
      current.current = null;
    },
  };
}
