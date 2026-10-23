import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { setAuthHandlers } from "./api/client";
import type { AuthSession } from "./api/types";

// Sesión de la PERSONA: la que devuelve el ingreso por código (POST /auth/verify-code).
// Una persona puede ser cliente y dueña de comercios: `comercioId` es el comercio
// con el que está trabajando ahora (null = está en el área del cliente).
// El token es opaco, dura 60 días y el backend lo renueva al usarlo; no hay
// refresh token. Se guarda en el navegador y es el ÚNICO lugar que sabe de la
// sesión: `lib/api/client.ts` pide el token acá y avisa si el backend dice que
// ya no vale (401 INVALID_SESSION).

export const CODE_LENGTH = 6;
// El mínimo entre pedidos de código es de 30 s (lo impone el backend).
export const RESEND_SECONDS = 30;

export interface Sesion {
  token: string;
  expiresAt: string;
  userId: string;
  phone: string; // +598XXXXXXXX, verificado
  name: string | null;
  comercioId: string | null; // el comercio activo; null = área del cliente
}

const STORAGE_KEY = "platita.sesion";

const isSesion = (data: Partial<Sesion>): data is Sesion =>
  typeof data.token === "string" &&
  typeof data.expiresAt === "string" &&
  typeof data.userId === "string" &&
  typeof data.phone === "string";

function leer(now: number = Date.now()): Sesion | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<Sesion>;
    if (!isSesion(data) || Date.parse(data.expiresAt) <= now) return null;
    return {
      ...data,
      name: typeof data.name === "string" ? data.name : null,
      comercioId: typeof data.comercioId === "string" ? data.comercioId : null,
    };
  } catch {
    return null;
  }
}

function guardar(sesion: Sesion | null) {
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
  sesion: Sesion | null;
  entrar: (auth: AuthSession) => void;
  /** Borra la sesión de este navegador (para cerrarla en el backend, ver pages/cliente/Salir). */
  salir: () => void;
  cambiarNombre: (name: string | null) => void;
  /** Con qué comercio se trabaja (null = área del cliente). */
  elegirComercio: (comercioId: string | null) => void;
}

const SesionContext = createContext<Contexto | null>(null);

export function SesionProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Sesion | null>(() => leer());

  const poner = useCallback((next: Sesion | null) => {
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
        poner({ token, expiresAt, userId: user.id, phone: user.phone, name: user.name, comercioId: null }),
      salir: () => poner(null),
      cambiarNombre: (name) => sesion && poner({ ...sesion, name }),
      elegirComercio: (comercioId) => sesion && poner({ ...sesion, comercioId }),
    }),
    [sesion, poner],
  );

  return <SesionContext.Provider value={value}>{children}</SesionContext.Provider>;
}

export function useSesion(): Contexto {
  const ctx = useContext(SesionContext);
  if (!ctx) throw new Error("useSesion va dentro de <SesionProvider>");
  return ctx;
}

// Lo último que eligió la persona (el área del cliente o un comercio), para
// entrar directo la próxima vez. Se guarda aparte de la sesión: sobrevive a cerrarla.
const ULTIMA_KEY = "platita.ultima";
export type Cuenta = "cliente" | { comercioId: string };

export function recordarCuenta(userId: string, cuenta: Cuenta) {
  try {
    localStorage.setItem(ULTIMA_KEY, JSON.stringify({ userId, cuenta }));
  } catch {
    // Sin almacenamiento: simplemente no se recuerda.
  }
}

export function cuentaRecordada(userId: string): Cuenta | null {
  try {
    const data = JSON.parse(localStorage.getItem(ULTIMA_KEY) ?? "null") as { userId?: string; cuenta?: unknown } | null;
    if (!data || data.userId !== userId) return null;
    if (data.cuenta === "cliente") return "cliente";
    const id = (data.cuenta as { comercioId?: unknown } | undefined)?.comercioId;
    return typeof id === "string" ? { comercioId: id } : null;
  } catch {
    return null;
  }
}
