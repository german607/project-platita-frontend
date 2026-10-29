import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AvisoServidor } from "../../components/AvisoServidor";
import { ESPERA_REINTENTO_MS, TIMEOUT_MS, api } from "./client";

// El backend gratis duerme: el primer pedido tarda o falla con 503. Estos tests
// cubren el timeout, los reintentos y el aviso "Despertando el servidor…".

const respuesta503 = (retryAfter?: string) =>
  new Response(JSON.stringify({ error: "x", code: "DATABASE_UNAVAILABLE" }), {
    status: 503,
    headers: retryAfter ? { "retry-after": retryAfter } : undefined,
  });

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("api: servidor que despierta", () => {
  it("reintenta un GET sin respuesta y termina con NETWORK_ERROR", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    vi.stubGlobal("fetch", fetchMock);
    const result = api("/health").catch((e) => e);
    await vi.advanceTimersByTimeAsync(ESPERA_REINTENTO_MS * 2);
    expect(await result).toMatchObject({ status: 0, code: "NETWORK_ERROR" });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("no repite una escritura sin respuesta (podría duplicarse)", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    vi.stubGlobal("fetch", fetchMock);
    const error = await api("/customers/c1/charges", { method: "POST", body: { amount: 400 } }).catch((e) => e);
    expect(error).toMatchObject({ code: "NETWORK_ERROR" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("reintenta un 503 respetando Retry-After, también en un POST", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(respuesta503("3"))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const result = api("/auth/request-code", { method: "POST", body: { phone: "+59899000001" } });
    await vi.advanceTimersByTimeAsync(2_900);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(200);
    await expect(result).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("si el 503 sigue después de los reintentos, devuelve el error del backend", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockImplementation(async () => respuesta503());
    vi.stubGlobal("fetch", fetchMock);
    const result = api("/places").catch((e) => e);
    await vi.advanceTimersByTimeAsync(ESPERA_REINTENTO_MS * 2);
    expect(await result).toMatchObject({ status: 503, code: "DATABASE_UNAVAILABLE" });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("corta a los 60 s y lo informa como TIMEOUT", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(
        (_url: string, init: RequestInit) =>
          new Promise((_resolve, reject) => {
            init.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
          }),
      ),
    );
    const result = api("/customers/c1/charges", { method: "POST", body: { amount: 400 } }).catch((e) => e);
    await vi.advanceTimersByTimeAsync(TIMEOUT_MS);
    expect(await result).toMatchObject({ status: 0, code: "TIMEOUT" });
  });

  it("muestra «Despertando el servidor…» si el pedido tarda, y lo saca al responder", async () => {
    vi.useFakeTimers();
    let responder!: (r: Response) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(() => new Promise<Response>((r) => (responder = r))),
    );
    render(<AvisoServidor />);
    const result = api("/places");
    expect(screen.queryByRole("status")).toBeNull();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(4_100);
    });
    expect(screen.getByRole("status")).toHaveTextContent("Despertando el servidor");
    await act(async () => {
      responder(new Response("{}", { status: 200 }));
      await result;
    });
    expect(screen.queryByRole("status")).toBeNull();
  });
});
