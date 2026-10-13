import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../lib/api/client";
import { createBonusRule, listBonusRules, updateBonusRule } from "../lib/api/endpoints";
import type { BonusRule } from "../lib/api/types";
import { PromoForm } from "./PromoForm";

vi.mock("../config", () => ({ config: { apiUrl: "/api", merchantId: "m1" } }));
vi.mock("../lib/api/endpoints", () => ({
  listBonusRules: vi.fn(),
  createBonusRule: vi.fn(),
  updateBonusRule: vi.fn(),
}));

const mockList = vi.mocked(listBonusRules);
const mockCreate = vi.mocked(createBonusRule);
const mockUpdate = vi.mocked(updateBonusRule);

const r1: BonusRule = {
  id: "r1",
  merchantId: "m1",
  name: null,
  description: null,
  minTopUp: 100000,
  bonusAmount: 20000,
  active: true,
  timesUsed: 0,
};
const r2: BonusRule = {
  id: "r2",
  merchantId: "m1",
  name: null,
  description: null,
  minTopUp: 200000,
  bonusAmount: 50000,
  active: true,
  timesUsed: 0,
};

function renderAt(path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/promos" element={<p>LISTA</p>} />
          <Route path="/promos/nueva" element={<PromoForm />} />
          <Route path="/promos/:ruleId/editar" element={<PromoForm />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const desde = () => screen.getByLabelText("Cargando desde");
const regalo = () => screen.getByLabelText("Le regalo");
const guardar = () => screen.getByRole("button", { name: /Guardar promo|Guardando/ });
const type = (el: HTMLElement, value: string) => fireEvent.change(el, { target: { value } });

beforeEach(() => {
  vi.resetAllMocks();
  mockList.mockResolvedValue({ data: [r1, r2] });
});

describe("Promo · crear", () => {
  it("arranca vacía y no deja guardar", async () => {
    renderAt("/promos/nueva");

    expect(await screen.findByText("Nueva promo")).toBeInTheDocument();
    expect(guardar()).toBeDisabled();
    expect(screen.getByRole("switch", { name: "Promo activa" })).toHaveAttribute("aria-checked", "true");
  });

  it("muestra cómo lo ve el cliente y guarda con los montos en pesos", async () => {
    mockCreate.mockResolvedValue({ ...r1, id: "r9" });
    renderAt("/promos/nueva");
    await screen.findByText("Nueva promo");
    type(desde(), "1500");
    type(regalo(), "250,50");

    expect(screen.getByText("Cargá $1.500 y recibís $1.750,50")).toBeInTheDocument();
    fireEvent.click(guardar());

    await waitFor(() =>
      expect(mockCreate).toHaveBeenCalledWith("m1", { minTopUp: 1500, bonusAmount: 250.5, active: true }),
    );
    expect(await screen.findByText("LISTA")).toBeInTheDocument();
  });

  it("guarda el nombre y la descripción cuando se escriben", async () => {
    mockCreate.mockResolvedValue({ ...r1, id: "r9" });
    renderAt("/promos/nueva");
    await screen.findByText("Nueva promo");
    type(desde(), "1500");
    type(regalo(), "250");
    type(screen.getByLabelText("Nombre (opcional)"), "  Promo de verano ");
    type(screen.getByLabelText("Descripción (opcional)"), "Válida hasta fin de mes");
    fireEvent.click(guardar());

    await waitFor(() =>
      expect(mockCreate).toHaveBeenCalledWith("m1", {
        minTopUp: 1500,
        bonusAmount: 250,
        active: true,
        name: "Promo de verano",
        description: "Válida hasta fin de mes",
      }),
    );
  });

  it("sin nombre ni descripción, no los manda", async () => {
    mockCreate.mockResolvedValue({ ...r1, id: "r9" });
    renderAt("/promos/nueva");
    await screen.findByText("Nueva promo");
    type(desde(), "1500");
    type(regalo(), "250");
    fireEvent.click(guardar());

    await waitFor(() => expect(mockCreate).toHaveBeenCalled());
    const body = mockCreate.mock.calls[0][1];
    expect(body.name).toBeUndefined();
    expect(body.description).toBeUndefined();
  });

  it("puede guardarse apagada", async () => {
    mockCreate.mockResolvedValue({ ...r1, id: "r9", active: false });
    renderAt("/promos/nueva");
    await screen.findByText("Nueva promo");
    type(desde(), "500");
    type(regalo(), "50");
    fireEvent.click(screen.getByRole("switch", { name: "Promo activa" }));
    fireEvent.click(guardar());

    await waitFor(() =>
      expect(mockCreate).toHaveBeenCalledWith("m1", { minTopUp: 500, bonusAmount: 50, active: false }),
    );
  });

  it("no deja guardar montos inválidos y lo explica", async () => {
    renderAt("/promos/nueva");
    await screen.findByText("Nueva promo");
    type(desde(), "abc");
    type(regalo(), "0");

    expect(screen.getAllByText(/Escribí un monto válido/)).toHaveLength(2);
    expect(guardar()).toBeDisabled();
  });

  it("avisa si ya hay otra promo activa con el mismo mínimo", async () => {
    renderAt("/promos/nueva");
    await screen.findByText("Nueva promo");
    type(desde(), "1000");
    type(regalo(), "300");

    expect(screen.getByText(/Ya hay otra promo activa con ese mínimo/)).toBeInTheDocument();

    // Apagada no compite con la otra: no hay aviso.
    fireEvent.click(screen.getByRole("switch", { name: "Promo activa" }));
    expect(screen.queryByText(/Ya hay otra promo activa con ese mínimo/)).not.toBeInTheDocument();
  });

  it("si falla al guardar, lo dice y no sale de la pantalla", async () => {
    mockCreate.mockRejectedValue(new ApiError(400, "VALIDATION_ERROR", "Datos inválidos"));
    renderAt("/promos/nueva");
    await screen.findByText("Nueva promo");
    type(desde(), "1500");
    type(regalo(), "250");
    fireEvent.click(guardar());

    expect(await screen.findByRole("alert")).toHaveTextContent("Revisá los datos ingresados.");
    expect(screen.queryByText("LISTA")).not.toBeInTheDocument();
  });
});

describe("Promo · editar", () => {
  it("parte con los valores de la promo", async () => {
    renderAt("/promos/r1/editar");

    expect(await screen.findByText("Editar promo")).toBeInTheDocument();
    expect(desde()).toHaveValue("1000");
    expect(regalo()).toHaveValue("200");
    expect(screen.getByRole("switch", { name: "Promo activa" })).toHaveAttribute("aria-checked", "true");
  });

  it("guarda los cambios en la misma promo", async () => {
    mockUpdate.mockResolvedValue({ ...r1, bonusAmount: 30000 });
    renderAt("/promos/r1/editar");
    await screen.findByText("Editar promo");
    type(regalo(), "300");
    fireEvent.click(guardar());

    await waitFor(() =>
      expect(mockUpdate).toHaveBeenCalledWith("r1", {
        minTopUp: 1000,
        bonusAmount: 300,
        active: true,
        name: null,
        description: null,
      }),
    );
    expect(mockCreate).not.toHaveBeenCalled();
    expect(await screen.findByText("LISTA")).toBeInTheDocument();
  });

  it("parte con el nombre y la descripción de la promo, y al borrarlos los manda como null", async () => {
    mockList.mockResolvedValue({
      data: [{ ...r1, name: "Promo de verano", description: "Válida hasta fin de mes" }, r2],
    });
    mockUpdate.mockResolvedValue(r1);
    renderAt("/promos/r1/editar");
    await screen.findByText("Editar promo");

    expect(screen.getByLabelText("Nombre (opcional)")).toHaveValue("Promo de verano");
    expect(screen.getByLabelText("Descripción (opcional)")).toHaveValue("Válida hasta fin de mes");

    type(screen.getByLabelText("Nombre (opcional)"), "");
    fireEvent.click(guardar());

    await waitFor(() =>
      expect(mockUpdate).toHaveBeenCalledWith("r1", {
        minTopUp: 1000,
        bonusAmount: 200,
        active: true,
        name: null,
        description: "Válida hasta fin de mes",
      }),
    );
  });

  it("no avisa de mínimo repetido contra sí misma", async () => {
    renderAt("/promos/r1/editar");
    await screen.findByText("Editar promo");

    expect(screen.queryByText(/Ya hay otra promo activa con ese mínimo/)).not.toBeInTheDocument();
  });

  it("si la promo no existe, lo dice y lleva de vuelta", async () => {
    renderAt("/promos/zzz/editar");

    expect(await screen.findByText("No encontramos esa promo")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Volver a las promos" })).toHaveAttribute("href", "/promos");
  });
});
