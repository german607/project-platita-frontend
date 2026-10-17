import { Link } from "react-router-dom";
import { routes } from "../lib/routes";

// Primera pantalla: elegir si se entra como cliente o como comercio. Las dos
// áreas son la misma web y comparten la API. Todavía no hay login: el comercio
// entra con el comercio configurado (VITE_MERCHANT_ID) y el cliente con un
// ingreso simulado (ver docs/STATE.md). Diseño: design/platita-cliente.codigo.html.

const opcion =
  "flex min-h-[76px] w-full items-center justify-center rounded-boton px-6 text-center font-titulo text-[22px] font-extrabold";

export function Entrada() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-10 px-5 py-10">
      <div className="text-center">
        <h1 className="font-titulo text-[44px] font-extrabold leading-none text-accion">platita</h1>
        <p className="mt-3 text-suave">Saldo y promos en los comercios de tu barrio.</p>
      </div>

      <div className="flex w-full flex-col gap-4">
        <h2 className="text-center font-titulo text-2xl font-extrabold">¿Cómo querés entrar?</h2>
        <Link to={routes.cliente.ingreso} className={`${opcion} bg-accion text-tarjeta shadow-accion`}>
          Soy cliente
        </Link>
        <Link to={routes.comercio.mostrador} className={`${opcion} bg-mostaza text-tinta shadow-mostaza`}>
          Soy un comercio
        </Link>
      </div>
    </main>
  );
}
