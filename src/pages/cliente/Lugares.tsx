import { useInfiniteQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState, ErrorState, LoadingState } from "../../components/states";
import { TarjetaLugar } from "../../components/TarjetaLugar";
import { listPlaces } from "../../lib/api/endpoints";
import type { MerchantCategory } from "../../lib/api/types";
import { CATEGORIES, categoryPlural } from "../../lib/categories";
import { routes } from "../../lib/routes";
import { useSaldos } from "../../lib/saldos";
import { useDebounced } from "../../lib/useDebounced";

// Lugares: los comercios que eligieron aparecer, con filtro por categoría y
// búsqueda por nombre (los dos los resuelve el backend). Si la persona tiene
// saldo en un lugar, la tarjeta lo dice; si los saldos no cargan, no se muestra.

const PAGE_SIZE = 12;

const chip = (active: boolean) =>
  `shrink-0 rounded-full px-4 py-2 text-sm font-extrabold ${active ? "bg-tinta text-tarjeta" : "bg-arena text-suave"}`;

export function Lugares() {
  const [raw, setRaw] = useState("");
  const [category, setCategory] = useState<MerchantCategory | undefined>();
  const search = useDebounced(raw.trim() || undefined);
  const saldos = useSaldos().data;

  const query = useInfiniteQuery({
    queryKey: ["places", category, search],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => listPlaces({ category, search, limit: PAGE_SIZE, cursor: pageParam }),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

  const places = query.data?.pages.flatMap((page) => page.data) ?? [];
  const filtered = category !== undefined || search !== undefined;

  return (
    <section className="flex flex-col gap-4">
      <h1 className="font-titulo text-[26px] font-extrabold lg:text-[28px]">Lugares</h1>

      <input
        type="search"
        aria-label="Buscar por nombre"
        placeholder="Buscar por nombre"
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        className="h-12 w-full rounded-campo border-2 border-borde bg-tarjeta px-5 font-bold outline-none focus:border-accion"
      />

      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 lg:mx-0 lg:flex-wrap lg:px-0" role="group" aria-label="Categoría">
        <button type="button" aria-pressed={category === undefined} onClick={() => setCategory(undefined)} className={chip(category === undefined)}>
          Todos
        </button>
        {CATEGORIES.map((c) => (
          <button key={c.value} type="button" aria-pressed={category === c.value} onClick={() => setCategory(c.value)} className={chip(category === c.value)}>
            {c.plural}
          </button>
        ))}
      </div>

      {query.isPending ? (
        <LoadingState label="Buscando lugares…" />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : places.length === 0 ? (
        <EmptyState
          title={filtered ? "No hay lugares con este filtro" : "Todavía no hay lugares"}
          hint={filtered ? "Probá con otra categoría o borrá la búsqueda." : "Cuando un comercio se sume, lo vas a ver acá."}
          action={
            filtered && (
              <button
                type="button"
                onClick={() => {
                  setRaw("");
                  setCategory(undefined);
                }}
                className="h-12 rounded-tarjeta bg-mostaza px-6 font-extrabold shadow-mostaza"
              >
                Ver todos
              </button>
            )
          }
        />
      ) : (
        <>
          <ul className="grid gap-4 lg:grid-cols-2">
            {places.map((place) => (
              <li key={place.id}>
                <Link to={routes.cliente.lugar(place.id)} className="block rounded-panel focus-visible:outline focus-visible:outline-2 focus-visible:outline-accion">
                  <TarjetaLugar
                    name={place.name}
                    categoria={categoryPlural(place.category)}
                    direccion={place.locations[0]?.address ?? null}
                    photoUrl={place.photoUrl}
                    hasPromo={place.hasActivePromo}
                    saldo={saldos?.find((b) => b.merchant.id === place.id)?.balance}
                  />
                </Link>
              </li>
            ))}
          </ul>
          {query.hasNextPage && (
            <button
              type="button"
              onClick={() => query.fetchNextPage()}
              disabled={query.isFetchingNextPage}
              className="h-12 self-center rounded-tarjeta border-2 border-tinta px-6 font-extrabold disabled:opacity-50"
            >
              {query.isFetchingNextPage ? "Cargando…" : "Ver más"}
            </button>
          )}
        </>
      )}
    </section>
  );
}
