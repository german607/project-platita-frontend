import { useQuery } from "@tanstack/react-query";
import { Link, NavLink, Navigate, Outlet } from "react-router-dom";
import { getMerchant } from "../lib/api/endpoints";
import { routes } from "../lib/routes";
import { useSesion } from "../lib/sesion";
import { Marca } from "./Logo";

// Navegación como en design/: menú oscuro lateral de 200px en pantallas
// grandes, y menú inferior en el celular (donde se usa en el mostrador).
const items = [
  { to: routes.comercio.mostrador, label: "Mostrador", end: true },
  { to: routes.comercio.clientes, label: "Clientes", end: false },
  { to: routes.comercio.promos, label: "Promos", end: false },
  { to: routes.comercio.reactivar, label: "Reactivar", end: false },
];

// Se usa poco (al principio y para algún cambio eventual), así que va aparte y
// al final, lejos de lo que se toca todos los días.
const perfil = { to: routes.comercio.miComercio, label: "Mi comercio", end: false };

const sideLink = ({ isActive }: { isActive: boolean }) =>
  [
    "flex h-12 items-center rounded-[14px] px-3 text-base font-extrabold",
    isActive ? "bg-mostaza text-tinta" : "text-crema",
  ].join(" ");

const sideLinkAparte = ({ isActive }: { isActive: boolean }) =>
  [
    "flex h-11 items-center rounded-[14px] px-3 text-sm font-bold",
    isActive ? "bg-mostaza text-tinta" : "text-arena",
  ].join(" ");

const bottomLinkAparte = ({ isActive }: { isActive: boolean }) =>
  [
    "flex h-12 items-center justify-center px-3 text-[11px] font-bold",
    isActive ? "text-accion" : "text-suave/80",
  ].join(" ");

const bottomLink = ({ isActive }: { isActive: boolean }) =>
  [
    "flex h-12 items-center justify-center text-[11.5px] font-extrabold",
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
  const { sesion } = useSesion();
  const merchantId = sesion?.comercioId;
  // Sin sesión o sin un comercio elegido no hay nada que mostrar: la pantalla de
  // inicio decide a dónde llevar a la persona.
  if (!merchantId) return <Navigate to={routes.entrada} replace />;

  return (
    <div className="min-h-screen">
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-[200px] lg:flex-col lg:gap-1.5 lg:bg-tinta lg:px-3.5 lg:py-[22px]">
        <p className="px-2.5 pb-[18px] font-titulo text-[26px] font-extrabold text-rosa">
          <Marca />
        </p>
        <nav className="flex flex-col gap-1.5" aria-label="Principal">
          {items.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={sideLink}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <nav className="mt-auto border-t border-suave/40 pt-3" aria-label="Configuración">
          <NavLink to={perfil.to} end={perfil.end} className={sideLinkAparte}>
            {perfil.label}
          </NavLink>
        </nav>
      </aside>

      <div className="mx-auto max-w-[900px] px-5 pb-28 pt-[22px] lg:ml-[200px] lg:px-9 lg:pb-8 lg:pt-7">
        <header className="mb-5 flex items-center justify-between">
          <span className="font-titulo text-[22px] font-extrabold text-accion lg:hidden">
            <Marca />
          </span>
          <span className="flex items-center gap-3 lg:ml-auto">
            <MerchantChip merchantId={merchantId} />
            <Link to={routes.elegir} className="text-sm font-extrabold text-suave underline">
              Cambiar de cuenta
            </Link>
          </span>
        </header>

        <main>
          <Outlet />
        </main>
      </div>

      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-10 flex h-[58px] items-center rounded-t-[24px] bg-tarjeta lg:hidden"
      >
        <div className="grid flex-1 grid-cols-4">
          {items.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={bottomLink}>
              {item.label}
            </NavLink>
          ))}
        </div>
        <span aria-hidden="true" className="h-6 w-px bg-borde" />
        <NavLink to={perfil.to} end={perfil.end} className={bottomLinkAparte}>
          {perfil.label}
        </NavLink>
      </nav>
    </div>
  );
}
