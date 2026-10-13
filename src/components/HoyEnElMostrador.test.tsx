import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../lib/api/client";
import { listMerchantTransactions } from "../lib/api/endpoints";
import type { MerchantTransaction } from "../lib/api/types";
import { HoyEnElMostrador } from "./HoyEnElMostrador";

vi.mock("../lib/api/endpoints", () => ({ listMerchantTransactions: vi.fn() }));

const mockList = vi.mocked(listMerchantTransactions);

// Un movimiento de hoy a una hora de la máquina (así la prueba no depende de la zona horaria).
const at = (hour: number, minute: number) => new Date(new Date().setHours(hour, minute, 0, 0)).toISOString();

const row = (
  id: string,
  type: MerchantTransaction["type"],
  amount: number,
  hour: number,
  minute: number,
  customer: MerchantTransaction["customer"],
  note: string | null = null,
): MerchantTransaction => ({
  id,
  customerId: customer.id,
  type,
  amount,
  paidWith: null,
  note,
  bonusRuleId: null,
  createdAt: at(hour, minute),
  customer,
});

const marta = { id: "c1", name: "Marta Rodríguez", phone: "+59899123456" };
const julio = { id: "c2", name: "Julio Pereira", phone: "+59894551220" };
const sinNombre = { id: "c3", name: null, phone: "+59891234987" };

const page = (data: MerchantTransaction[], nextCursor: string | null = null) => ({ data, nextCursor });

function renderPanel() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <HoyEnElMostrador merchantId="m1" />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => vi.resetAllMocks());

describe("Hoy en el mostrador", () => {
  it("pide los movimientos de hoy, desde la medianoche, de a 10", async () => {
    mockList.mockResolvedValue(page([]));
    renderPanel();
    await screen.findByText("Todavía no hubo movimientos hoy.");

    const [merchantId, params] = mockList.mock.calls[0];
    expect(merchantId).toBe("m1");
    expect(params).toEqual({
      from: expect.stringMatching(/T00:00:00[+-]\d{2}:\d{2}$/),
      to: expect.stringMatching(/T00:00:00[+-]\d{2}:\d{2}$/),
      limit: 10,
    });
  });

  it("lista cada movimiento con cliente, hora, tipo, detalle y monto con signo", async () => {
    mockList.mockResolvedValue(
      page([
        row("t3", "CHARGE", -60000, 10, 15, julio, "Corte"),
        row("t2", "BONUS", 20000, 11, 40, marta),
        row("t1", "TOPUP", 100000, 11, 40, marta),
      ]),
    );
    renderPanel();

    expect(await screen.findByText("Julio Pereira")).toBeInTheDocument();
    expect(screen.getByText("10:15 · Cobro · Corte")).toBeInTheDocument();
    expect(screen.getByText("-$600")).toBeInTheDocument();
    expect(screen.getByText("+$1.000")).toBeInTheDocument();
    expect(screen.getByText("+$200")).toBeInTheDocument();
    expect(screen.getByText("11:40 · Carga")).toBeInTheDocument();
    expect(screen.getByText("11:40 · Bono")).toBeInTheDocument();
  });

  it("cada fila lleva a la ficha del cliente", async () => {
    mockList.mockResolvedValue(page([row("t1", "TOPUP", 100000, 11, 40, marta)]));
    renderPanel();

    expect(await screen.findByRole("link", { name: /Marta Rodríguez/ })).toHaveAttribute("href", "/clientes/c1");
  });

  it("si el cliente no tiene nombre, muestra su teléfono", async () => {
    mockList.mockResolvedValue(page([row("t1", "TOPUP", 100000, 9, 5, sinNombre)]));
    renderPanel();

    expect(await screen.findByText("091 234 987")).toBeInTheDocument();
  });

  it("avisa cuando hay más movimientos de los que muestra", async () => {
    mockList.mockResolvedValue(page([row("t1", "TOPUP", 100000, 11, 40, marta)], "t1"));
    renderPanel();

    expect(await screen.findByText("Se muestran los últimos 10 movimientos de hoy.")).toBeInTheDocument();
  });

  it("si no hubo movimientos hoy, lo dice", async () => {
    mockList.mockResolvedValue(page([]));
    renderPanel();

    expect(await screen.findByText("Todavía no hubo movimientos hoy.")).toBeInTheDocument();
  });

  it("si falla, muestra el error y deja reintentar", async () => {
    mockList.mockRejectedValueOnce(new ApiError(0, "NETWORK_ERROR", "No se pudo conectar con el servidor"));
    renderPanel();

    expect(await screen.findByRole("alert")).toHaveTextContent("No hay conexión con el servidor");

    mockList.mockResolvedValue(page([row("t1", "TOPUP", 100000, 11, 40, marta)]));
    fireEvent.click(screen.getByRole("button", { name: "Probar de nuevo" }));
    expect(await screen.findByText("Marta Rodríguez")).toBeInTheDocument();
  });
});
