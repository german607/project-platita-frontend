import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { listMerchantTransactions } from "../lib/api/endpoints";
import type { MerchantTransaction, TransactionType } from "../lib/api/types";
import { formatTime, todayRange } from "../lib/dates";
import { formatSigned } from "../lib/money";
import { formatUyPhone } from "../lib/phone";
import { ErrorState } from "./states";

// Panel "Hoy en el mostrador" (columna derecha del Mostrador en pantalla
// grande): los últimos movimientos de todo el comercio desde las 00:00. Cada
// fila lleva a la ficha del cliente. Diseño: docs/DISENO.md.

const LIMIT = 10;

const TYPE_LABEL: Record<TransactionType, string> = {
  TOPUP: "Carga",
  BONUS: "Bono",
  CHARGE: "Cobro",
  ADJUSTMENT: "Ajuste",
};

export function HoyEnElMostrador({ merchantId }: { merchantId: string }) {
  // "Hoy" es la medianoche de esta máquina: el backend necesita la zona horaria.
  const { from, to } = todayRange();

  const query = useQuery({
    queryKey: ["merchant-transactions", merchantId, from],
    queryFn: () => listMerchantTransactions(merchantId, { from, to, limit: LIMIT }),
  });

  return (
    <aside aria-label="Hoy en el mostrador" className="rounded-panel bg-tarjeta px-[22px] py-5">
      <h2 className="mb-1 font-titulo text-lg font-extrabold">Hoy en el mostrador</h2>

      {query.isPending && <p className="py-3 text-suave">Cargando…</p>}

      {query.isError && <ErrorState error={query.error} onRetry={() => void query.refetch()} />}

      {query.isSuccess && query.data.data.length === 0 && (
        <p className="py-3 text-suave">Todavía no hubo movimientos hoy.</p>
      )}

      {query.isSuccess && query.data.data.length > 0 && (
        <>
          <ul>
            {query.data.data.map((row) => (
              <Fila key={row.id} row={row} />
            ))}
          </ul>
          {query.data.nextCursor && (
            <p className="pt-2 text-[13px] font-bold text-suave">{`Se muestran los últimos ${LIMIT} movimientos de hoy.`}</p>
          )}
        </>
      )}
    </aside>
  );
}

function Fila({ row }: { row: MerchantTransaction }) {
  // "Cobro · Corte": el tipo y, si lo hay, la nota.
  const detalle = [TYPE_LABEL[row.type], row.note].filter(Boolean).join(" · ");

  return (
    <li className="border-b border-linea last:border-b-0">
      <Link to={`/clientes/${row.customer.id}`} className="flex items-center justify-between gap-3 py-3 text-[15px] font-bold">
        <span>
          {row.customer.name ?? formatUyPhone(row.customer.phone)}
          <span className="block text-[13px] text-suave">{`${formatTime(row.createdAt)} · ${detalle}`}</span>
        </span>
        <span className={`font-titulo text-lg font-extrabold ${row.amount > 0 ? "text-saldo" : "text-accion"}`}>
          {formatSigned(row.amount)}
        </span>
      </Link>
    </li>
  );
}
