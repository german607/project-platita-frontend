import { formatPesos } from "../lib/money";

// La tarjeta de un comercio en la lista de Lugares: foto, nombre, categoría y
// dirección, y si tiene una promo activa. La usa la vista previa de "Mi
// comercio" y la lista de Lugares del cliente. Diseño: design/*.codigo.html.
export function TarjetaLugar({
  name,
  categoria,
  direccion,
  photoUrl,
  hasPromo,
  saldo,
}: {
  name: string;
  categoria: string;
  direccion: string | null;
  photoUrl: string | null;
  hasPromo: boolean;
  saldo?: number; // si el cliente ya tiene saldo ahí (centésimos)
}) {
  return (
    <article className="overflow-hidden rounded-panel bg-tarjeta shadow-tarjeta">
      <div className="relative h-32 bg-[repeating-linear-gradient(45deg,#EADCBC,#EADCBC_10px,#F2E6CC_10px,#F2E6CC_20px)]">
        {photoUrl ? (
          <img src={photoUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-sm font-extrabold text-suave">foto</span>
        )}
        <span
          className={`absolute left-3 top-3 rounded-full px-3 py-1 text-[13px] font-extrabold ${
            hasPromo ? "bg-saldo text-tarjeta" : "bg-arena text-suave"
          }`}
        >
          {hasPromo ? "Promo activa" : "Sin promo"}
        </span>
      </div>
      <div className="px-4 pb-4 pt-3">
        <p className="font-titulo text-xl font-extrabold leading-tight">{name}</p>
        <p className="text-sm font-bold text-suave">{[categoria, direccion].filter(Boolean).join(" · ")}</p>
        {saldo !== undefined && saldo > 0 && (
          <p className="mt-1.5 font-extrabold text-saldo">{`Tenés ${formatPesos(saldo)}`}</p>
        )}
      </div>
    </article>
  );
}
