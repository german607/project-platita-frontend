import { Switch } from "../../components/Switch";
import { TarjetaLugar } from "../../components/TarjetaLugar";
import { canBeVisible, type Requirements } from "../../lib/miComercio";
import { ayuda, botonChico, seccion, tituloSeccion } from "./estilos";

// Sección 1: el interruptor "Aparecer en la app" y la vista previa de cómo se ve
// el comercio en la lista de Lugares. Solo se puede prender con un local y una
// categoría (lo mismo que exige el backend); la descripción es recomendada.

export interface VistaPrevia {
  name: string;
  categoria: string;
  direccion: string | null;
  photoUrl: string | null;
  hasPromo: boolean;
}

function Item({ ok, children }: { ok: boolean; children: string }) {
  return (
    <li className={`flex items-center gap-2 font-bold ${ok ? "text-saldo" : "text-accion"}`}>
      <span aria-hidden="true">{ok ? "✓" : "✕"}</span>
      <span className="sr-only">{ok ? "Listo: " : "Falta: "}</span>
      {children}
    </li>
  );
}

export function SeccionAparecer({
  visible,
  onChange,
  req,
  error,
  vista,
  onIrALocales,
}: {
  visible: boolean;
  onChange: (visible: boolean) => void;
  req: Requirements;
  error: string | null;
  vista: VistaPrevia;
  onIrALocales: () => void;
}) {
  const puede = canBeVisible(req);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className={seccion} aria-labelledby="aparecer-titulo">
        <h2 id="aparecer-titulo" className={tituloSeccion}>
          Aparecer en la app
        </h2>
        <div className="mt-3">
          <Switch
            checked={visible}
            onChange={onChange}
            label="Aparecer en la app"
            textOn="Prendido"
            textOff="Apagado"
            disabled={!visible && !puede}
          />
        </div>
        <p className={ayuda}>Si lo prendés, los clientes te encuentran en Lugares.</p>

        {!visible && !puede && (
          <div className="mt-4 rounded-tarjeta bg-fondo p-4">
            <p className="font-extrabold">Todavía no podés prenderlo. Te falta:</p>
            <ul className="mt-2 flex flex-col gap-1">
              <Item ok={req.location}>Cargar al menos un local</Item>
              <Item ok={req.category}>Elegir una categoría</Item>
              <Item ok={req.description}>Agregar una descripción corta (recomendado)</Item>
            </ul>
            <button type="button" onClick={onIrALocales} className={`${botonChico} mt-3`}>
              Ir a Locales
            </button>
          </div>
        )}

        {!visible && puede && (
          <p className="mt-4 font-bold text-saldo">
            {req.description
              ? "✓ Todo listo: tenés local, categoría y descripción."
              : "✓ Todo listo: tenés local y categoría. Una descripción corta ayuda a que te elijan."}
          </p>
        )}

        {visible && puede && <p className="mt-4 font-bold text-saldo">Ya te encuentran en Lugares.</p>}

        {visible && !puede && (
          <p role="alert" className="mt-4 font-bold text-accion">
            Para seguir apareciendo necesitás al menos un local activo y una categoría.
          </p>
        )}

        {error && (
          <p role="alert" className="mt-4 font-bold text-accion">
            {error}
          </p>
        )}
      </section>

      <section className={seccion} aria-labelledby="vista-titulo">
        <h2 id="vista-titulo" className={tituloSeccion}>
          Así te ven los clientes
        </h2>
        <p className={`${ayuda} mb-3`}>En la lista de Lugares</p>
        <TarjetaLugar
          name={vista.name}
          categoria={vista.categoria}
          direccion={vista.direccion}
          photoUrl={vista.photoUrl}
          hasPromo={vista.hasPromo}
        />
        <p className="mt-3 text-sm font-bold text-suave">
          {visible ? "Ya te encuentran en Lugares." : "Todavía no te ven: “Aparecer en la app” está apagado."}
        </p>
      </section>
    </div>
  );
}
