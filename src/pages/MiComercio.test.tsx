import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../lib/api/client";
import {
  createLocation,
  getMerchant,
  listBonusRules,
  listLocations,
  updateLocation,
  updateMerchant,
} from "../lib/api/endpoints";
import type { Location, Merchant } from "../lib/api/types";
import { formatLongDate } from "../lib/dates";
import { emptyHours } from "../lib/hours";
import { MiComercio } from "./MiComercio";

vi.mock("../config", () => ({ config: { apiUrl: "/api", merchantId: "m1" } }));
vi.mock("../lib/api/endpoints", () => ({
  getMerchant: vi.fn(),
  listLocations: vi.fn(),
  listBonusRules: vi.fn(),
  updateMerchant: vi.fn(),
  createLocation: vi.fn(),
  updateLocation: vi.fn(),
}));

const mockGetMerchant = vi.mocked(getMerchant);
const mockListLocations = vi.mocked(listLocations);
const mockRules = vi.mocked(listBonusRules);
const mockUpdateMerchant = vi.mocked(updateMerchant);
const mockCreateLocation = vi.mocked(createLocation);
const mockUpdateLocation = vi.mocked(updateLocation);

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();

const merchant = (extra: Partial<Merchant> = {}): Merchant => ({
  id: "m1",
  name: "Café Don Pedro",
  phone: null,
  plan: "BASIC",
  createdAt: "2026-09-01T10:00:00.000Z",
  description: null,
  photoUrl: null,
  category: null,
  categoryChangedAt: null,
  visible: false,
  openingHours: emptyHours(),
  ...extra,
});

const location = (extra: Partial<Location> = {}): Location => ({
  id: "l1",
  merchantId: "m1",
  label: "Pocitos",
  address: "Av. Brasil 2500, Pocitos",
  active: true,
  createdAt: "2026-09-01T10:00:00.000Z",
  ...extra,
});

function renderPage(m: Merchant, locations: Location[] = []) {
  mockGetMerchant.mockResolvedValue(m);
  mockListLocations.mockResolvedValue({ data: locations });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <MiComercio />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const switchVisible = () => screen.getByRole("switch", { name: "Aparecer en la app" });
const guardar = () => screen.getByRole("button", { name: /Guardar cambios|Guardando…|Reintentar/ });
const escribir = (el: HTMLElement, value: string) => fireEvent.change(el, { target: { value } });
const listo = () => screen.findByRole("heading", { name: "Mi comercio" });

beforeEach(() => {
  vi.resetAllMocks();
  mockRules.mockResolvedValue({ data: [] });
});

describe("Mi comercio · lo guardado", () => {
  it("muestra el perfil guardado: descripción, categoría, local y horario", async () => {
    renderPage(
      merchant({
        description: "Café de especialidad.",
        category: "CAFETERIA",
        categoryChangedAt: daysAgo(200),
        openingHours: { ...emptyHours(), mon: [{ from: "09:00", to: "13:00" }] },
      }),
      [location()],
    );
    await listo();

    expect(screen.getByLabelText("Descripción corta")).toHaveValue("Café de especialidad.");
    expect(screen.getByText("21 / 280")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Cafetería" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByLabelText("Dirección del local 1")).toHaveValue("Av. Brasil 2500, Pocitos");
    expect(screen.getByLabelText("Lunes, tramo 1: desde")).toHaveValue("09:00");
    expect(screen.getByRole("switch", { name: "Lunes cerrado" })).toHaveAttribute("aria-checked", "false");
    expect(screen.getByRole("switch", { name: "Martes cerrado" })).toHaveAttribute("aria-checked", "true");
  });

  it("al abrir no hay nada para guardar", async () => {
    renderPage(merchant({ category: "CAFETERIA" }), [location()]);
    await listo();

    expect(screen.getByText("No hay cambios para guardar")).toBeInTheDocument();
    expect(guardar()).toBeDisabled();
  });

  it("si no carga el comercio, lo dice y deja reintentar", async () => {
    mockGetMerchant.mockRejectedValue(new ApiError(500, "INTERNAL_ERROR", "Error interno"));
    mockListLocations.mockResolvedValue({ data: [] });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <MiComercio />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent("Algo salió mal");
    expect(screen.getByRole("button", { name: "Probar de nuevo" })).toBeInTheDocument();
  });
});

describe("Mi comercio · aparecer en la app", () => {
  it("no deja prenderlo sin local ni categoría y dice qué falta", async () => {
    renderPage(merchant());
    await listo();

    expect(switchVisible()).toBeDisabled();
    expect(screen.getByText("Todavía no podés prenderlo. Te falta:")).toBeInTheDocument();
    expect(screen.getByText("Cargar al menos un local")).toBeInTheDocument();
    expect(screen.getByText("Elegir una categoría")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ir a Locales" })).toBeInTheDocument();
    expect(screen.getByText("Todavía no te ven: “Aparecer en la app” está apagado.")).toBeInTheDocument();
  });

  it("con local y categoría se puede prender, y la descripción es solo recomendada", async () => {
    renderPage(merchant({ category: "CAFETERIA" }), [location()]);
    await listo();

    expect(switchVisible()).toBeEnabled();
    expect(screen.getByText(/Todo listo: tenés local y categoría/)).toBeInTheDocument();
  });

  it("la vista previa usa el nombre, la categoría y la dirección del local", async () => {
    renderPage(merchant({ category: "CAFETERIA" }), [location()]);
    await listo();

    expect(screen.getByText("Café Don Pedro")).toBeInTheDocument();
    expect(screen.getByText("Cafeterías · Av. Brasil 2500, Pocitos")).toBeInTheDocument();
    expect(screen.getByText("Sin promo")).toBeInTheDocument();
  });

  it("la vista previa dice 'Promo activa' si el comercio tiene una promo prendida", async () => {
    mockRules.mockResolvedValue({
      data: [{ id: "r1", merchantId: "m1", name: null, description: null, minTopUp: 100000, bonusAmount: 20000, active: true, timesUsed: 0 }],
    });
    renderPage(merchant({ category: "CAFETERIA" }), [location()]);
    await listo();

    expect(await screen.findByText("Promo activa")).toBeInTheDocument();
  });

  it("con el interruptor prendido, no deja quedarse sin local", async () => {
    renderPage(merchant({ category: "CAFETERIA", visible: true }), [location()]);
    await listo();

    fireEvent.click(screen.getByRole("button", { name: "Dar de baja el local 1" }));

    expect(screen.getAllByText("Para seguir apareciendo necesitás al menos un local activo y una categoría.").length).toBeGreaterThan(0);
    expect(guardar()).toBeDisabled();
  });
});

describe("Mi comercio · guardar", () => {
  it("manda solo lo que cambió y avisa que se guardó", async () => {
    mockUpdateMerchant.mockResolvedValue(merchant({ category: "CAFETERIA", description: "Nuevo" }));
    renderPage(merchant({ category: "CAFETERIA" }), [location()]);
    await listo();

    escribir(screen.getByLabelText("Descripción corta"), "  Nuevo ");
    expect(screen.getByText("Tenés cambios sin guardar")).toBeInTheDocument();
    fireEvent.click(guardar());

    expect(await screen.findByText("✓ Cambios guardados")).toBeInTheDocument();
    expect(mockUpdateMerchant).toHaveBeenCalledWith("m1", { description: "Nuevo" });
    expect(mockCreateLocation).not.toHaveBeenCalled();
    expect(mockUpdateLocation).not.toHaveBeenCalled();
  });

  it("para prender por primera vez: crea el local y DESPUÉS prende el interruptor", async () => {
    mockCreateLocation.mockResolvedValue(location({ id: "l9", label: null, address: "Av. Italia 3320" }));
    mockUpdateMerchant.mockResolvedValue(merchant({ category: "CAFETERIA", visible: true }));
    renderPage(merchant());
    await listo();

    fireEvent.click(screen.getByRole("radio", { name: "Cafetería" }));
    fireEvent.click(screen.getByRole("button", { name: "+ Agregar un local" }));
    escribir(screen.getByLabelText("Dirección del local 1"), "Av. Italia 3320");
    fireEvent.click(switchVisible());
    fireEvent.click(guardar());

    await screen.findByText("✓ Cambios guardados");
    expect(mockCreateLocation).toHaveBeenCalledWith("m1", { address: "Av. Italia 3320" });
    expect(mockUpdateMerchant).toHaveBeenCalledWith("m1", { category: "CAFETERIA", visible: true });
    expect(mockCreateLocation.mock.invocationCallOrder[0]).toBeLessThan(mockUpdateMerchant.mock.invocationCallOrder[0]);
  });

  it("para apagar y dar de baja el único local: primero apaga el comercio y DESPUÉS da de baja el local", async () => {
    mockUpdateMerchant.mockResolvedValue(merchant({ category: "CAFETERIA", visible: false }));
    mockUpdateLocation.mockResolvedValue(location({ active: false }));
    renderPage(merchant({ category: "CAFETERIA", categoryChangedAt: daysAgo(200), visible: true }), [location()]);
    await listo();

    fireEvent.click(switchVisible());
    fireEvent.click(screen.getByRole("button", { name: "Dar de baja el local 1" }));
    fireEvent.click(guardar());

    await screen.findByText("✓ Cambios guardados");
    expect(mockUpdateMerchant).toHaveBeenCalledWith("m1", { visible: false });
    expect(mockUpdateLocation).toHaveBeenCalledWith("l1", { active: false });
    expect(mockUpdateMerchant.mock.invocationCallOrder[0]).toBeLessThan(mockUpdateLocation.mock.invocationCallOrder[0]);
  });

  it("si falla a mitad de camino, reintentar no vuelve a crear el local ya creado", async () => {
    mockCreateLocation.mockResolvedValue(location({ id: "l9", label: null, address: "Av. Italia 3320" }));
    mockUpdateMerchant
      .mockRejectedValueOnce(new ApiError(0, "NETWORK_ERROR", "No se pudo conectar con el servidor"))
      .mockResolvedValueOnce(merchant({ category: "CAFETERIA", description: "Hola" }));
    renderPage(merchant({ category: "CAFETERIA", categoryChangedAt: daysAgo(200) }));
    await listo();

    fireEvent.click(screen.getByRole("button", { name: "+ Agregar un local" }));
    escribir(screen.getByLabelText("Dirección del local 1"), "Av. Italia 3320");
    escribir(screen.getByLabelText("Descripción corta"), "Hola");
    fireEvent.click(guardar());

    expect(await screen.findByText("No pudimos guardar tus cambios")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(await screen.findByText("✓ Cambios guardados")).toBeInTheDocument();
    expect(mockCreateLocation).toHaveBeenCalledTimes(1);
    expect(mockUpdateMerchant).toHaveBeenCalledTimes(2);
  });
});

describe("Mi comercio · errores del backend", () => {
  it("categoría cambiada antes de tiempo: avisa desde cuándo y vuelve a la anterior", async () => {
    const desde = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    mockUpdateMerchant.mockRejectedValue(
      new ApiError(422, "CATEGORY_CHANGE_TOO_SOON", "La categoría no se puede cambiar todavía", { availableAt: desde }),
    );
    // El front cree que ya se puede (pasaron más de 90 días) y el backend dice que no.
    renderPage(merchant({ category: "CAFETERIA", categoryChangedAt: daysAgo(100) }), [location()]);
    await listo();

    fireEvent.click(screen.getByRole("radio", { name: "Panadería" }));
    fireEvent.click(guardar());

    expect(await screen.findByText(`Todavía no podés cambiarla. Podés cambiarla desde el ${formatLongDate(desde)}`)).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Cafetería" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: "Panadería" })).toHaveAttribute("aria-checked", "false");
  });

  it("perfil incompleto: muestra lo que dice el backend y deja el interruptor apagado", async () => {
    mockUpdateMerchant.mockRejectedValue(
      new ApiError(422, "PROFILE_INCOMPLETE", "Para aparecer en la app falta: al menos un local activo", { missing: ["location"] }),
    );
    renderPage(merchant({ category: "CAFETERIA" }), [location()]);
    await listo();

    fireEvent.click(switchVisible());
    fireEvent.click(guardar());

    expect(await screen.findByText("Para aparecer en la app falta: al menos un local activo")).toBeInTheDocument();
    expect(switchVisible()).toHaveAttribute("aria-checked", "false");
  });

  it("no se puede dar de baja el único local mientras aparece: lo explica", async () => {
    mockUpdateLocation.mockRejectedValue(new ApiError(422, "LOCATION_REQUIRED_WHILE_VISIBLE", "No se puede"));
    // El front lo frena antes; esto prueba la red de seguridad si el backend igual lo rechaza.
    renderPage(merchant({ category: "CAFETERIA", visible: true }), [location(), location({ id: "l2", label: null, address: "Av. Italia 3320" })]);
    await listo();

    fireEvent.click(screen.getByRole("button", { name: "Dar de baja el local 1" }));
    fireEvent.click(guardar());

    expect(await screen.findByText(/No podés dar de baja el único local mientras aparecés en la app/)).toBeInTheDocument();
  });
});

describe("Mi comercio · categoría", () => {
  it("bloqueada: no se puede elegir otra y dice desde cuándo", async () => {
    const changed = daysAgo(10);
    const unlock = new Date(new Date(changed).getTime() + 90 * 24 * 60 * 60 * 1000);
    renderPage(merchant({ category: "CAFETERIA", categoryChangedAt: changed }), [location()]);
    await listo();

    expect(screen.getByText("Bloqueada por ahora")).toBeInTheDocument();
    expect(screen.getByText(`Podés cambiarla desde el ${formatLongDate(unlock.toISOString())}`)).toBeInTheDocument();
    for (const radio of screen.getAllByRole("radio")) expect(radio).toBeDisabled();
  });

  it("el ícono de ayuda explica la regla de los 90 días", async () => {
    renderPage(merchant());
    await listo();

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Ayuda sobre la categoría" }));
    expect(screen.getByRole("tooltip")).toHaveTextContent("una vez cada 90 días");
    expect(screen.getByRole("tooltip")).toHaveTextContent("escribinos");
  });
});

describe("Mi comercio · horarios y foto", () => {
  it("un tramo con 'hasta' antes de 'desde' muestra el error y no deja guardar", async () => {
    renderPage(
      merchant({ category: "CAFETERIA", openingHours: { ...emptyHours(), mon: [{ from: "09:00", to: "13:00" }] } }),
      [location()],
    );
    await listo();

    escribir(screen.getByLabelText("Lunes, tramo 1: desde"), "14:00");

    expect(screen.getByText("“Hasta” tiene que ser después de “desde”")).toBeInTheDocument();
    expect(screen.getByText("Revisá los horarios: hay tramos con errores.")).toBeInTheDocument();
    expect(guardar()).toBeDisabled();
  });

  it("copia el horario de un día a todos los demás y lo manda completo", async () => {
    // Como el backend real: devuelve el comercio con lo que se acaba de guardar.
    mockUpdateMerchant.mockImplementation(async (_id, changes) =>
      merchant({ category: "CAFETERIA", openingHours: changes.openingHours ?? emptyHours() }),
    );
    renderPage(
      merchant({ category: "CAFETERIA", openingHours: { ...emptyHours(), mon: [{ from: "09:00", to: "13:00" }] } }),
      [location()],
    );
    await listo();

    fireEvent.click(screen.getByRole("button", { name: "Copiar a todos los días" }));
    expect(screen.getByRole("switch", { name: "Domingo cerrado" })).toHaveAttribute("aria-checked", "false");
    fireEvent.click(guardar());

    await screen.findByText("✓ Cambios guardados");
    const enviado = mockUpdateMerchant.mock.calls[0][1].openingHours;
    expect(enviado?.sun).toEqual([{ from: "09:00", to: "13:00" }]);
    expect(enviado?.tue).toEqual([{ from: "09:00", to: "13:00" }]);
  });

  it("abrir un día cerrado propone un tramo y se pueden agregar y quitar", async () => {
    renderPage(merchant({ category: "CAFETERIA" }), [location()]);
    await listo();

    fireEvent.click(screen.getByRole("switch", { name: "Lunes cerrado" }));
    expect(screen.getByLabelText("Lunes, tramo 1: desde")).toHaveValue("09:00");
    expect(screen.getByLabelText("Lunes, tramo 1: hasta")).toHaveValue("13:00");

    fireEvent.click(screen.getByRole("button", { name: "+ Agregar tramo al Lunes" }));
    expect(screen.getByLabelText("Lunes, tramo 2: desde")).toHaveValue("16:00");

    fireEvent.click(screen.getByRole("button", { name: "Quitar el tramo 2 del Lunes" }));
    expect(screen.queryByLabelText("Lunes, tramo 2: desde")).not.toBeInTheDocument();
  });

  it("una foto con un enlace inválido avisa y no deja guardar", async () => {
    renderPage(merchant({ category: "CAFETERIA" }), [location()]);
    await listo();

    escribir(screen.getByLabelText("Foto"), "fotos.uy/cafe.jpg");

    expect(screen.getByText("Tiene que ser un enlace que empiece con http:// o https://")).toBeInTheDocument();
    expect(guardar()).toBeDisabled();
  });

  it("una dirección a medio escribir no deja guardar", async () => {
    renderPage(merchant({ category: "CAFETERIA" }), [location()]);
    await listo();

    fireEvent.click(screen.getByRole("button", { name: "+ Agregar otro local" }));
    escribir(screen.getByLabelText("Etiqueta del local 2"), "Tres Cruces");

    expect(screen.getByText("Escribí la dirección")).toBeInTheDocument();
    expect(guardar()).toBeDisabled();
  });
});
