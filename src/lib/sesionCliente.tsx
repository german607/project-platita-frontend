import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { setAuthHandlers } from "./api/client";
import type { AuthSession } from "./api/types";

// Sesión del CLIENTE: la que devuelve el ingreso por código (POST /auth/verify-code).
// El token es opaco, dura 60 días y el backend lo renueva al usarlo; no hay
// refresh token. Se guarda en el navegador y es el ÚNICO lugar que sabe de la
// sesión: `lib/api/client.ts` pide el token acá y avisa si el backend dice que
// ya no vale (401 INVALID_SESSION).

export const CODE_LENGTH = 6;
// El mínimo entre pedidos de código es de 30 s (lo impone el backend).
export const RESEND_SECONDS = 30;

export interface SesionCliente {
  token: string;
  expiresAt: string;
  userId: string;
  phone: string; // +598XXXXXXXX, verificado
  name: string | null;
}

const STORAGE_KEY = "platita.cliente";

const isSesion = (data: Partial<SesionCliente>): data is SesionCliente =>
  typeof data.token === "string" &&
  typeof data.expiresAt === "string" &&
  typeof data.userId === "string" &&
  typeof data.phone === "string";

function leer(now: number = Date.now()): SesionCliente | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<SesionCliente>;
    if (!isSesion(data) || Date.parse(data.expiresAt) <= now) return null;
    return { ...data, name: typeof data.name === "string" ? data.name : null };
  } catch {
    return null;
  }
}

function guardar(sesion: SesionCliente | null) {
  try {
    if (sesion) localStorage.setItem(STORAGE_KEY, JSON.stringify(sesion));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Sin almacenamiento (ventana privada): la sesión dura mientras la pestaña esté abierta.
  }
}

// Lo que lee `api` antes de cada pedido. Va al almacenamiento y no al estado de
// React para que ande aunque la consulta salga antes de que se monte el proveedor.
setAuthHandlers({ getToken: () => leer()?.token ?? null, onInvalidSession: () => {} });

interface Contexto {
  sesion: SesionCliente | null;
  entrar: (auth: AuthSession) => void;
  /** Borra la sesión de este navegador (para cerrarla en el backend, ver pages/cliente/Salir). */
  salir: () => void;
  cambiarNombre: (name: string | null) => void;
}

const SesionContext = createContext<Contexto | null>(null);

export function SesionClienteProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<SesionCliente | null>(() => leer());

  const poner = useCallback((next: SesionCliente | null) => {
    guardar(next);
    setSesion(next);
  }, []);

  // Si el backend dice que la sesión ya no vale, se cierra acá y el guardia de
  // LayoutCliente manda al ingreso.
  useEffect(() => {
    setAuthHandlers({ getToken: () => leer()?.token ?? null, onInvalidSession: () => poner(null) });
  }, [poner]);

  const value = useMemo<Contexto>(
    () => ({
      sesion,
      entrar: ({ token, expiresAt, user }) =>
        poner({ token, expiresAt, userId: user.id, phone: user.phone, name: user.name }),
      salir: () => poner(null),
      cambiarNombre: (name) => sesion && poner({ ...sesion, name }),
    }),
    [sesion, poner],
  );

  return <SesionContext.Provider value={value}>{children}</SesionContext.Provider>;
}

export function useSesionCliente(): Contexto {
  const ctx = useContext(SesionContext);
  if (!ctx) throw new Error("useSesionCliente va dentro de <SesionClienteProvider>");
  return ctx;
}
