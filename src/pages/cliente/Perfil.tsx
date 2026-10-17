import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { updateUser } from "../../lib/api/endpoints";
import { friendlyMessage } from "../../lib/api/errors";
import { formatUyPhone } from "../../lib/phone";
import { routes } from "../../lib/routes";
import { useSesionCliente } from "../../lib/sesionCliente";

// Perfil: nombre (editable), teléfono verificado, QR para más adelante y cerrar
// sesión. El nombre es el de la persona (PATCH /users/:id); el que anota cada
// comercio de sus clientes no cambia.

const card = "rounded-panel bg-tarjeta p-5 shadow-tarjeta";
const MAX_NAME = 80;

export function Perfil() {
  const { sesion, cambiarNombre, salir } = useSesionCliente();
  const navigate = useNavigate();
  const [editando, setEditando] = useState(false);
  const [borrador, setBorrador] = useState("");

  const guardarNombre = useMutation({
    mutationFn: (name: string | null) => updateUser(sesion!.userId, { name }),
    onSuccess: (user) => {
      cambiarNombre(user.name);
      setEditando(false);
    },
  });

  if (!sesion) return null;

  const guardar = (e: React.FormEvent) => {
    e.preventDefault();
    guardarNombre.mutate(borrador.trim() || null);
  };

  return (
    <section className="flex flex-col gap-4">
      <h1 className="font-titulo text-[26px] font-extrabold lg:text-[28px]">Perfil</h1>

      <div className={card}>
        <p className="font-bold text-suave">Nombre</p>
        {editando ? (
          <form onSubmit={guardar} className="mt-2 flex flex-col gap-3">
            <input
              aria-label="Nombre"
              autoFocus
              maxLength={MAX_NAME}
              value={borrador}
              onChange={(e) => setBorrador(e.target.value)}
              className="h-12 w-full rounded-campo border-2 border-borde bg-fondo px-4 font-bold outline-none focus:border-accion"
            />
            <div className="flex gap-3">
              <button type="submit" disabled={guardarNombre.isPending} className="h-11 rounded-tarjeta bg-accion px-5 font-extrabold text-tarjeta disabled:opacity-50">
                {guardarNombre.isPending ? "Guardando…" : "Guardar"}
              </button>
              <button type="button" onClick={() => setEditando(false)} className="h-11 rounded-tarjeta border-2 border-tinta px-5 font-extrabold">
                Cancelar
              </button>
            </div>
            {guardarNombre.isError && (
              <p role="alert" className="font-extrabold text-accion">
                {friendlyMessage(guardarNombre.error)}
              </p>
            )}
          </form>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <p className="text-lg font-extrabold">{sesion.name ?? "Sin nombre"}</p>
            <button
              type="button"
              onClick={() => {
                setBorrador(sesion.name ?? "");
                setEditando(true);
              }}
              className="font-extrabold text-accion"
            >
              Editar
            </button>
          </div>
        )}
      </div>

      <div className={card}>
        <p className="font-bold text-suave">Teléfono</p>
        <div className="flex items-center justify-between gap-3">
          <p className="text-lg font-extrabold">{formatUyPhone(sesion.phone)}</p>
          <span className="rounded-full bg-carga-suave px-3 py-1 text-sm font-extrabold text-saldo">✓ Verificado</span>
        </div>
      </div>

      <div className={card}>
        <div className="flex items-center justify-between gap-3">
          <p className="font-extrabold">Mi código QR</p>
          <span className="rounded-full bg-arena px-3 py-1 text-sm font-extrabold text-suave">Próximamente</span>
        </div>
        <p className="mt-1 text-suave">Más adelante se lo mostrás al cajero.</p>
      </div>

      <button
        type="button"
        onClick={() => {
          salir();
          navigate(routes.entrada, { replace: true });
        }}
        className="h-12 self-start rounded-tarjeta border-2 border-accion px-6 font-extrabold text-accion"
      >
        Cerrar sesión
      </button>
    </section>
  );
}
