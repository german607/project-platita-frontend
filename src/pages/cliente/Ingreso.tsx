import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Button } from "../../components/Button";
import { formatUyPhone, normalizeUyPhone } from "../../lib/phone";
import { routes } from "../../lib/routes";
import { CODE_LENGTH, RESEND_SECONDS, checkCode, useSesionCliente } from "../../lib/sesionCliente";

// Ingreso del cliente en dos pasos: celular → código de 6 dígitos. El código
// está SIMULADO (ver lib/sesionCliente.tsx). Diseño: design/platita-cliente.codigo.html.

const campo =
  "h-14 w-full rounded-campo border-2 border-borde bg-tarjeta px-5 text-xl font-bold outline-none focus:border-accion";

function formatCountdown(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function Ingreso() {
  const { sesion, entrar } = useSesionCliente();
  const navigate = useNavigate();
  const [raw, setRaw] = useState("");
  const [phone, setPhone] = useState<string | null>(null); // confirmado en el paso 1
  const [sentAt, setSentAt] = useState(0);
  const [code, setCode] = useState("");
  const [error, setError] = useState<"incorrecto" | "vencido" | "telefono" | null>(null);
  const [wait, setWait] = useState(0);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (wait <= 0) return;
    const id = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(id);
  }, [wait]);

  useEffect(() => {
    if (phone) codeRef.current?.focus();
  }, [phone]);

  if (sesion) return <Navigate to={routes.cliente.lugares} replace />;

  const mandarCodigo = (e164: string) => {
    setPhone(e164);
    setSentAt(Date.now());
    setCode("");
    setError(null);
    setWait(RESEND_SECONDS);
  };

  const paso1 = (e: React.FormEvent) => {
    e.preventDefault();
    const e164 = normalizeUyPhone(raw);
    if (!e164) return setError("telefono");
    mandarCodigo(e164);
  };

  const paso2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    const result = checkCode(code, sentAt);
    if (result === "ok") {
      entrar(phone);
      navigate(routes.cliente.lugares, { replace: true });
    } else {
      setError(result);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-5 py-10">
      <h1 className="font-titulo text-[32px] font-extrabold text-accion">platita</h1>

      {!phone ? (
        <form onSubmit={paso1} className="flex flex-col gap-5" noValidate>
          <Link to={routes.entrada} className="font-extrabold text-suave">
            ← Volver
          </Link>
          <div>
            <h2 className="font-titulo text-[28px] font-extrabold">Ingresá tu celular</h2>
            <p className="mt-1 text-suave">Te mandamos un código para confirmar que sos vos.</p>
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
                setError(null);
              }}
              className={campo}
            />
          </label>
          {error === "telefono" && (
            <p role="alert" className="font-extrabold text-accion">
              Revisá el número: tiene que ser un celular de Uruguay.
            </p>
          )}
          <Button type="submit">Mandame el código</Button>
        </form>
      ) : (
        <form onSubmit={paso2} className="flex flex-col gap-5" noValidate>
          <button
            type="button"
            onClick={() => {
              setPhone(null);
              setError(null);
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
                setError(null);
              }}
              className={`${campo} text-center tracking-[0.5em]`}
            />
          </label>
          {error === "incorrecto" && (
            <p role="alert" className="font-extrabold text-accion">
              Código incorrecto
            </p>
          )}
          {error === "vencido" && (
            <p role="alert" className="font-extrabold text-accion">
              El código venció
            </p>
          )}
          {error !== "vencido" && <Button type="submit" disabled={code.length < CODE_LENGTH}>Entrar</Button>}
          {wait > 0 && error !== "vencido" ? (
            <p className="text-center font-bold text-suave">{`Reenviar código en ${formatCountdown(wait)}`}</p>
          ) : (
            <Button variant="borde" onClick={() => mandarCodigo(phone)}>
              Reenviar código
            </Button>
          )}
          <p className="text-center text-sm text-suave">Ingreso de prueba: el código es 000000.</p>
        </form>
      )}
    </main>
  );
}
