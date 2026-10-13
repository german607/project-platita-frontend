import type { ReactNode } from "react";
import { friendlyMessage } from "../lib/api/errors";

// Los cuatro estados que toda pantalla con datos de la API debe resolver
// (ver docs/AGENTS.md): vacío, cargando, error y éxito.

const box = "rounded-panel border border-borde bg-tarjeta p-6 text-center";

export function LoadingState({ label = "Cargando…" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className={box}>
      <p className="font-titulo text-xl font-extrabold text-suave">{label}</p>
    </div>
  );
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className={box}>
      <p className="font-titulo text-2xl font-extrabold">{title}</p>
      {hint && <p className="mt-2 text-suave">{hint}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div role="alert" className={`${box} border-accion`}>
      <p className="font-titulo text-xl font-extrabold text-accion">{friendlyMessage(error)}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 h-12 rounded-tarjeta bg-accion px-6 font-extrabold text-tarjeta active:bg-accion-oscuro"
        >
          Probar de nuevo
        </button>
      )}
    </div>
  );
}

export function SuccessState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div role="status" className={`${box} border-saldo`}>
      <p className="font-titulo text-2xl font-extrabold text-saldo">{title}</p>
      {children && <div className="mt-2 text-suave">{children}</div>}
    </div>
  );
}
