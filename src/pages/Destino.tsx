import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ErrorState, LoadingState } from "../components/states";
import { getMe } from "../lib/api/endpoints";
import { decidirDestino } from "../lib/destino";
import { routes } from "../lib/routes";
import { cuentaRecordada, recordarCuenta, useSesion } from "../lib/sesion";

// Con la sesión abierta, decide a qué área lleva la entrada: solo cliente → el
// área del cliente; un comercio → directo; varios → preguntar a cuál. Recuerda lo
// último que se eligió. Los comercios salen de GET /me.
export function Destino() {
  const { sesion, elegirComercio, salir } = useSesion();
  const navigate = useNavigate();
  const me = useQuery({ queryKey: ["me", sesion?.userId], queryFn: getMe, enabled: !!sesion });

  const destino = me.data ? decidirDestino(me.data.merchants, cuentaRecordada(me.data.user.id)) : null;

  useEffect(() => {
    if (!destino || !me.data) return;
    if (destino.tipo === "comercio") {
      elegirComercio(destino.comercioId);
      recordarCuenta(me.data.user.id, { comercioId: destino.comercioId });
      navigate(routes.comercio.mostrador, { replace: true });
    } else if (destino.tipo === "cliente") {
      elegirComercio(null);
      navigate(routes.cliente.lugares, { replace: true });
    }
  }, [destino?.tipo, destino && "comercioId" in destino ? destino.comercioId : null]); // eslint-disable-line react-hooks/exhaustive-deps

  if (me.isPending) return <LoadingState label="Entrando…" />;
  if (me.isError) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-4 px-5 py-10">
        <ErrorState error={me.error} onRetry={() => me.refetch()} />
        <button type="button" onClick={salir} className="font-extrabold text-suave underline">
          Salir
        </button>
      </div>
    );
  }
  if (destino?.tipo === "elegir") return <Navigate to={routes.elegir} replace />;
  return <LoadingState label="Entrando…" />;
}
