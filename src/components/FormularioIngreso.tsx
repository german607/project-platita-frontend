import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Button } from "../components/Button";
import { ApiError } from "../lib/api/client";
import { friendlyMessage } from "../lib/api/errors";
import { getAuthConfig, requestCode, verifyCode } from "../lib/api/endpoints";
import { formatUyPhone, normalizeUyPhone } from "../lib/phone";
import { CODE_LENGTH, RESEND_SECONDS, useSesion } from "../lib/sesion";

// Formulario de entrada (en la pantalla de inicio) en dos pasos: celular → código de 6 dígitos que le llega
// por mensaje (POST /auth/request-code y /auth/verify-code). Los límites y el
// vencimiento los pone el backend; acá solo se muestra lo que responde.
// Cualquiera entra con el celular: si la persona no existía, su cuenta se crea al
// verificar el código. Diseño: design/platita-cliente.codigo.html.

const campo =
  "h-14 w-full rounded-campo border-2 border-borde bg-tarjeta px-5 text-xl font-bold outline-none focus:border-accion";

const formatCountdown = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

const retryAfter = (error: unknown): number | null => {
  const seconds = (error as ApiError | undefined)?.details as { retryAfterSeconds?: unknown } | undefined;
  return typeof seconds?.retryAfterSeconds === "number" ? Math.ceil(seconds.retryAfterSeconds) : null;
};

// Qué decirle a la persona según el código de error del backend.
function mensajeDeCodigo(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.code) {
      case "INVALID_PHONE":
        return "Revisá el número: tiene que ser un celular de Uruguay.";
      case "TOO_MANY_REQUESTS":
        return "Pediste muchos códigos seguidos. Esperá un poco y probá de nuevo.";
      case "OTP_PROVIDER_ERROR":
        return "No pudimos mandar el código. Probá en un rato.";
      case "CODE_INCORRECT": {
        const left = (error.details as { attemptsLeft?: unknown } | undefined)?.attemptsLeft;
        return typeof left === "number" ? `Código incorrecto. Te quedan ${left} ${left === 1 ? "intento" : "intentos"}.` : "Código incorrecto";
      }
      case "CODE_EXPIRED":
        return "El código venció";
      case "TOO_MANY_ATTEMPTS":
        return "Fallaste demasiadas veces. Pedí un código nuevo.";
      case "VALIDATION_ERROR":
        return `El código tiene ${CODE_LENGTH} dígitos.`;
    }
  }
  return friendlyMessage(error);
}

export function FormularioIngreso() {
  const { entrar } = useSesion();
  const [raw, setRaw] = useState("");
  const [phone, setPhone] = useState<string | null>(null); // confirmado en el paso 1
  const [code, setCode] = useState("");
  const [wait, setWait] = useState(0);
  const [telefonoMalo, setTelefonoMalo] = useState(false);
  const codeRef = useRef<HTMLInputElement>(null);

  // El aviso "el código es 000000" solo aparece si el backend usa el proveedor de pruebas.
  const config = useQuery({ queryKey: ["auth-config"], queryFn: getAuthConfig, retry: false, staleTime: Infinity });
  const devCode = config.data?.devCode ?? null;

  const pedir = useMutation({
    mutationFn: (e164: string) => requestCode(e164),
    onSuccess: (_data, e164) => {
      setPhone(e164);
      setCode("");
      setWait(RESEND_SECONDS);
    },
    onError: (error) => {
      const seconds = retryAfter(error);
      if (seconds) setWait(seconds);
    },
  });

  const verificar = useMutation({
    mutationFn: ({ e164, value }: { e164: string; value: string }) => verifyCode(e164, value),
    onSuccess: (auth) => {
      entrar(auth); // con la sesión, la pantalla de inicio decide a dónde llevarla
    },
  });

  useEffect(() => {
    if (wait <= 0) return;
    const id = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(id);
  }, [wait]);

  useEffect(() => {
    if (phone) codeRef.current?.focus();
  }, [phone]);

  const paso1 = (e: React.FormEvent) => {
    e.preventDefault();
    const e164 = normalizeUyPhone(raw);
    setTelefonoMalo(!e164);
    if (e164) pedir.mutate(e164);
  };

  const paso2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone) verificar.mutate({ e164: phone, value: code });
  };

  const reenviar = () => {
    if (!phone) return;
    verificar.reset();
    pedir.mutate(phone);
  };

  const verifyError = verificar.error;
  const vencido = verifyError instanceof ApiError && verifyError.code === "CODE_EXPIRED";
  const sinIntentos = verifyError instanceof ApiError && verifyError.code === "TOO_MANY_ATTEMPTS";

  return (
    <div className="flex flex-col gap-6">
      {!phone ? (
        <form onSubmit={paso1} className="flex flex-col gap-5" noValidate>
          <div>
            <h2 className="font-titulo text-[28px] font-extrabold">Entrá a Platita</h2>
            <p className="mt-1 text-suave">Ingresá tu celular y te mandamos un código para confirmar que sos vos.</p>
          </div>
          <label className="flex flex-col gap-2 font-extrabold">
            Tu celular
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="099 123 456"
              value={raw}
              onChange={(e) => {
                setRaw(e.target.value);
                setTelefonoMalo(false);
                pedir.reset();
              }}
              className={campo}
            />
          </label>
          {(telefonoMalo || pedir.isError) && (
            <p role="alert" className="font-extrabold text-accion">
              {telefonoMalo ? "Revisá el número: tiene que ser un celular de Uruguay." : mensajeDeCodigo(pedir.error)}
            </p>
          )}
          <Button type="submit" disabled={pedir.isPending || wait > 0}>
            {pedir.isPending ? "Mandando…" : wait > 0 ? `Esperá ${formatCountdown(wait)}` : "Mandame el código"}
          </Button>
          <p className="-mt-2 text-center text-xs text-suave/70">Si es tu primera vez, tu cuenta se crea sola.</p>
        </form>
      ) : (
        <form onSubmit={paso2} className="flex flex-col gap-5" noValidate>
          <button
            type="button"
            onClick={() => {
              setPhone(null);
              verificar.reset();
              pedir.reset();
            }}
            className="self-start font-extrabold text-suave"
          >
            ← Cambiar número
          </button>
          <div>
            <h2 className="font-titulo text-[28px] font-extrabold">Poné el código</h2>
            <p className="mt-1 text-suave">{`Te lo mandamos al ${formatUyPhone(phone)}.`}</p>
          </div>
          <label className="flex flex-col gap-2 font-extrabold">
            Código de {CODE_LENGTH} dígitos
            <input
              ref={codeRef}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={CODE_LENGTH}
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, ""));
                verificar.reset();
              }}
              className={`${campo} text-center tracking-[0.5em]`}
            />
          </label>
          {(verificar.isError || pedir.isError) && (
            <p role="alert" className="font-extrabold text-accion">
              {mensajeDeCodigo(verificar.isError ? verificar.error : pedir.error)}
            </p>
          )}
          {!vencido && !sinIntentos && (
            <Button type="submit" disabled={code.length < CODE_LENGTH || verificar.isPending}>
              {verificar.isPending ? "Entrando…" : "Entrar"}
            </Button>
          )}
          {wait > 0 ? (
            <p className="text-center font-bold text-suave">{`Reenviar código en ${formatCountdown(wait)}`}</p>
          ) : (
            <Button variant="borde" onClick={reenviar} disabled={pedir.isPending}>
              Reenviar código
            </Button>
          )}
          {devCode && (
            <p className="text-center text-sm text-suave">
              {`Ingreso de prueba: el código es ${devCode}`}
              {config.data?.realPhonesConfigured ? " (salvo números con verificación real)" : ""}.
            </p>
          )}
        </form>
      )}
    </div>
  );
}
