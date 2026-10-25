import { config } from "../config";

// LOGO PROVISIONAL: un círculo con un árbol (un ombú, de copa ancha) adentro. Es
// solo para marcar DÓNDE va el logo en cada pantalla; cuando haya uno de verdad,
// se cambia este archivo (y public/favicon.svg) y se ve en todos lados. Toma el
// color del texto que lo rodea (currentColor).
export function Logo({ className = "h-[1.15em] w-[1.15em]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false" className={`shrink-0 ${className}`}>
      <circle cx="24" cy="24" r="22" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <g fill="currentColor">
        <ellipse cx="24" cy="20" rx="14" ry="8" />
        <circle cx="14.5" cy="21" r="5" />
        <circle cx="33.5" cy="21" r="5" />
        <circle cx="19" cy="14.5" r="6" />
        <circle cx="29" cy="14.5" r="6" />
        <circle cx="24" cy="12.5" r="6" />
        <path d="M21 25 C21 30 20 33 16.5 36.5 L31.5 36.5 C28 33 27 30 27 25 Z" />
      </g>
    </svg>
  );
}

// El logo con el nombre de la app al lado: lo que va en el encabezado y los menús.
// Hereda tamaño y color del elemento que lo contiene.
export function Marca() {
  return (
    <span className="inline-flex items-center gap-[0.4em]">
      <Logo />
      {config.appName}
    </span>
  );
}
