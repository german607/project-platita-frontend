import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../lib/api/client";
import { listInactiveCustomers } from "../lib/api/endpoints";
import type { CustomerWithBalance } from "../lib/api/types";
import { Reactivar } from "./Reactivar";

vi.mock("../lib/merchant", () => ({ useMerchantId: () => "m1" }));
vi.mock("../lib/api/endpoints", () => ({ listInactiveCustomers: vi.fn() }));

const mockList = vi.mocked(listInactiveCustomers);

// Una fecha de hace `days` días, al mediodía (para que el cambio de hora no mueva el día).
const ago = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(12, 0, 0, 0);
  return d.toISOString();
};

const customer = (
  id: string,
  name: string | null,
  phone: string,
  lastVisitDays: number | null,
  balance = 0,
): CustomerWithBalance => ({
  id,
  merchantId: "m1",
  phone,
  name,
  createdAt: ago(100),
  lastVisitAt: lastVisitDays === null ? null : ago(lastVisitDays),
  balance,
});

const nicolas = customer("c1", "Nicolás Acosta", "+59891234987", 74, 32000);
const ana = customer("c2", "Ana Silveira", "+59892410663", 91, 150000);
const ricardo = customer("c3", "Ricardo Viera", "+59899802145", 128);

// `total` es el de todos los inactivos, no solo el de esta página.
const page = (data: CustomerWithBalance[], nextCursor: string | null = null, total = data.length) => ({
  data,
  nextCursor,
  total,
});

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/comercio/reactivar"]}>
        <Routes>
          <Route path="/comercio/reactivar" element={<Reactivar />} />
          <Route path="/comercio/clientes/:customerId" element={<p>FICHA</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const dias = () => screen.getByLabelText("Días sin venir");

beforeEach(() => vi.resetAllMocks());

describe("Reactivar", () => {
  it("arranca en 60 días y lista a los que no vienen hace ese tiempo", async () => {
    mockList.mockResolvedValue(page([nicolas, ana, ricardo]));
    renderPage();

    expect(await screen.findByText("Nicolás Acosta")).toBeInTheDocument();
    expect(dias()).toHaveTextContent("60");
    expect(mockList).toHaveBeenCalledWith("m1", { days: 60, limit: 20, cursor: undefined });
    expect(screen.getByText("Hace 74 días")).toBeInTheDocument();
    expect(screen.getByText("Hace 91 días")).toBeInTheDocument();
    expect(screen.getByText("Hace 128 días")).toBeInTheDocument();
    expect(screen.getAllByText("091 234 987").length).toBeGreaterThan(0);
    expect(screen.getByText("3 clientes")).toBeInTheDocument();
    expect(screen.getAllByText("$320").length).toBeGreaterThan(0);
    expect(screen.getAllByText("$1.500").length).toBeGreaterThan(0);
    expect(screen.getAllByText("$0").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /Nicolás Acosta/ })).toHaveAttribute("href", "/comercio/clientes/c1");
  });

  it("si nunca vino, lo dice contando desde que se anotó", async () => {
    mockList.mockResolvedValue(page([customer("c4", "Julio Pereira", "+59894551220", null)]));
    renderPage();

    expect(await screen.findByText("Julio Pereira")).toBeInTheDocument();
    expect(screen.getAllByText(/Nunca vino · se anotó hace 100 días/).length).toBeGreaterThan(0);
    expect(screen.getByText("1 cliente")).toBeInTheDocument();
  });

  it("cambia los días de 10 en 10 y vuelve a buscar", async () => {
    mockList.mockResolvedValue(page([nicolas]));
    renderPage();
    await screen.findByText("Nicolás Acosta");

    fireEvent.click(screen.getByRole("button", { name: "Menos días" }));
    await waitFor(() => expect(dias()).toHaveTextContent("50"));
    expect(mockList).toHaveBeenLastCalledWith("m1", { days: 50, limit: 20, cursor: undefined });

    fireEvent.click(screen.getByRole("button", { name: "Más días" }));
    fireEvent.click(screen.getByRole("button", { name: "Más días" }));
    await waitFor(() => expect(dias()).toHaveTextContent("70"));
    expect(mockList).toHaveBeenLastCalledWith("m1", { days: 70, limit: 20, cursor: undefined });
  });

  it("no baja de 10 días", async () => {
    mockList.mockResolvedValue(page([nicolas]));
    renderPage();
    await screen.findByText("Nicolás Acosta");

    for (let i = 0; i < 5; i++) fireEvent.click(screen.getByRole("button", { name: "Menos días" }));

    expect(dias()).toHaveTextContent("10");
    expect(screen.getByRole("button", { name: "Menos días" })).toBeDisabled();
  });

  it("si todos vienen seguido, lo celebra y sugiere bajar los días", async () => {
    mockList.mockResolvedValue(page([]));
    renderPage();

    expect(await screen.findByText("¡Todos vienen seguido!")).toBeInTheDocument();
    expect(screen.getByText("Nadie lleva más de 60 días sin venir. Bajá los días para ver más.")).toBeInTheDocument();
  });

  it("el envío por WhatsApp todavía no existe: los botones están deshabilitados", async () => {
    mockList.mockResolvedValue(page([nicolas, ana]));
    renderPage();
    await screen.findByText("Nicolás Acosta");

    const botones = screen.getAllByRole("button", { name: /WhatsApp/ });
    expect(botones.length).toBeGreaterThan(0);
    for (const boton of botones) expect(boton).toBeDisabled();
  });

  it("pagina con 'Ver más clientes' y el contador es el total, no lo cargado", async () => {
    mockList.mockResolvedValueOnce(page([nicolas], "c1", 2)).mockResolvedValueOnce(page([ana], null, 2));
    renderPage();

    expect(await screen.findByText("2 clientes")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Ver más clientes" }));

    expect(await screen.findByText("Ana Silveira")).toBeInTheDocument();
    expect(mockList).toHaveBeenLastCalledWith("m1", { days: 60, limit: 20, cursor: "c1" });
    expect(screen.getByText("2 clientes")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ver más clientes" })).not.toBeInTheDocument();
  });

  it("muestra el error y deja reintentar", async () => {
    mockList.mockRejectedValueOnce(new ApiError(0, "NETWORK_ERROR", "No se pudo conectar con el servidor"));
    renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent("No hay conexión con el servidor");

    mockList.mockResolvedValue(page([nicolas]));
    fireEvent.click(screen.getByRole("button", { name: "Probar de nuevo" }));
    expect(await screen.findByText("Nicolás Acosta")).toBeInTheDocument();
  });
});
