import type { OpeningHours, TimeRange, Weekday } from "./api/types";

// Horarios del comercio: una semana tipo, con uno o más tramos por día, en hora
// de Montevideo. Lista vacía = cerrado. Las reglas son las del backend: cada
// tramo con desde < hasta y sin superponerse con otro del mismo día (que uno
// termine justo donde empieza el otro sirve).

export const WEEKDAYS: { key: Weekday; label: string }[] = [
  { key: "mon", label: "Lunes" },
  { key: "tue", label: "Martes" },
  { key: "wed", label: "Miércoles" },
  { key: "thu", label: "Jueves" },
  { key: "fri", label: "Viernes" },
  { key: "sat", label: "Sábado" },
  { key: "sun", label: "Domingo" },
];

export const emptyHours = (): OpeningHours => ({ mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] });

// "24:00" solo vale como cierre (si no, cerrar a medianoche sería 00:00, que es
// antes que la hora de apertura).
const FROM = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const TO = /^(?:(?:[01]\d|2[0-3]):[0-5]\d|24:00)$/;
const validFrom = (value: string) => FROM.test(value);
const validTo = (value: string) => TO.test(value);

// Máximo de tramos por día que acepta el backend.
export const MAX_RANGES_PER_DAY = 6;

function minutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

// El error de cada tramo de un día (null = está bien), en el mismo orden.
export function dayErrors(ranges: TimeRange[]): (string | null)[] {
  return ranges.map((range, i) => {
    if (!validFrom(range.from) || !validTo(range.to)) return "Elegí la hora";
    if (minutes(range.from) >= minutes(range.to)) return "“Hasta” tiene que ser después de “desde”";
    for (let j = 0; j < i; j++) {
      const before = ranges[j];
      if (!validFrom(before.from) || !validTo(before.to)) continue;
      if (minutes(range.from) < minutes(before.to) && minutes(before.from) < minutes(range.to)) {
        return `Se superpone con el tramo anterior (${before.from} a ${before.to})`;
      }
    }
    return null;
  });
}

export function hoursErrors(hours: OpeningHours): Record<Weekday, (string | null)[]> {
  return Object.fromEntries(WEEKDAYS.map(({ key }) => [key, dayErrors(hours[key])])) as Record<
    Weekday,
    (string | null)[]
  >;
}

export const hasHoursErrors = (hours: OpeningHours) =>
  WEEKDAYS.some(({ key }) => dayErrors(hours[key]).some((error) => error !== null));

// Cada día con sus tramos de menor a mayor hora de inicio.
export function sortedHours(hours: OpeningHours): OpeningHours {
  const result = emptyHours();
  for (const { key } of WEEKDAYS) {
    result[key] = hours[key].map((r) => ({ from: r.from, to: r.to })).sort((a, b) => a.from.localeCompare(b.from));
  }
  return result;
}

export function sameHours(a: OpeningHours, b: OpeningHours): boolean {
  return JSON.stringify(sortedHours(a)) === JSON.stringify(sortedHours(b));
}

// Copia los tramos de un día a todos los demás.
export function copyToAllDays(hours: OpeningHours, source: Weekday): OpeningHours {
  const result = emptyHours();
  for (const { key } of WEEKDAYS) result[key] = hours[source].map((r) => ({ ...r }));
  return result;
}

// El tramo que se propone al "Agregar tramo".
export function nextRange(ranges: TimeRange[]): TimeRange {
  if (ranges.length === 0) return { from: "09:00", to: "13:00" };
  const last = ranges[ranges.length - 1].to;
  if (validTo(last) && minutes(last) <= minutes("16:00")) return { from: "16:00", to: "20:00" };
  return { from: validFrom(last) ? last : "16:00", to: "23:59" };
}

// "Abierto ahora" para el detalle de un lugar. `now` es la hora de la máquina.
export function isOpenNow(hours: OpeningHours, now: Date = new Date()): boolean {
  const keys: Weekday[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const current = now.getHours() * 60 + now.getMinutes();
  return hours[keys[now.getDay()]].some((r) => validFrom(r.from) && validTo(r.to) && minutes(r.from) <= current && current < minutes(r.to));
}
