import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { newIdempotencyKey, useIdempotencyKey } from "./idempotency";

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

afterEach(() => vi.unstubAllGlobals());

describe("newIdempotencyKey", () => {
  it("genera un UUID v4 distinto cada vez", () => {
    const a = newIdempotencyKey();
    expect(a).toMatch(UUID_V4);
    expect(newIdempotencyKey()).not.toBe(a);
  });

  it("también funciona donde randomUUID no existe (http en la red local)", () => {
    vi.stubGlobal("crypto", { getRandomValues: (a: Uint8Array) => a.fill(7) });
    expect(newIdempotencyKey()).toMatch(UUID_V4);
  });

  it("y sin crypto, devuelve igual una clave no vacía", () => {
    vi.stubGlobal("crypto", undefined);
    expect(newIdempotencyKey().length).toBeGreaterThan(8);
  });
});

describe("useIdempotencyKey", () => {
  it("reusa la clave mientras la operación sea la misma (un reintento)", () => {
    const { result } = renderHook(() => useIdempotencyKey());
    const first = result.current.keyFor("cobrar 800");
    expect(result.current.keyFor("cobrar 800")).toBe(first);
  });

  it("si cambia la operación, es otra clave", () => {
    const { result } = renderHook(() => useIdempotencyKey());
    const first = result.current.keyFor("cobrar 800");
    expect(result.current.keyFor("cobrar 400")).not.toBe(first);
  });

  it("después de reset, la misma operación vuelve a tener clave nueva", () => {
    const { result } = renderHook(() => useIdempotencyKey());
    const first = result.current.keyFor("cobrar 800");
    result.current.reset();
    expect(result.current.keyFor("cobrar 800")).not.toBe(first);
  });
});
