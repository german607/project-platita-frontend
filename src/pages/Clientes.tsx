import { useInfiniteQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { ButtonLink } from "../components/Button";
import { EmptyState, ErrorState } from "../components/states";
import { listCustomers } from "../lib/api/endpoints";
import { visitShort } from "../lib/dates";
import { useMerchantId } from "../lib/merchant";
import { formatPesos } from "../lib/money";
import { formatUyPhone } from "../lib/phone";
import { useDebounced } from "../lib/useDebounced";
import { routes } from "../lib/routes";

// Clientes: lista del comercio con su saldo y buscador por nombre o teléfono.
// En el celular es una lista; en pantalla grande, una tabla. Diseño: docs/DISENO.md.

const PAGE_SIZE = 20;

// Columnas de la tabla en pantalla grande: nombre, celular, última visita, saldo.
const grid = "lg:grid lg:grid-cols-[2fr_1.5fr_1.5fr_1fr] lg:items-center";

export function Clientes() {
  const merchantId = useMerchantId();
  const [raw, setRaw] = useState("");
  // Nombre o teléfono en cualquier formato: el backend entiende el texto tal cual.
  const search = useDebounced(raw.trim() || undefined);

  const query = useInfiniteQuery({
    queryKey: ["customers", merchantId, search],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => listCustomers(merchantId, { search, limit: PAGE_SIZE, cursor: pageParam }),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

  const customers = query.data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <section className="flex flex-col gap-4">
      <h1 className="font-titulo text-[26px] font-extrabold lg:text-[28px]">Clientes</h1>

      <input
        type="search"
        autoComplete="off"
        aria-label="Buscar por nombre o teléfono"
        placeholder="Nombre o teléfono"
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        className="h-14 w-full rounded-[20px] border-[3px] border-tinta bg-tarjeta px-4 font-texto text-base font-bold placeholder:text-suave"
      />

      {query.isPending && <Cargando />}

      {query.isError && <ErrorState error={query.error} onRetry={() => void query.refetch()} />}

      {query.isSuccess && customers.length === 0 && (
        <EmptyState
          title={search ? "No encontramos a nadie con eso" : "Todavía no hay clientes"}
          hint={search ? "Probá con otro nombre o con más números del teléfono." : "Aparecen solos cuando cargás saldo a alguien por primera vez."}
          action={
            search ? undefined : (
              <ButtonLink to={routes.comercio.mostrador} variant="mostaza" className="max-w-xs">
                Ir al mostrador
              </ButtonLink>
            )
          }
        />
      )}

      {query.isSuccess && customers.length > 0 && (
        <div className="rounded-panel lg:bg-tarjeta lg:px-6 lg:py-2">
          <div
            aria-hidden="true"
            className={`${grid} hidden border-b-2 border-linea py-3 text-[13px] font-extrabold text-suave`}
          >
            <span>NOMBRE</span>
            <span>CELULAR</span>
            <span>ÚLTIMA VISITA</span>
            <span className="text-right">SALDO</span>
          </div>

          <ul>
            {customers.map((customer) => (
              <li key={customer.id} className="border-b border-arena lg:border-linea">
                <Link
                  to={routes.comercio.ficha(customer.id)}
                  className={`${grid} flex min-h-16 items-center justify-between gap-3 py-2 lg:h-[62px] lg:py-0`}
                >
                  <span className="font-extrabold lg:text-base">
                    {customer.name ?? "Sin nombre"}
                    <span className="block text-[13px] font-bold text-suave lg:hidden">{formatUyPhone(customer.phone)}</span>
                  </span>
                  <span className="hidden lg:block">{formatUyPhone(customer.phone)}</span>
                  <span className="hidden text-suave lg:block">{visitShort(customer.lastVisitAt)}</span>
                  <span className="font-titulo text-2xl font-extrabold lg:text-right">{formatPesos(customer.balance)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {query.hasNextPage && (
        <button
          type="button"
          onClick={() => void query.fetchNextPage()}
          disabled={query.isFetchingNextPage}
          className="h-[52px] w-full rounded-boton border-2 border-tinta font-titulo text-[17px] font-extrabold disabled:opacity-50"
        >
          {query.isFetchingNextPage ? "Cargando…" : "Ver más clientes"}
        </button>
      )}
    </section>
  );
}

// Barras grises mientras llega la lista, como en el diseño.
function Cargando() {
  return (
    <div role="status" className="flex flex-col gap-3">
      <div className="h-16 rounded-[20px] bg-arena" />
      <div className="h-16 rounded-[20px] bg-linea" />
      <div className="h-16 rounded-[20px] bg-[#F0E4C8]" />
      <p className="text-center text-sm text-suave">Buscando…</p>
    </div>
  );
}
