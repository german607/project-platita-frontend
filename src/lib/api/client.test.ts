import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, api } from "./client";
import { friendlyMessage } from "./errors";

function mockFetch(status: number, body?: unknown) {
  // Una Response nueva por llamada: una ya leída no se puede volver a leer.
  const fetchMock = vi
    .fn()
    .mockImplementation(async () => new Response(body === undefined ? null : JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => vi.unstubAllGlobals());

describe("api", () => {
  it("devuelve el JSON de una respuesta correcta", async () => {
    mockFetch(200, { balance: 120000 });
    await expect(api("/customers/c1/balance")).resolves.toEqual({ balance: 120000 });
  });

  it("arma la query sin parámetros vacíos", async () => {
    const fetchMock = mockFetch(200, { data: [], nextCursor: null });
    await api("/merchants/m1/customers", { query: { search: "juan", limit: 20, cursor: undefined, x: "" } });
    expect(fetchMock.mock.calls[0][0]).toBe("/api/merchants/m1/customers?search=juan&limit=20");
  });

  it("manda content-type JSON solo cuando hay body", async () => {
    const fetchMock = mockFetch(200, {});
    await api("/health");
    expect(fetchMock.mock.calls[0][1].headers).toBeUndefined();
    await api("/customers/c1/charges", { method: "POST", body: { amount: 400 } });
    expect(fetchMock.mock.calls[1][1].headers).toEqual({ "content-type": "application/json" });
  });

  it("manda los encabezados propios, como Idempotency-Key", async () => {
    const fetchMock = mockFetch(201, {});
    await api("/customers/c1/charges", {
      method: "POST",
      body: { amount: 400 },
      headers: { "Idempotency-Key": "k1" },
    });
    expect(fetchMock.mock.calls[0][1].headers).toEqual({ "content-type": "application/json", "Idempotency-Key": "k1" });
  });

  it("convierte el error del backend en ApiError con su code y details", async () => {
    mockFetch(422, {
      error: "Saldo insuficiente",
      code: "INSUFFICIENT_BALANCE",
      details: { balance: 0, needed: 40000 },
    });
    const error = await api("/customers/c1/charges", { method: "POST", body: { amount: 400 } }).catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 422, code: "INSUFFICIENT_BALANCE", details: { balance: 0, needed: 40000 } });
  });

  it("distingue la falta de conexión", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    // Una escritura no se repite sin respuesta (podría duplicarse): falla de una.
    const error = await api("/customers/c1/charges", { method: "POST", body: { amount: 400 } }).catch((e) => e);
    expect(error).toMatchObject({ status: 0, code: "NETWORK_ERROR" });
  });
});

describe("friendlyMessage", () => {
  it("traduce los códigos conocidos y no muestra textos técnicos", () => {
    expect(friendlyMessage(new ApiError(422, "INSUFFICIENT_BALANCE", "Saldo insuficiente"))).toBe(
      "El cliente no tiene saldo suficiente.",
    );
    expect(friendlyMessage(new ApiError(500, "INTERNAL_ERROR", "stack…"))).toBe("Algo salió mal. Probá de nuevo.");
    expect(friendlyMessage(new ApiError(422, "IDEMPOTENCY_KEY_REUSED", "x"))).toContain("Revisá el saldo");
    expect(friendlyMessage(new Error("boom"))).toBe("Algo salió mal. Probá de nuevo.");
  });
});
