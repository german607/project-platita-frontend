import { EmptyState } from "../components/states";

// Pantalla todavía sin construir. Se reemplaza por la real (ver TODO.md §2 y §3).
export function Placeholder({ title }: { title: string }) {
  return (
    <section>
      <h1 className="mb-4 font-titulo text-3xl font-extrabold">{title}</h1>
      <EmptyState title="Próximamente" hint="Esta pantalla todavía no está construida." />
    </section>
  );
}
