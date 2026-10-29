import { useSyncExternalStore } from "react";

// ¿El servidor está despertando? El plan gratis del backend duerme y el primer
// pedido tarda. Cada intento que sigue sin respuesta pasados SLOW_MS cuenta como
// "lento"; mientras haya alguno, la app muestra un aviso (ver AvisoServidor).
export const SLOW_MS = 4_000;

let lentos = 0;
const oyentes = new Set<() => void>();
const avisar = () => oyentes.forEach((f) => f());

// Se llama al empezar cada intento; devuelve la función que lo da por terminado
// (se puede llamar más de una vez).
export function empezarEspera(): () => void {
  let esLento = false;
  let terminado = false;
  const timer = setTimeout(() => {
    esLento = true;
    lentos++;
    avisar();
  }, SLOW_MS);
  return () => {
    if (terminado) return;
    terminado = true;
    clearTimeout(timer);
    if (esLento) {
      lentos--;
      avisar();
    }
  };
}

const suscribir = (f: () => void) => {
  oyentes.add(f);
  return () => oyentes.delete(f);
};

export const useServidorLento = () =>
  useSyncExternalStore(suscribir, () => lentos > 0, () => false);
