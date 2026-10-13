import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button, ButtonLink } from "../components/Button";
import { ErrorDeMovimiento, MontoGrande, PantallaExito } from "../components/movimiento";
import { ErrorState, LoadingState } from "../components/states";
import { ApiError } from "../lib/api/client";
import { charge, getCustomer } from "../lib/api/endpoints";
import type { MovementResult } from "../lib/api/types";
import { useMerchantId } from "../lib/merchant";
import { formatPesos, parsePesos, pesosToCents } from "../lib/money";

// Cobrar: descuenta del saldo del cliente lo que consumió. Si no alcanza, no
// se cobra: se muestra cuánto le falta y se lleva a Cargar saldo.
// Diseño: docs/DISENO.md.

const MAX_PESOS = 1_000_000; // mismo tope que el backend
const MAX_NOTE = 280; // mismo tope que el backend

const card = "rounded-panel bg-tarjeta p-5 shadow-tarjeta";

export function Cobrar() {
  const { customerId = "" } = useParams();
  const merchantId = useMerchantId();
  const queryClient = useQueryClient();

  const [raw, setRaw] = useState("");
  const [note, setNote] = useState("");

  const customer = useQuery({
    queryKey: ["customer", customerId],
    queryFn: () => getCustomer(customerId),
    enabled: customerId !== "",
  });

  const cobrar = useMutation({
    mutationFn: (input: { amount: number; note?: string }) => charge(customerId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["customer", customerId] });
      void queryClient.invalidateQueries({ queryKey: ["customer-by-phone", merchantId] });
    },
  });

  const parsed = parsePesos(raw);
  const pesos = parsed !== null && parsed > 0 && parsed <= MAX_PESOS ? parsed : null;
  const cents = pesos === null ? null : pesosToCents(pesos);
  const trimmedNote = note.trim();

  if (cobrar.isSuccess) {
    return <ExitoDeCobro result={cobrar.data} note={trimmedNote} name={customer.data?.name ?? "el cliente"} />;
  }
  if (customer.isPending) return <LoadingState label="Cargando al cliente…" />;
  if (customer.isError) return <ErrorState error={customer.error} onRetry={() => void customer.refetch()} />;

  const balance = customer.data.balance;
  const name = customer.data.name ?? "Cliente sin nombre";

  // Cuánto le falta: lo calcula la pantalla con el saldo que ve y, si el saldo
  // cambió mientras tanto, lo corrige con lo que responde el backend (422).
  const faltaAhora = cents !== null && cents > balance ? cents - balance : null;
  const faltaSegunServidor = faltanteDelServidor(cobrar.error);
  const falta = faltaSegunServidor ?? faltaAhora;
  const alcanza = cents !== null && falta === null;

  return (
    <section className="flex flex-col gap-4">
      <h1 className="flex items-baseline gap-2 font-titulo text-[28px] font-extrabold">
        <Link to="/" aria-label="Volver al mostrador">
          ←
        </Link>
        <span>Cobrar</span>
        <span className="font-texto text-lg font-bold text-suave">· {name}</span>
      </h1>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr] lg:gap-7">
        <div className="flex flex-col gap-3.5">
          <div className={card}>
            <label htmlFor="monto" className="text-sm text-suave">
              ¿Cuánto es?
            </label>
            <input
              id="monto"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              aria-label="Monto a cobrar"
              placeholder="$0"
              value={raw}
              onChange={(e) => {
                setRaw(e.target.value);
                // Un monto nuevo es un cobro nuevo: se borra el error del intento anterior.
                if (cobrar.isError) cobrar.reset();
              }}
              className="block w-full bg-transparent font-titulo text-[68px] font-extrabold leading-[1.05] tracking-[-2px] outline-none placeholder:text-borde lg:text-[88px] lg:tracking-[-3px]"
            />
          </div>
          {raw.trim() !== "" && pesos === null && (
            <p className="px-1 text-sm text-accion">
              Escribí un monto válido (hasta {formatPesos(MAX_PESOS * 100)}).
            </p>
          )}

          <input
            type="text"
            autoComplete="off"
            maxLength={MAX_NOTE}
            aria-label="¿Qué se cobra? (opcional)"
            placeholder="¿Qué se cobra? (opcional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="h-14 w-full rounded-tarjeta border-2 border-borde bg-tarjeta px-4 font-texto text-[17px] font-bold placeholder:text-suave"
          />

          <div className="flex gap-3.5">
            <Dato titulo="Saldo ahora">{formatPesos(balance)}</Dato>
            <Dato titulo="Quedaría" alerta={falta !== null}>
              {cents === null ? "—" : falta !== null ? "No alcanza" : formatPesos(balance - cents)}
            </Dato>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {falta !== null && cents !== null ? (
            <>
              <div className="rounded-panel bg-accion p-5 text-tarjeta lg:p-6">
                <p className="font-titulo text-[30px] font-extrabold leading-[1.05] lg:text-5xl">{`Le faltan ${formatPesos(falta)}`}</p>
                <p className="mt-1 text-sm lg:mt-2 lg:text-base">Que cargue saldo y cobrás enseguida.</p>
              </div>
              <ButtonLink to={`/cargar/${customerId}`} variant="mostaza">
                Cargar saldo
              </ButtonLink>
              <button
                type="button"
                disabled
                className="h-14 w-full rounded-[20px] bg-arena font-titulo text-lg font-extrabold text-suave"
              >
                {`Cobrar ${formatPesos(cents)} (no disponible)`}
              </button>
            </>
          ) : (
            <>
              {cobrar.isError && <ErrorDeMovimiento error={cobrar.error} sustantivo="el cobro" />}
              <Button
                disabled={!alcanza || cobrar.isPending}
                onClick={() => pesos !== null && cobrar.mutate({ amount: pesos, note: trimmedNote || undefined })}
                className="lg:h-[72px]"
              >
                {cobrar.isPending ? "Cobrando…" : cents === null ? "Cobrar" : `Cobrar ${formatPesos(cents)}`}
              </Button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function Dato({ titulo, alerta = false, children }: { titulo: string; alerta?: boolean; children: string }) {
  return (
    <div className="flex-1 rounded-[20px] bg-tarjeta px-3.5 py-3 lg:rounded-[22px] lg:px-[18px] lg:py-3.5">
      <p className="text-[13px] text-suave lg:text-sm">{titulo}</p>
      <p className={`font-titulo text-[26px] font-extrabold lg:text-[34px] ${alerta ? "text-accion" : ""}`}>{children}</p>
    </div>
  );
}

// Si el backend rechazó el cobro por saldo insuficiente (porque el saldo
// cambió desde que se abrió la pantalla), de ahí sale cuánto falta.
function faltanteDelServidor(error: unknown): number | null {
  if (!(error instanceof ApiError) || error.code !== "INSUFFICIENT_BALANCE") return null;
  const details = error.details as { balance?: unknown; needed?: unknown } | undefined;
  if (typeof details?.balance !== "number" || typeof details.needed !== "number") return null;
  return Math.max(0, details.needed - details.balance);
}

function ExitoDeCobro({ result, note, name }: { result: MovementResult; note: string; name: string }) {
  const detalle = note ? `${note} · a ${name}` : `a ${name}`;
  return (
    <PantallaExito titulo="¡Cobrado!">
      <MontoGrande>{formatPesos(-result.transaction.amount)}</MontoGrande>
      <p>{detalle}</p>
      <p className="mt-4">{`Le quedan ${formatPesos(result.balance)}`}</p>
    </PantallaExito>
  );
}
