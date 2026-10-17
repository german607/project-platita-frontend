// Cómo se nombra a un cliente en el área del comercio. El comercio lo anota a
// su manera ("Juanito"); la persona tiene además su propio nombre ("Juan").
// Se muestra el del comercio y, aparte y más chico, el de la persona, salvo que
// coincidan (sin importar mayúsculas ni tildes) o falte alguno.
type Named = { name: string | null; userName?: string | null };

const key = (text: string) =>
  text.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().replace(/\s+/g, " ").toLowerCase();

export function customerNames(customer: Named, fallback: string): { main: string; alias: string | null } {
  const local = customer.name?.trim() || null;
  const own = customer.userName?.trim() || null;
  if (!local) return { main: own ?? fallback, alias: null };
  if (!own || key(own) === key(local)) return { main: local, alias: null };
  return { main: local, alias: own };
}
