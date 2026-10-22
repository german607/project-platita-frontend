import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../lib/api/client";
import { charge, getCustomer } from "../lib/api/endpoints";
import type { CustomerWithBalance, MovementResult, Transaction } from "../lib/api/types";
import { Cobrar } from "./Cobrar";

vi.mock("../lib/merchant", () => ({ useMerchantId: () => "m1" }));
vi.mock("../lib/api/endpoints", () => ({ getCustomer: vi.fn(), charge: vi.fn() }));

const mockCustomer = vi.mocked(getCustomer);
const mockCharge = vi.mocked(charge);

// Marta tiene $1.200 de saldo.
const marta: CustomerWithBalance = {
  id: "c1",
  merchantId: "m1",
  phone: "+59899123456",
  name: "Marta",
  createdAt: "2026-09-01T10:00:00.000Z",
  lastVisitAt: null,
  balance: 120000,
};

const tx = (amount: number): Transaction => ({
  id: "t1",
  customerId: "c1",
  type: "CHARGE",
  amount,
  paidWith: null,
  note: null,
  bonusRuleId: null,
  createdAt: "2026-10-13T12:00:00.000Z",
});

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/comercio/cobrar/c1"]}>
        <Routes>
          <Route path="/comercio/cobrar/:customerId" element={<Cobrar />} />
          <Route path="/comercio" element={<p>MOSTRADOR</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const monto = () => screen.getByLabelText("Monto a cobrar");
const typeAmount = (value: string) => fireEvent.change(monto(), { target: { value } });
const confirmButton = () => screen.getByRole("button", { name: /^Cobrar|Cobrando/ });
const keyOf = (call: number) => (mockCharge.mock.calls[call][2] as { idempotencyKey: string }).idempotencyKey;

beforeEach(() => {
  vi.resetAllMocks();
  mockCustomer.mockResolvedValue(marta);
});

describe("Cobrar", () => {
  it("arranca sin monto: muestra el saldo y no deja cobrar", async () => {
    renderPage();
    expect(await screen.findByText("$1.200")).toBeInTheDocument();
    expect(screen.getByText("Saldo ahora")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(confirmButton()).toBeDisabled();
  });

  it("si el saldo alcanza, muestra cuánto quedaría y habilita cobrar", async () => {
    renderPage();
    await screen.findByText("$1.200");
    typeAmount("800");

    expect(screen.getByText("$400")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cobrar $800" })).toBeEnabled();
  });

  it("cobra el saldo exacto y deja $0", async () => {
    renderPage();
    await screen.findByText("$1.200");
    typeAmount("1.200");

    expect(screen.getByText("$0")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cobrar $1.200" })).toBeEnabled();
  });

  it("cobra con nota y muestra el resultado real del backend", async () => {
    const result: MovementResult = { transaction: tx(-80000), balance: 40000 };
    mockCharge.mockResolvedValue(result);
    renderPage();
    await screen.findByText("$1.200");
    typeAmount("800");
    fireEvent.change(screen.getByLabelText("¿Qué se cobra? (opcional)"), { target: { value: " Corte " } });
    fireEvent.click(confirmButton());

    expect(await screen.findByText("¡Cobrado!")).toBeInTheDocument();
    expect(mockCharge).toHaveBeenCalledWith("c1", { amount: 800, note: "Corte" }, { idempotencyKey: expect.any(String) });
    expect(screen.getByText("$800")).toBeInTheDocument();
    expect(screen.getByText("Corte · a Marta")).toBeInTheDocument();
    expect(screen.getByText("Le quedan $400")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Volver al mostrador" })).toHaveAttribute("href", "/comercio");
  });

  it("cobra sin nota si no se escribe ninguna", async () => {
    mockCharge.mockResolvedValue({ transaction: tx(-40000), balance: 80000 });
    renderPage();
    await screen.findByText("$1.200");
    typeAmount("400");
    fireEvent.click(confirmButton());

    await waitFor(() =>
      expect(mockCharge).toHaveBeenCalledWith("c1", { amount: 400, note: undefined }, { idempotencyKey: expect.any(String) }),
    );
    expect(await screen.findByText("a Marta")).toBeInTheDocument();
  });

  it("si no alcanza, dice cuánto falta, no deja cobrar y lleva a Cargar saldo", async () => {
    renderPage();
    await screen.findByText("$1.200");
    typeAmount("1350");

    expect(screen.getByText("Le faltan $150")).toBeInTheDocument();
    expect(screen.getByText("Que cargue saldo y cobrás enseguida.")).toBeInTheDocument();
    expect(screen.getByText("No alcanza")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Cargar saldo" })).toHaveAttribute("href", "/comercio/cargar/c1");
    expect(screen.getByRole("button", { name: "Cobrar $1.350 (no disponible)" })).toBeDisabled();
    expect(mockCharge).not.toHaveBeenCalled();
  });

  it("por un centésimo de más ya no alcanza", async () => {
    renderPage();
    await screen.findByText("$1.200");
    typeAmount("1200,01");

    expect(screen.getByText("Le faltan $0,01")).toBeInTheDocument();
  });

  it("si el saldo cambió y el backend rechaza, muestra cuánto falta según el backend", async () => {
    mockCharge.mockRejectedValue(
      new ApiError(422, "INSUFFICIENT_BALANCE", "Saldo insuficiente", { balance: 50000, needed: 80000 }),
    );
    renderPage();
    await screen.findByText("$1.200");
    typeAmount("800");
    fireEvent.click(confirmButton());

    expect(await screen.findByText("Le faltan $300")).toBeInTheDocument();

    // Si baja el monto, el cartel viejo desaparece y se puede intentar de nuevo.
    typeAmount("400");
    expect(screen.queryByText(/Le faltan/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cobrar $400" })).toBeEnabled();
  });

  it("si se corta la conexión al cobrar, ofrece reintentar y reenvía la MISMA clave: no se cobra dos veces", async () => {
    mockCharge
      .mockRejectedValueOnce(new ApiError(0, "NETWORK_ERROR", "No se pudo conectar con el servidor"))
      .mockResolvedValueOnce({ transaction: tx(-40000), balance: 80000 });
    renderPage();
    await screen.findByText("$1.200");
    typeAmount("400");
    fireEvent.click(confirmButton());

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("No pudimos confirmar si el cobro se registró.");
    expect(alert).toHaveTextContent("no se va a registrar dos veces");
    expect(screen.queryByText("¡Cobrado!")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(await screen.findByText("¡Cobrado!")).toBeInTheDocument();
    expect(mockCharge).toHaveBeenCalledTimes(2);
    expect(keyOf(1)).toBe(keyOf(0));
  });

  it("si cambia el monto después del error, el aviso desaparece y el cobro nuevo lleva otra clave", async () => {
    mockCharge
      .mockRejectedValueOnce(new ApiError(0, "NETWORK_ERROR", "No se pudo conectar con el servidor"))
      .mockResolvedValueOnce({ transaction: tx(-20000), balance: 100000 });
    renderPage();
    await screen.findByText("$1.200");
    typeAmount("400");
    fireEvent.click(confirmButton());
    await screen.findByRole("alert");

    typeAmount("200");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    fireEvent.click(confirmButton());

    await waitFor(() => expect(mockCharge).toHaveBeenCalledTimes(2));
    expect(keyOf(1)).not.toBe(keyOf(0));
  });

  it("si falla el servidor, también deja reintentar con la misma clave", async () => {
    mockCharge
      .mockRejectedValueOnce(new ApiError(500, "INTERNAL_ERROR", "Error interno"))
      .mockResolvedValueOnce({ transaction: tx(-40000), balance: 80000 });
    renderPage();
    await screen.findByText("$1.200");
    typeAmount("400");
    fireEvent.click(confirmButton());

    expect(await screen.findByRole("alert")).toHaveTextContent("Algo salió mal en el servidor.");
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(await screen.findByText("¡Cobrado!")).toBeInTheDocument();
    expect(keyOf(1)).toBe(keyOf(0));
  });

  it("no deja cobrar un monto inválido y lo explica", async () => {
    renderPage();
    await screen.findByText("$1.200");
    typeAmount("abc");

    expect(screen.getByText(/Escribí un monto válido/)).toBeInTheDocument();
    expect(confirmButton()).toBeDisabled();
    typeAmount("0");
    expect(confirmButton()).toBeDisabled();
  });

  it("si el cliente no existe, lo dice", async () => {
    mockCustomer.mockRejectedValue(new ApiError(404, "NOT_FOUND", "Cliente no encontrado"));
    renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent("No lo encontramos.");
  });
});
