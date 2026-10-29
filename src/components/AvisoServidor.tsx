import { useServidorLento } from "../lib/api/servidor";

// Aviso fijo abajo: aparece solo cuando un pedido tarda más de lo normal (el
// servidor gratis duerme y despertarlo lleva hasta un minuto).
export function AvisoServidor() {
  if (!useServidorLento()) return null;
  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-panel bg-tarjeta p-4 text-center font-bold shadow-tarjeta"
    >
      Despertando el servidor… Puede tardar hasta un minuto la primera vez.
    </div>
  );
}
