import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../lib/api/client";
import { getBonusPreview, getCustomer, topUp } from "../lib/api/endpoints";
import type { BonusPreview, CustomerWithBalance, TopUpResult, Transaction } from "../lib/api/types";
import { CargarSaldo } from "./CargarSaldo";

vi.mock("../lib/merchant", () => ({ useMerchantId: () => "m1" }));
vi.mock("../lib/api/endpoints", () => ({ getCustomer: vi.fn(), getBonusPreview: vi.fn(), topUp: vi.fn() }));

const mockCustomer = vi.mocked(getCustomer);
const mockPreview = vi.mocked(getBonusPreview);
const mockTopUp = vi.mocked(topUp);

const marta: CustomerWithBalance = {
  id: "c1",
  merchantId: "m1",
  phone: "+59899123456",
  name: "Marta",
  createdAt: "2026-09-01T10:00:00.000Z",
  lastVisitAt: null,
  balance: 0,
};

// Lo que respondería el backend: promo de $200 de bono desde los $1.000.
const previewFor = (pesos: number, ruleName: string | null = null): BonusPreview => {
  const amount = Math.round(pesos * 100);
  return pesos >= 1000
    ? {
        amount,
        rule: { id: "r1", name: ruleName, minTopUp: 100000, bonusAmount: 20000 },
        bonus: 20000,
        total: amount + 20000,
      }
    : { amount, rule: null, bonus: 0, total: amount };
};

const tx = (type: Transaction["type"], amount: number): Transaction => ({
  id: `t-${type}`,
  customerId: "c1",
  type,
  amount,
  paidWith: null,
  note: null,
  bonusRuleId: null,
  createdAt: "2026-10-13T12:00:00.000Z",
});

const resultWithBonus: TopUpResult = { topup: tx("TOPUP", 100000), bonus: tx("BONUS", 20000), balance: 120000 };

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/comercio/cargar/c1"]}>
        <Routes>
          <Route path="/comercio/cargar/:customerId" element={<CargarSaldo />} />
          <Route path="/comercio" element={<p>MOSTRADOR</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const chip = (name: string) => screen.getByRole("button", { name });
const confirmButton = () => screen.getByRole("button", { name: /Listo, confirmar|Registrando/ });
const keyOf = (call: number) => (mockTopUp.mock.calls[call][2] as { idempotencyKey: string }).idempotencyKey;

beforeEach(() => {
  vi.resetAllMocks();
  mockCustomer.mockResolvedValue(marta);
  mockPreview.mockImplementation(async (_merchantId, pesos) => previewFor(pesos));
});

describe("Cargar saldo", () => {
  it("arranca sin monto elegido y no deja confirmar", async () => {
    renderPage();
    expect(await screen.findByText(/Marta/)).toBeInTheDocument();
    expect(confirmButton()).toBeDisabled();
    expect(screen.queryByText("Saldo nuevo")).not.toBeInTheDocument();
    expect(mockPreview).not.toHaveBeenCalled();
  });

  it("muestra la vista previa que calcula el backend: bono y saldo nuevo", async () => {
    renderPage();
    await screen.findByText(/Marta/);
    fireEvent.click(chip("$1.000"));

    expect(await screen.findByText("¡Le regalás $200 de bono!")).toBeInTheDocument();
    expect(mockPreview).toHaveBeenCalledWith("m1", 1000);
    expect(screen.getByText("$1.000 + $200 de bono")).toBeInTheDocument();
    expect(screen.getByText("$1.200")).toBeInTheDocument();
    expect(screen.getByText("Antes tenía $0")).toBeInTheDocument();
    expect(confirmButton()).toBeEnabled();
  });

  it("dice el nombre de la promo cuando la tiene", async () => {
    mockPreview.mockImplementation(async (_m, pesos) => previewFor(pesos, "Promo de octubre"));
    renderPage();
    await screen.findByText(/Marta/);
    fireEvent.click(chip("$1.000"));

    expect(await screen.findByText("Promo: Promo de octubre")).toBeInTheDocument();
  });

  it("avisa cuando el monto no alcanza ningún bono", async () => {
    renderPage();
    await screen.findByText(/Marta/);
    fireEvent.click(chip("$500"));

    expect(await screen.findByText("Sin bono para este monto")).toBeInTheDocument();
  });

  it("confirma con efectivo por defecto, con su clave de idempotencia, y muestra el resultado real", async () => {
    mockTopUp.mockResolvedValue(resultWithBonus);
    renderPage();
    await screen.findByText(/Marta/);
    fireEvent.click(chip("$1.000"));
    await screen.findByText("¡Le regalás $200 de bono!");
    fireEvent.click(confirmButton());

    expect(await screen.findByText("¡Carga lista!")).toBeInTheDocument();
    expect(mockTopUp).toHaveBeenCalledWith(
      "c1",
      { amount: 1000, paidWith: "efectivo" },
      { idempotencyKey: expect.any(String) },
    );
    expect(screen.getByText("Marta ahora tiene")).toBeInTheDocument();
    expect(screen.getByText("$1.200")).toBeInTheDocument();
    expect(screen.getByText("$1.000 + $200 de bono · Efectivo")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Volver al mostrador" })).toHaveAttribute("href", "/comercio");
  });

  it("manda la forma de pago elegida", async () => {
    mockTopUp.mockResolvedValue(resultWithBonus);
    renderPage();
    await screen.findByText(/Marta/);
    fireEvent.click(chip("$2.000"));
    fireEvent.click(chip("Mercado Pago"));
    fireEvent.click(confirmButton());

    await waitFor(() =>
      expect(mockTopUp).toHaveBeenCalledWith(
        "c1",
        { amount: 2000, paidWith: "mercadopago" },
        { idempotencyKey: expect.any(String) },
      ),
    );
  });

  it("acepta otro monto, con decimales, y consulta el bono con ese monto", async () => {
    mockTopUp.mockResolvedValue(resultWithBonus);
    renderPage();
    await screen.findByText(/Marta/);
    fireEvent.click(chip("Otro monto"));
    fireEvent.change(screen.getByLabelText("Monto"), { target: { value: "1.250,50" } });

    expect(screen.getByText("$1.250,50")).toBeInTheDocument();
    await waitFor(() => expect(mockPreview).toHaveBeenCalledWith("m1", 1250.5));
    fireEvent.click(confirmButton());
    await waitFor(() =>
      expect(mockTopUp).toHaveBeenCalledWith(
        "c1",
        { amount: 1250.5, paidWith: "efectivo" },
        { idempotencyKey: expect.any(String) },
      ),
    );
  });

  it("no deja confirmar un monto inválido y lo explica, sin consultar el bono", async () => {
    renderPage();
    await screen.findByText(/Marta/);
    fireEvent.click(chip("Otro monto"));
    fireEvent.change(screen.getByLabelText("Monto"), { target: { value: "abc" } });

    expect(screen.getByText(/Escribí un monto válido/)).toBeInTheDocument();
    expect(confirmButton()).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Monto"), { target: { value: "2.000.000" } });
    expect(confirmButton()).toBeDisabled();
    expect(mockPreview).not.toHaveBeenCalled();
  });

  it("si se corta la conexión, ofrece reintentar y reenvía la MISMA clave: no se registra dos veces", async () => {
    mockTopUp
      .mockRejectedValueOnce(new ApiError(0, "NETWORK_ERROR", "No se pudo conectar con el servidor"))
      .mockResolvedValueOnce(resultWithBonus);
    renderPage();
    await screen.findByText(/Marta/);
    fireEvent.click(chip("$1.000"));
    fireEvent.click(confirmButton());

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("No pudimos confirmar si la carga se registró.");
    expect(alert).toHaveTextContent("no se va a registrar dos veces");
    expect(screen.queryByText("¡Carga lista!")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(await screen.findByText("¡Carga lista!")).toBeInTheDocument();
    expect(mockTopUp).toHaveBeenCalledTimes(2);
    expect(keyOf(1)).toBe(keyOf(0));
  });

  it("si cambia el monto después del error, es una operación nueva con otra clave", async () => {
    mockTopUp
      .mockRejectedValueOnce(new ApiError(0, "NETWORK_ERROR", "No se pudo conectar con el servidor"))
      .mockResolvedValueOnce(resultWithBonus);
    renderPage();
    await screen.findByText(/Marta/);
    fireEvent.click(chip("$1.000"));
    fireEvent.click(confirmButton());
    await screen.findByRole("alert");

    fireEvent.click(chip("$2.000"));
    fireEvent.click(confirmButton());

    await waitFor(() => expect(mockTopUp).toHaveBeenCalledTimes(2));
    expect(keyOf(1)).not.toBe(keyOf(0));
  });

  it("si falla el servidor, también deja reintentar con la misma clave", async () => {
    mockTopUp
      .mockRejectedValueOnce(new ApiError(500, "INTERNAL_ERROR", "Error interno"))
      .mockResolvedValueOnce(resultWithBonus);
    renderPage();
    await screen.findByText(/Marta/);
    fireEvent.click(chip("$1.000"));
    fireEvent.click(confirmButton());

    expect(await screen.findByRole("alert")).toHaveTextContent("Algo salió mal en el servidor.");
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(await screen.findByText("¡Carga lista!")).toBeInTheDocument();
    expect(keyOf(1)).toBe(keyOf(0));
  });

  it("los otros errores del backend se muestran en lenguaje de mostrador, sin reintentar", async () => {
    mockTopUp.mockRejectedValue(new ApiError(400, "VALIDATION_ERROR", "Datos inválidos"));
    renderPage();
    await screen.findByText(/Marta/);
    fireEvent.click(chip("$1.000"));
    fireEvent.click(confirmButton());

    expect(await screen.findByRole("alert")).toHaveTextContent("Revisá los datos ingresados.");
    expect(screen.queryByRole("button", { name: "Reintentar" })).not.toBeInTheDocument();
  });

  it("si falla el cálculo del bono, avisa pero no bloquea la carga", async () => {
    mockPreview.mockRejectedValue(new ApiError(500, "INTERNAL_ERROR", "Error interno"));
    renderPage();
    await screen.findByText(/Marta/);
    fireEvent.click(chip("$1.000"));

    expect(await screen.findByText(/No pudimos calcular el bono/)).toBeInTheDocument();
    expect(confirmButton()).toBeEnabled();
  });

  it("si el cliente no existe, lo dice", async () => {
    mockCustomer.mockRejectedValue(new ApiError(404, "NOT_FOUND", "Cliente no encontrado"));
    renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent("No lo encontramos.");
  });
});
