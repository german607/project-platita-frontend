import { useEffect, useState } from "react";

// Devuelve `value` recién cuando dejó de cambiar durante `ms` milisegundos.
// Sirve para no consultar la API en cada tecla de un buscador.
export function useDebounced<T>(value: T, ms = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}
