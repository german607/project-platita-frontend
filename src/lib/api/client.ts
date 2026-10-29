import { config } from "../../config";
import { empezarEspera } from "./servidor";

// Error de la API con la forma que devuelve el backend: { error, code, details? }.
// La interfaz se apoya en `code` (INSUFFICIENT_BALANCE, NOT_FOUND…), no en el texto.
export class ApiError extends Error {
  constructor(
    public readonly status: number, // 0 = no hubo respuesta (sin conexión)
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// El backend gratis duerme y el primer pedido puede tardar ~50 s: se espera hasta un
// minuto y se reintenta lo que no pudo haber tenido efecto.
export const TIMEOUT_MS = 60_000;
export const REINTENTOS = 2;
export const ESPERA_REINTENTO_MS = 2_000;

type Query = Record<string, string | number | boolean | undefined>;

// La sesión se conecta acá (lib/sesion.tsx) para que `api`
// mande el token y reaccione a una sesión vencida sin conocer React.
interface AuthHandlers {
  getToken: () => string | null;
  onInvalidSession: () => void;
}
let authHandlers: AuthHandlers = { getToken: () => null, onInvalidSession: () => {} };
export function setAuthHandlers(handlers: AuthHandlers) {
  authHandlers = handlers;
}

interface RequestOptions {
  // true: manda `Authorization: Bearer <token>` de la sesión del cliente.
  auth?: boolean;
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Query;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: Query): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  const qs = params.toString();
  return `${config.apiUrl}${path}${qs ? `?${qs}` : ""}`;
}

// Un pedido con tope de tiempo. Sin respuesta lanza ApiError (status 0); un
// AbortError del llamador se deja pasar tal cual.
async function pedir(url: string, init: RequestInit, signal?: AbortSignal): Promise<Response> {
  const control = new AbortController();
  let vencio = false;
  const timer = setTimeout(() => {
    vencio = true;
    control.abort();
  }, TIMEOUT_MS);
  const cortar = () => control.abort();
  if (signal?.aborted) cortar();
  signal?.addEventListener("abort", cortar);
  try {
    return await fetch(url, { ...init, signal: control.signal });
  } catch (err) {
    if (vencio) throw new ApiError(0, "TIMEOUT", "El servidor tardó demasiado en responder");
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new ApiError(0, "NETWORK_ERROR", "No se pudo conectar con el servidor");
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", cortar);
  }
}

function esperar(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException("Aborted", "AbortError"));
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });
}

// Única puerta de entrada a la API. Todas las llamadas pasan por acá.
export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, query, headers: extraHeaders, signal, auth = false } = options;

  // El backend rechaza un content-type JSON sin cuerpo: solo se manda con body.
  const token = auth ? authHandlers.getToken() : null;
  const headers = {
    ...(body !== undefined ? { "content-type": "application/json" } : {}),
    ...(token ? { authorization: `Bearer ${token}` } : {}),
    ...extraHeaders,
  };

  const url = buildUrl(path, query);
  const init = {
    method,
    headers: Object.keys(headers).length > 0 ? headers : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  };

  let res!: Response;
  for (let intento = 0; ; intento++) {
    const terminar = empezarEspera();
    try {
      res = await pedir(url, init, signal);
    } catch (err) {
      // Sin respuesta: un GET se puede repetir; una escritura no (pudo haberse hecho).
      if (err instanceof ApiError && method === "GET" && intento < REINTENTOS) {
        terminar();
        await esperar(ESPERA_REINTENTO_MS, signal);
        continue;
      }
      throw err;
    } finally {
      terminar();
    }
    // 503: el servidor o la base todavía no están listos; no se procesó nada, es seguro repetir.
    if (res.status === 503 && intento < REINTENTOS) {
      const seg = Number(res.headers.get("retry-after"));
      await esperar(seg > 0 ? Math.min(seg, 10) * 1000 : ESPERA_REINTENTO_MS, signal);
      continue;
    }
    break;
  }

  const text = await res.text();
  let data: unknown;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = undefined;
    }
  }

  if (!res.ok) {
    const e = (data ?? {}) as { error?: string; code?: string; details?: unknown };
    // Sesión vencida, cerrada o desconocida: el front vuelve a pedir el código.
    if (auth && res.status === 401 && e.code === "INVALID_SESSION") authHandlers.onInvalidSession();
    throw new ApiError(res.status, e.code ?? `HTTP_${res.status}`, e.error ?? res.statusText, e.details);
  }
  return data as T;
}
