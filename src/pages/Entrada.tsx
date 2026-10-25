import { useQuery } from "@tanstack/react-query";
import { FormularioIngreso } from "../components/FormularioIngreso";
import { TarjetaLugar } from "../components/TarjetaLugar";
import { listPlaces } from "../lib/api/endpoints";
import { categoryPlural } from "../lib/categories";
import { useSesion } from "../lib/sesion";
import { Destino } from "./Destino";
import { config } from "../config";
import { Marca } from "../components/Logo";

// Pantalla de inicio, sin sesión: de un lado los lugares que están en Platita
// (la lista pública, sin saldos) y del otro, entrar con el celular. Con sesión,
// decide solo a qué área llevar (ver Destino): cliente, comercio o elegir.
// Diseño de referencia: design/platita-cliente.codigo.html (Entrada).

const PREVIEW = 6;

function LugaresDeLaApp() {
  const query = useQuery({ queryKey: ["places-home"], queryFn: () => listPlaces({ limit: PREVIEW }) });
  const places = query.data?.data ?? [];

  return (
    <section aria-labelledby="lugares-titulo" className="flex flex-col gap-4">
      <h2 id="lugares-titulo" className="font-titulo text-[24px] font-extrabold">
        {`Lugares en ${config.appName}`}
      </h2>
      {query.isPending ? (
        <p role="status" className="text-suave">
          Buscando lugares…
        </p>
      ) : query.isError ? (
        <p className="text-suave">No pudimos cargar los lugares ahora. Igual podés entrar.</p>
      ) : places.length === 0 ? (
        <p className="text-suave">Pronto vas a ver acá los comercios de tu barrio.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {places.map((place) => (
            <li key={place.id}>
              <TarjetaLugar
                name={place.name}
                categoria={categoryPlural(place.category)}
                direccion={place.locations[0]?.address ?? null}
                photoUrl={place.photoUrl}
                hasPromo={place.hasActivePromo}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function Entrada() {
  const { sesion } = useSesion();
  if (sesion) return <Destino />;

  return (
    <main className="mx-auto max-w-[1000px] px-5 py-8 lg:py-14">
      <div className="mb-8 text-center lg:text-left">
        <h1 className="font-titulo text-[40px] font-extrabold leading-none text-accion">
          <Marca />
        </h1>
        <p className="mt-2 text-suave">Saldo y promos en los comercios de tu barrio.</p>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1.25fr_1fr] lg:items-start lg:gap-14">
        {/* En el celular, primero entrar y abajo los lugares. */}
        <div className="order-first rounded-panel bg-tarjeta p-6 shadow-tarjeta lg:sticky lg:top-8 lg:order-last">
          <FormularioIngreso />
          <p className="mt-6 border-t border-linea pt-4 text-center text-sm text-suave">
            ¿Tenés un comercio? Entrá con tu celular: te llevamos a tu cuenta.
          </p>
        </div>
        <LugaresDeLaApp />
      </div>
    </main>
  );
}
