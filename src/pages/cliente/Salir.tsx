import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { routes } from "../../lib/routes";
import { useSesionCliente } from "../../lib/sesionCliente";

// Cerrar sesión como una ruta propia, fuera de LayoutCliente: así, al borrar la
// sesión, el guardia de esa zona no manda al ingreso, sino a la entrada.
export function Salir() {
  const { salir } = useSesionCliente();
  useEffect(() => salir(), [salir]);
  return <Navigate to={routes.entrada} replace />;
}
