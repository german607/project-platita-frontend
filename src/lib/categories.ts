import type { MerchantCategory } from "./api/types";

// Las categorías del comercio. Los códigos son los del backend; las etiquetas en
// español las pone el frontend. `label` es para elegir ("Cafetería") y `plural`
// para listar ("Cafeterías").
export const CATEGORIES: { value: MerchantCategory; label: string; plural: string }[] = [
  { value: "CAFETERIA", label: "Cafetería", plural: "Cafeterías" },
  { value: "BARBERIA_PELUQUERIA", label: "Barbería y peluquería", plural: "Barberías y peluquerías" },
  { value: "PILATES_YOGA", label: "Pilates y yoga", plural: "Pilates y yoga" },
  { value: "PANADERIA", label: "Panadería", plural: "Panaderías" },
  { value: "LAVADERO", label: "Lavadero", plural: "Lavaderos" },
  { value: "OTRO", label: "Otro", plural: "Otros" },
];

export const categoryLabel = (category: MerchantCategory) =>
  CATEGORIES.find((c) => c.value === category)?.label ?? "";

export const categoryPlural = (category: MerchantCategory) =>
  CATEGORIES.find((c) => c.value === category)?.plural ?? "";
