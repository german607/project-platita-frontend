import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../lib/api/client";
import { adjust, getCustomer } from "../lib/api/endpoints";
import type { CustomerWithBalance, MovementResult, Transaction } from "../lib/api/types";
import { Ajuste } from "./Ajuste";

vi.mock("../config", () => ({ config: { apiUrl: "/api", merchantId: "m1" } }));
vi.mock("../lib/api/endpoints", () => ({ getCustomer: vi.fn(), adjust: vi.fn() }));

const mockCustomer = vi.mocked(getCustomer);
const mockAdjust = vi.mocked(adjust);

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
  type: "ADJUSTMENT",
  amount,
  paidWith: null,
  note: null,
  bonusRuleId: null,
  createdAt: "2026-10-13T12:00:00.000Z",
});

const MOTIVO = "Cobro cargado dos veces";

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/ajustar/c1"]}>
        <Routes>
          <Route path="/ajustar/:customerId" element={<Ajuste />} />
          <Route path="/clientes/:customerId" element={<p>FICHA</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const sumar = () => screen.getByRole("button", { name: "+ Sumar" });
const restar = () => screen.getByRole("button", { name: "− Restar" });
const guardar = () => screen.getByRole("button", { name: /Guardar ajuste|Guardando/ });
const keyOf = (call: number) => (mockAdjust.mock.calls[call][2] as { idempotencyKey: string }).idempotencyKey;
const typeAmount = (value: string) => fireEvent.change(screen.getByLabelText("Monto del ajuste"), { target: { value } });
const typeNote = (value: string) => fireEvent.change(screen.getByLabelText("Motivo (obligatorio)"), { target: { value } });

beforeEach(() => {
  vi.resetAllMocks();
  mockCustomer.mockResolvedValue(marta);
});

describe("Ajuste", () => {
  it("arranca sin signo, sin monto y sin motivo: no deja guardar", async () => {
    renderPage();
    await screen.findByText(/Marta/);

    expect(sumar()).toHaveAttribute("aria-pressed", "false");
    expect(restar()).toHaveAttribute("aria-pressed", "false");
    expect(guardar()).toBeDisabled();
  });

  it("muestra cómo quedaría el saldo al restar", async () => {
    renderPage();
    await screen.findByText(/Marta/);
    fireEvent.click(restar());
    typeAmount("100");
    typeNote(MOTIVO);

    expect(screen.getByText(/Saldo: \$1\.200/)).toBeInTheDocument();
    expect(screen.getByText("$1.100")).toBeInTheDocument();
    expect(guardar()).toBeEnabled();
  });

  it("guarda una resta con signo negativo y muestra el resultado real del backend", async () => {
    const result: MovementResult = { transaction: tx(-10000), balance: 110000 };
    mockAdjust.mockResolvedValue(result);
    renderPage();
    await screen.findByText(/Marta/);
    fireEvent.click(restar());
    typeAmount("100");
    typeNote(`  ${MOTIVO} `);
    fireEvent.click(guardar());

    expect(await screen.findByText("¡Ajuste guardado!")).toBeInTheDocument();
    expect(mockAdjust).toHaveBeenCalledWith("c1", { amount: -100, note: MOTIVO }, { idempotencyKey: expect.any(String) });
    expect(screen.getByText("Marta ahora tiene")).toBeInTheDocument();
    expect(screen.getByText("$1.100")).toBeInTheDocument();
    expect(screen.getByText(`-$100 · ${MOTIVO}`)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Volver a la ficha" })).toHaveAttribute("href", "/clientes/c1");
  });

  it("guarda una suma con signo positivo", async () => {
    mockAdjust.mockResolvedValue({ transaction: tx(5000), balance: 125000 });
    renderPage();
    await screen.findByText(/Marta/);
    fireEvent.click(sumar());
    typeAmount("50");
    typeNote("Error de la semana");
    fireEvent.click(guardar());

    await waitFor(() =>
      expect(mockAdjust).toHaveBeenCalledWith(
        "c1",
        { amount: 50, note: "Error de la semana" },
        { idempotencyKey: expect.any(String) },
      ),
    );
  });

  it("no deja restar más que el saldo: el saldo no puede quedar en negativo", async () => {
    renderPage();
    await screen.findByText(/Marta/);
    fireEvent.click(restar());
    typeAmount("1.500");
    typeNote(MOTIVO);

    expect(screen.getByText("El saldo no puede quedar en negativo.")).toBeInTheDocument();
    expect(screen.getByText("-$300")).toBeInTheDocument();
    expect(guardar()).toBeDisabled();
  });

  it("restar justo el saldo es válido y deja $0", async () => {
    renderPage();
    await screen.findByText(/Marta/);
    fireEvent.click(restar());
    typeAmount("1200");
    typeNote(MOTIVO);

    expect(screen.queryByText("El saldo no puede quedar en negativo.")).not.toBeInTheDocument();
    expect(guardar()).toBeEnabled();
  });

  it("el motivo es obligatorio: un motivo en blanco no alcanza", async () => {
    renderPage();
    await screen.findByText(/Marta/);
    fireEvent.click(sumar());
    typeAmount("50");
    typeNote("    ");

    expect(guardar()).toBeDisabled();
    typeNote("Error de la semana");
    expect(guardar()).toBeEnabled();
  });

  it("no deja guardar un monto inválido y lo explica", async () => {
    renderPage();
    await screen.findByText(/Marta/);
    fireEvent.click(sumar());
    typeNote(MOTIVO);
    typeAmount("abc");

    expect(screen.getByText(/Escribí un monto válido/)).toBeInTheDocument();
    expect(guardar()).toBeDisabled();
    typeAmount("0");
    expect(guardar()).toBeDisabled();
  });

  it("si se corta la conexión, ofrece reintentar y reenvía la MISMA clave: no se ajusta dos veces", async () => {
    mockAdjust
      .mockRejectedValueOnce(new ApiError(0, "NETWORK_ERROR", "No se pudo conectar con el servidor"))
      .mockResolvedValueOnce({ transaction: tx(5000), balance: 125000 });
    renderPage();
    await screen.findByText(/Marta/);
    fireEvent.click(sumar());
    typeAmount("50");
    typeNote(MOTIVO);
    fireEvent.click(guardar());

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("No pudimos confirmar si el ajuste se registró.");
    expect(alert).toHaveTextContent("no se va a registrar dos veces");

    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(await screen.findByText("¡Ajuste guardado!")).toBeInTheDocument();
    expect(mockAdjust).toHaveBeenCalledTimes(2);
    expect(keyOf(1)).toBe(keyOf(0));
  });

  it("si cambia el monto después del error, es un ajuste nuevo con otra clave", async () => {
    mockAdjust
      .mockRejectedValueOnce(new ApiError(0, "NETWORK_ERROR", "No se pudo conectar con el servidor"))
      .mockResolvedValueOnce({ transaction: tx(3000), balance: 123000 });
    renderPage();
    await screen.findByText(/Marta/);
    fireEvent.click(sumar());
    typeAmount("50");
    typeNote(MOTIVO);
    fireEvent.click(guardar());
    await screen.findByRole("alert");

    typeAmount("30");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    fireEvent.click(guardar());

    await waitFor(() => expect(mockAdjust).toHaveBeenCalledTimes(2));
    expect(keyOf(1)).not.toBe(keyOf(0));
  });

  it("si el backend rechaza porque el saldo quedaría negativo, lo explica con palabras de esta pantalla", async () => {
    mockAdjust.mockRejectedValue(
      new ApiError(422, "INSUFFICIENT_BALANCE", "Saldo insuficiente", { balance: 5000, needed: 10000 }),
    );
    renderPage();
    await screen.findByText(/Marta/);
    fireEvent.click(restar());
    typeAmount("100");
    typeNote(MOTIVO);
    fireEvent.click(guardar());

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("El saldo no puede quedar en negativo.");
    expect(alert).toHaveTextContent("Puede que el saldo haya cambiado");
  });

  it("si el cliente no existe, lo dice", async () => {
    mockCustomer.mockRejectedValue(new ApiError(404, "NOT_FOUND", "Cliente no encontrado"));
    renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent("No lo encontramos.");
  });
});
