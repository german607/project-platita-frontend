import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button, ButtonLink } from "../components/Button";
import { ErrorState, LoadingState } from "../components/states";
import { listCustomers, upsertCustomer } from "../lib/api/endpoints";
import type { CustomerWithBalance } from "../lib/api/types";
import { visitLabel } from "../lib/dates";
import { useMerchantId } from "../lib/merchant";
import { formatPesos } from "../lib/money";
import { normalizeUyPhone } from "../lib/phone";

// Mostrador: la pantalla que se usa con el cliente delante. Se escribe el
// teléfono; si el cliente existe se ve su saldo y se pasa a Cobrar o Cargar,
// y si no, se lo anota con solo el teléfono. Diseño: docs/DISENO.md.

const card = "rounded-panel bg-tarjeta p-5 shadow-tarjeta lg:p-6";

export function Mostrador() {
  const merchantId = useMerchantId();
  const queryClient = useQueryClient();
  const [raw, setRaw] = useState("");
  const [name, setName] = useState("");

  const phone = normalizeUyPhone(raw);
  const queryKey = ["customer-by-phone", merchantId, phone];

  const lookup = useQuery({
    queryKey,
    enabled: phone !== null,
    queryFn: async (): Promise<CustomerWithBalance | null> => {
      if (phone === null) return null;
      // Teléfono exacto, sin crear nada: el backend normaliza y filtra.
      const page = await listCustomers(merchantId, { phone, limit: 1 });
      return page.data[0] ?? null;
    },
  });

  const create = useMutation({
    mutationFn: (input: { phone: string; name?: string }) => upsertCustomer(merchantId, input),
    onSuccess: (customer) => {
      queryClient.setQueryData(["customer-by-phone", merchantId, customer.phone], customer);
      setName("");
    },
  });

  const digits = raw.replace(/\D/g, "").length;

  return (
    <section className="flex flex-col gap-[18px]">
      <h1 className="hidden font-titulo text-[28px] font-extrabold lg:block">Mostrador</h1>

      <input
        type="tel"
        inputMode="tel"
        autoComplete="off"
        aria-label="Teléfono del cliente"
        placeholder="099 123 456"
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        className="h-[66px] w-full rounded-campo border-[3px] border-tinta bg-tarjeta px-[18px] font-texto text-[28px] font-bold placeholder:text-borde lg:h-[68px] lg:text-3xl"
      />

      {raw.trim() === "" && <p className="px-1 text-suave">Escribí el teléfono del cliente para empezar.</p>}

      {raw.trim() !== "" && phone === null && (
        <p className="px-1 text-suave">
          {digits < 8 ? "Seguí escribiendo…" : "Ese número no parece uruguayo. Revisalo."}
        </p>
      )}

      {phone !== null && lookup.isPending && <LoadingState label="Buscando…" />}

      {phone !== null && lookup.isError && <ErrorState error={lookup.error} onRetry={() => void lookup.refetch()} />}

      {phone !== null && lookup.isSuccess && lookup.data && <ClienteEncontrado customer={lookup.data} />}

      {phone !== null && lookup.isSuccess && lookup.data === null && (
        <>
          <div className={card}>
            <p className="font-titulo text-2xl font-extrabold lg:text-[28px]">Este número es nuevo</p>
            <p className="mt-1 text-suave">Lo anotamos con solo el teléfono.</p>
            <input
              type="text"
              autoComplete="off"
              aria-label="Nombre (opcional)"
              placeholder="Nombre (opcional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-3.5 h-14 w-full rounded-tarjeta border-2 border-borde bg-tarjeta px-4 font-texto text-[17px] font-bold placeholder:text-suave"
            />
          </div>
          {create.isError && <ErrorState error={create.error} />}
          <Button
            disabled={create.isPending}
            onClick={() => create.mutate({ phone, name: name.trim() || undefined })}
          >
            {create.isPending ? "Creando…" : "Crear cliente"}
          </Button>
        </>
      )}
    </section>
  );
}

function ClienteEncontrado({ customer }: { customer: CustomerWithBalance }) {
  return (
    <>
      <div className={card}>
        <p className="text-lg font-extrabold lg:text-xl">{customer.name ?? "Cliente sin nombre"}</p>
        <p className="text-sm text-suave">{visitLabel(customer.lastVisitAt)}</p>
        <div className="mt-3.5 rounded-[20px] bg-saldo px-4 py-3 text-tarjeta lg:rounded-[22px] lg:px-[22px] lg:py-3.5">
          <p className="text-sm lg:text-[15px]">Tiene de saldo</p>
          <p className="font-titulo text-[68px] font-extrabold leading-none tracking-[-2px] lg:text-[96px] lg:tracking-[-3px]">
            {formatPesos(customer.balance)}
          </p>
        </div>
      </div>

      <div className="mt-2 flex flex-col gap-3 lg:flex-row">
        <ButtonLink to={`/cobrar/${customer.id}`}>Cobrar</ButtonLink>
        <ButtonLink to={`/cargar/${customer.id}`} variant="mostaza">
          Cargar saldo
        </ButtonLink>
      </div>
    </>
  );
}
