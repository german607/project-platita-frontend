import { config } from "../../config";

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

  let res: Response;
  try {
    res = await fetch(buildUrl(path, query), {
      method,
      signal,
      headers: Object.keys(headers).length > 0 ? headers : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new ApiError(0, "NETWORK_ERROR", "No se pudo conectar con el servidor");
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
