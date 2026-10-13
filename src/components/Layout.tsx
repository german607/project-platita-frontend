import { useQuery } from "@tanstack/react-query";
import { NavLink, Outlet } from "react-router-dom";
import { config } from "../config";
import { getMerchant } from "../lib/api/endpoints";
import { EmptyState } from "./states";

// Navegación como en design/: menú oscuro lateral de 200px en pantallas
// grandes, y menú inferior en el celular (donde se usa en el mostrador).
const items = [
  { to: "/", label: "Mostrador", end: true },
  { to: "/clientes", label: "Clientes", end: false },
  { to: "/promos", label: "Promos", end: false },
  { to: "/reactivar", label: "Reactivar", end: false },
];

const sideLink = ({ isActive }: { isActive: boolean }) =>
  [
    "flex h-12 items-center rounded-[14px] px-3 text-base font-extrabold",
    isActive ? "bg-mostaza text-tinta" : "text-crema",
  ].join(" ");

const bottomLink = ({ isActive }: { isActive: boolean }) =>
  [
    "flex h-12 items-center justify-center text-[13px] font-extrabold",
    isActive ? "text-accion" : "text-suave",
  ].join(" ");

// Etiqueta con el nombre del comercio. Si no se puede traer, no se muestra:
// no vale la pena frenar el mostrador por un adorno.
function MerchantChip({ merchantId }: { merchantId: string }) {
  const { data } = useQuery({ queryKey: ["merchant", merchantId], queryFn: () => getMerchant(merchantId) });
  if (!data) return null;
  return <span className="rounded-full bg-mostaza px-3.5 py-1.5 text-sm font-extrabold">{data.name}</span>;
}

export function Layout() {
  const merchantId = config.merchantId;

  return (
    <div className="min-h-screen">
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-[200px] lg:flex-col lg:gap-1.5 lg:bg-tinta lg:px-3.5 lg:py-[22px]">
        <p className="px-2.5 pb-[18px] font-titulo text-[26px] font-extrabold text-rosa">platita</p>
        <nav className="flex flex-col gap-1.5" aria-label="Principal">
          {items.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={sideLink}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="mx-auto max-w-[900px] px-5 pb-28 pt-[22px] lg:ml-[200px] lg:px-9 lg:pb-8 lg:pt-7">
        <header className="mb-5 flex items-center justify-between">
          <span className="font-titulo text-[22px] font-extrabold text-accion lg:hidden">platita</span>
          {merchantId && (
            <span className="lg:ml-auto">
              <MerchantChip merchantId={merchantId} />
            </span>
          )}
        </header>

        <main>
          {merchantId ? (
            <Outlet />
          ) : (
            <EmptyState
              title="Falta elegir el comercio"
              hint="Mientras no haya login, el comercio se configura en la variable VITE_MERCHANT_ID (ver docs/FRONTEND.md)."
            />
          )}
        </main>
      </div>

      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-10 grid h-[58px] grid-cols-4 rounded-t-[24px] bg-tarjeta lg:hidden"
      >
        {items.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={bottomLink}>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
