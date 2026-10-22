import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { api } from "./api/client";
import { SesionProvider, useSesion } from "./sesion";

// El token sale del almacenamiento: `api` lo manda solo en los pedidos con `auth`.
describe("sesión del cliente y la API", () => {
  beforeEach(() => {
    localStorage.clear();
    void SesionProvider; // importa el módulo, que conecta la sesión con `api`
  });

  const guardarSesion = (expiresAt: string) =>
    localStorage.setItem(
      "platita.sesion",
      JSON.stringify({ token: "tok123", expiresAt, userId: "u1", phone: "+59899123456", name: null }),
    );

  const headersDelPedido = async (auth: boolean) => {
    let headers: Record<string, string> = {};
    globalThis.fetch = (async (_url: string, init?: RequestInit) => {
      headers = (init?.headers ?? {}) as Record<string, string>;
      return new Response("{}", { status: 200 });
    }) as typeof fetch;
    await api("/x", { auth });
    return headers;
  };

  it("manda el token solo cuando el pedido es de la sesión", async () => {
    guardarSesion(new Date(Date.now() + 86_400_000).toISOString());
    expect((await headersDelPedido(true)).authorization).toBe("Bearer tok123");
    expect((await headersDelPedido(false)).authorization).toBeUndefined();
  });

  it("una sesión vencida no manda nada", async () => {
    guardarSesion(new Date(Date.now() - 1000).toISOString());
    expect((await headersDelPedido(true)).authorization).toBeUndefined();
  });

  it("ante un 401 INVALID_SESSION cierra la sesión (y un 401 de otro tipo, no)", async () => {
    guardarSesion(new Date(Date.now() + 86_400_000).toISOString());
    const responder = (code: string) => {
      globalThis.fetch = (async () =>
        new Response(JSON.stringify({ error: "x", code }), { status: 401 })) as typeof fetch;
    };
    function Estado() {
      const { sesion } = useSesion();
      return <p>{sesion ? "con sesión" : "sin sesión"}</p>;
    }
    render(
      <SesionProvider>
        <Estado />
      </SesionProvider>,
    );

    responder("OTRO");
    await api("/me", { auth: true }).catch(() => {});
    expect(screen.getByText("con sesión")).toBeInTheDocument();

    responder("INVALID_SESSION");
    await api("/me", { auth: true }).catch(() => {});
    await waitFor(() => expect(screen.getByText("sin sesión")).toBeInTheDocument());
    expect(localStorage.getItem("platita.sesion")).toBeNull();
  });
});
