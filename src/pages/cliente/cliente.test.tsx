import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LayoutCliente } from "../../components/LayoutCliente";
import { ApiError } from "../../lib/api/client";
import { getPlace, listPlaces, listUserBalances, updateUser, upsertUser } from "../../lib/api/endpoints";
import type { PlaceDetail } from "../../lib/api/types";
import { emptyHours } from "../../lib/hours";
import { SesionClienteProvider } from "../../lib/sesionCliente";
import { Ingreso } from "./Ingreso";
import { Lugar } from "./Lugar";
import { Lugares } from "./Lugares";
import { Perfil } from "./Perfil";
import { Saldos } from "./Saldos";

vi.mock("../../lib/api/endpoints", () => ({
  listPlaces: vi.fn(),
  getPlace: vi.fn(),
  upsertUser: vi.fn(),
  updateUser: vi.fn(),
  listUserBalances: vi.fn(),
}));
const mockList = vi.mocked(listPlaces);
const mockPlace = vi.mocked(getPlace);
const mockUpsert = vi.mocked(upsertUser);
const mockUpdateUser = vi.mocked(updateUser);
const mockBalances = vi.mocked(listUserBalances);

function renderApp(path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <SesionClienteProvider>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/" element={<p>entrada</p>} />
            <Route path="/cliente/ingreso" element={<Ingreso />} />
            <Route path="/cliente" element={<LayoutCliente />}>
              <Route path="lugares" element={<Lugares />} />
              <Route path="lugares/:merchantId" element={<Lugar />} />
              <Route path="perfil" element={<Perfil />} />
              <Route path="saldos" element={<Saldos />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </SesionClienteProvider>
    </QueryClientProvider>,
  );
}

const entrar = () => localStorage.setItem("platita.cliente", JSON.stringify({ userId: "u1", phone: "+59899123456", name: null }));

const place = (extra = {}) => ({
  id: "m1",
  name: "Café Don Pedro",
  category: "CAFETERIA" as const,
  photoUrl: null,
  locations: [{ label: null, address: "Av. Italia 3320" }],
  hasActivePromo: true,
  ...extra,
});

const user = (extra = {}) => ({ id: "u1", phone: "+59899123456", name: null, createdAt: "2026-10-01T10:00:00.000Z", ...extra });
const saldo = (id: string, name: string, balance: number) => ({
  merchant: { id, name, category: "CAFETERIA" as const, photoUrl: null },
  balance,
  lastVisitAt: null,
});

beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
  mockBalances.mockResolvedValue({ data: [] });
});

describe("Ingreso del cliente", () => {
  it("con teléfono y código correcto busca o crea a la persona y entra a Lugares", async () => {
    mockList.mockResolvedValue({ data: [], nextCursor: null });
    mockUpsert.mockResolvedValue(user());
    renderApp("/cliente/ingreso");

    fireEvent.change(screen.getByLabelText("Tu celular"), { target: { value: "099 123 456" } });
    fireEvent.click(screen.getByRole("button", { name: "Mandame el código" }));
    expect(screen.getByText("Te lo mandamos al 099 123 456.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Código de 6 dígitos/), { target: { value: "000000" } });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByRole("heading", { name: "Lugares" })).toBeInTheDocument();
    expect(mockUpsert).toHaveBeenCalledWith({ phone: "+59899123456" });
    expect(JSON.parse(localStorage.getItem("platita.cliente")!)).toMatchObject({ userId: "u1", phone: "+59899123456" });
  });

  it("rechaza un teléfono inválido y un código incorrecto", () => {
    renderApp("/cliente/ingreso");
    fireEvent.change(screen.getByLabelText("Tu celular"), { target: { value: "123" } });
    fireEvent.click(screen.getByRole("button", { name: "Mandame el código" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Revisá el número");

    fireEvent.change(screen.getByLabelText("Tu celular"), { target: { value: "099123456" } });
    fireEvent.click(screen.getByRole("button", { name: "Mandame el código" }));
    fireEvent.change(screen.getByLabelText(/Código de 6 dígitos/), { target: { value: "482719" } });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Código incorrecto");
    expect(localStorage.getItem("platita.cliente")).toBeNull();
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("si el backend falla al crear la sesión, avisa y no entra", async () => {
    mockUpsert.mockRejectedValue(new ApiError(0, "NETWORK_ERROR", "x"));
    renderApp("/cliente/ingreso");
    fireEvent.change(screen.getByLabelText("Tu celular"), { target: { value: "099123456" } });
    fireEvent.click(screen.getByRole("button", { name: "Mandame el código" }));
    fireEvent.change(screen.getByLabelText(/Código de 6 dígitos/), { target: { value: "000000" } });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("No hay conexión con el servidor");
    expect(localStorage.getItem("platita.cliente")).toBeNull();
  });

  it("sin sesión, las pantallas del cliente mandan al ingreso", () => {
    renderApp("/cliente/lugares");
    expect(screen.getByText("Ingresá tu celular")).toBeInTheDocument();
  });
});

describe("Lugares", () => {
  it("lista los lugares con su categoría y si hay promo", async () => {
    entrar();
    mockList.mockResolvedValue({ data: [place(), place({ id: "m2", name: "Panadería La Espiga", category: "PANADERIA", hasActivePromo: false })], nextCursor: null });
    renderApp("/cliente/lugares");

    expect(await screen.findByText("Café Don Pedro")).toBeInTheDocument();
    expect(screen.getByText("Cafeterías · Av. Italia 3320")).toBeInTheDocument();
    expect(screen.getByText("Promo activa")).toBeInTheDocument();
    expect(screen.getByText("Sin promo")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Café Don Pedro/ })).toHaveAttribute("href", "/cliente/lugares/m1");
  });

  it("si la persona tiene saldo en un lugar, la tarjeta lo dice", async () => {
    entrar();
    mockList.mockResolvedValue({ data: [place(), place({ id: "m2", name: "Panadería La Espiga" })], nextCursor: null });
    mockBalances.mockResolvedValue({ data: [saldo("m1", "Café Don Pedro", 120000)] });
    renderApp("/cliente/lugares");

    expect(await screen.findByText("Tenés $1.200")).toBeInTheDocument();
    expect(screen.getAllByText(/Tenés/)).toHaveLength(1);
  });

  it("filtra por categoría pidiéndole al backend", async () => {
    entrar();
    mockList.mockResolvedValue({ data: [place()], nextCursor: null });
    renderApp("/cliente/lugares");
    await screen.findByText("Café Don Pedro");

    mockList.mockResolvedValue({ data: [], nextCursor: null });
    fireEvent.click(screen.getByRole("button", { name: "Panaderías" }));
    expect(await screen.findByText("No hay lugares con este filtro")).toBeInTheDocument();
    expect(mockList).toHaveBeenLastCalledWith(expect.objectContaining({ category: "PANADERIA" }));
  });

  it("si falla, deja reintentar", async () => {
    entrar();
    mockList.mockRejectedValueOnce(new ApiError(0, "NETWORK_ERROR", "x"));
    renderApp("/cliente/lugares");
    expect(await screen.findByRole("alert")).toHaveTextContent("No hay conexión con el servidor");

    mockList.mockResolvedValue({ data: [place()], nextCursor: null });
    fireEvent.click(screen.getByRole("button", { name: "Probar de nuevo" }));
    expect(await screen.findByText("Café Don Pedro")).toBeInTheDocument();
  });
});

describe("Detalle de un lugar", () => {
  const detail = (extra: Partial<PlaceDetail> = {}): PlaceDetail => ({
    id: "m1",
    name: "Café Don Pedro",
    category: "CAFETERIA",
    description: "Café de especialidad",
    photoUrl: null,
    locations: [
      { label: "Tres Cruces", address: "Av. Italia 3320" },
      { label: "Pocitos", address: "Av. Brasil 2890" },
    ],
    openingHours: { ...emptyHours(), mon: [{ from: "09:00", to: "13:00" }, { from: "16:00", to: "20:00" }] },
    promos: [{ id: "p1", name: "Promo de verano", description: "Lunes a viernes", minTopUp: 100000, bonusAmount: 20000 }],
    ...extra,
  });

  it("muestra promos, locales con 'Cómo llegar' y horarios", async () => {
    entrar();
    mockPlace.mockResolvedValue(detail());
    renderApp("/cliente/lugares/m1");

    expect(await screen.findByRole("heading", { name: "Café Don Pedro" })).toBeInTheDocument();
    expect(screen.getByText("Cargando $1.000 o más, te regalo $200")).toBeInTheDocument();
    expect(screen.getByText("Promo de verano")).toBeInTheDocument();
    const links = screen.getAllByRole("link", { name: "Cómo llegar" });
    expect(links).toHaveLength(2);
    expect(links[0].getAttribute("href")).toContain(encodeURIComponent("Av. Italia 3320"));
    expect(screen.getByText("9 a 13 · 16 a 20")).toBeInTheDocument();
    expect(screen.getByText("Domingo").nextSibling).toHaveTextContent("Cerrado");
  });

  it("muestra el saldo de la persona en este lugar, buscado en su lista", async () => {
    entrar();
    mockPlace.mockResolvedValue(detail());
    mockBalances.mockResolvedValue({ data: [saldo("m9", "Otro", 5000), saldo("m1", "Café Don Pedro", 120000)] });
    renderApp("/cliente/lugares/m1");

    expect(await screen.findByText("$1.200")).toBeInTheDocument();
    expect(mockBalances).toHaveBeenCalledWith("u1");
  });

  it("si no tiene ficha en el lugar, dice que no tiene saldo", async () => {
    entrar();
    mockPlace.mockResolvedValue(detail());
    renderApp("/cliente/lugares/m1");

    expect(await screen.findByText("Todavía no tenés saldo")).toBeInTheDocument();
  });

  it("'Cargar saldo' está deshabilitado y dice Próximamente", async () => {
    entrar();
    mockPlace.mockResolvedValue(detail());
    renderApp("/cliente/lugares/m1");

    const boton = await screen.findByRole("button", { name: /Cargar saldo/ });
    expect(boton).toBeDisabled();
    expect(boton).toHaveTextContent("Próximamente");
  });

  it("si el lugar no existe, lo dice y deja volver", async () => {
    entrar();
    mockPlace.mockRejectedValue(new ApiError(404, "NOT_FOUND", "no"));
    renderApp("/cliente/lugares/zzz");

    expect(await screen.findByRole("alert")).toHaveTextContent("Este lugar ya no está disponible");
    expect(screen.getByRole("link", { name: "← Volver a Lugares" })).toHaveAttribute("href", "/cliente/lugares");
  });
});

describe("Perfil", () => {
  it("muestra el teléfono verificado, deja editar el nombre y cerrar sesión", async () => {
    entrar();
    mockUpdateUser.mockResolvedValue(user({ name: "Marta Rodríguez" }));
    renderApp("/cliente/perfil");

    expect(screen.getByText("099 123 456")).toBeInTheDocument();
    expect(screen.getByText("✓ Verificado")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: "Marta Rodríguez" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect(await screen.findByText("Marta Rodríguez")).toBeInTheDocument();
    expect(mockUpdateUser).toHaveBeenCalledWith("u1", { name: "Marta Rodríguez" });
    expect(JSON.parse(localStorage.getItem("platita.cliente")!).name).toBe("Marta Rodríguez");

    fireEvent.click(screen.getByRole("button", { name: "Cerrar sesión" }));
    expect(screen.getByText("entrada")).toBeInTheDocument();
    expect(localStorage.getItem("platita.cliente")).toBeNull();
  });
});

describe("Mis saldos", () => {
  it("lista un saldo por comercio, sin sumarlos, incluido el de $0", async () => {
    entrar();
    mockBalances.mockResolvedValue({ data: [saldo("m1", "Café Don Pedro", 120000), saldo("m2", "Panadería La Espiga", 0)] });
    renderApp("/cliente/saldos");

    expect(await screen.findByText("Café Don Pedro")).toBeInTheDocument();
    expect(screen.getByText("$1.200")).toBeInTheDocument();
    expect(screen.getByText("$0")).toBeInTheDocument();
    expect(screen.queryByText(/total/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Café Don Pedro/ })).toHaveAttribute("href", "/cliente/lugares/m1");
  });

  it("sin saldos, invita a ver los lugares", async () => {
    entrar();
    renderApp("/cliente/saldos");
    expect(await screen.findByText("Todavía no tenés saldo en ningún lugar")).toBeInTheDocument();
  });

  it("si falla, deja reintentar", async () => {
    entrar();
    mockBalances.mockRejectedValueOnce(new ApiError(0, "NETWORK_ERROR", "x"));
    renderApp("/cliente/saldos");
    expect(await screen.findByRole("alert")).toBeInTheDocument();

    mockBalances.mockResolvedValue({ data: [saldo("m1", "Café Don Pedro", 120000)] });
    fireEvent.click(screen.getByRole("button", { name: "Probar de nuevo" }));
    expect(await screen.findByText("Café Don Pedro")).toBeInTheDocument();
  });
});
