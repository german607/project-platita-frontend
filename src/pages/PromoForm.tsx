import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button, ButtonLink } from "../components/Button";
import { EmptyState, ErrorState, LoadingState } from "../components/states";
import { createBonusRule, listBonusRules, updateBonusRule } from "../lib/api/endpoints";
import type { BonusRule } from "../lib/api/types";
import { useMerchantId } from "../lib/merchant";
import { formatPesos, parsePesos, pesosToCents } from "../lib/money";
import { Interruptor } from "./Promos";
import { routes } from "../lib/routes";

// Crear o editar una promo ("Cargando desde $1.000, le regalo $200"). Es la
// misma pantalla para las dos cosas: con :ruleId edita, sin él crea.
// Diseño: docs/DISENO.md.

const MAX_PESOS = 1_000_000; // mismo tope que el backend

const MAX_NAME = 80; // mismos topes que el backend
const MAX_DESCRIPTION = 280;

const label = "mb-1.5 block text-sm font-extrabold text-suave";
const textField =
  "w-full rounded-[20px] border-2 border-borde bg-tarjeta px-[18px] font-texto text-base font-bold placeholder:text-suave";
const field =
  "h-16 w-full rounded-[20px] border-[3px] border-tinta bg-tarjeta px-[18px] font-titulo text-[32px] font-extrabold placeholder:text-borde";

export function PromoForm() {
  const { ruleId } = useParams();
  const merchantId = useMerchantId();

  const rules = useQuery({ queryKey: ["bonus-rules", merchantId], queryFn: () => listBonusRules(merchantId) });

  if (rules.isPending) return <LoadingState label="Cargando promo…" />;
  if (rules.isError) return <ErrorState error={rules.error} onRetry={() => void rules.refetch()} />;

  const rule = ruleId ? rules.data.data.find((r) => r.id === ruleId) : undefined;
  if (ruleId && !rule) {
    return (
      <EmptyState
        title="No encontramos esa promo"
        action={
          <ButtonLink to={routes.comercio.promos} variant="mostaza" className="max-w-xs">
            Volver a las promos
          </ButtonLink>
        }
      />
    );
  }

  // El formulario se monta recién con las promos cargadas, así parte con los
  // valores de la promo que se edita.
  return <Formulario rule={rule} all={rules.data.data} merchantId={merchantId} />;
}

// Un monto de pesos válido para una promo (más que 0 y dentro del tope), o null.
const valid = (text: string) => {
  const n = parsePesos(text);
  return n !== null && n > 0 && n <= MAX_PESOS ? n : null;
};

function Formulario({ rule, all, merchantId }: { rule: BonusRule | undefined; all: BonusRule[]; merchantId: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [min, setMin] = useState(rule ? String(rule.minTopUp / 100) : "");
  const [bonus, setBonus] = useState(rule ? String(rule.bonusAmount / 100) : "");
  const [active, setActive] = useState(rule?.active ?? true);
  const [ruleName, setRuleName] = useState(rule?.name ?? "");
  const [description, setDescription] = useState(rule?.description ?? "");

  const minPesos = valid(min);
  const bonusPesos = valid(bonus);
  // Los dos montos en centésimos, o null si falta alguno o es inválido.
  const amounts =
    minPesos !== null && bonusPesos !== null
      ? { min: pesosToCents(minPesos), bonus: pesosToCents(bonusPesos) }
      : null;

  // Con dos promos activas del mismo mínimo, el backend aplica una sola.
  const repetida =
    minPesos !== null &&
    active &&
    all.some((r) => r.id !== rule?.id && r.active && r.minTopUp === pesosToCents(minPesos));

  const save = useMutation({
    // Vacío, el nombre y la descripción no se mandan al crear y se borran (null) al editar.
    mutationFn: (input: { minTopUp: number; bonusAmount: number; active: boolean; name: string; description: string }) =>
      rule
        ? updateBonusRule(rule.id, { ...input, name: input.name || null, description: input.description || null })
        : createBonusRule(merchantId, {
            ...input,
            name: input.name || undefined,
            description: input.description || undefined,
          }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["bonus-rules", merchantId] });
      navigate(routes.comercio.promos);
    },
  });

  return (
    <section className="mx-auto flex max-w-xl flex-col gap-4">
      <h1 className="flex items-baseline gap-2 font-titulo text-[28px] font-extrabold">
        <Link to={routes.comercio.promos} aria-label="Volver a las promos">
          ←
        </Link>
        <span>{rule ? "Editar promo" : "Nueva promo"}</span>
      </h1>

      <div>
        <label htmlFor="desde" className={label}>
          Cargando desde
        </label>
        <input
          id="desde"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder="$1.000"
          value={min}
          onChange={(e) => setMin(e.target.value)}
          className={field}
        />
        {min.trim() !== "" && minPesos === null && <Invalido />}
      </div>

      <div>
        <label htmlFor="regalo" className={label}>
          Le regalo
        </label>
        <input
          id="regalo"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder="$200"
          value={bonus}
          onChange={(e) => setBonus(e.target.value)}
          className={field}
        />
        {bonus.trim() !== "" && bonusPesos === null && <Invalido />}
      </div>

      <div>
        <label htmlFor="nombre" className={label}>
          Nombre (opcional)
        </label>
        <input
          id="nombre"
          type="text"
          autoComplete="off"
          maxLength={MAX_NAME}
          placeholder="Ej: Promo de verano"
          value={ruleName}
          onChange={(e) => setRuleName(e.target.value)}
          className={`${textField} h-14`}
        />
      </div>

      <div>
        <label htmlFor="descripcion" className={label}>
          Descripción (opcional)
        </label>
        <textarea
          id="descripcion"
          maxLength={MAX_DESCRIPTION}
          placeholder="Ej: Válida hasta fin de mes"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={`${textField} h-24 resize-none py-3`}
        />
      </div>

      <Interruptor active={active} label="Promo activa" onChange={setActive} />

      {repetida && (
        <p className="px-1 text-sm text-accion">
          Ya hay otra promo activa con ese mínimo. Cuando un cliente cargue esa plata, se aplica una sola.
        </p>
      )}

      {amounts && (
        <div className="rounded-[24px] bg-saldo px-[18px] py-4 text-tarjeta">
          <p className="text-sm">Así lo ve tu cliente</p>
          <p className="mt-1 font-titulo text-[22px] font-extrabold leading-[1.2]">
            {`Cargá ${formatPesos(amounts.min)} y recibís ${formatPesos(amounts.min + amounts.bonus)}`}
          </p>
        </div>
      )}

      {save.isError && <ErrorState error={save.error} />}

      <div className="flex flex-col gap-2.5">
        <Button
          disabled={amounts === null || save.isPending}
          onClick={() =>
            minPesos !== null &&
            bonusPesos !== null &&
            save.mutate({
              minTopUp: minPesos,
              bonusAmount: bonusPesos,
              active,
              name: ruleName.trim(),
              description: description.trim(),
            })
          }
        >
          {save.isPending ? "Guardando…" : "Guardar promo"}
        </Button>
        <ButtonLink to={routes.comercio.promos} variant="borde">
          Cancelar
        </ButtonLink>
      </div>
    </section>
  );
}

function Invalido() {
  return <p className="mt-1 px-1 text-sm text-accion">Escribí un monto válido (hasta {formatPesos(MAX_PESOS * 100)}).</p>;
}
