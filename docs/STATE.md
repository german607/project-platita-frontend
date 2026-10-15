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
  typecheck` sin errores y `npm run test:run` con **152 tests pasando** en 16
  archivos (dinero, teléfono, fechas, bono, cliente de la API y las nueve
  pantallas y formularios). El `typecheck` encontró un error real en su momento, ya
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
- **Pantallas:** las siete del diseño están construidas, con sus tests
  pasando: **Mostrador**, **Cargar saldo**, **Cobrar**, **Clientes**,
  **Ficha del cliente**, **Ajuste**, **Promos** (con su formulario de crear
  y editar) y **Reactivar**. El usuario las probó en el navegador contra el
  backend local el 2026-10-13 y funcionan todas. Reactivar se probó
  simulando un cliente que no venía desde junio (editando `lastVisitAt` en la
  base con Prisma Studio, sin tocar el reloj): aparece y desaparece según los
  días. Faltan piezas del diseño que dependen del backend (ver "Pedidos al
  backend" en el [`TODO`](../TODO.md)). Ver [`../TODO.md`](../TODO.md) §2 y
  §3.

## Próximo hito: el lado del cliente (decidido el 2026-10-15)

La web va a tener **dos tipos de usuario**, en la misma app y con la misma
API: el **comercio** (lo que ya está construido) y el **cliente**. El
cliente ve *Lugares* (los comercios con el servicio y si tienen una promo
activa), el detalle de cada lugar (promos, dirección con mapa, horarios,
categoría), *Mis saldos* (lo que tiene en cada comercio) y su *Perfil*. Se
hace primero en web para pulir flujos y estilo, y que después la app mobile
reutilice todo. Detalle y pendientes: [`../TODO.md`](../TODO.md) §7.

Decisiones tomadas:
- **Ingreso del cliente:** con su teléfono y un código de un solo uso
  (WhatsApp o SMS); recién ahí es un usuario verificado. **Por ahora se
  simula.** **Recordatorio: reemplazar la simulación por la verificación real
  antes de publicar** (sin eso, cualquiera vería los saldos de cualquier
  teléfono).
- **El cliente solo mira.** Más adelante podrá cargar por su cuenta,
  transfiriéndole al comercio que elija: por ahora, un botón "Próximamente".
- **Un comercio solo aparece si lo activa.** Se suma una pestaña nueva del
  lado del comercio (nombre a definir) con su perfil público: dirección y
  mapa, horarios, foto, descripción, categoría y el interruptor "Aparecer en
  la app". Lo edita el dueño o el personal.
- **La categoría** la elige el comercio y **no se puede cambiar seguido**.
- Todo vive **en este mismo repo**, en dos áreas que comparten la API, los
  helpers y el estilo. El diseño del cliente se hace en Claude Design, con
  el mismo estilo "Cálida y de barrio".
- **Perfil del cliente:** nombre, teléfono y cerrar sesión (y, más adelante,
  un QR personal).

Lo que esto le pide al backend (hoy un comercio solo tiene nombre, teléfono
y plan, y un cliente es una fila por comercio, sin login) está en el TODO,
§4.

## El backend con el que se va a conectar

Según su documentación (`../project-platita-backend/docs/STATE.md`) y su
código al 2026-10-13: API modular con comercios, promos, clientes y libro
mayor, consola de pruebas local en `/dev` y, **nuevo hoy**, todo lo que el
front había pedido: idempotencia en cargas, cobros y ajustes
(`Idempotency-Key`), CORS por `CORS_ORIGINS`, búsqueda por teléfono
(`?search=` normaliza, `?phone=` exacto), movimientos del comercio, saldo y
total en `/inactive`, vista previa del bono, y nombre, descripción y uso de
las promos. Esos cambios del backend están **sin commitear y sin
verificar corriendo** (así los marca su propio TODO).

Qué sigue pendiente de su lado: autenticación, unificar las unidades
(entra pesos, sale centésimos) y el envío por WhatsApp.

Consecuencias para este repo, registradas en el TODO (§4):
- Hasta que haya login, el comercio se fija por configuración.
- En desarrollo se sigue usando el proxy de Vite; en producción hacen falta
  la URL absoluta del backend en `VITE_API_URL` y la del front en
  `CORS_ORIGINS`.
- **Ya adoptado por el front** (2026-10-13): reintentar con la misma clave de
  idempotencia, búsqueda por `?phone=` y texto tal cual, saldo y total de
  los inactivos, y la vista previa del bono del servidor.
- **Adoptado también** (segunda tanda, 2026-10-13): el panel "Hoy en el
  mostrador", el nombre, la descripción y el uso de las promos, y la promo de
  cada bono en la ficha. Todo con tests pasando; falta verlo en el navegador
  contra el backend nuevo.

## No existe todavía

- Las pantallas Cargar saldo, Cobrar, Ficha, Clientes, Promos y Reactivar,
  y el panel "Hoy en el mostrador" (falta un listado de movimientos del
  comercio en el backend).
- Lint, CI y despliegue.

## Decisiones abiertas

- **Lado del cliente:** cada cuánto se puede cambiar la categoría de un
  comercio; si un comercio puede tener varios locales (cada uno con su
  dirección y horarios) y cómo se relaciona con el saldo; y qué tan completo
  es el mapa (un pin que el comercio ubica, o la dirección con un enlace
  "Cómo llegar"). Ver [`../TODO.md`](../TODO.md) §7.
- Si este repo se mantiene separado del backend y contra qué rama se
  integra (`dev` o `main`); a acordar con Germán Pereira.
