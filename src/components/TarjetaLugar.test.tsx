import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Switch } from "./Switch";
import { TarjetaLugar } from "./TarjetaLugar";

describe("TarjetaLugar", () => {
  it("muestra nombre, categoría, dirección y la marca de promo", () => {
    render(<TarjetaLugar name="Café Don Pedro" categoria="Cafeterías" direccion="Av. Italia 3320" photoUrl={null} hasPromo />);

    expect(screen.getByText("Café Don Pedro")).toBeInTheDocument();
    expect(screen.getByText("Cafeterías · Av. Italia 3320")).toBeInTheDocument();
    expect(screen.getByText("Promo activa")).toBeInTheDocument();
    expect(screen.getByText("foto")).toBeInTheDocument();
  });

  it("dice 'Sin promo' y no muestra saldo si no hay", () => {
    render(<TarjetaLugar name="Panadería Sol" categoria="Panaderías" direccion={null} photoUrl="https://x.uy/a.jpg" hasPromo={false} saldo={0} />);

    expect(screen.getByText("Sin promo")).toBeInTheDocument();
    expect(screen.getByText("Panaderías")).toBeInTheDocument();
    expect(screen.queryByText(/Tenés/)).not.toBeInTheDocument();
    expect(document.querySelector("img")).toHaveAttribute("src", "https://x.uy/a.jpg");
  });

  it("muestra el saldo del cliente en ese lugar", () => {
    render(<TarjetaLugar name="Café" categoria="Cafeterías" direccion="Av. Italia 3320" photoUrl={null} hasPromo saldo={120000} />);
    expect(screen.getByText("Tenés $1.200")).toBeInTheDocument();
  });
});

describe("Switch", () => {
  it("avisa el cambio y dice su estado", () => {
    let value = false;
    const { rerender } = render(<Switch checked={value} onChange={(v) => (value = v)} label="Aparecer" textOn="Prendido" textOff="Apagado" />);

    expect(screen.getByRole("switch", { name: "Aparecer" })).toHaveAttribute("aria-checked", "false");
    expect(screen.getByText("Apagado")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("switch"));
    expect(value).toBe(true);

    rerender(<Switch checked={value} onChange={() => {}} label="Aparecer" textOn="Prendido" textOff="Apagado" />);
    expect(screen.getByText("Prendido")).toBeInTheDocument();
  });

  it("deshabilitado no cambia", () => {
    let called = false;
    render(<Switch checked={false} disabled onChange={() => (called = true)} label="Aparecer" textOn="Prendido" textOff="Apagado" />);
    fireEvent.click(screen.getByRole("switch"));
    expect(called).toBe(false);
  });
});
