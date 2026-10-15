import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { routes } from "../lib/routes";
import { Entrada } from "./Entrada";

describe("Entrada", () => {
  it("pregunta cómo se quiere entrar y lleva a cada área", () => {
    render(
      <MemoryRouter>
        <Entrada />
      </MemoryRouter>,
    );

    expect(screen.getByText("¿Cómo querés entrar?")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Soy cliente" })).toHaveAttribute("href", routes.cliente.ingreso);
    expect(screen.getByRole("link", { name: "Soy un comercio" })).toHaveAttribute("href", routes.comercio.mostrador);
  });

  it("las dos áreas viven bajo prefijos distintos, para no confundirse", () => {
    expect(routes.comercio.clientes).toBe("/comercio/clientes");
    expect(routes.cliente.lugares).toBe("/cliente/lugares");
    expect(routes.comercio.ficha("c1")).toBe("/comercio/clientes/c1");
    expect(routes.cliente.lugar("m1")).toBe("/cliente/lugares/m1");
  });
});
