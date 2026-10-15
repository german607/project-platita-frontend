import { Button } from "../../components/Button";

export type EstadoDeGuardado = "sin-cambios" | "con-cambios" | "guardando" | "guardado" | "error";

// La barra de abajo, siempre visible: dice si hay cambios sin guardar, si se está
// guardando, si se guardó o si falló (con "Reintentar").
export function BarraDeGuardado({
  estado,
  puedeGuardar,
  motivo,
  onGuardar,
}: {
  estado: EstadoDeGuardado;
  puedeGuardar: boolean; // hay algo para guardar y no hay errores de validación
  motivo: string | null; // por qué no se puede guardar (errores a corregir)
  onGuardar: () => void;
}) {
  const mensaje = {
    "sin-cambios": "No hay cambios para guardar",
    "con-cambios": "Tenés cambios sin guardar",
    guardando: "Guardando tus cambios…",
    guardado: "✓ Cambios guardados",
    error: "No pudimos guardar tus cambios",
  }[estado];

  return (
    <div
      role="status"
      className="sticky bottom-[66px] z-10 mt-2 flex flex-col gap-2 rounded-panel border border-borde bg-tarjeta p-3 shadow-tarjeta lg:bottom-4 lg:flex-row lg:items-center lg:justify-between lg:px-5"
    >
      <div>
        <p className={`font-extrabold ${estado === "error" ? "text-accion" : estado === "guardado" ? "text-saldo" : ""}`}>{mensaje}</p>
        {motivo && estado !== "guardando" && <p className="text-sm font-bold text-accion">{motivo}</p>}
      </div>
      <Button
        onClick={onGuardar}
        disabled={estado === "guardando" || !puedeGuardar}
        className="!h-14 !text-lg lg:!w-auto lg:px-8"
      >
        {estado === "guardando" ? "Guardando…" : estado === "error" ? "Reintentar" : "Guardar cambios"}
      </Button>
    </div>
  );
}
