import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Layout } from "../components/Layout";
import { ApiError } from "../lib/api/client";
import { createMerchant, getAuthConfig, getMe, getMerchant, listPlaces } from "../lib/api/endpoints";
import { friendlyMessage } from "../lib/api/errors";
import { routes } from "../lib/routes";
import { SesionProvider, cuentaRecordada, recordarCuenta } from "../lib/sesion";
import { Elegir } from "./Elegir";
import { Entrada } from "./Entrada";
import { Salir } from "./Salir";

vi.mock("../lib/api/endpoints", () => ({
  getMe: vi.fn(),
  getMerchant: vi.fn(),
  createMerchant: vi.fn(),
  listPlaces: vi.fn(),
  getAuthConfig: vi.fn(),
  requestCode: vi.fn(),
  verifyCode: vi.fn(),
  logout: vi.fn(),
}));

const mockMe = vi.mocked(getMe);

const me = (merchants: { id: string; name: string }[], canCreateMerchant = true) => ({
  canCreateMerchant,
  user: { id: "u1", phone: "+59899123456", name: null, createdAt: "2026-10-01T10:00:00.000Z", phoneVerifiedAt: "2026-10-01T10:00:00.000Z" },
  merchants,
});

const sesion = (comercioId: string | null = null) =>
  localStorage.setItem(
    "platita.sesion",
    JSON.stringify({ token: "t", expiresAt: "2099-01-01T00:00:00.000Z", userId: "u1", phone: "+59899123456", name: null, comercioId }),
  );

function renderApp(path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <SesionProvider>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/" element={<Entrada />} />
            <Route path="/elegir" element={<Elegir />} />
            <Route path="/salir" element={<Salir />} />
            <Route path="/comercio" element={<Layout />}>
              <Route index element={<p>mostrador</p>} />
            </Route>
            <Route path="/cliente/lugares" element={<p>lugares del cliente</p>} />
          </Routes>
        </MemoryRouter>
      </SesionProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
  vi.mocked(listPlaces).mockResolvedValue({ data: [], nextCursor: null });
  vi.mocked(getAuthConfig).mockResolvedValue({ otpProvider: "twilio", channel: "sms", devCode: null, realPhonesConfigured: false });
  vi.mocked(getMerchant).mockResolvedValue({ id: "m1", name: "Café Don Pedro" } as never);
});

describe("A dónde lleva la entrada", () => {
  it("una persona sin comercios va al área del cliente", async () => {
    sesion();
    mockMe.mockResolvedValue(me([]));
    renderApp("/");
    expect(await screen.findByText("lugares del cliente")).toBeInTheDocument();
  });

  it("con un solo comercio entra directo al mostrador y lo recuerda", async () => {
    sesion();
    mockMe.mockResolvedValue(me([{ id: "m1", name: "Café Don Pedro" }]));
    renderApp("/");

    expect(await screen.findByText("mostrador")).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("platita.sesion")!).comercioId).toBe("m1");
    expect(cuentaRecordada("u1")).toEqual({ comercioId: "m1" });
  });

  it("con varios comercios pregunta a cuál entrar", async () => {
    sesion();
    mockMe.mockResolvedValue(me([{ id: "m1", name: "Café Don Pedro" }, { id: "m2", name: "Peluquería Lucía" }]));
    renderApp("/");

    expect(await screen.findByRole("heading", { name: "¿A dónde querés entrar?" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Peluquería Lucía/ }));
    expect(await screen.findByText("mostrador")).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("platita.sesion")!).comercioId).toBe("m2");
  });

  it("con varios, entra directo a lo último que eligió", async () => {
    sesion();
    recordarCuenta("u1", "cliente");
    mockMe.mockResolvedValue(me([{ id: "m1", name: "Café Don Pedro" }, { id: "m2", name: "Peluquería Lucía" }]));
    renderApp("/");
    expect(await screen.findByText("lugares del cliente")).toBeInTheDocument();
  });

  it("si no se puede saber qué cuentas tiene, avisa y deja reintentar", async () => {
    sesion();
    mockMe.mockRejectedValueOnce(new ApiError(0, "NETWORK_ERROR", "x"));
    renderApp("/");
    expect(await screen.findByRole("alert")).toHaveTextContent("No hay conexión con el servidor");

    mockMe.mockResolvedValue(me([]));
    fireEvent.click(screen.getByRole("button", { name: "Probar de nuevo" }));
    expect(await screen.findByText("lugares del cliente")).toBeInTheDocument();
  });
});

describe("Sumar un comercio", () => {
  it("crea el comercio, queda como dueña y entra a su mostrador", async () => {
    sesion();
    mockMe.mockResolvedValue(me([]));
    vi.mocked(createMerchant).mockResolvedValue({ id: "m9", name: "Lavadero Burbujas" } as never);
    renderApp("/elegir");

    fireEvent.change(await screen.findByLabelText("Nombre del comercio"), { target: { value: "  Lavadero Burbujas " } });
    fireEvent.click(screen.getByRole("button", { name: "Crear comercio" }));

    expect(await screen.findByText("mostrador")).toBeInTheDocument();
    expect(createMerchant).toHaveBeenCalledWith({ name: "Lavadero Burbujas" });
    expect(JSON.parse(localStorage.getItem("platita.sesion")!).comercioId).toBe("m9");
  });

  it("si el número no está habilitado, no ofrece crear y pide escribir", async () => {
    sesion();
    mockMe.mockResolvedValue(me([], false));
    renderApp("/elegir");

    expect(await screen.findByText(/todavía no está habilitado para crear un comercio/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Crear comercio" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Como cliente/ })).toBeInTheDocument();
  });

  it("si el backend rechaza la creación (403), muestra el aviso", async () => {
    sesion();
    mockMe.mockResolvedValue(me([]));
    vi.mocked(createMerchant).mockRejectedValue(new ApiError(403, "MERCHANT_CREATION_NOT_ALLOWED", "x"));
    renderApp("/elegir");

    fireEvent.change(await screen.findByLabelText("Nombre del comercio"), { target: { value: "Mi local" } });
    fireEvent.click(screen.getByRole("button", { name: "Crear comercio" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("escribinos para habilitarlo");
  });

  it("sin nombre no se puede crear", async () => {
    sesion();
    mockMe.mockResolvedValue(me([]));
    renderApp("/elegir");
    expect(await screen.findByRole("button", { name: "Crear comercio" })).toBeDisabled();
  });
});

describe("Área del comercio con sesión", () => {
  it("sin comercio elegido o sin sesión, vuelve al inicio", async () => {
    renderApp("/comercio");
    expect(await screen.findByLabelText("Tu celular")).toBeInTheDocument();
  });

  it("con un comercio elegido muestra su nombre y el enlace para cambiar de cuenta", async () => {
    sesion("m1");
    renderApp("/comercio");
    expect(await screen.findByText("Café Don Pedro")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Cambiar de cuenta" })).toHaveAttribute("href", routes.elegir);
  });
});

describe("Cerrar sesión", () => {
  it("borra la sesión y vuelve al inicio, también desde el comercio", async () => {
    sesion("m1");
    const { logout } = await import("../lib/api/endpoints");
    vi.mocked(logout).mockResolvedValue(undefined);
    renderApp("/salir");

    expect(await screen.findByLabelText("Tu celular")).toBeInTheDocument();
    expect(localStorage.getItem("platita.sesion")).toBeNull();
  });
});

describe("Mensajes", () => {
  it("un comercio ajeno dice que no es tuyo", () => {
    expect(friendlyMessage(new ApiError(403, "FORBIDDEN", "x"))).toBe("Este comercio no es tuyo.");
  });
});
