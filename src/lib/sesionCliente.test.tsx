import { describe, expect, it } from "vitest";
import { CODE_TTL_MS, SIMULATED_CODE, checkCode } from "./sesionCliente";

describe("checkCode", () => {
  const sent = 1_000_000;

  it("acepta el código simulado a tiempo", () => {
    expect(checkCode(SIMULATED_CODE, sent, sent + 1000)).toBe("ok");
  });

  it("rechaza otro código", () => {
    expect(checkCode("482719", sent, sent + 1000)).toBe("incorrecto");
  });

  it("pasado el tiempo, el código venció aunque sea el correcto", () => {
    expect(checkCode(SIMULATED_CODE, sent, sent + CODE_TTL_MS + 1)).toBe("vencido");
    expect(checkCode(SIMULATED_CODE, sent, sent + CODE_TTL_MS)).toBe("ok");
  });
});
