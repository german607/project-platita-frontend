import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ButtonLink } from "../components/Button";
import { EmptyState, ErrorState, LoadingState } from "../components/states";
import { listBonusRules, updateBonusRule } from "../lib/api/endpoints";
import type { BonusRule } from "../lib/api/types";
import { useMerchantId } from "../lib/merchant";
import { formatPesos } from "../lib/money";

// Promos: las reglas de bonificación del comercio. No se borran: se apagan
// (así el historial de bonos ya dados sigue siendo explicable). Diseño:
// docs/DISENO.md.

export function describeRule(rule: Pick<BonusRule, "minTopUp" | "bonusAmount">): string {
  return `Cargando ${formatPesos(rule.minTopUp)} o más, te regalo ${formatPesos(rule.bonusAmount)}`;
}

export function Promos() {
  const merchantId = useMerchantId();
  const queryClient = useQueryClient();

  const rules = useQuery({ queryKey: ["bonus-rules", merchantId], queryFn: () => listBonusRules(merchantId) });

  const toggle = useMutation({
    mutationFn: (input: { id: string; active: boolean }) => updateBonusRule(input.id, { active: input.active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bonus-rules", merchantId] }),
  });

  const crear = (
    <ButtonLink to="/promos/nueva" className="lg:!h-14 lg:!w-auto lg:!rounded-[20px] lg:!px-6 lg:!text-lg lg:!shadow-none">
      + Crear promo
    </ButtonLink>
  );

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-titulo text-[26px] font-extrabold lg:text-[28px]">Promos</h1>
        <div className="hidden lg:block">{crear}</div>
      </div>

      <p className="hidden text-suave lg:block">Las promos no se borran: si ya no la querés, la apagás.</p>

      {rules.isPending && <LoadingState label="Cargando promos…" />}
      {rules.isError && <ErrorState error={rules.error} onRetry={() => void rules.refetch()} />}

      {rules.isSuccess && rules.data.data.length === 0 && (
        <EmptyState
          title="Todavía no tenés promos"
          hint="Creá una para que tus clientes carguen más."
          action={
            <ButtonLink to="/promos/nueva" variant="mostaza" className="max-w-xs">
              + Crear promo
            </ButtonLink>
          }
        />
      )}

      {rules.isSuccess && rules.data.data.length > 0 && (
        <ul className="flex flex-col gap-3">
          {rules.data.data.map((rule) => (
            <li
              key={rule.id}
              className={`flex flex-col gap-2.5 rounded-[24px] bg-tarjeta px-4 py-3.5 lg:flex-row lg:items-center lg:gap-5 lg:px-6 lg:py-[18px] ${
                rule.active ? "" : "opacity-65"
              }`}
            >
              <p className="font-titulo text-xl font-extrabold leading-[1.15] lg:flex-1 lg:text-2xl">{describeRule(rule)}</p>
              <div className="flex items-center justify-between gap-3 lg:justify-end lg:gap-5">
                <Link
                  to={`/promos/${rule.id}/editar`}
                  className="flex h-12 items-center rounded-[16px] border-2 border-tinta px-[18px] font-extrabold lg:px-5"
                >
                  Editar
                </Link>
                <Interruptor
                  active={rule.active}
                  label={describeRule(rule)}
                  disabled={toggle.isPending && toggle.variables?.id === rule.id}
                  onChange={(active) => toggle.mutate({ id: rule.id, active })}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      {toggle.isError && <ErrorState error={toggle.error} />}

      <div className="lg:hidden">{crear}</div>
    </section>
  );
}

// El interruptor de "Activa / Apagada" del diseño.
export function Interruptor({
  active,
  label,
  disabled = false,
  onChange,
}: {
  active: boolean;
  label: string;
  disabled?: boolean;
  onChange: (active: boolean) => void;
}) {
  return (
    <div className="flex w-[130px] items-center gap-2 text-sm font-extrabold lg:gap-2.5 lg:text-base">
      <button
        type="button"
        role="switch"
        aria-checked={active}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!active)}
        className={`relative h-9 w-16 flex-none rounded-full transition-colors disabled:opacity-50 ${
          active ? "bg-saldo" : "bg-[#A8957E]"
        }`}
      >
        <span
          className={`absolute top-1 h-7 w-7 rounded-full bg-white transition-all ${active ? "left-8" : "left-1"}`}
        />
      </button>
      {active ? "Activa" : "Apagada"}
    </div>
  );
}
