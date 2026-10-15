import { useState } from "react";
import { isValidPhotoUrl, MAX_DESCRIPTION } from "../../lib/miComercio";
import { ayuda, campo, seccion, tituloSeccion } from "./estilos";

// Sección 2: descripción corta y foto. La foto es solo una URL por ahora: el
// backend todavía no guarda archivos (pedido en el TODO).
export function SeccionDatos({
  description,
  onDescription,
  photoUrl,
  onPhotoUrl,
}: {
  description: string;
  onDescription: (value: string) => void;
  photoUrl: string;
  onPhotoUrl: (value: string) => void;
}) {
  const [roto, setRoto] = useState(false); // la foto no cargó
  const urlValida = isValidPhotoUrl(photoUrl);
  const hayFoto = photoUrl.trim() !== "" && urlValida;

  return (
    <section className={seccion} aria-labelledby="datos-titulo">
      <h2 id="datos-titulo" className={tituloSeccion}>
        Datos
      </h2>
      <p className={ayuda}>Lo que cuentan de tu comercio</p>

      <div className="mt-4">
        <label htmlFor="descripcion" className="mb-1.5 block text-sm font-extrabold text-suave">
          Descripción corta
        </label>
        <textarea
          id="descripcion"
          maxLength={MAX_DESCRIPTION}
          value={description}
          onChange={(e) => onDescription(e.target.value)}
          className={`${campo} h-28 resize-none py-3`}
        />
        <p className="mt-1 text-right text-sm font-bold text-suave">{`${description.length} / ${MAX_DESCRIPTION}`}</p>
      </div>

      <div className="mt-4">
        <label htmlFor="foto" className="mb-1.5 block text-sm font-extrabold text-suave">
          Foto
        </label>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex h-24 w-full flex-none items-center justify-center overflow-hidden rounded-tarjeta bg-fondo text-sm font-bold text-suave lg:w-40">
            {hayFoto && !roto ? (
              <img src={photoUrl.trim()} alt="Vista previa de la foto" className="h-full w-full object-cover" onError={() => setRoto(true)} />
            ) : (
              "vista previa"
            )}
          </div>
          <div className="flex-1">
            <input
              id="foto"
              type="url"
              inputMode="url"
              autoComplete="off"
              placeholder="https://…/foto.jpg"
              value={photoUrl}
              onChange={(e) => {
                setRoto(false);
                onPhotoUrl(e.target.value);
              }}
              className={`${campo} h-14`}
            />
            {!urlValida && <p className="mt-1 text-sm font-bold text-accion">Tiene que ser un enlace que empiece con http:// o https://</p>}
            {urlValida && roto && <p className="mt-1 text-sm font-bold text-accion">No pudimos abrir esa foto. Revisá el enlace.</p>}
            <div className="mt-2 flex items-center gap-3">
              <button
                type="button"
                disabled={photoUrl.trim() === ""}
                onClick={() => {
                  setRoto(false);
                  onPhotoUrl("");
                }}
                className="text-sm font-extrabold text-accion underline disabled:opacity-40"
              >
                Quitar
              </button>
              <p className="text-sm font-bold text-suave">Por ahora la foto se carga con un enlace.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
