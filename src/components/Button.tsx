import type { ButtonHTMLAttributes } from "react";
import { Link, type LinkProps } from "react-router-dom";

// Los dos botones grandes del diseño: acción principal (rojo) y secundaria
// (mostaza), con la sombra de color de abajo que se "hunde" al apretar.
const base =
  "flex w-full items-center justify-center rounded-boton font-titulo font-extrabold transition-transform active:translate-y-[3px] active:shadow-none disabled:opacity-50";

const variants = {
  accion: "h-[68px] bg-accion text-[22px] text-tarjeta shadow-accion",
  mostaza: "h-16 bg-mostaza text-xl text-tinta shadow-mostaza",
  // Botón claro, para usar sobre fondos verdes (pantallas de éxito).
  claro: "h-[68px] bg-fondo text-[22px] text-tinta",
} as const;

type Variant = keyof typeof variants;

export function Button({
  variant = "accion",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button type="button" className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function ButtonLink({
  variant = "accion",
  className = "",
  ...props
}: LinkProps & { variant?: Variant }) {
  return <Link className={`${base} ${variants[variant]} ${className}`} {...props} />;
}
