import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../lib/api/client";
import { listCustomers, listMerchantTransactions, upsertCustomer } from "../lib/api/endpoints";
import type { CustomerWithBalance, MerchantTransaction } from "../lib/api/types";
import { Mostrador } from "./Mostrador";

vi.mock("../lib/merchant", () => ({ useMerchantId: () => "m1" }));
vi.mock("../lib/api/endpoints", () => ({
  listCustomers: vi.fn(),
  upsertCustomer: vi.fn(),
  listMerchantTransactions: vi.fn(),
}));

const mockList = vi.mocked(listCustomers);
const mockUpsert = vi.mocked(upsertCustomer);
const mockToday = vi.mocked(listMerchantTransactions);

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

// jsdom no trae matchMedia: se agrega por test y se saca al terminar.
afterEach(() => {
  Reflect.deleteProperty(window, "matchMedia");
});

const fakeMatchMedia = (matches: boolean) =>
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: () => ({ matches, addEventListener: () => {}, removeEventListener: () => {} }),
  });

const todayRow: MerchantTransaction = {
  id: "t1",
  customerId: "c1",
  type: "TOPUP",
  amount: 100000,
  paidWith: "efectivo",
  note: null,
  bonusRuleId: null,
  createdAt: new Date(new Date().setHours(11, 40, 0, 0)).toISOString(),
  customer: { id: "c1", name: "Marta Rodríguez", phone: "+59899123456" },
};

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
    expect(screen.getByRole("link", { name: "Cobrar" })).toHaveAttribute("href", "/comercio/cobrar/c1");
    expect(screen.getByRole("link", { name: "Cargar saldo" })).toHaveAttribute("href", "/comercio/cargar/c1");
  });

  it("si el backend ignorara el filtro y devolviera a otra persona, no se la muestra", async () => {
    mockList.mockResolvedValue(page([{ ...marta, phone: "+59899123457", name: "Otra Persona" }]));
    renderMostrador();
    typePhone("099 123 456");

    expect(await screen.findByText("Este número es nuevo")).toBeInTheDocument();
    expect(screen.queryByText("Otra Persona")).not.toBeInTheDocument();
  });

  it("en el celular no pide ni muestra los movimientos de hoy", async () => {
    mockList.mockResolvedValue(page([marta]));
    renderMostrador();
    typePhone("099 123 456");
    await screen.findByText("$1.200");

    expect(mockToday).not.toHaveBeenCalled();
    expect(screen.queryByText("Hoy en el mostrador")).not.toBeInTheDocument();
  });

  it("en pantalla grande muestra el panel con los movimientos de hoy", async () => {
    fakeMatchMedia(true);
    mockToday.mockResolvedValue({ data: [todayRow], nextCursor: null });
    renderMostrador();

    expect(await screen.findByText("Hoy en el mostrador")).toBeInTheDocument();
    expect(await screen.findByText("11:40 · Carga")).toBeInTheDocument();
    expect(screen.getByText("+$1.000")).toBeInTheDocument();
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
