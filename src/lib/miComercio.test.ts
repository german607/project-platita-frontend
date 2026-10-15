import { describe, expect, it } from "vitest";
import type { Location, Merchant } from "./api/types";
import { emptyHours } from "./hours";
import {
  canBeVisible,
  categoryUnlockDate,
  hasLocationErrors,
  isValidPhotoUrl,
  locationError,
  locationOps,
  newDraftLocation,
  profileChanges,
  profileDraft,
  requirements,
  toDraftLocations,
} from "./miComercio";

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

describe("profileChanges", () => {
  it("sin tocar nada, no hay cambios", () => {
    const server = merchant({ description: "Hola", category: "CAFETERIA", openingHours: { ...emptyHours(), mon: [{ from: "09:00", to: "13:00" }] } });
    expect(profileChanges(server, profileDraft(server))).toEqual({});
  });

  it("manda solo lo que cambió", () => {
    const server = merchant();
    const draft = { ...profileDraft(server), description: "  Café de especialidad  ", category: "CAFETERIA" as const, visible: true };
    expect(profileChanges(server, draft)).toEqual({ description: "Café de especialidad", category: "CAFETERIA", visible: true });
  });

  it("borrar un texto manda null", () => {
    const server = merchant({ description: "Hola", photoUrl: "https://x.uy/a.jpg" });
    const draft = { ...profileDraft(server), description: "  ", photoUrl: "" };
    expect(profileChanges(server, draft)).toEqual({ description: null, photoUrl: null });
  });

  it("no manda la categoría si no se eligió ninguna o es la misma", () => {
    const server = merchant({ category: "PANADERIA" });
    expect(profileChanges(server, { ...profileDraft(server), category: "PANADERIA" })).toEqual({});
    expect(profileChanges(server, { ...profileDraft(server), category: null })).toEqual({});
  });

  it("manda los horarios completos y ordenados cuando cambian", () => {
    const server = merchant();
    const draft = {
      ...profileDraft(server),
      hours: { ...emptyHours(), mon: [{ from: "16:00", to: "20:00" }, { from: "09:00", to: "13:00" }] },
    };
    const changes = profileChanges(server, draft);
    expect(changes.openingHours?.mon).toEqual([
      { from: "09:00", to: "13:00" },
      { from: "16:00", to: "20:00" },
    ]);
    expect(Object.keys(changes)).toEqual(["openingHours"]);
  });
});

describe("isValidPhotoUrl", () => {
  it("acepta vacío y URLs http o https, y rechaza el resto", () => {
    expect(isValidPhotoUrl("")).toBe(true);
    expect(isValidPhotoUrl("  ")).toBe(true);
    expect(isValidPhotoUrl("https://fotos.uy/cafe.jpg")).toBe(true);
    expect(isValidPhotoUrl("http://fotos.uy/cafe.jpg")).toBe(true);
    expect(isValidPhotoUrl("ftp://fotos.uy/cafe.jpg")).toBe(false);
    expect(isValidPhotoUrl("fotos.uy/cafe.jpg")).toBe(false);
    expect(isValidPhotoUrl("javascript:alert(1)")).toBe(false);
  });
});

describe("categoryUnlockDate", () => {
  const now = new Date(2026, 9, 13, 12);

  it("la primera vez es libre", () => {
    expect(categoryUnlockDate(merchant(), now)).toBeNull();
    expect(categoryUnlockDate(merchant({ category: "CAFETERIA", categoryChangedAt: null }), now)).toBeNull();
  });

  it("está bloqueada 90 días desde el último cambio", () => {
    const changed = new Date(2026, 9, 1, 12);
    const unlock = categoryUnlockDate(merchant({ category: "CAFETERIA", categoryChangedAt: changed.toISOString() }), now);
    expect(unlock).not.toBeNull();
    expect(unlock!.getTime() - changed.getTime()).toBe(90 * 24 * 60 * 60 * 1000);
  });

  it("pasados los 90 días se puede cambiar de nuevo", () => {
    const changed = new Date(2026, 5, 1, 12);
    expect(categoryUnlockDate(merchant({ category: "CAFETERIA", categoryChangedAt: changed.toISOString() }), now)).toBeNull();
  });
});

describe("locationError", () => {
  it("una fila nueva y vacía no es un error: todavía no se llenó", () => {
    expect(locationError(newDraftLocation("k1"))).toBeNull();
  });

  it("pide la dirección cuando falta o es muy corta", () => {
    expect(locationError({ ...newDraftLocation("k1"), label: "Pocitos" })).toBe("Escribí la dirección");
    expect(locationError({ ...newDraftLocation("k1"), address: "ab" })).toBe("Escribí la dirección");
    expect(locationError({ ...newDraftLocation("k1"), address: "Av. Italia 3320" })).toBeNull();
  });

  it("controla el largo de la dirección y de la etiqueta", () => {
    expect(locationError({ ...newDraftLocation("k1"), address: "x".repeat(201) })).toContain("hasta 200");
    expect(locationError({ ...newDraftLocation("k1"), label: "x".repeat(61), address: "Av. Italia 3320" })).toContain("hasta 60");
  });

  it("hasLocationErrors mira todas las filas", () => {
    expect(hasLocationErrors([newDraftLocation("a"), { ...newDraftLocation("b"), label: "solo etiqueta" }])).toBe(true);
    expect(hasLocationErrors([newDraftLocation("a")])).toBe(false);
  });
});

describe("locationOps", () => {
  const saved = [location()];

  it("sin cambios no hay nada para mandar", () => {
    expect(locationOps(saved, toDraftLocations(saved))).toEqual([]);
  });

  it("un local nuevo se crea, con la etiqueta solo si hay", () => {
    const draft = [...toDraftLocations(saved), { ...newDraftLocation("k2"), address: " Av. Italia 3320 " }];
    expect(locationOps(saved, draft)).toEqual([{ kind: "create", key: "k2", input: { address: "Av. Italia 3320" } }]);

    const withLabel = [{ ...newDraftLocation("k3"), label: "Tres Cruces", address: "Av. Italia 3320" }];
    expect(locationOps([], withLabel)).toEqual([
      { kind: "create", key: "k3", input: { label: "Tres Cruces", address: "Av. Italia 3320" } },
    ]);
  });

  it("una fila nueva y vacía se ignora", () => {
    expect(locationOps(saved, [...toDraftLocations(saved), newDraftLocation("k2")])).toEqual([]);
  });

  it("de un local guardado manda solo lo que cambió", () => {
    const draft = [{ ...toDraftLocations(saved)[0], address: "Av. Brasil 2600", active: false }];
    expect(locationOps(saved, draft)).toEqual([
      { kind: "update", key: "l1", id: "l1", changes: { address: "Av. Brasil 2600", active: false } },
    ]);
  });

  it("borrar la etiqueta manda null", () => {
    const draft = [{ ...toDraftLocations(saved)[0], label: "" }];
    expect(locationOps(saved, draft)[0]).toMatchObject({ changes: { label: null } });
  });
});

describe("requirements y canBeVisible", () => {
  it("hace falta un local activo bien escrito y una categoría; la descripción es solo recomendada", () => {
    const withLocation = toDraftLocations([location()]);

    const todo = requirements({ category: null, description: "" }, []);
    expect(todo).toEqual({ location: false, category: false, description: false });
    expect(canBeVisible(todo)).toBe(false);

    const casi = requirements({ category: "CAFETERIA", description: "" }, withLocation);
    expect(casi).toEqual({ location: true, category: true, description: false });
    expect(canBeVisible(casi)).toBe(true);
  });

  it("un local dado de baja o a medio escribir no cuenta", () => {
    expect(requirements({ category: "CAFETERIA", description: "" }, toDraftLocations([location({ active: false })])).location).toBe(false);
    expect(requirements({ category: "CAFETERIA", description: "" }, [{ ...newDraftLocation("k"), address: "ab" }]).location).toBe(false);
  });
});
