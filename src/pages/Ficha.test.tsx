import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../lib/api/client";
import { getCustomer, listBonusRules, listTransactions } from "../lib/api/endpoints";
import type { BonusRule, CustomerWithBalance, Transaction } from "../lib/api/types";
import { Ficha } from "./Ficha";

vi.mock("../config", () => ({ config: { apiUrl: "/api", merchantId: "m1" } }));
vi.mock("../lib/api/endpoints", () => ({ getCustomer: vi.fn(), listTransactions: vi.fn(), listBonusRules: vi.fn() }));

const mockCustomer = vi.mocked(getCustomer);
const mockTransactions = vi.mocked(listTransactions);
const mockRules = vi.mocked(listBonusRules);

const promo = (name: string | null): BonusRule => ({
  id: "r1",
  merchantId: "m1",
  name,
  description: null,
  minTopUp: 100000,
  bonusAmount: 20000,
  active: true,
  timesUsed: 1,
});

// Vino hace 12 días (al mediodía, para que el cambio de hora no mueva el día).
const twelveDaysAgo = new Date();
twelveDaysAgo.setDate(twelveDaysAgo.getDate() - 12);
twelveDaysAgo.setHours(12, 0, 0, 0);

const marta: CustomerWithBalance = {
  id: "c1",
  merchantId: "m1",
  phone: "+59899123456",
  name: "Marta Rodríguez",
  createdAt: "2026-09-01T10:00:00.000Z",
  lastVisitAt: twelveDaysAgo.toISOString(),
  balance: 120000,
};

const tx = (id: string, type: Transaction["type"], amount: number, extra: Partial<Transaction> = {}): Transaction => ({
  id,
  customerId: "c1",
  type,
  amount,
  paidWith: null,
  note: null,
  bonusRuleId: null,
  createdAt: new Date().toISOString(),
  ...extra,
});

const movements = [
  tx("t4", "TOPUP", 100000, { paidWith: "efectivo" }),
  tx("t3", "BONUS", 20000),
  tx("t2", "CHARGE", -80000, { note: "Corte" }),
  tx("t1", "ADJUSTMENT", 5000, { note: "Error de la semana" }),
];

const page = (data: Transaction[], nextCursor: string | null = null) => ({ data, nextCursor });

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/comercio/clientes/c1"]}>
        <Routes>
          <Route path="/comercio/clientes/:customerId" element={<Ficha />} />
          <Route path="/comercio/clientes" element={<p>CLIENTES</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  mockCustomer.mockResolvedValue(marta);
  mockTransactions.mockResolvedValue(page(movements));
  mockRules.mockResolvedValue({ data: [] });
});

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

describe("Ficha del cliente", () => {
  it("muestra nombre, teléfono, última visita y saldo", async () => {
    renderPage();

    expect(await screen.findByRole("heading", { name: "Marta Rodríguez" })).toBeInTheDocument();
    expect(screen.getByText("099 123 456 · vino hace 12 días")).toBeInTheDocument();
    expect(screen.getByText("$1.200")).toBeInTheDocument();
  });

  it("tiene los accesos a cobrar, cargar, ajustar y volver", async () => {
    renderPage();
    await screen.findByRole("heading", { name: "Marta Rodríguez" });

    expect(screen.getByRole("link", { name: "Cobrar" })).toHaveAttribute("href", "/comercio/cobrar/c1");
    expect(screen.getByRole("link", { name: /Cargar/ })).toHaveAttribute("href", "/comercio/cargar/c1");
    expect(screen.getByRole("link", { name: "Corregir con un ajuste" })).toHaveAttribute("href", "/comercio/ajustar/c1");
    expect(screen.getByRole("link", { name: "← Clientes" })).toHaveAttribute("href", "/comercio/clientes");
  });

  it("lista los movimientos con tipo, detalle y monto con signo", async () => {
    renderPage();

    expect(await screen.findByText("+$1.000")).toBeInTheDocument();
    expect(screen.getByText("Efectivo")).toBeInTheDocument();
    expect(screen.getByText("+$200")).toBeInTheDocument();
    expect(screen.getByText("-$800")).toBeInTheDocument();
    expect(screen.getByText("Corte")).toBeInTheDocument();
    expect(screen.getByText("+$50")).toBeInTheDocument();
    expect(screen.getByText("Error de la semana")).toBeInTheDocument();
    expect(mockTransactions).toHaveBeenCalledWith("c1", { type: undefined, limit: 8, cursor: undefined });
  });

  it("un bono dice de qué promo salió, por nombre", async () => {
    mockRules.mockResolvedValue({ data: [promo("Promo de verano")] });
    mockTransactions.mockResolvedValue(page([tx("t3", "BONUS", 20000, { bonusRuleId: "r1" })]));
    renderPage();

    expect(await screen.findByText("Promo de verano")).toBeInTheDocument();
    expect(screen.getByText("+$200")).toBeInTheDocument();
  });

  it("si la promo no tiene nombre, la describe por su mínimo", async () => {
    mockRules.mockResolvedValue({ data: [promo(null)] });
    mockTransactions.mockResolvedValue(page([tx("t3", "BONUS", 20000, { bonusRuleId: "r1" })]));
    renderPage();

    expect(await screen.findByText("Promo $1.000+")).toBeInTheDocument();
  });

  it("un bono viejo, sin promo guardada, se ve igual, solo como Bono", async () => {
    mockRules.mockResolvedValue({ data: [promo("Promo de verano")] });
    mockTransactions.mockResolvedValue(page([tx("t3", "BONUS", 20000)]));
    renderPage();

    expect(await screen.findByText("+$200")).toBeInTheDocument();
    expect(screen.getByText("Bono")).toBeInTheDocument();
    expect(screen.queryByText("Promo de verano")).not.toBeInTheDocument();
  });

  it("si las promos no cargan, los bonos se ven igual", async () => {
    mockRules.mockRejectedValue(new ApiError(500, "INTERNAL_ERROR", "Error interno"));
    mockTransactions.mockResolvedValue(page([tx("t3", "BONUS", 20000, { bonusRuleId: "r1" })]));
    renderPage();

    expect(await screen.findByText("+$200")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("en el celular trae de a 8 movimientos y en pantalla grande de a 15", async () => {
    renderPage();
    await screen.findByText("+$1.000");
    expect(mockTransactions).toHaveBeenLastCalledWith("c1", { type: undefined, limit: 8, cursor: undefined });
    cleanup();

    fakeMatchMedia(true);
    renderPage();
    await screen.findByText("+$1.000");
    expect(mockTransactions).toHaveBeenLastCalledWith("c1", { type: undefined, limit: 15, cursor: undefined });
  });

  it("filtra por tipo y marca el filtro activo", async () => {
    renderPage();
    await screen.findByText("+$1.000");
    expect(screen.getByRole("button", { name: "Todos" })).toHaveAttribute("aria-pressed", "true");

    mockTransactions.mockResolvedValue(page([movements[2]]));
    fireEvent.click(screen.getByRole("button", { name: "Cobros" }));

    expect(await screen.findByRole("button", { name: "Cobros" })).toHaveAttribute("aria-pressed", "true");
    expect(mockTransactions).toHaveBeenLastCalledWith("c1", { type: "CHARGE", limit: 8, cursor: undefined });
    expect(await screen.findByText("-$800")).toBeInTheDocument();
    expect(screen.queryByText("+$1.000")).not.toBeInTheDocument();
  });

  it("explica cuando no hay movimientos, con y sin filtro", async () => {
    mockTransactions.mockResolvedValue(page([]));
    renderPage();
    expect(await screen.findByText("Todavía no tiene movimientos")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Bonos" }));
    expect(await screen.findByText("No hay movimientos de este tipo")).toBeInTheDocument();
  });

  it("pagina los movimientos con 'Ver más movimientos'", async () => {
    mockTransactions
      .mockResolvedValueOnce(page([movements[0]], "t4"))
      .mockResolvedValueOnce(page([movements[2]], null));
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Ver más movimientos" }));

    expect(await screen.findByText("-$800")).toBeInTheDocument();
    expect(mockTransactions).toHaveBeenLastCalledWith("c1", { type: undefined, limit: 8, cursor: "t4" });
    expect(screen.getByText("+$1.000")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ver más movimientos" })).not.toBeInTheDocument();
  });

  it("si fallan los movimientos, igual muestra al cliente y deja reintentar", async () => {
    mockTransactions.mockRejectedValueOnce(new ApiError(500, "INTERNAL_ERROR", "Error interno"));
    renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent("Algo salió mal");
    expect(screen.getByText("$1.200")).toBeInTheDocument();

    mockTransactions.mockResolvedValue(page(movements));
    fireEvent.click(screen.getByRole("button", { name: "Probar de nuevo" }));
    expect(await screen.findByText("+$1.000")).toBeInTheDocument();
  });

  it("si el cliente no existe, lo dice", async () => {
    mockCustomer.mockRejectedValue(new ApiError(404, "NOT_FOUND", "Cliente no encontrado"));
    renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent("No lo encontramos.");
  });
});
