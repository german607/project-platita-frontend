import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../lib/api/client";
import { listCustomers, upsertCustomer } from "../lib/api/endpoints";
import type { CustomerWithBalance } from "../lib/api/types";
import { Mostrador } from "./Mostrador";

vi.mock("../config", () => ({ config: { apiUrl: "/api", merchantId: "m1" } }));
vi.mock("../lib/api/endpoints", () => ({ listCustomers: vi.fn(), upsertCustomer: vi.fn() }));

const mockList = vi.mocked(listCustomers);
const mockUpsert = vi.mocked(upsertCustomer);

const marta: CustomerWithBalance = {
  id: "c1",
  merchantId: "m1",
  phone: "+59899123456",
  name: "Marta Rodríguez",
  createdAt: "2026-09-01T10:00:00.000Z",
  lastVisitAt: null,
  balance: 120000,
};

const page = (data: CustomerWithBalance[]) => ({ data, nextCursor: null });

function renderMostrador() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <Mostrador />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const typePhone = (value: string) =>
  fireEvent.change(screen.getByLabelText("Teléfono del cliente"), { target: { value } });

beforeEach(() => vi.resetAllMocks());

describe("Mostrador", () => {
  it("al empezar pide el teléfono y no consulta nada", () => {
    renderMostrador();
    expect(screen.getByText("Escribí el teléfono del cliente para empezar.")).toBeInTheDocument();
    expect(mockList).not.toHaveBeenCalled();
  });

  it("no consulta mientras el número está incompleto o no es uruguayo", () => {
    renderMostrador();
    typePhone("099 12");
    expect(screen.getByText("Seguí escribiendo…")).toBeInTheDocument();
    typePhone("1234567890");
    expect(screen.getByText("Ese número no parece uruguayo. Revisalo.")).toBeInTheDocument();
    expect(mockList).not.toHaveBeenCalled();
  });

  it("muestra el saldo y los botones de un cliente existente", async () => {
    mockList.mockResolvedValue(page([marta]));
    renderMostrador();
    typePhone("099 123 456");

    expect(await screen.findByText("Marta Rodríguez")).toBeInTheDocument();
    expect(screen.getByText("$1.200")).toBeInTheDocument();
    expect(screen.getByText("Todavía no vino")).toBeInTheDocument();
    expect(mockList).toHaveBeenCalledWith("m1", { phone: "+59899123456", limit: 1 });
    expect(screen.getByRole("link", { name: "Cobrar" })).toHaveAttribute("href", "/cobrar/c1");
    expect(screen.getByRole("link", { name: "Cargar saldo" })).toHaveAttribute("href", "/cargar/c1");
  });

  it("si el backend ignorara el filtro y devolviera a otra persona, no se la muestra", async () => {
    mockList.mockResolvedValue(page([{ ...marta, phone: "+59899123457", name: "Otra Persona" }]));
    renderMostrador();
    typePhone("099 123 456");

    expect(await screen.findByText("Este número es nuevo")).toBeInTheDocument();
    expect(screen.queryByText("Otra Persona")).not.toBeInTheDocument();
  });

  it("crea un cliente nuevo con el teléfono normalizado y su nombre", async () => {
    mockList.mockResolvedValue(page([]));
    mockUpsert.mockResolvedValue(marta);
    renderMostrador();
    typePhone("099 123 456");

    await screen.findByText("Este número es nuevo");
    fireEvent.change(screen.getByLabelText("Nombre (opcional)"), { target: { value: " Marta Rodríguez " } });
    fireEvent.click(screen.getByRole("button", { name: "Crear cliente" }));

    await waitFor(() =>
      expect(mockUpsert).toHaveBeenCalledWith("m1", { phone: "+59899123456", name: "Marta Rodríguez" }),
    );
    expect(await screen.findByText("$1.200")).toBeInTheDocument();
  });

  it("crea el cliente sin nombre si no se escribe ninguno", async () => {
    mockList.mockResolvedValue(page([]));
    mockUpsert.mockResolvedValue({ ...marta, name: null, balance: 0 });
    renderMostrador();
    typePhone("099123456");

    await screen.findByText("Este número es nuevo");
    fireEvent.click(screen.getByRole("button", { name: "Crear cliente" }));

    await waitFor(() => expect(mockUpsert).toHaveBeenCalledWith("m1", { phone: "+59899123456", name: undefined }));
    expect(await screen.findByText("Cliente sin nombre")).toBeInTheDocument();
  });

  it("muestra un error en lenguaje de mostrador si falla la búsqueda", async () => {
    mockList.mockRejectedValue(new ApiError(0, "NETWORK_ERROR", "No se pudo conectar con el servidor"));
    renderMostrador();
    typePhone("099123456");

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("No hay conexión con el servidor");
    expect(screen.getByRole("button", { name: "Probar de nuevo" })).toBeInTheDocument();
  });
});
