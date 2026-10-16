import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

// Sesión del CLIENTE, SIMULADA: todavía no hay ingreso real en el backend
// (pedido en TODO.md §4). Se guarda en el navegador y solo sirve para armar y
// probar las pantallas. ⚠ Antes de publicar hay que reemplazarla por la
// verificación real del teléfono (P0 en TODO.md).

export const SIMULATED_CODE = "000000"; // el único código válido mientras sea simulado
export const CODE_LENGTH = 6;
export const CODE_TTL_MS = 5 * 60 * 1000; // el código vence a los 5 minutos
export const RESEND_SECONDS = 45;

export type CodeCheck = "ok" | "incorrecto" | "vencido";

// Pura, para probarla sin pantalla. El vencimiento manda sobre el valor.
export function checkCode(code: string, sentAt: number, now: number = Date.now()): CodeCheck {
  if (now - sentAt > CODE_TTL_MS) return "vencido";
  return code === SIMULATED_CODE ? "ok" : "incorrecto";
}

export interface SesionCliente {
  userId: string; // el id del usuario en el backend: lo único que hace de "sesión"
  phone: string; // +598XXXXXXXX, ya verificado
  name: string | null;
}

const STORAGE_KEY = "platita.cliente";

function leer(): SesionCliente | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<SesionCliente>;
    if (typeof data.phone !== "string" || typeof data.userId !== "string") return null;
    return { userId: data.userId, phone: data.phone, name: typeof data.name === "string" ? data.name : null };
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

interface Contexto {
  sesion: SesionCliente | null;
  entrar: (user: { id: string; phone: string; name: string | null }) => void;
  salir: () => void;
  cambiarNombre: (name: string | null) => void;
}

const SesionContext = createContext<Contexto | null>(null);

export function SesionClienteProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<SesionCliente | null>(leer);

  const poner = useCallback((next: SesionCliente | null) => {
    guardar(next);
    setSesion(next);
  }, []);

  const value = useMemo<Contexto>(
    () => ({
      sesion,
      entrar: (user) => poner({ userId: user.id, phone: user.phone, name: user.name }),
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
