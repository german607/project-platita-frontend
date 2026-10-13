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
