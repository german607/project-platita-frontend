import { useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "../components/Button";
import { ErrorDeMovimiento, MontoGrande, PantallaExito } from "../components/movimiento";
import { ErrorState, LoadingState } from "../components/states";
import { getBonusPreview, getCustomer, topUp } from "../lib/api/endpoints";
import type { BonusPreview, TopUpResult } from "../lib/api/types";
import { useIdempotencyKey } from "../lib/idempotency";
import { useMerchantId } from "../lib/merchant";
import { formatPesos, parsePesos, pesosToCents } from "../lib/money";
import { PAYMENT_METHODS as METHODS, paymentLabel, type PaymentMethod as Method } from "../lib/payment";
import { useDebounced } from "../lib/useDebounced";
import { routes } from "../lib/routes";

// Cargar saldo: el cliente entrega plata (efectivo o Mercado Pago, que cobra
// el comercio por su cuenta) y acá se registra su saldo, con el bono que
// corresponda. Diseño: docs/DISENO.md. Platita no toca la plata.

const QUICK_AMOUNTS = [500, 1000, 2000]; // pesos
const MAX_PESOS = 1_000_000; // mismo tope que el backend

type Choice = number | "otro" | null;

const card = "rounded-panel bg-tarjeta p-5 shadow-tarjeta";
const chip = "h-[50px] min-w-[96px] flex-1 rounded-full border-2 font-extrabold";

export function CargarSaldo() {
  const { customerId = "" } = useParams();
  const merchantId = useMerchantId();
  const queryClient = useQueryClient();

  // Sin monto elegido no se puede confirmar: a diferencia del diseño, no se
  // preselecciona $1.000, para que nadie registre una carga por apretar de más.
  const [choice, setChoice] = useState<Choice>(null);
  const [custom, setCustom] = useState("");
  const [method, setMethod] = useState<Method>("efectivo");

  const customer = useQuery({
    queryKey: ["customer", customerId],
    queryFn: () => getCustomer(customerId),
    enabled: customerId !== "",
  });
  const idempotency = useIdempotencyKey();

  const confirm = useMutation({
    mutationFn: (op: { input: { amount: number; paidWith: string }; key: string }) =>
      topUp(customerId, op.input, { idempotencyKey: op.key }),
    onSuccess: () => {
      idempotency.reset();
      void queryClient.invalidateQueries({ queryKey: ["customer", customerId] });
      void queryClient.invalidateQueries({ queryKey: ["customer-by-phone", merchantId] });
    },
  });

  const parsed = choice === "otro" ? parsePesos(custom) : choice;
  const pesos = parsed !== null && parsed > 0 && parsed <= MAX_PESOS ? parsed : null;
  const cents = pesos === null ? null : pesosToCents(pesos);

  // La vista previa del bono la calcula el backend, con la misma función que
  // la carga real. Con un monto libre se espera a que termine de escribir.
  const previewPesos = useDebounced(pesos, 250);
  const preview = useQuery({
    queryKey: ["bonus-preview", merchantId, previewPesos],
    queryFn: () => {
      if (previewPesos === null) throw new Error("Falta el monto");
      return getBonusPreview(merchantId, previewPesos);
    },
    enabled: previewPesos !== null,
  });

  if (confirm.isSuccess) {
    return <ExitoDeCarga result={confirm.data} name={customer.data?.name ?? "El cliente"} method={method} />;
  }
  if (customer.isPending) return <LoadingState label="Cargando al cliente…" />;
  if (customer.isError) return <ErrorState error={customer.error} onRetry={() => void customer.refetch()} />;

  const before = customer.data.balance;
  const name = customer.data.name ?? "Cliente sin nombre";

  // Una clave por operación: si hay que reintentar, se reenvía la misma y el
  // backend no registra la carga dos veces.
  const confirmar = () => {
    if (pesos === null) return;
    const input = { amount: pesos, paidWith: method };
    confirm.mutate({ input, key: idempotency.keyFor(JSON.stringify(input)) });
  };

  return (
    <section className="flex flex-col gap-4">
      <h1 className="flex items-baseline gap-2 font-titulo text-[28px] font-extrabold">
        <Link to={routes.comercio.mostrador} aria-label="Volver al mostrador">
          ←
        </Link>
        <span>Cargar saldo</span>
        <span className="font-texto text-lg font-bold text-suave">· {name}</span>
      </h1>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr] lg:gap-7">
        <div className="flex flex-col gap-3.5">
          <div className={card}>
            <p className="text-sm text-suave">¿Cuánto carga?</p>
            <p
              aria-live="polite"
              className="font-titulo text-[68px] font-extrabold leading-[1.05] tracking-[-2px] lg:text-[88px] lg:tracking-[-3px]"
            >
              {cents === null ? "$0" : formatPesos(cents)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {QUICK_AMOUNTS.map((amount) => (
              <button
                key={amount}
                type="button"
                aria-pressed={choice === amount}
                onClick={() => setChoice(amount)}
                className={`${chip} ${choice === amount ? "border-tinta bg-tinta text-tarjeta" : "border-borde bg-tarjeta"}`}
              >
                {formatPesos(amount * 100)}
              </button>
            ))}
            <button
              type="button"
              aria-pressed={choice === "otro"}
              onClick={() => setChoice("otro")}
              className={`${chip} ${choice === "otro" ? "border-tinta bg-tinta text-tarjeta" : "border-borde bg-tarjeta"}`}
            >
              Otro monto
            </button>
          </div>

          {choice === "otro" && (
            <div>
              <input
                type="text"
                inputMode="decimal"
                autoComplete="off"
                aria-label="Monto"
                placeholder="Ej: 1.250"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                className="h-14 w-full rounded-tarjeta border-2 border-borde bg-tarjeta px-4 font-texto text-xl font-bold placeholder:text-suave"
              />
              {custom.trim() !== "" && pesos === null && (
                <p className="mt-1 px-1 text-sm text-accion">
                  Escribí un monto válido (hasta {formatPesos(MAX_PESOS * 100)}).
                </p>
              )}
            </div>
          )}

          <p className="mt-1.5 text-sm font-extrabold text-suave">¿Cómo paga?</p>
          <div className="grid grid-cols-3 gap-2">
            {METHODS.map((m) => (
              <button
                key={m.value}
                type="button"
                aria-pressed={method === m.value}
                onClick={() => setMethod(m.value)}
                className={`h-[54px] rounded-tarjeta text-sm font-extrabold ${
                  method === m.value ? "border-[3px] border-tinta bg-mostaza" : "border-2 border-borde bg-tarjeta"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {cents !== null && (
            <Vista cents={cents} before={before} preview={preview} esperando={previewPesos !== pesos} />
          )}

          {confirm.isError && <ErrorDeMovimiento error={confirm.error} sustantivo="la carga" onRetry={confirmar} />}

          <Button
            disabled={pesos === null || confirm.isPending}
            onClick={confirmar}
            className="lg:h-[72px]"
          >
            {confirm.isPending ? "Registrando…" : "Listo, confirmar"}
          </Button>
        </div>
      </div>
    </section>
  );
}

// Lo que va a pasar si se confirma, según el backend. El bono definitivo es
// el que devuelve la carga al confirmar.
function Vista({
  cents,
  before,
  preview,
  esperando,
}: {
  cents: number;
  before: number;
  preview: UseQueryResult<BonusPreview>;
  esperando: boolean;
}) {
  if (esperando || preview.isPending) {
    return <div className={`${card} text-suave`}>Calculando el bono…</div>;
  }
  if (preview.isError) {
    return (
      <div className={`${card} text-suave`}>
        No pudimos calcular el bono. Al confirmar se aplica el que corresponda.
      </div>
    );
  }

  const { rule, bonus, total } = preview.data;

  return (
    <div className="rounded-panel bg-saldo p-5 text-tarjeta lg:p-6">
      {rule ? (
        <>
          <p className="text-sm">{`¡Le regalás ${formatPesos(bonus)} de bono!`}</p>
          <p className="mt-1">{`${formatPesos(cents)} + ${formatPesos(bonus)} de bono`}</p>
          {rule.name && <p className="mt-1 text-sm">{`Promo: ${rule.name}`}</p>}
        </>
      ) : (
        <p className="text-sm">Sin bono para este monto</p>
      )}
      <p className="mt-3 text-sm">Saldo nuevo</p>
      <p className="font-titulo text-[56px] font-extrabold leading-none tracking-[-2px] lg:text-[72px]">
        {formatPesos(before + total)}
      </p>
      <p className="mt-2 text-sm">{`Antes tenía ${formatPesos(before)}`}</p>
    </div>
  );
}

function ExitoDeCarga({ result, name, method }: { result: TopUpResult; name: string; method: Method }) {
  const methodLabel = paymentLabel(method);
  const bonus = result.bonus ? ` + ${formatPesos(result.bonus.amount)} de bono` : "";

  return (
    <PantallaExito titulo="¡Carga lista!">
      <p className="mt-1.5">{`${name} ahora tiene`}</p>
      <MontoGrande>{formatPesos(result.balance)}</MontoGrande>
      <p>{`${formatPesos(result.topup.amount)}${bonus} · ${methodLabel}`}</p>
    </PantallaExito>
  );
}
