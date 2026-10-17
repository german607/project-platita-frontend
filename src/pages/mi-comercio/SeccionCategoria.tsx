import { useState } from "react";
import type { MerchantCategory } from "../../lib/api/types";
import { CATEGORIES } from "../../lib/categories";
import { formatLongDate } from "../../lib/dates";
import { CATEGORY_LOCK_DAYS } from "../../lib/miComercio";
import { ayuda, seccion, tituloSeccion } from "./estilos";

// Sección 3: la categoría, una de seis. Después de elegirla no se puede cambiar
// antes de 90 días; si necesita cambiarla antes, el comercio nos escribe.
export function SeccionCategoria({
  value,
  onChange,
  desbloqueaEl,
  error,
}: {
  value: MerchantCategory | null;
  onChange: (value: MerchantCategory) => void;
  desbloqueaEl: Date | null; // null = se puede cambiar
  error: string | null;
}) {
  const [ayudaAbierta, setAyudaAbierta] = useState(false);
  const bloqueada = desbloqueaEl !== null;

  return (
    <section className={seccion} aria-labelledby="categoria-titulo">
      <div className="flex items-center gap-2">
        <h2 id="categoria-titulo" className={tituloSeccion}>
          Categoría
        </h2>
        <button
          type="button"
          aria-label="Ayuda sobre la categoría"
          aria-expanded={ayudaAbierta}
          onClick={() => setAyudaAbierta((open) => !open)}
          className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-tinta text-sm font-extrabold"
        >
          i
        </button>
        {bloqueada && <span className="rounded-full bg-arena px-3 py-0.5 text-sm font-extrabold text-suave">Bloqueada por ahora</span>}
      </div>

      {ayudaAbierta && (
        <p role="tooltip" className="mt-2 rounded-tarjeta bg-fondo p-3 text-sm font-bold">
          {`La categoría no se puede cambiar seguido: una vez cada ${CATEGORY_LOCK_DAYS} días. Si necesitás cambiarla antes, escribinos y la cambiamos nosotros.`}
        </p>
      )}

      {value === null && !bloqueada && <p className={ayuda}>Elegí una</p>}

      <div role="radiogroup" aria-label="Categoría" className="mt-3 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            type="button"
            role="radio"
            aria-checked={value === c.value}
            disabled={bloqueada}
            onClick={() => onChange(c.value)}
            className={`h-12 rounded-full border-2 px-4 text-sm font-extrabold disabled:opacity-60 ${
              value === c.value ? "border-tinta bg-tinta text-tarjeta" : "border-borde bg-fondo"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {bloqueada && (
        <p className="mt-3 font-bold text-suave">{`Podés cambiarla desde el ${formatLongDate(desbloqueaEl.toISOString())}`}</p>
      )}
      {error && (
        <p role="alert" className="mt-3 font-bold text-accion">
          {error}
        </p>
      )}
    </section>
  );
}
