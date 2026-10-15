import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../lib/api/client";
import { listCustomers } from "../lib/api/endpoints";
import type { CustomerWithBalance } from "../lib/api/types";
import { Clientes } from "./Clientes";

vi.mock("../config", () => ({ config: { apiUrl: "/api", merchantId: "m1" } }));
vi.mock("../lib/api/endpoints", () => ({ listCustomers: vi.fn() }));

const mockList = vi.mocked(listCustomers);

const customer = (id: string, name: string | null, phone: string, balance: number): CustomerWithBalance => ({
  id,
  merchantId: "m1",
  phone,
  name,
  createdAt: "2026-09-01T10:00:00.000Z",
  lastVisitAt: null,
  balance,
});

const marta = customer("c1", "Marta Rodríguez", "+59899123456", 120000);
const sofia = customer("c2", "Sofía Techera", "+59898777301", 345000);

const page = (data: CustomerWithBalance[], nextCursor: string | null = null) => ({ data, nextCursor });

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/comercio/clientes"]}>
        <Routes>
          <Route path="/comercio/clientes" element={<Clientes />} />
          <Route path="/comercio/clientes/:customerId" element={<p>FICHA</p>} />
          <Route path="/comercio" element={<p>MOSTRADOR</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => vi.resetAllMocks());

describe("Clientes", () => {
  it("muestra mientras busca", () => {
    mockList.mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByText("Buscando…")).toBeInTheDocument();
  });

  it("lista los clientes con su saldo y enlaza a la ficha", async () => {
    mockList.mockResolvedValue(page([marta, sofia]));
    renderPage();

    expect(await screen.findByText("$1.200")).toBeInTheDocument();
    expect(screen.getByText("$3.450")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Marta Rodríguez/ })).toHaveAttribute("href", "/comercio/clientes/c1");
    expect(screen.getByRole("link", { name: /Sofía Techera/ })).toHaveAttribute("href", "/comercio/clientes/c2");
    expect(screen.getAllByText("099 123 456").length).toBeGreaterThan(0);
    expect(mockList).toHaveBeenCalledWith("m1", { search: undefined, limit: 20, cursor: undefined });
  });

  it("muestra 'Sin nombre' si el cliente no tiene nombre", async () => {
    mockList.mockResolvedValue(page([customer("c3", null, "+59894551220", 0)]));
    renderPage();

    expect(await screen.findByText("Sin nombre")).toBeInTheDocument();
    expect(screen.getByText("$0")).toBeInTheDocument();
  });

  it("si no hay clientes, lo explica y lleva al mostrador", async () => {
    mockList.mockResolvedValue(page([]));
    renderPage();

    expect(await screen.findByText("Todavía no hay clientes")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir al mostrador" })).toHaveAttribute("href", "/comercio");
  });

  it("manda lo que se escribe tal cual (el backend entiende los teléfonos), esperando a que termine", async () => {
    mockList.mockResolvedValue(page([marta]));
    renderPage();
    await screen.findByText("$1.200");

    mockList.mockResolvedValue(page([]));
    fireEvent.change(screen.getByLabelText("Buscar por nombre o teléfono"), { target: { value: "099 123" } });

    await waitFor(
      () => expect(mockList).toHaveBeenLastCalledWith("m1", { search: "099 123", limit: 20, cursor: undefined }),
      { timeout: 2000 },
    );
    expect(await screen.findByText("No encontramos a nadie con eso")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Ir al mostrador" })).not.toBeInTheDocument();
  });

  it("busca por nombre tal cual", async () => {
    mockList.mockResolvedValue(page([marta]));
    renderPage();
    await screen.findByText("$1.200");

    fireEvent.change(screen.getByLabelText("Buscar por nombre o teléfono"), { target: { value: "Marta" } });

    await waitFor(
      () => expect(mockList).toHaveBeenLastCalledWith("m1", { search: "Marta", limit: 20, cursor: undefined }),
      { timeout: 2000 },
    );
  });

  it("pagina: 'Ver más clientes' trae la página siguiente y se va cuando no hay más", async () => {
    mockList.mockResolvedValueOnce(page([marta], "c1")).mockResolvedValueOnce(page([sofia], null));
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Ver más clientes" }));

    expect(await screen.findByText("$3.450")).toBeInTheDocument();
    expect(mockList).toHaveBeenLastCalledWith("m1", { search: undefined, limit: 20, cursor: "c1" });
    expect(screen.getByText("$1.200")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ver más clientes" })).not.toBeInTheDocument();
  });

  it("muestra un error en lenguaje de mostrador y deja reintentar", async () => {
    mockList.mockRejectedValueOnce(new ApiError(0, "NETWORK_ERROR", "No se pudo conectar con el servidor"));
    renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent("No hay conexión con el servidor");

    mockList.mockResolvedValue(page([marta]));
    fireEvent.click(screen.getByRole("button", { name: "Probar de nuevo" }));
    expect(await screen.findByText("$1.200")).toBeInTheDocument();
  });
});
