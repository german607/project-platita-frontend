import { customerNames } from "../lib/customerName";

// El nombre de un cliente como lo anota el comercio y, más chico al lado, el
// de la persona si es distinto: "Juanito (Juan)".
export function NombreCliente({
  customer,
  fallback = "Sin nombre",
}: {
  customer: { name: string | null; userName?: string | null };
  fallback?: string;
}) {
  const { main, alias } = customerNames(customer, fallback);
  return (
    <>
      {main}
      {alias && <span className="ml-1.5 text-[0.8em] font-bold text-suave">{`(${alias})`}</span>}
    </>
  );
}
