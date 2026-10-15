import type { ReactNode } from "react";
import { ApiError } from "../lib/api/client";
import { Button, ButtonLink } from "./Button";
import { ErrorState } from "./states";
import { routes } from "../lib/routes";

// Piezas que comparten las pantallas que mueven saldo (Cargar saldo, Cobrar y,
// más adelante, Ajuste).

// Si se corta la conexión (o el servidor falla) no se sabe si el movimiento
// llegó a registrarse. Como las pantallas mandan una clave de idempotencia,
// reintentar es seguro: el backend devuelve la respuesta original en vez de
// registrarlo otra vez. Cualquier otro error se muestra como siempre.
export function ErrorDeMovimiento({
  error,
  sustantivo,
  onRetry,
}: {
  error: unknown;
  sustantivo: "la carga" | "el cobro" | "el ajuste";
  onRetry: () => void;
}) {
  if (error instanceof ApiError && (error.code === "NETWORK_ERROR" || error.status >= 500)) {
    const titulo =
      error.code === "NETWORK_ERROR"
        ? `No pudimos confirmar si ${sustantivo} se registró.`
        : "Algo salió mal en el servidor.";
    return (
      <div role="alert" className="rounded-panel border border-accion bg-tarjeta p-5">
        <p className="font-titulo text-xl font-extrabold text-accion">{titulo}</p>
        <p className="mt-1 text-suave">
          Podés reintentar: no se va a registrar dos veces. Si cambiás los datos antes, se toma como una operación nueva.
        </p>
        <Button variant="mostaza" onClick={onRetry} className="mt-3">
          Reintentar
        </Button>
        <ButtonLink to={routes.comercio.mostrador} variant="borde" className="mt-2">
          Revisar el saldo en el Mostrador
        </ButtonLink>
      </div>
    );
  }
  return <ErrorState error={error} />;
}

// Pantalla verde de "listo": tilde, título, lo que quiera mostrar cada
// pantalla, y la vuelta al Mostrador.
export function PantallaExito({
  titulo,
  children,
  volverA = { to: routes.comercio.mostrador, label: "Volver al mostrador" },
}: {
  titulo: string;
  children: ReactNode;
  volverA?: { to: string; label: string };
}) {
  return (
    <section
      role="status"
      className="flex flex-col items-center rounded-panel bg-saldo px-6 py-10 text-center text-tarjeta"
    >
      <div
        aria-hidden="true"
        className="flex h-24 w-24 items-center justify-center rounded-full bg-fondo font-titulo text-[56px] font-extrabold text-saldo"
      >
        ✓
      </div>
      <p className="mt-6 font-titulo text-3xl font-extrabold">{titulo}</p>
      {children}
      <div className="mt-8 w-full max-w-[300px]">
        <ButtonLink to={volverA.to} variant="claro">
          {volverA.label}
        </ButtonLink>
      </div>
    </section>
  );
}

// El número grande de la pantalla de éxito.
export function MontoGrande({ children }: { children: ReactNode }) {
  return (
    <p className="mt-1 font-titulo text-[80px] font-extrabold leading-[1.1] tracking-[-3px]">{children}</p>
  );
}
