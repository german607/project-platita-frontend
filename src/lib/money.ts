// Dinero. La API recibe PESOS y devuelve CENTÉSIMOS de peso (enteros).
// Este es el único lugar donde se convierte y se formatea: ninguna pantalla
// hace esas cuentas por su cuenta (ver docs/AGENTS.md).

export const pesosToCents = (pesos: number) => Math.round(pesos * 100);
export const centsToPesos = (cents: number) => cents / 100;

// 120000 → "$1.200"; 150 → "$1,50"; -15000 → "-$150".
// Punto de miles, coma decimal, y sin decimales si el monto es entero.
export function formatPesos(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(Math.round(cents));
  const pesos = Math.floor(abs / 100);
  const rest = abs % 100;
  const grouped = String(pesos).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const decimals = rest ? `,${String(rest).padStart(2, "0")}` : "";
  return `${sign}$${grouped}${decimals}`;
}

// Lo que escribe una persona → pesos, o null si no se entiende.
// Acepta "1200", "1.200", "1200,50", "$ 1.200,50". No acepta negativos.
export function parsePesos(input: string): number | null {
  let s = input.replace(/[$\s]/g, "");
  if (!s) return null;

  if (s.includes(",")) {
    // La coma es el decimal y los puntos son miles.
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    // Solo puntos con forma de miles: "1.200" es mil doscientos.
    s = s.replace(/\./g, "");
  }

  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  return Number(s);
}
