// Interruptor con su texto al lado ("Prendido" / "Apagado"). Es un `switch` de
// verdad para los lectores de pantalla: el estado va en `aria-checked`.
export function Switch({
  checked,
  onChange,
  label,
  textOn,
  textOff,
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string; // nombre accesible
  textOn: string;
  textOff: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 font-extrabold">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-9 w-16 flex-none rounded-full transition-colors disabled:opacity-50 ${
          checked ? "bg-saldo" : "bg-[#A8957E]"
        }`}
      >
        <span className={`absolute top-1 h-7 w-7 rounded-full bg-white transition-all ${checked ? "left-8" : "left-1"}`} />
      </button>
      {checked ? textOn : textOff}
    </div>
  );
}
