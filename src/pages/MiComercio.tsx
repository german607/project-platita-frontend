import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { ErrorState, LoadingState } from "../components/states";
import { ApiError } from "../lib/api/client";
import {
  createLocation,
  getMerchant,
  listBonusRules,
  listLocations,
  updateLocation,
  updateMerchant,
  type MerchantProfileChanges,
} from "../lib/api/endpoints";
import type { Location, Merchant, OpeningHours } from "../lib/api/types";
import { categoryPlural } from "../lib/categories";
import { formatLongDate } from "../lib/dates";
import { hasHoursErrors } from "../lib/hours";
import { useMerchantId } from "../lib/merchant";
import {
  canBeVisible,
  categoryUnlockDate,
  hasLocationErrors,
  isValidPhotoUrl,
  locationOps,
  profileChanges,
  profileDraft,
  requirements,
  toDraftLocations,
  type DraftLocation,
  type LocationOp,
  type ProfileDraft,
} from "../lib/miComercio";
import { BarraDeGuardado, type EstadoDeGuardado } from "./mi-comercio/BarraDeGuardado";
import { SeccionAparecer } from "./mi-comercio/SeccionAparecer";
import { SeccionCategoria } from "./mi-comercio/SeccionCategoria";
import { SeccionDatos } from "./mi-comercio/SeccionDatos";
import { SeccionHorarios } from "./mi-comercio/SeccionHorarios";
import { SeccionLocales } from "./mi-comercio/SeccionLocales";

// "Mi comercio": el perfil público del comercio, lo que ven los clientes en su
// app. Lo editan el dueño o el personal. Diseño: docs/DISENO.md.
//
// Es un solo formulario con una barra de guardado. Por detrás son varias
// llamadas (el comercio y cada local), así que guardar hace lo siguiente:
//   - manda solo lo que cambió;
//   - si se apaga "Aparecer en la app", primero se guarda el comercio y después
//     los locales (así se puede dar de baja el único local); si no, al revés
//     (así el local ya existe cuando se prende);
//   - lo que ya se guardó no se vuelve a mandar al reintentar (los locales
//     nuevos adoptan su id apenas se crean, para no duplicarlos).

type Servidor = { merchant: Merchant; locations: Location[] };
type Errores = { visible: string | null; category: string | null; locations: string | null };
const SIN_ERRORES: Errores = { visible: null, category: null, locations: null };

export function MiComercio() {
  const merchantId = useMerchantId();

  const merchant = useQuery({ queryKey: ["merchant", merchantId], queryFn: () => getMerchant(merchantId) });
  const locations = useQuery({ queryKey: ["locations", merchantId], queryFn: () => listLocations(merchantId) });
  // Solo para saber si mostrar "Promo activa" en la vista previa; si falla, se ignora.
  const rules = useQuery({ queryKey: ["bonus-rules", merchantId], queryFn: () => listBonusRules(merchantId) });

  if (merchant.isPending || locations.isPending) return <LoadingState label="Cargando tu comercio…" />;
  if (merchant.isError) return <ErrorState error={merchant.error} onRetry={() => void merchant.refetch()} />;
  if (locations.isError) return <ErrorState error={locations.error} onRetry={() => void locations.refetch()} />;

  return (
    <Formulario
      merchantId={merchantId}
      inicial={{ merchant: merchant.data, locations: locations.data.data }}
      hasPromo={rules.data?.data.some((r) => r.active) ?? false}
    />
  );
}

function Formulario({ merchantId, inicial, hasPromo }: { merchantId: string; inicial: Servidor; hasPromo: boolean }) {
  const queryClient = useQueryClient();
  const claves = useRef(0);
  const nuevaClave = () => `nuevo-${++claves.current}`;

  // Lo último que se sabe que está guardado, y lo que se está editando.
  const [servidor, setServidor] = useState<Servidor>(inicial);
  const [perfil, setPerfil] = useState<ProfileDraft>(() => profileDraft(inicial.merchant));
  const [locales, setLocales] = useState<DraftLocation[]>(() => toDraftLocations(inicial.locations));

  const [estado, setEstado] = useState<"quieto" | "guardando" | "guardado" | "error">("quieto");
  const [errores, setErrores] = useState<Errores>(SIN_ERRORES);

  // Tocar cualquier cosa vuelve la barra a "tenés cambios" y limpia el error de ese tema.
  const editar = (tema?: keyof Errores) => {
    if (estado !== "guardando") setEstado("quieto");
    if (tema) setErrores((e) => ({ ...e, [tema]: null }));
  };

  // ---- Lo derivado ----
  const cambios = profileChanges(servidor.merchant, perfil);
  const operaciones = locationOps(servidor.locations, locales);
  const hayCambios = Object.keys(cambios).length > 0 || operaciones.length > 0;

  const req = requirements(perfil, locales);
  const desbloqueaEl = categoryUnlockDate(servidor.merchant);

  // Lo que impide guardar (hay que corregirlo antes).
  const motivo = hasHoursErrors(perfil.hours)
    ? "Revisá los horarios: hay tramos con errores."
    : hasLocationErrors(locales)
      ? "Revisá los locales: falta la dirección de alguno."
      : !isValidPhotoUrl(perfil.photoUrl)
        ? "Revisá la foto: el enlace no es válido."
        : perfil.visible && !canBeVisible(req)
          ? "Para seguir apareciendo necesitás al menos un local activo y una categoría."
          : null;

  const barra: EstadoDeGuardado =
    estado === "guardando" ? "guardando" : estado === "error" ? "error" : hayCambios ? "con-cambios" : estado === "guardado" ? "guardado" : "sin-cambios";

  // ---- Guardar ----
  async function guardarLocales(ops: LocationOp[]) {
    for (const op of ops) {
      if (op.kind === "create") {
        const creado = await createLocation(merchantId, op.input);
        setServidor((s) => ({ ...s, locations: [...s.locations, creado] }));
        // El local nuevo adopta su id ya: si algo falla después, al reintentar no se crea de nuevo.
        setLocales((prev) => prev.map((l) => (l.key === op.key ? { ...l, id: creado.id } : l)));
      } else {
        const actualizado = await updateLocation(op.id, op.changes);
        setServidor((s) => ({ ...s, locations: s.locations.map((l) => (l.id === actualizado.id ? actualizado : l)) }));
      }
    }
  }

  async function guardarPerfil(changes: MerchantProfileChanges) {
    if (Object.keys(changes).length === 0) return;
    const actualizado = await updateMerchant(merchantId, changes);
    setServidor((s) => ({ ...s, merchant: actualizado }));
  }

  async function guardar() {
    setEstado("guardando");
    setErrores(SIN_ERRORES);
    const apagando = servidor.merchant.visible && cambios.visible === false;

    try {
      if (apagando) {
        await guardarPerfil(cambios);
        await guardarLocales(operaciones);
      } else {
        await guardarLocales(operaciones);
        await guardarPerfil(cambios);
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["merchant", merchantId] }),
        queryClient.invalidateQueries({ queryKey: ["locations", merchantId] }),
        queryClient.invalidateQueries({ queryKey: ["places"] }),
      ]);
      setEstado("guardado");
    } catch (error) {
      manejarError(error);
    }
  }

  function manejarError(error: unknown) {
    if (error instanceof ApiError) {
      if (error.code === "CATEGORY_CHANGE_TOO_SOON") {
        const desde = (error.details as { availableAt?: string } | undefined)?.availableAt;
        setPerfil((p) => ({ ...p, category: servidor.merchant.category }));
        setErrores({
          ...SIN_ERRORES,
          category: desde ? `Todavía no podés cambiarla. Podés cambiarla desde el ${formatLongDate(desde)}` : "Todavía no podés cambiarla.",
        });
        setEstado("quieto");
        return;
      }
      if (error.code === "PROFILE_INCOMPLETE") {
        setPerfil((p) => ({ ...p, visible: false }));
        setErrores({ ...SIN_ERRORES, visible: error.message });
        setEstado("quieto");
        return;
      }
      if (error.code === "LOCATION_REQUIRED_WHILE_VISIBLE") {
        setErrores({
          ...SIN_ERRORES,
          locations: "No podés dar de baja el único local mientras aparecés en la app. Apagá “Aparecer en la app” primero o agregá otro local.",
        });
        setEstado("quieto");
        return;
      }
    }
    setEstado("error");
  }

  // ---- Qué se ve ----
  const principal = locales.find((l) => l.active && l.address.trim() !== "");
  const vista = {
    name: servidor.merchant.name,
    categoria: perfil.category ? categoryPlural(perfil.category) : "Sin categoría",
    direccion: principal ? principal.address.trim() : null,
    photoUrl: isValidPhotoUrl(perfil.photoUrl) && perfil.photoUrl.trim() !== "" ? perfil.photoUrl.trim() : null,
    hasPromo,
  };

  const irALocales = () => document.getElementById("locales")?.scrollIntoView?.({ behavior: "smooth" });

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="font-titulo text-[28px] font-extrabold">Mi comercio</h1>
        <p className="font-bold text-suave">Esto es lo que ven tus clientes en su app.</p>
      </header>

      <SeccionAparecer
        visible={perfil.visible}
        onChange={(visible) => {
          editar("visible");
          setPerfil((p) => ({ ...p, visible }));
        }}
        req={req}
        error={errores.visible}
        vista={vista}
        onIrALocales={irALocales}
      />

      <SeccionDatos
        description={perfil.description}
        onDescription={(description) => {
          editar();
          setPerfil((p) => ({ ...p, description }));
        }}
        photoUrl={perfil.photoUrl}
        onPhotoUrl={(photoUrl) => {
          editar();
          setPerfil((p) => ({ ...p, photoUrl }));
        }}
      />

      <SeccionCategoria
        value={perfil.category}
        onChange={(category) => {
          editar("category");
          setPerfil((p) => ({ ...p, category }));
        }}
        desbloqueaEl={desbloqueaEl}
        error={errores.category}
      />

      <SeccionLocales
        locations={locales}
        onChange={(list) => {
          editar("locations");
          setLocales(list);
        }}
        nuevaClave={nuevaClave}
        error={errores.locations}
      />

      <SeccionHorarios
        hours={perfil.hours}
        onChange={(hours: OpeningHours) => {
          editar();
          setPerfil((p) => ({ ...p, hours }));
        }}
      />

      <BarraDeGuardado estado={barra} puedeGuardar={hayCambios && motivo === null} motivo={motivo} onGuardar={() => void guardar()} />
    </div>
  );
}
