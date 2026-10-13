import { useSyncExternalStore } from "react";

// true mientras la pantalla cumple la condición (por ejemplo "(min-width: 1024px)"),
// y se actualiza sola si cambia (girar el celular, redimensionar la ventana).
// Donde no existe matchMedia (los tests) dice false: se asume el celular.
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window.matchMedia !== "function") return () => {};
      const media = window.matchMedia(query);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    () => (typeof window.matchMedia === "function" ? window.matchMedia(query).matches : false),
    () => false,
  );
}
