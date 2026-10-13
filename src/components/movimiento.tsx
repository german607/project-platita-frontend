import type { ReactNode } from "react";
import { ApiError } from "../lib/api/client";
import { ButtonLink } from "./Button";
import { ErrorState } from "./states";

// Piezas que comparten las pantallas que mueven saldo (Cargar saldo, Cobrar y,
// más adelante, Ajuste).

// El backend todavía no tiene idempotencia: si se corta la conexión no se
// sabe si el movimiento llegó a registrarse, y repetirlo podría duplicarlo.
// Por eso para ese caso no hay "Probar de nuevo": se manda a revisar el saldo
// primero. Cualquier otro error se muestra como siempre.
export function ErrorDeMovimiento({ error, sustantivo }: { error: unknown; sustantivo: "la carga" | "el cobro" | "el ajuste" }) {
  if (error instanceof ApiError && error.code === "NETWORK_ERROR") {
    const repetir = sustantivo === "la carga" ? "repetirla" : "repetirlo";
    return (
      <div role="alert" className="rounded-panel border border-accion bg-tarjeta p-5">
        <p className="font-titulo text-xl font-extrabold text-accion">{`No pudimos confirmar si ${sustantivo} se registró.`}</p>
        <p className="mt-1 text-suave">{`Antes de ${repetir}, revisá el saldo del cliente en el Mostrador.`}</p>
        <ButtonLink to="/" variant="mostaza" className="mt-3">
          Ir al Mostrador
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
  volverA = { to: "/", label: "Volver al mostrador" },
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
