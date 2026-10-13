import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ButtonLink } from "../components/Button";
import { EmptyState, ErrorState, LoadingState } from "../components/states";
import { getCustomer, listTransactions } from "../lib/api/endpoints";
import type { Transaction, TransactionType } from "../lib/api/types";
import { formatWhen, visitLabel } from "../lib/dates";
import { formatPesos, formatSigned } from "../lib/money";
import { paymentLabel } from "../lib/payment";
import { formatUyPhone } from "../lib/phone";

// Ficha del cliente: su saldo, sus movimientos (con filtro por tipo) y desde
// acá se cobra, se carga o se corrige con un ajuste. Diseño: docs/DISENO.md.

const PAGE_SIZE = 20;

const FILTERS: { label: string; type: TransactionType | undefined }[] = [
  { label: "Todos", type: undefined },
  { label: "Cargas", type: "TOPUP" },
  { label: "Bonos", type: "BONUS" },
  { label: "Cobros", type: "CHARGE" },
  { label: "Ajustes", type: "ADJUSTMENT" },
];

export function Ficha() {
  const { customerId = "" } = useParams();
  const [type, setType] = useState<TransactionType | undefined>(undefined);

  const customer = useQuery({
    queryKey: ["customer", customerId],
    queryFn: () => getCustomer(customerId),
    enabled: customerId !== "",
  });

  const movements = useInfiniteQuery({
    queryKey: ["transactions", customerId, type],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => listTransactions(customerId, { type, limit: PAGE_SIZE, cursor: pageParam }),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: customerId !== "",
  });

  if (customer.isPending) return <LoadingState label="Cargando al cliente…" />;
  if (customer.isError) return <ErrorState error={customer.error} onRetry={() => void customer.refetch()} />;

  const data = customer.data;
  const rows = movements.data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <section className="grid gap-4 lg:grid-cols-[320px_1fr] lg:gap-7">
      <div className="flex flex-col gap-3.5">
        <Link to="/clientes" className="text-sm font-extrabold text-suave">
          ← Clientes
        </Link>
        <h1 className="font-titulo text-[28px] font-extrabold">{data.name ?? "Cliente sin nombre"}</h1>
        <p className="text-suave">{`${formatUyPhone(data.phone)} · ${visitLabel(data.lastVisitAt).toLowerCase()}`}</p>

        <div className="rounded-[24px] bg-saldo px-5 py-3.5 text-tarjeta">
          <p className="text-sm lg:text-[15px]">Saldo</p>
          <p className="font-titulo text-6xl font-extrabold leading-none tracking-[-2px] lg:text-[80px] lg:tracking-[-3px]">
            {formatPesos(data.balance)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 lg:grid-cols-1 lg:gap-3.5">
          <ButtonLink to={`/cobrar/${data.id}`} className="!h-[52px] !text-[17px] lg:!h-[68px] lg:!text-[22px]">
            Cobrar
          </ButtonLink>
          <ButtonLink to={`/cargar/${data.id}`} variant="mostaza" className="!h-[52px] !text-[17px] lg:!h-16 lg:!text-xl">
            <span className="lg:hidden">Cargar</span>
            <span className="hidden lg:inline">Cargar saldo</span>
          </ButtonLink>
        </div>
      </div>

      <div className="flex flex-col gap-2 lg:rounded-panel lg:bg-tarjeta lg:p-6">
        <h2 className="hidden font-titulo text-xl font-extrabold lg:block">Movimientos</h2>

        <div role="group" aria-label="Filtrar movimientos" className="flex gap-1.5 overflow-x-auto py-1.5 lg:gap-2">
          {FILTERS.map((filter) => (
            <button
              key={filter.label}
              type="button"
              aria-pressed={type === filter.type}
              onClick={() => setType(filter.type)}
              className={`h-12 shrink-0 rounded-full border-2 px-3.5 text-[13px] font-extrabold lg:text-sm ${
                type === filter.type ? "border-tinta bg-tinta text-tarjeta" : "border-borde"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {movements.isPending && <LoadingState label="Cargando movimientos…" />}
        {movements.isError && <ErrorState error={movements.error} onRetry={() => void movements.refetch()} />}

        {movements.isSuccess && rows.length === 0 && (
          <EmptyState
            title={type ? "No hay movimientos de este tipo" : "Todavía no tiene movimientos"}
            hint={type ? "Probá con otro filtro." : "Cuando cargues o cobres, van a aparecer acá."}
          />
        )}

        {rows.length > 0 && (
          <ul>
            {rows.map((row) => (
              <Movimiento key={row.id} row={row} />
            ))}
          </ul>
        )}

        {movements.hasNextPage && (
          <button
            type="button"
            onClick={() => void movements.fetchNextPage()}
            disabled={movements.isFetchingNextPage}
            className="mt-2 h-[52px] w-full rounded-boton border-2 border-borde font-titulo text-[17px] font-extrabold disabled:opacity-50"
          >
            {movements.isFetchingNextPage ? "Cargando…" : "Ver más movimientos"}
          </button>
        )}

        <ButtonLink to={`/ajustar/${data.id}`} variant="borde" className="mt-3">
          Corregir con un ajuste
        </ButtonLink>
      </div>
    </section>
  );
}

const BADGES: Record<TransactionType, { label: string; className: string }> = {
  TOPUP: { label: "Carga", className: "bg-carga-suave" },
  BONUS: { label: "Bono", className: "bg-bono-suave" },
  CHARGE: { label: "Cobro", className: "bg-cobro-suave" },
  ADJUSTMENT: { label: "Ajuste", className: "bg-arena" },
};

// Lo que aclara cada movimiento: la forma de pago de una carga, o la nota de
// un cobro o un ajuste. El bono no guarda de qué promo vino.
function detalle(row: Transaction): string {
  return row.type === "TOPUP" ? paymentLabel(row.paidWith) : (row.note ?? "");
}

function Movimiento({ row }: { row: Transaction }) {
  const badge = BADGES[row.type];
  return (
    <li className="flex items-center justify-between gap-3 border-b border-arena py-2.5 text-sm font-bold lg:border-linea lg:py-3 lg:text-base">
      <span>
        <span className={`mr-2 inline-block rounded-full px-2.5 py-0.5 text-[13px] ${badge.className}`}>{badge.label}</span>
        {detalle(row)}
        <span className="block text-xs text-suave lg:text-[13px]">{formatWhen(row.createdAt)}</span>
      </span>
      <span
        className={`font-titulo text-lg font-extrabold lg:text-xl ${row.amount > 0 ? "text-saldo" : "text-accion"}`}
      >
        {formatSigned(row.amount)}
      </span>
    </li>
  );
}
