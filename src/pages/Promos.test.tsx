import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../lib/api/client";
import { listBonusRules, updateBonusRule } from "../lib/api/endpoints";
import type { BonusRule } from "../lib/api/types";
import { Promos } from "./Promos";

vi.mock("../lib/merchant", () => ({ useMerchantId: () => "m1" }));
vi.mock("../lib/api/endpoints", () => ({ listBonusRules: vi.fn(), updateBonusRule: vi.fn() }));

const mockList = vi.mocked(listBonusRules);
const mockUpdate = vi.mocked(updateBonusRule);

const rule = (id: string, minPesos: number, bonusPesos: number, active: boolean): BonusRule => ({
  id,
  merchantId: "m1",
  minTopUp: minPesos * 100,
  bonusAmount: bonusPesos * 100,
  active,
  name: null,
  description: null,
  timesUsed: 0,
});

const r1 = rule("r1", 1000, 200, true);
const r2 = rule("r2", 2000, 500, true);
const r3 = rule("r3", 500, 50, false);

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/comercio/promos"]}>
        <Routes>
          <Route path="/comercio/promos" element={<Promos />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => vi.resetAllMocks());

describe("Promos", () => {
  it("lista las promos en palabras de comercio y dice cuáles están activas", async () => {
    mockList.mockResolvedValue({ data: [r3, r1, r2] });
    renderPage();

    expect(await screen.findByText("Cargando $1.000 o más, te regalo $200")).toBeInTheDocument();
    expect(screen.getByText("Cargando $2.000 o más, te regalo $500")).toBeInTheDocument();
    expect(screen.getByText("Cargando $500 o más, te regalo $50")).toBeInTheDocument();
    expect(screen.getAllByText("Activa")).toHaveLength(2);
    expect(screen.getAllByText("Apagada")).toHaveLength(1);
  });

  it("muestra el nombre, la descripción y cuántas veces se usó cada promo", async () => {
    mockList.mockResolvedValue({
      data: [
        { ...r1, name: "Promo de verano", description: "Válida hasta fin de mes", timesUsed: 38 },
        { ...r2, timesUsed: 1 },
        r3,
      ],
    });
    renderPage();

    // Con nombre: el nombre es el título y lo que da pasa a ser el subtítulo.
    expect(await screen.findByText("Promo de verano")).toBeInTheDocument();
    expect(screen.getByText("Cargando $1.000 o más, te regalo $200")).toBeInTheDocument();
    expect(screen.getByText("Válida hasta fin de mes")).toBeInTheDocument();
    expect(screen.getByText("Usada 38 veces")).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "Promo de verano" })).toBeInTheDocument();
    // Sin nombre: el título es lo que da. Y se dice bien en singular y en cero.
    expect(screen.getByText("Cargando $2.000 o más, te regalo $500")).toBeInTheDocument();
    expect(screen.getByText("Usada 1 vez")).toBeInTheDocument();
    expect(screen.getByText("Usada 0 veces")).toBeInTheDocument();
  });

  it("cada promo tiene su interruptor, con el estado correcto, y un enlace para editarla", async () => {
    mockList.mockResolvedValue({ data: [r3, r1] });
    renderPage();

    const switches = await screen.findAllByRole("switch");
    expect(switches.map((s) => s.getAttribute("aria-checked"))).toEqual(["false", "true"]);
    expect(screen.getAllByRole("link", { name: "Editar" })[0]).toHaveAttribute("href", "/comercio/promos/r3/editar");
  });

  it("apaga una promo (no se borra) y refresca la lista", async () => {
    mockList.mockResolvedValueOnce({ data: [r1] }).mockResolvedValue({ data: [{ ...r1, active: false }] });
    mockUpdate.mockResolvedValue({ ...r1, active: false });
    renderPage();

    fireEvent.click(await screen.findByRole("switch", { name: "Cargando $1.000 o más, te regalo $200" }));

    await waitFor(() => expect(mockUpdate).toHaveBeenCalledWith("r1", { active: false }));
    await waitFor(() => expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false"));
    expect(screen.getByText("Apagada")).toBeInTheDocument();
  });

  it("enciende una promo apagada", async () => {
    mockList.mockResolvedValue({ data: [r3] });
    mockUpdate.mockResolvedValue({ ...r3, active: true });
    renderPage();

    fireEvent.click(await screen.findByRole("switch"));
    await waitFor(() => expect(mockUpdate).toHaveBeenCalledWith("r3", { active: true }));
  });

  it("si falla al cambiar el estado, lo dice", async () => {
    mockList.mockResolvedValue({ data: [r1] });
    mockUpdate.mockRejectedValue(new ApiError(0, "NETWORK_ERROR", "No se pudo conectar con el servidor"));
    renderPage();

    fireEvent.click(await screen.findByRole("switch"));
    expect(await screen.findByRole("alert")).toHaveTextContent("No hay conexión con el servidor");
  });

  it("si no hay promos, lo explica y ofrece crear una", async () => {
    mockList.mockResolvedValue({ data: [] });
    renderPage();

    expect(await screen.findByText("Todavía no tenés promos")).toBeInTheDocument();
    expect(screen.getByText("Creá una para que tus clientes carguen más.")).toBeInTheDocument();
    for (const link of screen.getAllByRole("link", { name: "+ Crear promo" })) {
      expect(link).toHaveAttribute("href", "/comercio/promos/nueva");
    }
  });

  it("muestra el error y deja reintentar", async () => {
    mockList.mockRejectedValueOnce(new ApiError(500, "INTERNAL_ERROR", "Error interno"));
    renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent("Algo salió mal");

    mockList.mockResolvedValue({ data: [r1] });
    fireEvent.click(screen.getByRole("button", { name: "Probar de nuevo" }));
    expect(await screen.findByText("Cargando $1.000 o más, te regalo $200")).toBeInTheDocument();
  });
});
