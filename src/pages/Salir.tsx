import { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { logout } from "../lib/api/endpoints";
import { routes } from "../lib/routes";
import { useSesion } from "../lib/sesion";

// Cerrar sesión como una ruta propia (la usan el área del cliente y la del comercio),
// fuera de las zonas con sesión: así, al borrar la sesión, el guardia de esas zonas
// no se cruza con esta salida. Primero
// se cierra en el backend (que la revoca al instante) y pase lo que pase se borra
// la de este navegador: si no hay conexión, igual se sale.
export function Salir() {
  const { salir } = useSesion();
  const [listo, setListo] = useState(false);
  const empezo = useRef(false); // salir() cambia el contexto: sin esto el efecto correría de nuevo

  useEffect(() => {
    if (empezo.current) return;
    empezo.current = true;
    logout()
      .catch(() => {})
      .finally(() => {
        salir();
        setListo(true);
      });
  }, [salir]);

  return listo ? <Navigate to={routes.entrada} replace /> : null;
}
