import { useQuery } from "@tanstack/react-query";
import { listUserBalances } from "./api/endpoints";
import { useSesionCliente } from "./sesionCliente";

// Los saldos de la persona en cada comercio. Una sola consulta que comparten
// Mis saldos, las tarjetas de Lugares y el detalle de un lugar.
export function useSaldos() {
  const { sesion } = useSesionCliente();
  const userId = sesion?.userId ?? "";
  return useQuery({
    queryKey: ["balances", userId],
    queryFn: () => listUserBalances(userId),
    enabled: userId !== "",
    select: (res) => res.data,
  });
}
