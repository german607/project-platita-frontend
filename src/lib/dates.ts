// Fechas para mostrar. Se cuentan días de calendario locales (no horas), así
// "ayer a las 23:00" visto hoy a la mañana sigue siendo "ayer".

const DAY_MS = 24 * 60 * 60 * 1000;

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

export function daysSince(iso: string, now: Date = new Date()): number {
  // Math.round absorbe el cambio de horario de verano (días de 23 o 25 horas).
  return Math.round((startOfDay(now) - startOfDay(new Date(iso))) / DAY_MS);
}

// "Vino hoy", "Vino ayer", "Vino hace 12 días" o "Todavía no vino".
export function visitLabel(iso: string | null, now: Date = new Date()): string {
  if (!iso) return "Todavía no vino";
  const days = Math.max(0, daysSince(iso, now));
  if (days === 0) return "Vino hoy";
  if (days === 1) return "Vino ayer";
  return `Vino hace ${days} días`;
}

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

// Cuándo pasó algo: "Hoy 11:40", "Ayer 09:05", "2 oct" o "2 oct 2025" si es de otro año.
export function formatWhen(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  const days = daysSince(iso, now);
  const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  if (days <= 0) return `Hoy ${time}`;
  if (days === 1) return `Ayer ${time}`;
  const base = `${date.getDate()} ${MONTHS[date.getMonth()]}`;
  return date.getFullYear() === now.getFullYear() ? base : `${base} ${date.getFullYear()}`;
}

// Última visita para una tabla: "Hoy", "Hace 3 días", "Hace 1 semana", "Hace 2 meses".
export function visitShort(iso: string | null, now: Date = new Date()): string {
  if (!iso) return "Todavía no vino";
  const days = Math.max(0, daysSince(iso, now));
  if (days === 0) return "Hoy";
  if (days === 1) return "Ayer";
  if (days < 7) return `Hace ${days} días`;
  if (days < 14) return "Hace 1 semana";
  if (days < 30) return `Hace ${Math.floor(days / 7)} semanas`;
  const months = Math.floor(days / 30);
  return months === 1 ? "Hace 1 mes" : `Hace ${months} meses`;
}

// "Hace 74 días" (o "Hoy" / "Ayer"). Para listas donde importa la cantidad exacta.
export function daysAgo(iso: string, now: Date = new Date()): string {
  const days = Math.max(0, daysSince(iso, now));
  if (days === 0) return "Hoy";
  if (days === 1) return "Ayer";
  return `Hace ${days} días`;
}

// "11:40", de una fecha ISO, en la hora de la máquina.
export function formatTime(iso: string): string {
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

// Fecha ISO con la zona horaria de la máquina (2026-10-13T00:00:00-03:00): el
// backend necesita el desfase para saber cuándo empieza "hoy" para quien pregunta.
function isoWithOffset(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";
  const hh = pad(Math.floor(Math.abs(offset) / 60));
  const mm = pad(Math.abs(offset) % 60);
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}${sign}${hh}:${mm}`
  );
}

// Desde las 00:00 de hoy (inclusive) hasta las 00:00 de mañana (exclusive).
export function todayRange(now: Date = new Date()): { from: string; to: string } {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return { from: isoWithOffset(start), to: isoWithOffset(end) };
}

const MONTHS_LONG = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

// "12 de enero" (y el año si es de otro año). Para avisos como "Podés cambiarla desde el…".
export function formatLongDate(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  const base = `${date.getDate()} de ${MONTHS_LONG[date.getMonth()]}`;
  return date.getFullYear() === now.getFullYear() ? base : `${base} de ${date.getFullYear()}`;
}
