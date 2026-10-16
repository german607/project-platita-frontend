import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { ErrorState, LoadingState } from "../../components/states";
import { getPlace } from "../../lib/api/endpoints";
import { ApiError } from "../../lib/api/client";
import { categoryPlural } from "../../lib/categories";
import { WEEKDAYS, formatRanges, isOpenNow, weekdayOf } from "../../lib/hours";
import { directionsUrl } from "../../lib/maps";
import { formatPesos } from "../../lib/money";
import { routes } from "../../lib/routes";

// Detalle de un lugar: promos, dónde queda, horarios. Falta "Tu saldo acá":
// necesita el saldo del cliente en este comercio (TODO.md §4). "Cargar saldo"
// es un botón deshabilitado a propósito: todavía no se puede.

const card = "rounded-panel bg-tarjeta p-5 shadow-tarjeta";

export function Lugar() {
  const { merchantId = "" } = useParams();
  const query = useQuery({ queryKey: ["place", merchantId], queryFn: () => getPlace(merchantId) });

  const volver = (
    <Link to={routes.cliente.lugares} className="font-extrabold text-suave">
      ← Volver a Lugares
    </Link>
  );

  if (query.isPending) return <LoadingState label="Abriendo el lugar…" />;
  if (query.isError) {
    const noExiste = query.error instanceof ApiError && query.error.status === 404;
    return (
      <div className="flex flex-col gap-4">
        {volver}
        {noExiste ? (
          <div role="alert" className="rounded-panel border border-accion bg-tarjeta p-6 text-center">
            <p className="font-titulo text-xl font-extrabold text-accion">Este lugar ya no está disponible</p>
          </div>
        ) : (
          <ErrorState error={query.error} onRetry={() => query.refetch()} />
        )}
      </div>
    );
  }

  const place = query.data;
  const today = weekdayOf();
  const abierto = isOpenNow(place.openingHours);
  const tieneHorarios = WEEKDAYS.some((d) => place.openingHours[d.key].length > 0);

  return (
    <article className="flex flex-col gap-5">
      {volver}

      <div className="relative h-44 overflow-hidden rounded-panel bg-[repeating-linear-gradient(45deg,#EADCBC,#EADCBC_10px,#F2E6CC_10px,#F2E6CC_20px)] lg:h-60">
        {place.photoUrl ? (
          <img src={place.photoUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center font-extrabold text-suave">foto</span>
        )}
      </div>

      <header>
        <h1 className="font-titulo text-[30px] font-extrabold leading-tight">{place.name}</h1>
        <p className="font-bold text-suave">{categoryPlural(place.category)}</p>
        {place.description && <p className="mt-2">{place.description}</p>}
      </header>

      <section className={`${card} flex items-center justify-between gap-4`} aria-label="Cargar saldo">
        <p className="font-bold text-suave">Cargar saldo en este lugar</p>
        <button type="button" disabled className="rounded-tarjeta bg-arena px-4 py-3 text-left font-extrabold text-suave">
          Cargar saldo
          <span className="block text-sm font-bold">Próximamente</span>
        </button>
      </section>

      <section className={card}>
        <h2 className="mb-3 font-titulo text-xl font-extrabold">Promos</h2>
        {place.promos.length === 0 ? (
          <p className="text-suave">Por ahora no tiene promos.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {place.promos.map((promo) => (
              <li key={promo.id} className="rounded-tarjeta bg-bono-suave p-3.5">
                {promo.name && <p className="font-extrabold">{promo.name}</p>}
                <p className="font-bold">{`Cargando ${formatPesos(promo.minTopUp)} o más, te regalo ${formatPesos(promo.bonusAmount)}`}</p>
                {promo.description && <p className="mt-1 text-sm text-suave">{promo.description}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={card}>
        <h2 className="mb-3 font-titulo text-xl font-extrabold">Dónde queda</h2>
        <ul className="flex flex-col gap-3">
          {place.locations.map((loc) => (
            <li key={loc.address} className="flex items-center justify-between gap-3">
              <div>
                {loc.label && <p className="font-extrabold">{loc.label}</p>}
                <p className="text-suave">{loc.address}</p>
              </div>
              <a
                href={directionsUrl(loc.address)}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 rounded-tarjeta bg-mostaza px-4 py-2.5 font-extrabold shadow-mostaza"
              >
                Cómo llegar
              </a>
            </li>
          ))}
        </ul>
      </section>

      {tieneHorarios && (
        <section className={card}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-titulo text-xl font-extrabold">Horarios</h2>
            {abierto && <span className="rounded-full bg-carga-suave px-3 py-1 text-sm font-extrabold text-saldo">Abierto ahora</span>}
          </div>
          <dl>
            {WEEKDAYS.map((d) => (
              <div key={d.key} className={`flex justify-between border-t border-linea py-2 first:border-t-0 ${d.key === today ? "font-extrabold" : ""}`}>
                <dt>{d.key === today ? `${d.label} · hoy` : d.label}</dt>
                <dd>{formatRanges(place.openingHours[d.key])}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </article>
  );
}
