import { EmptyState } from "../../components/states";

// Mis saldos: el saldo de cada comercio, nunca sumados. Necesita una consulta
// del backend que todavía no existe (GET /me/balances, TODO.md §4). Hacerla
// recorriendo comercio por comercio sería ineficiente, así que se espera.
export function Saldos() {
  return (
    <section className="flex flex-col gap-4">
      <h1 className="font-titulo text-[26px] font-extrabold lg:text-[28px]">Mis saldos</h1>
      <p className="text-suave">Cada saldo vale solo en su lugar.</p>
      <EmptyState title="Próximamente" hint="Acá vas a ver cuánto tenés en cada comercio." />
    </section>
  );
}
