import { useInfiniteQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState, ErrorState, LoadingState } from "../components/states";
import { listInactiveCustomers } from "../lib/api/endpoints";
import type { CustomerWithBalance } from "../lib/api/types";
import { daysAgo } from "../lib/dates";
import { useMerchantId } from "../lib/merchant";
import { formatPesos } from "../lib/money";
import { formatUyPhone } from "../lib/phone";
import { routes } from "../lib/routes";

// Reactivar: los clientes que hace tiempo no vienen, para mandarles una promo.
// El envío por WhatsApp todavía no existe en el backend: el botón queda
// deshabilitado y dice "próximamente". Diseño: docs/DISENO.md.

const PAGE_SIZE = 20;
const DEFAULT_DAYS = 60;
const STEP = 10;
const MIN_DAYS = 10;
const MAX_DAYS = 365;

const stepper =
  "flex h-12 w-12 items-center justify-center rounded-[14px] border-2 border-tinta text-[22px] disabled:opacity-40 lg:h-[52px] lg:w-[52px] lg:rounded-[16px] lg:text-[26px]";

export function Reactivar() {
  const merchantId = useMerchantId();
  const [days, setDays] = useState(DEFAULT_DAYS);

  const query = useInfiniteQuery({
    queryKey: ["inactive", merchantId, days],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => listInactiveCustomers(merchantId, { days, limit: PAGE_SIZE, cursor: pageParam }),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

  const customers = query.data?.pages.flatMap((page) => page.data) ?? [];
  // El backend cuenta a todos los inactivos, no solo a los de las páginas cargadas.
  const total = query.data?.pages[query.data.pages.length - 1]?.total ?? 0;

  return (
    <section className="flex flex-col gap-4">
      <h1 className="font-titulo text-[26px] font-extrabold lg:text-[28px]">
        Reactivar<span className="hidden lg:inline"> clientes</span>
      </h1>

      <div className="flex flex-wrap items-center gap-2 rounded-[22px] bg-tarjeta px-3.5 py-2.5 text-sm font-extrabold lg:gap-3.5 lg:bg-transparent lg:p-0 lg:text-lg">
        <span>No vienen hace</span>
        <button
          type="button"
          aria-label="Menos días"
          disabled={days <= MIN_DAYS}
          onClick={() => setDays((d) => Math.max(MIN_DAYS, d - STEP))}
          className={stepper}
        >
          −
        </button>
        <output aria-label="Días sin venir" className="min-w-[50px] text-center font-titulo text-[28px] font-extrabold lg:text-[40px]">
          {days}
        </output>
        <button
          type="button"
          aria-label="Más días"
          disabled={days >= MAX_DAYS}
          onClick={() => setDays((d) => Math.min(MAX_DAYS, d + STEP))}
          className={stepper}
        >
          +
        </button>
        <span className="hidden lg:inline">días</span>

        {query.isSuccess && total > 0 && (
          <span className="rounded-full bg-mostaza px-3.5 py-1.5 text-sm lg:ml-auto">
            {`${total} ${total === 1 ? "cliente" : "clientes"}`}
          </span>
        )}
      </div>

      {query.isPending && <LoadingState label="Buscando…" />}
      {query.isError && <ErrorState error={query.error} onRetry={() => void query.refetch()} />}

      {query.isSuccess && customers.length === 0 && (
        <EmptyState
          title="¡Todos vienen seguido!"
          hint={`Nadie lleva más de ${days} días sin venir. Bajá los días para ver más.`}
        />
      )}

      {customers.length > 0 && (
        <ul className="rounded-panel lg:bg-tarjeta lg:px-6 lg:py-2">
          {customers.map((customer) => (
            <Fila key={customer.id} customer={customer} />
          ))}
        </ul>
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

      <button
        type="button"
        disabled
        className="flex h-[60px] w-full items-center justify-center gap-2 rounded-[22px] bg-arena font-titulo text-[17px] font-extrabold text-suave lg:hidden"
      >
        Mandar promo por WhatsApp
        <i className="rounded-full bg-tinta px-2 py-0.5 text-[11px] not-italic text-tarjeta">pronto</i>
      </button>
    </section>
  );
}

function Fila({ customer }: { customer: CustomerWithBalance }) {
  // Si nunca vino, el backend lo cuenta desde que se anotó: se dice así.
  const cuando = customer.lastVisitAt
    ? daysAgo(customer.lastVisitAt)
    : `Nunca vino · se anotó ${daysAgo(customer.createdAt).toLowerCase()}`;
  const saldo = formatPesos(customer.balance);

  return (
    <li className="border-b border-arena py-3 lg:flex lg:h-[72px] lg:items-center lg:gap-4 lg:border-linea lg:py-0">
      <Link to={routes.comercio.ficha(customer.id)} className="block lg:flex-[2]">
        <span className="flex justify-between gap-3 lg:block">
          <b className="text-base lg:text-[17px]">{customer.name ?? "Sin nombre"}</b>
          <b className="font-titulo text-xl lg:hidden">{saldo}</b>
        </span>
        <span className="block text-[13px] font-bold text-suave lg:text-sm">
          <span className="lg:hidden">{`${cuando} · `}</span>
          {formatUyPhone(customer.phone)}
        </span>
      </Link>
      <span className="hidden font-bold text-suave lg:block lg:flex-[1.2]">{cuando}</span>
      <b className="hidden font-titulo text-2xl lg:block lg:flex-1">{saldo}</b>
      <button
        type="button"
        disabled
        className="hidden h-12 items-center gap-2 rounded-[16px] bg-arena px-[18px] font-extrabold text-suave lg:flex"
      >
        WhatsApp
        <i className="rounded-full bg-tinta px-2 py-0.5 text-xs not-italic text-tarjeta">próximamente</i>
      </button>
    </li>
  );
}
