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
- Commit `8d0065e` (Cobrar). Se construyeron **Clientes**, **Ficha del
  cliente** y **Ajuste** (`src/pages/`), con las rutas `/clientes`,
  `/clientes/:customerId` y `/ajustar/:customerId`:
  - Clientes: lista con saldo, buscador con espera (`useDebounced`) que
    normaliza los números como se guardan (`customerSearchTerm`), tabla en
    pantalla grande y "Ver más clientes" (`useInfiniteQuery`).
  - Ficha: saldo, accesos a cobrar/cargar/ajustar y movimientos con cinco
    filtros (uno por tipo del backend) y paginación.
  - Ajuste: sumar o restar con motivo obligatorio; no se preselecciona el
    signo y el saldo no puede quedar en negativo.
  - Helpers nuevos: `formatSigned`, `formatWhen`, `visitShort`,
    `customerSearchTerm`, `lib/payment.ts` (formas de pago compartidas con
    Cargar saldo) y `useDebounced`; variante de botón `borde`, colores de
    las insignias y `ErrorDeMovimiento` admite "el ajuste".
  - Nuevo pedido al backend (P2): que el bono diga de qué promo salió.
  - **Sin ejecutar**: tests de las tres pantallas y de los helpers nuevos,
    revisados a mano.
- El usuario corrió `typecheck` y los tests: sin errores y **94 tests
  pasando** en 11 archivos (8 de Clientes, 8 de la Ficha, 11 de Ajuste y los
  helpers nuevos). Clientes, Ficha y Ajuste todavía no se vieron en el
  navegador.
- Commit `0646550` (Clientes, Ficha y Ajuste). Se construyeron **Promos**,
  su formulario de crear y editar (`PromoForm`) y **Reactivar**, con las
  rutas `/promos`, `/promos/nueva`, `/promos/:ruleId/editar` y `/reactivar`;
  con esto están las pantallas del diseño.
  - Promos: lista con interruptor Activa/Apagada (no se borran), "Editar" y
    "+ Crear promo". El formulario muestra "Así lo ve tu cliente" y avisa si
    ya hay otra promo activa con el mismo mínimo.
  - Reactivar: días de 10 en 10, lista paginada, WhatsApp deshabilitado
    ("próximamente"); si el cliente nunca vino se cuenta desde que se anotó.
  - Helper `daysAgo`; `createBonusRule` acepta `active`.
  - Siguiendo la regla de no hacer rodeos ineficientes, no se arman el saldo
    de cada inactivo ni "Usada N veces": son tres pedidos nuevos al backend
    (saldo en `/inactive`, uso de cada promo y total de inactivos).
  - **Sin ejecutar**: 7 tests de Promos, 10 del formulario y 8 de Reactivar
    (y 2 de `daysAgo`), revisados a mano.
- El usuario corrió `typecheck` y los tests: sin errores y **121 tests
  pasando** en 14 archivos (7 de Promos, 10 del formulario, 8 de Reactivar y
  los de `daysAgo`). Con esto quedan hechas las pantallas del diseño; falta
  verlas en el navegador y los pedidos al backend.
- Commit `5eaecba` (Promos y Reactivar). El usuario probó las pantallas en el
  navegador y funcionan, salvo **Reactivar**, que no se pudo probar porque
  hace falta que pasen días (no se toca el reloj de la máquina; se puede
  simular cambiando `lastVisitAt` en la base). Se marcaron como verificadas
  en el TODO y se registró un pedido nuevo al backend: un nombre o una
  descripción para las promos.
- Observación del usuario sobre los movimientos de la ficha: tienen que
  paginar para no armar una lista enorme. La paginación ya existe (de a 20 con
  "Ver más movimientos"); ver la conversación del día para lo que se decida.
- Decisión del usuario sobre la paginación de movimientos de la Ficha: se
  mantiene "Ver más movimientos" (cursor) y la primera página baja a **15 en
  pantalla grande y 8 en el celular** (antes 20). Se agregó
  `lib/useMediaQuery.ts` (la pantalla se considera grande desde 1024px, el
  mismo corte que usa el diseño) y el tamaño entra en la clave de la
  consulta. Clientes y Reactivar siguen de a 20. Páginas numeradas quedaron
  descartadas (el backend no da total ni página anterior). Se actualizaron 3
  tests de la Ficha y se agregó uno que cubre las dos medidas.
- Prisma Studio rechazó una fecha escrita como `2026-6-13T…`: el mes debe
  llevar dos dígitos (`2026-06-13T…`). Sin consecuencias en la base.
- **Sin ejecutar**: los tests de la Ficha tras este cambio.
- El usuario corrió `typecheck` y los tests tras el cambio de página de la
  Ficha: sin errores y **122 tests pasando** en 14 archivos (9 de la Ficha).
- Commit `7373e20`. El usuario probó Reactivar editando `lastVisitAt` de un
  cliente a junio con Prisma Studio: lo muestra y lo saca al cambiar los días.
  Con esto quedan todas las pantallas verificadas en el navegador.
- Se analizaron las 15 vulnerabilidades de `npm audit` (con una caché temporal de
  npm, porque la de `~/.npm` no es escribible desde la sesión de la IA). Solo 2
  moderadas llegan a producción (`react-router-dom`); las otras 13 son de
  herramientas de desarrollo (`vitest`, `vite`, `tailwindcss` y sus dependencias).
  Hay un camino que funciona con Node 20.12: `react-router-dom` 7.18, `vite`
  6.4.4 y `vitest` 4.1.11; `tailwindcss` 4 se deja para después. Las versiones
  más nuevas de `vite` (8) y `vitest` (5) piden Node 22: no se usan. Quedó en el
  TODO; no se cambió ninguna dependencia todavía.
- El backend (otra sesión de IA, sin commitear y sin verificar corriendo)
  resolvió los pedidos del front: idempotencia (`Idempotency-Key`), CORS por
  `CORS_ORIGINS`, búsqueda por teléfono (`?search=` normaliza y `?phone=`
  exacto), `GET /merchants/:m/transactions`, saldo y `total` en `/inactive`,
  `GET /merchants/:m/bonus-preview`, `bonusRuleId` en los bonos y `name`,
  `description` y `timesUsed` en las promos. Se leyó su código (no solo el
  reporte) antes de adoptarlo; sigue pendiente su autenticación y la
  unificación de unidades.
- Primera tanda de adopción en el front (se hizo antes que las funciones
  nuevas porque reemplaza rodeos y da seguridad):
  - **Reintentar sin duplicar**: Cargar saldo, Cobrar y Ajuste mandan una
    `Idempotency-Key` por operación (`lib/idempotency.ts`, UUID v4 con
    alternativa para http en la red local). Ante una red caída o un error del
    servidor ofrecen "Reintentar" con la misma clave; si se cambian los datos
    es una operación nueva. Reemplaza el "no reintentar" anterior.
  - **Vista previa del bono del servidor** en Cargar saldo (muestra también el
    nombre de la promo); se eliminó `src/lib/bonus.ts`.
  - **Búsqueda sin rodeos**: el Mostrador usa `?phone=` y Clientes manda el
    texto tal cual; se eliminó `customerSearchTerm`.
  - **Reactivar** muestra el saldo de cada cliente y usa el `total` del backend.
  - La capa de la API acepta encabezados propios y los tipos incorporan los
    campos nuevos (`bonusRuleId`, `name`, `description`, `timesUsed`,
    `BonusPreview`, `InactivePage`).
  - Falta, en una segunda tanda: el panel "Hoy en el mostrador", los campos y
    el uso de las promos en su pantalla y formulario, y la promo de cada bono
    en la ficha.
  - **Sin ejecutar**: los tests nuevos y modificados de esta tanda.
- Verificación de la primera tanda (la corrió la propia IA con las
  herramientas instaladas en el proyecto, `node_modules/.bin`): `tsc --noEmit`
  sin errores y **126 tests pasando** en 14 archivos. No se probó en el
  navegador contra el backend nuevo, que a su vez está sin commitear.
- Verificación defensiva en el Mostrador: tras buscar con `?phone=` se
  comprueba que el cliente devuelto tenga ese teléfono. Sin eso, un backend sin
  el código nuevo ignoraría el filtro y el Mostrador mostraría a otra persona
  (y se le podría cobrar). Un test lo cubre. `tsc` sin errores y **127 tests
  pasando** en 14 archivos.
- El usuario probó el reintento seguro (con el backend caído aparece
  "Reintentar" y al volver se registra un solo cobro) y pidió dejar para
  después la prueba de la repetición real desde la consola del backend (anotada
  en el TODO).
- Segunda tanda de adopción del backend nuevo:
  - **Panel "Hoy en el mostrador"** (`components/HoyEnElMostrador.tsx`) en el
    Mostrador de pantalla grande: últimos 10 movimientos del comercio desde
    las 00:00 (`GET /merchants/:m/transactions`), con `todayRange` (fechas ISO
    con zona horaria) y `formatTime`. En el celular no se pide.
  - **Promos**: nombre y descripción opcionales en el formulario (vacíos no se
    mandan al crear y se borran con `null` al editar), título por nombre en el
    listado y "Usada N veces" (`timesUsed`).
  - **Ficha**: cada bono dice de qué promo salió, resolviendo `bonusRuleId`
    con las promos (nombre, o "Promo $1.000+" si no tiene); los bonos viejos
    siguen diciendo solo "Bono".
  - Tipos y funciones: `MerchantTransaction`, `listMerchantTransactions` y los
    campos de promos en `createBonusRule` / `updateBonusRule`.
  - Verificado por la IA con `node_modules/.bin`: `tsc` sin errores y **147
    tests pasando** en 15 archivos. Sin probar en el navegador contra el
    backend nuevo.
- Se reescribió el `README.md` como guía de arranque paso a paso (backend,
  crear un comercio y una promo, frontend, probarlo), con las variables, los
  comandos, cómo probar desde el celular y los problemas más comunes.
- Corrección al preparar el README: copiar `.env.example` deja
  `VITE_API_URL` **vacía** y la configuración la tomaba como "sin proxy" (las
  llamadas no llegaban al backend). Ahora una variable vacía vale lo mismo que
  no estar y usa el valor por defecto (`parseConfig` en `src/config.ts`, con
  tests).
