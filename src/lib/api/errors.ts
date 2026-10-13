import { ApiError } from "./client";

// Mensaje para mostrarle a una persona, en lenguaje de mostrador y según el
// `code` del backend. Los textos técnicos del backend no se muestran.
export function friendlyMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.code) {
      case "NETWORK_ERROR":
        return "No hay conexión con el servidor. Revisá tu internet y probá de nuevo.";
      case "INSUFFICIENT_BALANCE":
        return "El cliente no tiene saldo suficiente.";
      case "NOT_FOUND":
        return "No lo encontramos.";
      case "VALIDATION_ERROR":
        return "Revisá los datos ingresados.";
      case "CONFLICT":
        return "Eso ya existe.";
    }
  }
  return "Algo salió mal. Probá de nuevo.";
}
