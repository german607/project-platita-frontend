# Estado actual — Platita frontend

> Última actualización: 2026-10-13. Esto es una foto del presente, se
> reescribe cuando deja de ser cierto — no es historial (eso es
> [`CHANGELOG.md`](CHANGELOG.md)). Ver también [`../TODO.md`](../TODO.md)
> y la regla de mantenimiento en [`AGENTS.md`](AGENTS.md).

## Qué es

El panel web de Platita para comercios de barrio en Uruguay: el cajero o
el dueño, en el celular del mostrador, busca a un cliente por teléfono,
le carga saldo con bonificación o le cobra descontando saldo. El negocio,
el dominio y la API están en el repo del backend
(`../project-platita-backend`, GitHub `german607/project-platita-backend`);
este repo solo consume esa API.

## Etapa

**Proyecto base escrito; instalado, tipado y con tests pasando, pero todavía sin levantar en el navegador.** El repo tiene la
documentación de traspaso, la referencia visual en `design/` y el esqueleto
de la aplicación (stack, tokens, cliente de la API, helpers de dinero y
teléfono, componentes de estado y navegación con pantallas de relleno).
Trabajo en la rama `jeronimo/base-frontend`; sin commits todavía.

- **Diseño:** elegida la dirección B, "Cálida y de barrio" (versión
  afinada), con celular y web, todas las pantallas y sus estados.
  Detalle y tokens en [`DISENO.md`](DISENO.md).
- **Stack (decidido el 2026-10-13):** React 18 + TypeScript + Vite 5 +
  Tailwind 3 + TanStack Query + React Router + zod + Vitest. Se descartó
  Expo / React Native. Detalle, estructura y comandos en
  [`FRONTEND.md`](FRONTEND.md).
- **Verificado (2026-10-13):** `npm install` (247 paquetes), `npm run
  typecheck` sin errores y `npm run test:run` con **94 tests pasando** en 11
  archivos (dinero, teléfono, fechas, bono, cliente de la API y las seis
  pantallas: Mostrador, Cargar saldo, Cobrar, Clientes, Ficha y Ajuste). El `typecheck` encontró un error real en su momento, ya
  corregido.
- **Verificado en el navegador (2026-10-13, backend local en el 3001):**
  el proxy `/api` funciona (sin CORS), el chip con el nombre del comercio
  aparece, el menú lateral oscuro coincide con el diseño y el Mostrador
  busca por teléfono y muestra "Seguí escribiendo…" y "Este número es
  nuevo".
- **Sin verificar:** crear un cliente, ver uno existente con saldo, el
  celular (ancho chico), el estado de error de red y el contraste final
  contra el diseño. `npm install` reportó 15 vulnerabilidades (2
  críticas) sin analizar: ver el TODO.
- **Pantallas:** **Mostrador**, **Cargar saldo**, **Cobrar**, **Clientes**,
  **Ficha del cliente** y **Ajuste** están construidas según el diseño y
  con sus tests pasando. El Mostrador y Cargar saldo se probaron además en
  el navegador contra el backend local; **las otras cuatro todavía no se
  vieron en el navegador**. Promos y Reactivar son rutas de relleno. Ver
  [`../TODO.md`](../TODO.md) §2 y §3.

## El backend con el que se va a conectar

Según su documentación (`../project-platita-backend/docs/STATE.md`): API
con 18 endpoints (comercios, reglas de bonificación, clientes y libro
mayor), arquitectura modular, consola de pruebas local en `/dev`. Está
escrito y compila, pero el flujo completo no se recorrió después de su
reorganización. No tiene autenticación ni CORS configurado.

Consecuencias para este repo, ya registradas en el TODO (§4):
- Hasta que haya login, el comercio se fija por configuración.
- El navegador bloqueará las llamadas entre orígenes distintos hasta que
  haya CORS o proxy de desarrollo.
- La búsqueda por teléfono del backend no normaliza el término buscado: el
  Mostrador lo rodea buscando por el número normalizado y filtrando por
  teléfono exacto.

## No existe todavía

- Las pantallas Cargar saldo, Cobrar, Ficha, Clientes, Promos y Reactivar,
  y el panel "Hoy en el mostrador" (falta un listado de movimientos del
  comercio en el backend).
- Lint, CI y despliegue.

## Decisiones abiertas

- Si este repo se mantiene separado del backend y contra qué rama se
  integra (`dev` o `main`); a acordar con Germán Pereira.
