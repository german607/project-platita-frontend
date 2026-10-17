import { useState } from "react";
import { Switch } from "../../components/Switch";
import type { OpeningHours, TimeRange, Weekday } from "../../lib/api/types";
import { copyToAllDays, dayErrors, MAX_RANGES_PER_DAY, nextRange, WEEKDAYS } from "../../lib/hours";
import { ayuda, botonChico, campo, seccion, tituloSeccion } from "./estilos";

// Sección 5: los horarios. Uno solo para todos los locales. Cada día tiene uno o
// más tramos (hasta 6) o está cerrado. Los errores se muestran al lado del tramo.
export function SeccionHorarios({ hours, onChange }: { hours: OpeningHours; onChange: (hours: OpeningHours) => void }) {
  const [origen, setOrigen] = useState<Weekday>("mon");

  const setDay = (day: Weekday, ranges: TimeRange[]) => onChange({ ...hours, [day]: ranges });

  return (
    <section className={seccion} aria-labelledby="horarios-titulo">
      <h2 id="horarios-titulo" className={tituloSeccion}>
        Horarios
      </h2>
      <p className={ayuda}>Un solo horario para todos tus locales.</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <label htmlFor="copiar-de" className="text-sm font-extrabold text-suave">
          Copiar de otro día
        </label>
        <select
          id="copiar-de"
          value={origen}
          onChange={(e) => setOrigen(e.target.value as Weekday)}
          className={`${campo} h-12 w-auto bg-tarjeta`}
        >
          {WEEKDAYS.map((d) => (
            <option key={d.key} value={d.key}>
              {d.label}
            </option>
          ))}
        </select>
        <button type="button" onClick={() => onChange(copyToAllDays(hours, origen))} className={botonChico}>
          Copiar a todos los días
        </button>
      </div>

      <ul className="mt-4 flex flex-col gap-3">
        {WEEKDAYS.map(({ key, label }) => {
          const ranges = hours[key];
          const errors = dayErrors(ranges);
          const cerrado = ranges.length === 0;

          return (
            <li key={key} className="rounded-tarjeta bg-fondo p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="font-titulo text-lg font-extrabold">{label}</span>
                <Switch
                  checked={cerrado}
                  onChange={(closed) => setDay(key, closed ? [] : [nextRange([])])}
                  label={`${label} cerrado`}
                  textOn="Cerrado"
                  textOff="Abierto"
                />
              </div>

              {cerrado ? (
                <p className="mt-2 font-bold text-suave">Cerrado todo el día</p>
              ) : (
                <div className="mt-3 flex flex-col gap-3">
                  {ranges.map((range, i) => (
                    <div key={i}>
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          aria-label={`${label}, tramo ${i + 1}: desde`}
                          value={range.from}
                          onChange={(e) => setDay(key, ranges.map((r, j) => (j === i ? { ...r, from: e.target.value } : r)))}
                          className={`${campo} h-12 w-32 bg-tarjeta ${errors[i] ? "border-accion" : ""}`}
                        />
                        <span className="font-extrabold text-suave">a</span>
                        <input
                          type="time"
                          aria-label={`${label}, tramo ${i + 1}: hasta`}
                          value={range.to}
                          onChange={(e) => setDay(key, ranges.map((r, j) => (j === i ? { ...r, to: e.target.value } : r)))}
                          className={`${campo} h-12 w-32 bg-tarjeta ${errors[i] ? "border-accion" : ""}`}
                        />
                        <button
                          type="button"
                          aria-label={`Quitar el tramo ${i + 1} del ${label}`}
                          onClick={() => setDay(key, ranges.filter((_, j) => j !== i))}
                          className="flex h-12 w-12 items-center justify-center rounded-full text-2xl font-extrabold text-suave"
                        >
                          ×
                        </button>
                      </div>
                      {errors[i] && <p className="mt-1 text-sm font-bold text-accion">{errors[i]}</p>}
                    </div>
                  ))}
                  {ranges.length < MAX_RANGES_PER_DAY && (
                    <button
                      type="button"
                      onClick={() => setDay(key, [...ranges, nextRange(ranges)])}
                      className="self-start text-sm font-extrabold text-accion underline"
                    >
                      {`+ Agregar tramo al ${label}`}
                    </button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
