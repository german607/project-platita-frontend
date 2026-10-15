import { locationError, MAX_ADDRESS, MAX_LABEL, newDraftLocation, type DraftLocation } from "../../lib/miComercio";
import { ayuda, botonChico, campo, seccion, tituloSeccion } from "./estilos";

// Sección 4: los locales. Lo único que cambia entre locales es la dirección. No
// hay mapa: los clientes ven un botón "Cómo llegar" que se arma con el texto.
// Los locales no se borran: se dan de baja (y se pueden volver a dar de alta).
export function SeccionLocales({
  locations,
  onChange,
  nuevaClave,
  error,
}: {
  locations: DraftLocation[];
  onChange: (locations: DraftLocation[]) => void;
  nuevaClave: () => string;
  error: string | null;
}) {
  const update = (key: string, changes: Partial<DraftLocation>) =>
    onChange(locations.map((l) => (l.key === key ? { ...l, ...changes } : l)));
  const quitar = (key: string) => onChange(locations.filter((l) => l.key !== key));
  const agregar = () => onChange([...locations, newDraftLocation(nuevaClave())]);

  return (
    <section id="locales" className={seccion} aria-labelledby="locales-titulo">
      <h2 id="locales-titulo" className={tituloSeccion}>
        Locales
      </h2>
      <p className={ayuda}>Los clientes ven un botón “Cómo llegar” con esta dirección.</p>

      {locations.length === 0 && (
        <div className="mt-4 rounded-tarjeta bg-fondo p-4">
          <p className="font-extrabold">Todavía no cargaste ningún local</p>
        </div>
      )}

      <ul className="mt-4 flex flex-col gap-3">
        {locations.map((l, i) => {
          const n = i + 1;
          const problema = locationError(l);
          return (
            <li key={l.key} className={`rounded-tarjeta bg-fondo p-4 ${l.active ? "" : "opacity-70"}`}>
              <div className="flex flex-col gap-3 lg:flex-row">
                <div className="lg:w-1/3">
                  <label htmlFor={`${l.key}-label`} className="mb-1 block text-sm font-extrabold text-suave">
                    Etiqueta (opcional)
                  </label>
                  <input
                    id={`${l.key}-label`}
                    aria-label={`Etiqueta del local ${n}`}
                    type="text"
                    maxLength={MAX_LABEL}
                    placeholder="Ej: Pocitos"
                    value={l.label}
                    onChange={(e) => update(l.key, { label: e.target.value })}
                    className={`${campo} h-12 bg-tarjeta`}
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor={`${l.key}-address`} className="mb-1 block text-sm font-extrabold text-suave">
                    Dirección
                  </label>
                  <input
                    id={`${l.key}-address`}
                    aria-label={`Dirección del local ${n}`}
                    type="text"
                    maxLength={MAX_ADDRESS}
                    placeholder="Ej: Av. Brasil 2500, Pocitos"
                    value={l.address}
                    onChange={(e) => update(l.key, { address: e.target.value })}
                    className={`${campo} h-12 bg-tarjeta`}
                  />
                </div>
              </div>

              {problema && <p className="mt-2 text-sm font-bold text-accion">{problema}</p>}

              <div className="mt-3 flex items-center gap-3">
                {l.id === undefined ? (
                  <button type="button" onClick={() => quitar(l.key)} className={botonChico}>
                    {`Quitar local ${n}`}
                  </button>
                ) : l.active ? (
                  <button type="button" onClick={() => update(l.key, { active: false })} className={botonChico}>
                    {`Dar de baja el local ${n}`}
                  </button>
                ) : (
                  <>
                    <span className="rounded-full bg-arena px-3 py-0.5 text-sm font-extrabold text-suave">De baja</span>
                    <button type="button" onClick={() => update(l.key, { active: true })} className={botonChico}>
                      {`Dar de alta el local ${n}`}
                    </button>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <button type="button" onClick={agregar} className={`${botonChico} mt-4`}>
        {locations.length === 0 ? "+ Agregar un local" : "+ Agregar otro local"}
      </button>

      {error && (
        <p role="alert" className="mt-3 font-bold text-accion">
          {error}
        </p>
      )}
    </section>
  );
}
