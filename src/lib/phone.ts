// Teléfonos uruguayos. Misma regla que el backend (src/lib/phone.ts allá):
// lo que escribe la persona se normaliza a +598XXXXXXXX (8 dígitos locales).
// Este es el único lugar donde se normaliza y se formatea un teléfono.

export function normalizeUyPhone(raw: string): string | null {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("598")) digits = digits.slice(3);
  if (digits.startsWith("0")) digits = digits.slice(1);
  return /^[2-9]\d{7}$/.test(digits) ? `+598${digits}` : null;
}

export const isValidUyPhone = (raw: string) => normalizeUyPhone(raw) !== null;

// "+59899123456" → "099 123 456" (celular); "+59824001234" → "2400 1234" (fijo).
// Si no tiene forma de teléfono uruguayo, lo devuelve tal cual.
export function formatUyPhone(e164: string): string {
  const match = /^\+598([2-9]\d{7})$/.exec(e164);
  if (!match) return e164;
  const local = match[1];
  return local.startsWith("9")
    ? `0${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5)}`
    : `${local.slice(0, 4)} ${local.slice(4)}`;
}
