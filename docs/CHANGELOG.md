# Cronología

Registro cronológico de lo que se hizo, en orden. A diferencia de
[`STATE.md`](STATE.md) (foto del presente), esto **no se reescribe**:
las entradas viejas quedan tal cual, aunque algo después haya cambiado
(eso se anota como una entrada nueva, no editando la vieja). Ver la
regla de mantenimiento en [`AGENTS.md`](AGENTS.md).

## 2026-10-13

- Se generaron tres direcciones visuales en Claude Design y se eligió la
  **B, "Cálida y de barrio"**, que se afinó hasta tener celular y web con
  todas las pantallas y estados.
- El diseño se exportó de dos formas y se guardó en `design/`: un export
  "bundled" (que además se extrajo a un HTML legible) y un HTML estático
  de código, que quedó como referencia principal.
- Se armó el sistema de documentación de traspaso, igual al del backend:
  `CLAUDE.md` y `AGENTS.md` en la raíz como punteros, `docs/AGENTS.md`
  (reglas), `docs/STATE.md`, `docs/CHANGELOG.md`, `docs/DISENO.md` (tokens,
  pantallas y mapa pantalla → endpoint) y `TODO.md` como único backlog. Se
  agregó `.gitignore`.
- Al cruzar el diseño con la API del backend se detectaron tres cosas y se
  registraron como pedidos al backend en el TODO: no hay CORS, la búsqueda
  por teléfono no normaliza el término (`099123456` no encuentra
  `+59899123456`) y no hay autenticación.
- Todavía no hay código de aplicación, dependencias ni commits en este
  repo.
- Se decidió el stack: React + TypeScript + Vite, descartando Expo /
  React Native (obliga a reescribir el diseño, la web es de segunda y para
  el piloto un link es más simple que una app).
- Se creó la rama `jeronimo/base-frontend` y se escribió a mano el proyecto
  base: `package.json`, `tsconfig.json`, `vite.config.ts` (con proxy `/api`
  al backend para evitar CORS en desarrollo), Tailwind con los tokens de
  `DISENO.md`, `src/config.ts`, helpers de dinero y teléfono, cliente de la
  API con sus tipos y una función por endpoint, componentes de estado
  (vacío, cargando, error, éxito), `Layout` con menú inferior y lateral y
  pantallas de relleno. Se agregaron tests de dinero, teléfono y cliente de
  la API, y `docs/FRONTEND.md`.
- Se eligió Vite 5 porque, según lo que se sabe, corre en Node 20.12.
- **Nada se instaló ni se ejecutó**: los tipos y los tests se revisaron a
  mano y se corrigieron dos errores antes de entregar (tipo de `test` en la
  configuración de Vite y un mock de `Response` reutilizado). No se pudo
  crear `.env.example`: el entorno de la IA no puede escribir archivos
  `.env*`.
- El usuario corrió `npm install`, `typecheck` y los tests. El `typecheck`
  falló con 3 errores en `endpoints.ts` (una `interface` no es asignable al
  objeto de claves libres de `query`); se cambió a `type`. Después:
  `typecheck` sin errores y 20 tests pasando. `npm install` avisó de 15
  vulnerabilidades (2 críticas, 6 altas), anotadas en el TODO sin
  analizar.
- Se construyó la pantalla **Mostrador** y se ajustó el resto al diseño:
  `Layout` con menú lateral oscuro y chip del comercio, `Button`/`ButtonLink`
  (acción y mostaza), tokens nuevos (crema, rosa, línea, sombras y radios),
  `getMerchant` y el tipo `Merchant`, `lib/dates.ts` ("Vino hace N días"),
  `lib/merchant.ts` y las rutas de relleno `/cobrar/:id` y `/cargar/:id`.
  La búsqueda por teléfono se resuelve en el frontend (dígitos del número
  normalizado + filtro por teléfono exacto) porque la del backend no
  normaliza. Se escribieron tests de `dates` y 7 del Mostrador.
- El diseño web trae un panel "Hoy en el mostrador" que la API no puede
  alimentar (no hay listado de movimientos por comercio): quedó como pedido
  al backend en el TODO.
- **Sin ejecutar**: los tipos y los tests nuevos se revisaron a mano.
- Regla acordada con el usuario: cuando el backend no ofrece algo, no se
  busca un camino alternativo menos eficiente; se registra en "Pedidos al
  backend" y se sigue. Quedó en `docs/AGENTS.md`. El rodeo de la búsqueda
  por teléfono del Mostrador se mantuvo por ser tan eficiente como el
  endpoint pedido (una consulta, 5 resultados, filtro por teléfono exacto).
- El usuario corrió `typecheck`, los tests y `npm run dev`: todo pasó.
  Faltaba el nombre del comercio arriba; se descartaron el backend caído y
  un id inexistente (el comercio existe en la base local) y se vio en el
  navegador integrado que `GET /api/merchants/<id>` devuelve 200 y el chip
  sí se dibuja (se había mirado antes de que el backend terminara de
  levantar). Se verificó en el navegador la búsqueda por teléfono del
  Mostrador: `GET …/customers?search=59899123456&limit=5` → 200 y
  "Este número es nuevo". No se probó crear un cliente (escribe en la base
  del usuario).
- Se hicieron los dos primeros commits del repo en la rama
  `jeronimo/base-frontend` (documentación y diseño; proyecto base con
  Mostrador). El `.env.example` quedó afuera: el usuario lo creó pero está
  vacío.
- Se construyó **Cargar saldo** (`src/pages/CargarSaldo.tsx`) y
  `src/lib/bonus.ts` (vista previa del bono con la misma regla que el
  backend), más el botón `claro` y la ruta `/cargar/:customerId`. Dos
  decisiones sobre dinero: no se preselecciona ningún monto, y si falla la
  red al confirmar no se ofrece reintentar (podría duplicar la carga: el
  backend no tiene idempotencia, ahora pedido P0 en el TODO). Se escribieron
  tests de la pantalla y de `bonusFor`. **Sin ejecutar.**
- El usuario corrió `typecheck` y los tests: sin errores y **47 tests
  pasando** (11 de Cargar saldo, 7 del Mostrador, 5 del bono). Cargar
  saldo sigue sin verse en el navegador. Los tests muestran avisos de
  React Router v7, anotados en el TODO como P2.
- El usuario completó el `.env.example` (las tres variables, sin valores) y
  se commiteó aparte. El usuario probó Cargar saldo en el navegador y
  funciona.
- Commits `18cd3a0` (`.env.example`) y `d9c7c9d` (Cargar saldo). El usuario
  confirmó que Cargar saldo funciona en el navegador.
- Se construyó **Cobrar** (`src/pages/Cobrar.tsx`): monto escrito en el
  número grande, nota opcional, "Saldo ahora" y "Quedaría", y si no alcanza
  "Le faltan $X" con botón a Cargar saldo y el cobro deshabilitado. Si el
  saldo cambió y el backend responde 422, el faltante sale de su respuesta;
  al cambiar el monto se borra el aviso. Sin "reintentar" ante una red
  caída, por la falta de idempotencia. Se agregó el color `arena` (botón
  deshabilitado) y la ruta ya no es de relleno.
- Se extrajo `src/components/movimiento.tsx` (aviso de red caída, pantalla
  de éxito y monto grande) y `CargarSaldo` pasó a usarlo; Ajuste lo va a
  reutilizar.
- Se había perdido por error la fila de Cobrar de la tabla de pantallas de
  `docs/DISENO.md` (una expresión regular mal acotada, en el commit de Cargar
  saldo); se restauró con las notas nuevas. **Sin ejecutar**: 11 tests nuevos
  de Cobrar y la refactorización de Cargar saldo se revisaron a mano.
- El usuario corrió `typecheck` y los tests: sin errores y **58 tests
  pasando** en 8 archivos (11 nuevos de Cobrar; los 11 de Cargar saldo
  siguen pasando tras extraer `movimiento.tsx`). Cobrar todavía no se vio en
  el navegador.
