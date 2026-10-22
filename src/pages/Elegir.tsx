import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ErrorState, LoadingState } from "../components/states";
import { Button } from "../components/Button";
import { createMerchant, getMe } from "../lib/api/endpoints";
import { friendlyMessage } from "../lib/api/errors";
import { routes } from "../lib/routes";
import { recordarCuenta, useSesion } from "../lib/sesion";

// A qué cuenta entrar: el área del cliente o uno de los comercios de la persona.
// También es donde se suma un comercio nuevo (POST /merchants: queda como dueña).

const boton =
  "flex min-h-[64px] w-full items-center justify-between gap-3 rounded-boton bg-tarjeta px-5 text-left font-titulo text-xl font-extrabold shadow-tarjeta";

export function Elegir() {
  const { sesion, elegirComercio } = useSesion();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [nombre, setNombre] = useState("");
  const me = useQuery({ queryKey: ["me", sesion?.userId], queryFn: getMe, enabled: !!sesion });

  const entrar = (userId: string, comercioId: string | null) => {
    recordarCuenta(userId, comercioId ? { comercioId } : "cliente");
    elegirComercio(comercioId);
    navigate(comercioId ? routes.comercio.mostrador : routes.cliente.lugares, { replace: true });
  };

  const crear = useMutation({
    mutationFn: (name: string) => createMerchant({ name }),
    onSuccess: async (merchant) => {
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      if (me.data) entrar(me.data.user.id, merchant.id);
    },
  });

  if (!sesion) return <Navigate to={routes.entrada} replace />;

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 px-5 py-10">
      <h1 className="font-titulo text-[32px] font-extrabold text-accion">platita</h1>
      <h2 className="font-titulo text-[26px] font-extrabold">¿A dónde querés entrar?</h2>

      {me.isPending ? (
        <LoadingState />
      ) : me.isError ? (
        <ErrorState error={me.error} onRetry={() => me.refetch()} />
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {me.data.merchants.map((m) => (
              <button key={m.id} type="button" onClick={() => entrar(me.data.user.id, m.id)} className={boton}>
                {m.name}
                <span className="text-sm font-bold text-suave">Comercio</span>
              </button>
            ))}
            <button type="button" onClick={() => entrar(me.data.user.id, null)} className={boton}>
              Como cliente
              <span className="text-sm font-bold text-suave">Lugares y saldos</span>
            </button>
          </div>

          <form
            className="flex flex-col gap-3 rounded-panel border border-borde p-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (nombre.trim()) crear.mutate(nombre.trim());
            }}
          >
            <p className="font-titulo text-xl font-extrabold">Sumar mi comercio</p>
            <label className="flex flex-col gap-2 font-extrabold">
              Nombre del comercio
              <input
                value={nombre}
                maxLength={80}
                onChange={(e) => {
                  setNombre(e.target.value);
                  crear.reset();
                }}
                className="h-12 w-full rounded-campo border-2 border-borde bg-tarjeta px-4 font-bold outline-none focus:border-accion"
              />
            </label>
            {crear.isError && (
              <p role="alert" className="font-extrabold text-accion">
                {friendlyMessage(crear.error)}
              </p>
            )}
            <Button type="submit" variant="mostaza" disabled={!nombre.trim() || crear.isPending}>
              {crear.isPending ? "Creando…" : "Crear comercio"}
            </Button>
          </form>
        </>
      )}

      <Link to={routes.salir} className="self-center font-extrabold text-suave underline">
        Cerrar sesión
      </Link>
    </main>
  );
}
