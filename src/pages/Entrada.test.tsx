import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../lib/api/client";
import { getAuthConfig, getMe, listPlaces } from "../lib/api/endpoints";
import { routes } from "../lib/routes";
import { SesionProvider } from "../lib/sesion";
import { Entrada } from "./Entrada";

vi.mock("../lib/api/endpoints", () => ({ getMe: vi.fn(), listPlaces: vi.fn(), getAuthConfig: vi.fn(), requestCode: vi.fn(), verifyCode: vi.fn() }));
const mockPlaces = vi.mocked(listPlaces);

function renderEntrada() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <SesionProvider>
        <MemoryRouter>
          <Routes>
            <Route path="/" element={<Entrada />} />
            <Route path={routes.cliente.lugares} element={<p>área del cliente</p>} />
          </Routes>
        </MemoryRouter>
      </SesionProvider>
    </QueryClientProvider>,
  );
}

const place = (id: string, name: string) => ({
  id,
  name,
  category: "CAFETERIA" as const,
  photoUrl: null,
  locations: [{ label: null, address: "Av. Italia 3320" }],
  hasActivePromo: true,
});

beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
  vi.mocked(getAuthConfig).mockResolvedValue({ otpProvider: "twilio", channel: "sms", devCode: null, realPhonesConfigured: false });
});

describe("Entrada (inicio)", () => {
  it("muestra los lugares que están en Platita y el formulario para entrar", async () => {
    mockPlaces.mockResolvedValue({ data: [place("m1", "Café Don Pedro"), place("m2", "Panadería La Espiga")], nextCursor: null });
    renderEntrada();

    expect(await screen.findByText("Café Don Pedro")).toBeInTheDocument();
    expect(screen.getByText("Panadería La Espiga")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Lugares en Platita" })).toBeInTheDocument();
    expect(screen.getByLabelText("Tu celular")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mandame el código" })).toBeInTheDocument();
    expect(screen.getByText("Si es tu primera vez, tu cuenta se crea sola.")).toBeInTheDocument();
  });

  it("ya no pregunta si sos cliente o comercio: invita a entrar y avisa cómo sumar un comercio", async () => {
    mockPlaces.mockResolvedValue({ data: [], nextCursor: null });
    renderEntrada();

    expect(screen.queryByText("¿Cómo querés entrar?")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Soy cliente" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Soy un comercio" })).not.toBeInTheDocument();
    expect(screen.getByText(/¿Tenés un comercio\?/)).toBeInTheDocument();
    expect(await screen.findByText("Pronto vas a ver acá los comercios de tu barrio.")).toBeInTheDocument();
  });

  it("si no se pueden cargar los lugares, igual deja entrar", async () => {
    mockPlaces.mockRejectedValue(new ApiError(0, "NETWORK_ERROR", "x"));
    renderEntrada();

    expect(await screen.findByText(/No pudimos cargar los lugares/)).toBeInTheDocument();
    expect(screen.getByLabelText("Tu celular")).toBeInTheDocument();
  });

  it("con sesión abierta va directo al área del cliente", async () => {
    localStorage.setItem("platita.sesion", JSON.stringify({ token: "t", expiresAt: "2099-01-01T00:00:00.000Z", userId: "u1", phone: "+59899123456", name: null, comercioId: null }));
    vi.mocked(getMe).mockResolvedValue({
      user: { id: "u1", phone: "+59899123456", name: null, createdAt: "2026-10-01T10:00:00.000Z", phoneVerifiedAt: null },
      merchants: [],
      canCreateMerchant: false,
    });
    mockPlaces.mockResolvedValue({ data: [], nextCursor: null });
    renderEntrada();

    expect(await screen.findByText("área del cliente")).toBeInTheDocument();
  });

  it("las dos áreas viven bajo prefijos distintos, para no confundirse", () => {
    expect(routes.comercio.clientes).toBe("/comercio/clientes");
    expect(routes.cliente.lugares).toBe("/cliente/lugares");
    expect(routes.comercio.ficha("c1")).toBe("/comercio/clientes/c1");
    expect(routes.cliente.lugar("m1")).toBe("/cliente/lugares/m1");
  });
});
