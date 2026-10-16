import { Link } from "react-router-dom";
import { ButtonLink } from "../../components/Button";
import { EmptyState, ErrorState, LoadingState } from "../../components/states";
import { categoryPlural } from "../../lib/categories";
import { formatPesos } from "../../lib/money";
import { routes } from "../../lib/routes";
import { useSaldos } from "../../lib/saldos";

// Mis saldos: lo que tiene la persona en cada comercio. Cada saldo vale solo en
// su lugar: nunca se suman en un total.
export function Saldos() {
  const query = useSaldos();

  return (
    <section className="flex flex-col gap-4">
      <h1 className="font-titulo text-[26px] font-extrabold lg:text-[28px]">Mis saldos</h1>
      <p className="text-suave">Cada saldo vale solo en su lugar.</p>

      {query.isPending ? (
        <LoadingState label="Buscando tus saldos…" />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : query.data.length === 0 ? (
        <EmptyState
          title="Todavía no tenés saldo en ningún lugar"
          hint="Cargá saldo en un comercio y aparece acá."
          action={<ButtonLink to={routes.cliente.lugares} variant="mostaza" className="px-6">Ver lugares</ButtonLink>}
        />
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {query.data.map(({ merchant, balance }) => (
            <li key={merchant.id}>
              <Link
                to={routes.cliente.lugar(merchant.id)}
                className="flex items-center justify-between gap-3 rounded-panel bg-tarjeta p-4 shadow-tarjeta"
              >
                <div>
                  <p className="font-titulo text-lg font-extrabold leading-tight">{merchant.name}</p>
                  {merchant.category && <p className="text-sm font-bold text-suave">{categoryPlural(merchant.category)}</p>}
                </div>
                <p className={`font-titulo text-2xl font-extrabold ${balance > 0 ? "text-saldo" : "text-suave"}`}>{formatPesos(balance)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
