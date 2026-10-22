import { useSesion } from "./sesion";

// El comercio con el que se trabaja: el que la persona eligió al entrar (ver
// pages/Destino.tsx). Layout no muestra ninguna pantalla del comercio si no hay
// uno, así que acá es seguro exigirlo.
export function useMerchantId(): string {
  const { sesion } = useSesion();
  if (!sesion?.comercioId) throw new Error("No hay un comercio elegido");
  return sesion.comercioId;
}
