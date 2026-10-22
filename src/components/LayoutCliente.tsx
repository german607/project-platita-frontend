import { NavLink, Navigate, Outlet } from "react-router-dom";
import { routes } from "../lib/routes";
import { useSesionCliente } from "../lib/sesionCliente";

// Navegación del cliente: menú inferior en el celular y menú arriba en la web
// (contenido de hasta 900px). Sin sesión, se manda a la pantalla de inicio, que es donde se entra.
const items = [
  { to: routes.cliente.lugares, label: "Lugares" },
  { to: routes.cliente.saldos, label: "Mis saldos" },
  { to: routes.cliente.perfil, label: "Perfil" },
];

const topLink = ({ isActive }: { isActive: boolean }) =>
  `rounded-full px-4 py-2 font-extrabold ${isActive ? "bg-mostaza text-tinta" : "text-crema"}`;

const bottomLink = ({ isActive }: { isActive: boolean }) =>
  `flex h-12 items-center justify-center text-[12.5px] font-extrabold ${isActive ? "text-accion" : "text-suave"}`;

export function LayoutCliente() {
  const { sesion } = useSesionCliente();
  if (!sesion) return <Navigate to={routes.entrada} replace />;

  return (
    <div className="min-h-screen">
      <header className="hidden bg-tinta lg:block">
        <div className="mx-auto flex max-w-[900px] items-center gap-6 px-9 py-3.5">
          <span className="font-titulo text-[24px] font-extrabold text-rosa">platita</span>
          <nav aria-label="Principal" className="flex gap-2">
            {items.map((item) => (
              <NavLink key={item.to} to={item.to} className={topLink}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-[900px] px-5 pb-28 pt-[22px] lg:px-9 lg:pb-10 lg:pt-8">
        <span className="mb-4 block font-titulo text-[22px] font-extrabold text-accion lg:hidden">platita</span>
        <main>
          <Outlet />
        </main>
      </div>

      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-10 grid h-[58px] grid-cols-3 rounded-t-[24px] bg-tarjeta lg:hidden"
      >
        {items.map((item) => (
          <NavLink key={item.to} to={item.to} className={bottomLink}>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
