import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "../components/Button";
import { ErrorDeMovimiento, MontoGrande, PantallaExito } from "../components/movimiento";
import { ErrorState, LoadingState } from "../components/states";
import { ApiError } from "../lib/api/client";
import { adjust, getCustomer } from "../lib/api/endpoints";
import type { MovementResult } from "../lib/api/types";
import { useIdempotencyKey } from "../lib/idempotency";
import { useMerchantId } from "../lib/merchant";
import { formatPesos, formatSigned, parsePesos, pesosToCents } from "../lib/money";

// Ajuste: corrección manual del saldo, sumando o restando. Es la única forma
// de arreglar un error: los movimientos no se editan ni se borran, así que
// queda todo el rastro, y por eso el motivo es obligatorio.
// Diseño: docs/DISENO.md.

const MAX_PESOS = 1_000_000; // mismo tope que el backend
const MAX_NOTE = 280; // mismo tope que el backend

type Sign = "mas" | "menos" | null;

const card = "rounded-panel bg-tarjeta p-5 shadow-tarjeta";
const toggle = "h-[52px] flex-1 rounded-full font-extrabold";

export function Ajuste() {
  const { customerId = "" } = useParams();
  const merchantId = useMerchantId();
  const queryClient = useQueryClient();

  // Sin signo elegido no se puede guardar: a diferencia del diseño, no se
  // preselecciona "Restar", para que no se reste por apretar de más.
  const [sign, setSign] = useState<Sign>(null);
  const [raw, setRaw] = useState("");
  const [note, setNote] = useState("");

  const customer = useQuery({
    queryKey: ["customer", customerId],
    queryFn: () => getCustomer(customerId),
    enabled: customerId !== "",
  });

  const idempotency = useIdempotencyKey();

  const guardar = useMutation({
    mutationFn: (op: { input: { amount: number; note: string }; key: string }) =>
      adjust(customerId, op.input, { idempotencyKey: op.key }),
    onSuccess: () => {
      idempotency.reset();
      void queryClient.invalidateQueries({ queryKey: ["customer", customerId] });
      void queryClient.invalidateQueries({ queryKey: ["transactions", customerId] });
      void queryClient.invalidateQueries({ queryKey: ["customers", merchantId] });
      void queryClient.invalidateQueries({ queryKey: ["customer-by-phone", merchantId] });
    },
  });

  const parsed = parsePesos(raw);
  const absolute = parsed !== null && parsed > 0 && parsed <= MAX_PESOS ? parsed : null;
  const signed = absolute === null || sign === null ? null : sign === "menos" ? -absolute : absolute;
  const cents = signed === null ? null : pesosToCents(signed);
  const trimmedNote = note.trim();

  // Una clave por operación: si hay que reintentar, se reenvía la misma y el
  // backend no registra el ajuste dos veces.
  const confirmar = () => {
    if (signed === null) return;
    const input = { amount: signed, note: trimmedNote };
    guardar.mutate({ input, key: idempotency.keyFor(JSON.stringify(input)) });
  };

  if (guardar.isSuccess) {
    return (
      <ExitoDeAjuste
        result={guardar.data}
        customerId={customerId}
        name={customer.data?.name ?? "El cliente"}
        note={trimmedNote}
        cents={cents}
      />
    );
  }
  if (customer.isPending) return <LoadingState label="Cargando al cliente…" />;
  if (customer.isError) return <ErrorState error={customer.error} onRetry={() => void customer.refetch()} />;

  const balance = customer.data.balance;
  const name = customer.data.name ?? "Cliente sin nombre";
  const after = cents === null ? null : balance + cents;
  const quedaNegativo = after !== null && after < 0;
  const puedeGuardar = cents !== null && !quedaNegativo && trimmedNote !== "" && !guardar.isPending;

  return (
    <section className="mx-auto flex max-w-xl flex-col gap-4">
      <h1 className="flex items-baseline gap-2 font-titulo text-[28px] font-extrabold">
        <Link to={`/clientes/${customerId}`} aria-label="Volver a la ficha del cliente">
          ←
        </Link>
        <span>Corregir saldo</span>
        <span className="font-texto text-lg font-bold text-suave">· {name}</span>
      </h1>

      <div className={card}>
        <label htmlFor="monto" className="text-sm text-suave">
          Cuánto sumar o restar
        </label>
        <div
          className={`flex items-baseline font-titulo text-[64px] font-extrabold leading-[1.05] tracking-[-2px] ${
            sign === "menos" ? "text-accion" : sign === "mas" ? "text-saldo" : ""
          }`}
        >
          <span aria-hidden="true">{sign === "menos" ? "−" : sign === "mas" ? "+" : ""}</span>
          <input
            id="monto"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            aria-label="Monto del ajuste"
            placeholder="$0"
            value={raw}
            onChange={(e) => {
              setRaw(e.target.value);
              if (guardar.isError) guardar.reset();
            }}
            className="w-full bg-transparent outline-none placeholder:text-borde"
          />
        </div>
      </div>
      {raw.trim() !== "" && absolute === null && (
        <p className="px-1 text-sm text-accion">Escribí un monto válido (hasta {formatPesos(MAX_PESOS * 100)}).</p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          aria-pressed={sign === "mas"}
          onClick={() => setSign("mas")}
          className={`${toggle} ${sign === "mas" ? "bg-tinta text-tarjeta" : "border-2 border-borde bg-tarjeta"}`}
        >
          + Sumar
        </button>
        <button
          type="button"
          aria-pressed={sign === "menos"}
          onClick={() => setSign("menos")}
          className={`${toggle} ${sign === "menos" ? "bg-tinta text-tarjeta" : "border-2 border-borde bg-tarjeta"}`}
        >
          − Restar
        </button>
      </div>

      <textarea
        aria-label="Motivo (obligatorio)"
        placeholder="Motivo (obligatorio)"
        maxLength={MAX_NOTE}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className={`h-[88px] w-full resize-none rounded-tarjeta border-2 bg-tarjeta px-4 py-3 font-texto text-[15px] font-bold placeholder:text-suave ${
          trimmedNote === "" ? "border-accion" : "border-borde"
        }`}
      />

      {after !== null && (
        <p className="px-1 font-extrabold">
          {`Saldo: ${formatPesos(balance)} → `}
          <span className={`font-titulo text-2xl ${quedaNegativo ? "text-accion" : ""}`}>{formatPesos(after)}</span>
        </p>
      )}
      {quedaNegativo && <p className="px-1 text-sm text-accion">El saldo no puede quedar en negativo.</p>}

      {guardar.isError && <ErrorDeAjuste error={guardar.error} onRetry={confirmar} />}

      <Button
        disabled={!puedeGuardar}
        onClick={confirmar}
      >
        {guardar.isPending ? "Guardando…" : "Guardar ajuste"}
      </Button>
    </section>
  );
}

// Si el backend rechaza porque el saldo cambió y ahora quedaría en negativo,
// se dice con las palabras de esta pantalla; el resto de los errores, como siempre.
function ErrorDeAjuste({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  if (error instanceof ApiError && error.code === "INSUFFICIENT_BALANCE") {
    return (
      <div role="alert" className="rounded-panel border border-accion bg-tarjeta p-5">
        <p className="font-titulo text-xl font-extrabold text-accion">El saldo no puede quedar en negativo.</p>
        <p className="mt-1 text-suave">Puede que el saldo haya cambiado. Volvé a la ficha y revisalo.</p>
      </div>
    );
  }
  return <ErrorDeMovimiento error={error} sustantivo="el ajuste" onRetry={onRetry} />;
}

function ExitoDeAjuste({
  result,
  customerId,
  name,
  note,
  cents,
}: {
  result: MovementResult;
  customerId: string;
  name: string;
  note: string;
  cents: number | null;
}) {
  return (
    <PantallaExito titulo="¡Ajuste guardado!" volverA={{ to: `/clientes/${customerId}`, label: "Volver a la ficha" }}>
      <p className="mt-1.5">{`${name} ahora tiene`}</p>
      <MontoGrande>{formatPesos(result.balance)}</MontoGrande>
      <p>{`${cents === null ? "" : `${formatSigned(cents)} · `}${note}`}</p>
    </PantallaExito>
  );
}
