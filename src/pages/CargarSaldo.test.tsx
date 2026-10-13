import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../lib/api/client";
import { getCustomer, listBonusRules, topUp } from "../lib/api/endpoints";
import type { BonusRule, CustomerWithBalance, TopUpResult, Transaction } from "../lib/api/types";
import { CargarSaldo } from "./CargarSaldo";

vi.mock("../config", () => ({ config: { apiUrl: "/api", merchantId: "m1" } }));
vi.mock("../lib/api/endpoints", () => ({ getCustomer: vi.fn(), listBonusRules: vi.fn(), topUp: vi.fn() }));

const mockCustomer = vi.mocked(getCustomer);
const mockRules = vi.mocked(listBonusRules);
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

// Promo: cargando $1.000 o más, $200 de bono.
const promo: BonusRule = { id: "r1", merchantId: "m1", minTopUp: 100000, bonusAmount: 20000, active: true };

const tx = (type: Transaction["type"], amount: number): Transaction => ({
  id: `t-${type}`,
  customerId: "c1",
  type,
  amount,
  paidWith: null,
  note: null,
  createdAt: "2026-10-13T12:00:00.000Z",
});

const resultWithBonus: TopUpResult = { topup: tx("TOPUP", 100000), bonus: tx("BONUS", 20000), balance: 120000 };

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/cargar/c1"]}>
        <Routes>
          <Route path="/cargar/:customerId" element={<CargarSaldo />} />
          <Route path="/" element={<p>MOSTRADOR</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const chip = (name: string) => screen.getByRole("button", { name });
const confirmButton = () => screen.getByRole("button", { name: /Listo, confirmar|Registrando/ });

beforeEach(() => {
  vi.resetAllMocks();
  mockCustomer.mockResolvedValue(marta);
  mockRules.mockResolvedValue({ data: [promo] });
});

describe("Cargar saldo", () => {
  it("arranca sin monto elegido y no deja confirmar", async () => {
    renderPage();
    expect(await screen.findByText(/Marta/)).toBeInTheDocument();
    expect(confirmButton()).toBeDisabled();
    expect(screen.queryByText("Saldo nuevo")).not.toBeInTheDocument();
  });

  it("muestra la vista previa con el bono y el saldo nuevo", async () => {
    renderPage();
    await screen.findByText(/Marta/);
    fireEvent.click(chip("$1.000"));

    expect(await screen.findByText("¡Le regalás $200 de bono!")).toBeInTheDocument();
    expect(screen.getByText("$1.000 + $200 de bono")).toBeInTheDocument();
    expect(screen.getByText("$1.200")).toBeInTheDocument();
    expect(screen.getByText("Antes tenía $0")).toBeInTheDocument();
    expect(confirmButton()).toBeEnabled();
  });

  it("avisa cuando el monto no alcanza ningún bono", async () => {
    renderPage();
    await screen.findByText(/Marta/);
    fireEvent.click(chip("$500"));

    expect(await screen.findByText("Sin bono para este monto")).toBeInTheDocument();
  });

  it("confirma con efectivo por defecto y muestra el resultado real del backend", async () => {
    mockTopUp.mockResolvedValue(resultWithBonus);
    renderPage();
    await screen.findByText(/Marta/);
    fireEvent.click(chip("$1.000"));
    await screen.findByText("¡Le regalás $200 de bono!");
    fireEvent.click(confirmButton());

    expect(await screen.findByText("¡Carga lista!")).toBeInTheDocument();
    expect(mockTopUp).toHaveBeenCalledWith("c1", { amount: 1000, paidWith: "efectivo" });
    expect(screen.getByText("Marta ahora tiene")).toBeInTheDocument();
    expect(screen.getByText("$1.200")).toBeInTheDocument();
    expect(screen.getByText("$1.000 + $200 de bono · Efectivo")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Volver al mostrador" })).toHaveAttribute("href", "/");
  });

  it("manda la forma de pago elegida", async () => {
    mockTopUp.mockResolvedValue(resultWithBonus);
    renderPage();
    await screen.findByText(/Marta/);
    fireEvent.click(chip("$2.000"));
    fireEvent.click(chip("Mercado Pago"));
    fireEvent.click(confirmButton());

    await waitFor(() => expect(mockTopUp).toHaveBeenCalledWith("c1", { amount: 2000, paidWith: "mercadopago" }));
  });

  it("acepta otro monto, con decimales, escrito como lo escribe una persona", async () => {
    mockTopUp.mockResolvedValue(resultWithBonus);
    renderPage();
    await screen.findByText(/Marta/);
    fireEvent.click(chip("Otro monto"));
    fireEvent.change(screen.getByLabelText("Monto"), { target: { value: "1.250,50" } });

    expect(screen.getByText("$1.250,50")).toBeInTheDocument();
    fireEvent.click(confirmButton());
    await waitFor(() => expect(mockTopUp).toHaveBeenCalledWith("c1", { amount: 1250.5, paidWith: "efectivo" }));
  });

  it("no deja confirmar un monto inválido y lo explica", async () => {
    renderPage();
    await screen.findByText(/Marta/);
    fireEvent.click(chip("Otro monto"));
    fireEvent.change(screen.getByLabelText("Monto"), { target: { value: "abc" } });

    expect(screen.getByText(/Escribí un monto válido/)).toBeInTheDocument();
    expect(confirmButton()).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Monto"), { target: { value: "2.000.000" } });
    expect(confirmButton()).toBeDisabled();
  });

  it("si se corta la conexión al confirmar, no ofrece reintentar: avisa que revise el saldo", async () => {
    mockTopUp.mockRejectedValue(new ApiError(0, "NETWORK_ERROR", "No se pudo conectar con el servidor"));
    renderPage();
    await screen.findByText(/Marta/);
    fireEvent.click(chip("$1.000"));
    fireEvent.click(confirmButton());

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("No pudimos confirmar si la carga se registró.");
    expect(alert).toHaveTextContent("revisá el saldo del cliente");
    expect(screen.queryByRole("button", { name: "Probar de nuevo" })).not.toBeInTheDocument();
    expect(screen.queryByText("¡Carga lista!")).not.toBeInTheDocument();
  });

  it("muestra los otros errores del backend en lenguaje de mostrador", async () => {
    mockTopUp.mockRejectedValue(new ApiError(400, "VALIDATION_ERROR", "Datos inválidos"));
    renderPage();
    await screen.findByText(/Marta/);
    fireEvent.click(chip("$1.000"));
    fireEvent.click(confirmButton());

    expect(await screen.findByRole("alert")).toHaveTextContent("Revisá los datos ingresados.");
  });

  it("si fallan las promos, avisa pero no bloquea la carga", async () => {
    mockRules.mockRejectedValue(new ApiError(500, "INTERNAL_ERROR", "Error interno"));
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
