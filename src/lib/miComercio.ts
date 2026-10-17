import type { MerchantProfileChanges } from "./api/endpoints";
import type { Location, Merchant, MerchantCategory, OpeningHours } from "./api/types";
import { sameHours, sortedHours } from "./hours";

// La lógica de la pestaña "Mi comercio", sin pantalla: qué cambió respecto de lo
// guardado, qué falta para poder aparecer en la app y cuándo se puede cambiar la
// categoría. Los límites son los del backend.

export const MAX_DESCRIPTION = 280;
export const MAX_LABEL = 60;
export const MIN_ADDRESS = 3;
export const MAX_ADDRESS = 200;
export const CATEGORY_LOCK_DAYS = 90;

const DAY_MS = 24 * 60 * 60 * 1000;

// ---------- Perfil ----------

// Lo que se está editando del comercio. Los textos van como se escriben (vacío = sin valor).
export interface ProfileDraft {
  description: string;
  photoUrl: string;
  category: MerchantCategory | null;
  visible: boolean;
  hours: OpeningHours;
}

export const profileDraft = (merchant: Merchant): ProfileDraft => ({
  description: merchant.description ?? "",
  photoUrl: merchant.photoUrl ?? "",
  category: merchant.category,
  visible: merchant.visible,
  hours: sortedHours(merchant.openingHours),
});

// Solo lo que cambió: el backend recibe un PATCH con esos campos.
export function profileChanges(server: Merchant, draft: ProfileDraft): MerchantProfileChanges {
  const changes: MerchantProfileChanges = {};

  const description = draft.description.trim();
  if (description !== (server.description ?? "")) changes.description = description === "" ? null : description;

  const photoUrl = draft.photoUrl.trim();
  if (photoUrl !== (server.photoUrl ?? "")) changes.photoUrl = photoUrl === "" ? null : photoUrl;

  if (draft.category !== null && draft.category !== server.category) changes.category = draft.category;
  if (draft.visible !== server.visible) changes.visible = draft.visible;
  if (!sameHours(draft.hours, server.openingHours)) changes.openingHours = sortedHours(draft.hours);

  return changes;
}

// Vacía vale; si no, tiene que ser una URL http o https.
export function isValidPhotoUrl(value: string): boolean {
  const url = value.trim();
  if (url === "") return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

// ---------- Categoría ----------

// Desde cuándo se puede volver a cambiar la categoría, o null si ya se puede.
// La primera vez se elige libre. El backend es quien manda (responde 422
// CATEGORY_CHANGE_TOO_SOON); esto es para avisar de antemano en la pantalla.
export function categoryUnlockDate(merchant: Merchant, now: Date = new Date()): Date | null {
  if (!merchant.category || !merchant.categoryChangedAt) return null;
  const unlock = new Date(new Date(merchant.categoryChangedAt).getTime() + CATEGORY_LOCK_DAYS * DAY_MS);
  return unlock.getTime() > now.getTime() ? unlock : null;
}

// ---------- Locales ----------

// Un local en edición. Sin `id` es uno nuevo que todavía no se guardó.
export interface DraftLocation {
  key: string; // identifica la fila en la pantalla (el id si ya existe)
  id?: string;
  label: string;
  address: string;
  active: boolean;
}

export const toDraftLocations = (locations: Location[]): DraftLocation[] =>
  locations.map((l) => ({ key: l.id, id: l.id, label: l.label ?? "", address: l.address, active: l.active }));

export const newDraftLocation = (key: string): DraftLocation => ({ key, label: "", address: "", active: true });

// Una fila nueva y vacía no cuenta: es un lugar reservado que todavía no se llenó.
const isBlank = (l: DraftLocation) => l.id === undefined && l.label.trim() === "" && l.address.trim() === "";

// El error de un local (null = está bien).
export function locationError(l: DraftLocation): string | null {
  if (isBlank(l)) return null;
  const address = l.address.trim();
  if (address.length < MIN_ADDRESS) return "Escribí la dirección";
  if (address.length > MAX_ADDRESS) return `La dirección puede tener hasta ${MAX_ADDRESS} caracteres`;
  if (l.label.trim().length > MAX_LABEL) return `La etiqueta puede tener hasta ${MAX_LABEL} caracteres`;
  return null;
}

export const hasLocationErrors = (list: DraftLocation[]) => list.some((l) => locationError(l) !== null);

export type LocationOp =
  | { kind: "create"; key: string; input: { label?: string; address: string } }
  | { kind: "update"; key: string; id: string; changes: { label?: string | null; address?: string; active?: boolean } };

// Qué hay que mandarle al backend para que los locales guardados queden como se editaron.
export function locationOps(server: Location[], draft: DraftLocation[]): LocationOp[] {
  const ops: LocationOp[] = [];
  for (const l of draft) {
    if (isBlank(l)) continue;
    const label = l.label.trim();
    const address = l.address.trim();

    if (l.id === undefined) {
      ops.push({ kind: "create", key: l.key, input: { ...(label ? { label } : {}), address } });
      continue;
    }

    const saved = server.find((s) => s.id === l.id);
    if (!saved) continue;
    const changes: { label?: string | null; address?: string; active?: boolean } = {};
    if (label !== (saved.label ?? "")) changes.label = label === "" ? null : label;
    if (address !== saved.address) changes.address = address;
    if (l.active !== saved.active) changes.active = l.active;
    if (Object.keys(changes).length > 0) ops.push({ kind: "update", key: l.key, id: l.id, changes });
  }
  return ops;
}

// ---------- Aparecer en la app ----------

export interface Requirements {
  location: boolean; // al menos un local activo y bien escrito
  category: boolean; // una categoría elegida
  description: boolean; // recomendada: el backend no la exige
}

export function requirements(draft: Pick<ProfileDraft, "category" | "description">, locations: DraftLocation[]): Requirements {
  return {
    location: locations.some((l) => l.active && !isBlank(l) && locationError(l) === null),
    category: draft.category !== null,
    description: draft.description.trim() !== "",
  };
}

// Se puede prender si hay local y categoría (lo mismo que exige el backend).
export const canBeVisible = (r: Requirements) => r.location && r.category;
