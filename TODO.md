# TODO — Platita frontend

**Único backlog del frontend** (ver `docs/AGENTS.md`). El backend tiene el
suyo en `../project-platita-backend/TODO.md`.

Prioridad: **P0** = bloquea el piloto · **P1** = necesario para cobrar · **P2** = después del piloto.

Leyenda: `[x]` hecho y verificado · `[ ]` pendiente · `[~]` en curso, o implementado pero todavía sin verificar corriéndolo

---

## 0. Decisiones previas

- [x] Stack elegido el 2026-10-13: React + TypeScript + Vite + Tailwind + TanStack Query + React Router + zod + Vitest (ver `docs/FRONTEND.md`; se descartó Expo)
- [ ] **P0** Decidir con Germán si se queda como repo aparte (hoy lo es) y qué rama integra, `dev` o `main`
- [ ] **P1** Decidir si los respaldos de `design/` (`.export.html` y `.legible.html`) se borran

## 1. Fundaciones

- [x] Documentación de traspaso entre sesiones (`CLAUDE.md`, `AGENTS.md`, `docs/`)
- [x] Diseño de referencia elegido y guardado en `design/` (dirección B, "Cálida y de barrio")
- [~] **P0** Proyecto base con el stack elegido (TypeScript estricto): `npm install`, `typecheck` y tests verificados; falta ver que `npm run dev` levante y se vea bien
- [~] **P0** Tokens de diseño en código (colores, tipografías, radios) tomados de `docs/DISENO.md` (`tailwind.config.ts`; falta compararlo con el diseño en el navegador)
- [~] **P0** Cliente de la API con una sola función de acceso, el formato de errores `{ error, code, details }` y las variables de entorno (`src/lib/api`, `src/config.ts`; tests del cliente pasando). Falta un `.env.example`: el entorno de la IA no puede escribir archivos `.env*`
- [x] Helper único de dinero: pesos ↔ centésimos y formato `$1.200` (`src/lib/money.ts`, tests pasando)
- [x] Helper único de teléfono: entrada libre → lo que espera la API; formato para mostrar (`src/lib/phone.ts`, tests pasando)
- [~] **P0** Componentes de estado compartidos: vacío, cargando, error y éxito (`src/components/states.tsx`)
- [ ] **P1** Lint y formato
- [ ] **P2** Silenciar los avisos de React Router v7 en los tests y en la consola (activar los *future flags* `v7_startTransition` y `v7_relativeSplatPath`)
- [x] `.env.example` con las tres variables (sin valores; los valores por defecto y su explicación están en `docs/FRONTEND.md`)
- [~] **P1** Comercio fijo por configuración mientras no haya login (`VITE_MERCHANT_ID`; la app avisa si falta)
- [~] Proxy de desarrollo `/api` → backend, para trabajar sin CORS (`vite.config.ts`)

## 2. Pantallas del mostrador (P0: lo que se usa con el cliente delante)

- [~] **P0** Mostrador: buscar cliente por teléfono, ver saldo, estado "cliente nuevo" y crear (`src/pages/Mostrador.tsx`; 7 tests pasando y verificado en el navegador contra el backend local: busca, avisa "Seguí escribiendo…" y muestra "Este número es nuevo"). Sin probar todavía: **crear** un cliente, ver un cliente existente con saldo, el celular y el error de red
- [~] **P1** Panel "Hoy en el mostrador" (columna derecha del diseño web) (`src/components/HoyEnElMostrador.tsx`; con tests pasando; falta verlo en el navegador contra el backend nuevo)
- [~] **P0** Cargar saldo con vista previa del bono (`src/pages/CargarSaldo.tsx`; verificada en el navegador por el usuario con la versión anterior; el 2026-10-13 pasó a usar el bono del backend y la clave de idempotencia con "Reintentar": 14 tests pasando; falta verla en el navegador con el backend nuevo). Decisión: no se preselecciona ningún monto
- [x] **P0** Cobrar, con los estados "éxito" y "saldo insuficiente (le faltan $X)" (`src/pages/Cobrar.tsx`, 11 tests pasando; verificada en el navegador por el usuario el 2026-10-13)
- [~] **P0** Navegación celular (menú inferior) y web (menú lateral oscuro de 200px) con el chip del comercio (`src/components/Layout.tsx`, según el diseño; sin ver en el navegador). Las rutas `/cobrar/:id` y `/cargar/:id` son de relleno

## 3. Gestión

- [x] **P1** Ficha del cliente con historial paginado y filtro por tipo (`src/pages/Ficha.tsx`; de a 8 movimientos en el celular y 15 en pantalla grande con "Ver más"; 9 tests; verificada en el navegador por el usuario el 2026-10-13)
- [x] **P1** Ajuste manual (monto con signo, nota obligatoria) (`src/pages/Ajuste.tsx`; 11 tests pasando; verificada en el navegador por el usuario el 2026-10-13)
- [x] **P1** Clientes: lista con búsqueda y saldo, paginada (`src/pages/Clientes.tsx`; 8 tests pasando; verificada en el navegador por el usuario el 2026-10-13)
- [x] **P1** Promos: listar, crear, editar y activar/desactivar (`src/pages/Promos.tsx` y `PromoForm.tsx`; 17 tests pasando; verificadas en el navegador por el usuario el 2026-10-13); con nombre, descripción y "Usada N veces" desde el 2026-10-13 (tests pasando; falta verlo contra el backend nuevo)
- [x] **P1** Reactivar: lista de inactivos (`src/pages/Reactivar.tsx`; 8 tests pasando; verificada en el navegador por el usuario el 2026-10-13, simulando un cliente que no venía desde junio al editar `lastVisitAt` en la base, sin tocar el reloj; lo muestra y lo saca al subir los días); con el saldo de cada cliente y el total del backend desde el 2026-10-13 (falta verlo contra el backend nuevo)

## 4. Pedidos al backend

Cosas que la interfaz necesita y la API de hoy no resuelve. No se simulan
en el frontend: se piden y se registran acá hasta que existan.

- [~] **P0** CORS: el backend lo resolvió el 2026-10-13 (sin commitear ni verificar corriendo) con la variable `CORS_ORIGINS` (lista de orígenes, nunca `*`). En desarrollo el front sigue usando el proxy de Vite; en producción hay que poner la URL absoluta del backend en `VITE_API_URL` y la del front en `CORS_ORIGINS`
- [~] **P1** Búsqueda por teléfono: el backend lo resolvió el 2026-10-13 (sin commitear ni verificar corriendo): `?search=` ahora normaliza (también parcial) y `?phone=` es exacto. El frontend ya dejó el rodeo (Mostrador usa `?phone=`; Clientes manda el texto tal cual)
- [~] **P1** Movimientos del comercio, para el panel "Hoy en el mostrador": el backend lo resolvió el 2026-10-13 (sin commitear ni verificar corriendo) (`GET /merchants/:m/transactions?from=&to=&type=`, con `customer {id, name, phone}` en cada fila; `from` inclusivo y `to` exclusivo, ISO con offset). El frontend ya lo usa en el panel "Hoy en el mostrador"
- [ ] **P0** Autenticación de comercios (hoy cualquiera con un id opera): hasta que exista, el frontend usa un comercio fijo por configuración
- [~] **P1** Buscar un cliente por teléfono sin crearlo: cubierto con `?phone=` (el backend lo resolvió el 2026-10-13 (sin commitear ni verificar corriendo)); el Mostrador ya lo usa
- [~] **P0** Idempotencia en cargas, cobros y ajustes: el backend lo resolvió el 2026-10-13 (sin commitear ni verificar corriendo) (header `Idempotency-Key`, opcional; mismo cuerpo → misma respuesta con `Idempotent-Replayed: true`; otro cuerpo → 422 `IDEMPOTENCY_KEY_REUSED`; claves de 48 horas). **El frontend ya lo usa**: Cargar saldo, Cobrar y Ajuste mandan una clave por operación y ofrecen "Reintentar" con la misma clave
- [~] **P1** Vista previa del bono en el servidor: el backend lo resolvió el 2026-10-13 (sin commitear ni verificar corriendo) (`GET /merchants/:m/bonus-preview?amount=`). El frontend ya la usa en Cargar saldo y se borró `src/lib/bonus.ts`
- [ ] **P1** Unificar unidades de la API (hoy entra pesos y sale centésimos)
- [~] **P2** Que un movimiento de bono diga de qué promo salió: el backend lo resolvió el 2026-10-13 (sin commitear ni verificar corriendo) (`bonusRuleId`; null en los bonos viejos). El frontend ya lo muestra en la ficha ("Promo de verano" o, sin nombre, "Promo $1.000+")
- [~] **P1** Saldo de cada cliente en `GET /merchants/:m/inactive`: el backend lo resolvió el 2026-10-13 (sin commitear ni verificar corriendo). El frontend ya lo muestra en Reactivar
- [~] **P2** Cuántas veces se usó cada promo: el backend lo resolvió el 2026-10-13 (sin commitear ni verificar corriendo) (`timesUsed`, que no cuenta los bonos anteriores). El frontend ya lo muestra en Promos ("Usada N veces")
- [~] **P2** Total de clientes inactivos: el backend lo resolvió el 2026-10-13 (sin commitear ni verificar corriendo) (`total` en `/inactive`). El frontend ya lo usa en el contador de Reactivar
- [~] **P2** Un nombre y una descripción para las promos: el backend lo resolvió el 2026-10-13 (sin commitear ni verificar corriendo) (`name` y `description`, opcionales; el PATCH acepta `null` para borrarlos). El frontend ya tiene los campos en el formulario y los muestra en el listado
- [ ] **P2** Envío de WhatsApp a inactivos (hoy el botón queda deshabilitado)

**Para el lado del cliente** (decisiones cerradas el 2026-10-15; el texto para el backend se armó ese día):

- [ ] **P0** Ingreso del cliente por teléfono + código de un solo uso (WhatsApp o SMS) y sesión; endpoints "del cliente" (`/me/…`) que solo devuelven los datos de quien está logueado
- [~] **P1** Perfil público del comercio (descripción, foto por URL, categoría, horarios y `visible`): el backend lo resolvió el 2026-10-15 (sin verificar corriendo); el frontend ya lo usa en la pestaña "Mi comercio". Los errores `CATEGORY_CHANGE_TOO_SOON`, `PROFILE_INCOMPLETE` y `LOCATION_REQUIRED_WHILE_VISIBLE` están manejados
- [~] **P1** Categoría de lista fija, con un cambio cada 90 días: el backend lo resolvió el 2026-10-15 (sin verificar corriendo); el frontend la muestra bloqueada con la fecha y maneja el 422
- [~] **P1** Varios locales por comercio (solo cambia la dirección; baja en vez de borrar): el backend lo resolvió el 2026-10-15 (sin verificar corriendo); el frontend ya los edita en "Mi comercio"
- [~] **P1** Listado y detalle públicos de lugares (`GET /places`, `GET /places/:id`): el backend lo resolvió el 2026-10-15 (sin verificar corriendo). **Falta construir las pantallas del cliente** (Lugares y Detalle)
- [ ] **P1** `GET /me/balances`: el saldo del cliente en cada comercio (se arma juntando sus filas de cliente por teléfono verificado)
- [ ] **P2** Subida y almacenamiento de fotos (hoy el comercio carga la foto con un enlace)
- [ ] **P2** Que `GET /merchants/:id` devuelva desde cuándo se puede cambiar la categoría (`categoryChangeAvailableAt`): hoy el front suma los 90 días por su cuenta para mostrar el bloqueo (el 422 del backend manda igual)
- [ ] **P2** Idempotencia al crear un local: si se corta la red justo al crearlo, un reintento podría duplicarlo (el front ya evita duplicar los reintentos que él controla)
- [ ] **P2** QR personal del cliente (ya está en el TODO del backend)

## 5. Calidad

- [x] Probar a mano el flujo completo contra el backend real: buscar → cargar con bono → cobrar → saldo (lo recorrió el usuario el 2026-10-13, salvo Reactivar; el caso narrado está en `../project-platita-backend/docs/EJEMPLO.md`)
- [x] Tests de los helpers de dinero y teléfono y del cliente de la API (20 tests pasando, 2026-10-13)
- [ ] **P1** Tests de pantalla para los casos de plata: saldo exacto, saldo insuficiente, monto con decimales
- [ ] **P1** Checklist de prueba manual en un celular real, en el mostrador
- [ ] **P1** Accesibilidad: contraste, objetivos táctiles de 48px o más, uso con una mano
- [ ] **P2** Pruebas de punta a punta automatizadas
- [x] Reintento seguro probado a mano en el navegador (2026-10-13): con el backend caído aparece "Reintentar" y, al volver, se registra un solo cobro
- [ ] **P1** Probar a mano la repetición real: que la carga **sí llegue** pero se pierda la respuesta. En el navegador no se simula bien; se hace desde la consola `/dev` del backend, mandando dos veces la misma carga con la misma `Idempotency-Key` (la segunda debe decir "REINTENTO" y no subir el saldo) y una tercera con otro monto (422 `IDEMPOTENCY_KEY_REUSED`). Pendiente, a pedido del usuario

## 6. Despliegue

- [ ] **P1** Vulnerabilidades de `npm audit` (analizadas el 2026-10-13: 15 en total, 2 críticas y 6 altas, pero **solo 2 moderadas llegan a producción**). Plan, en este orden:
  - [ ] **P1** `react-router-dom` 6.30 → 7.18.x: es lo único que viaja en la app. Las 2 moderadas (redirección abierta con `\` en `<Link>`/`navigate` y deserialización en SSR) casi no aplican acá (SPA sin SSR, enlaces con ids que genera el backend), pero es barato y además apaga los avisos de los future flags. Pide Node >= 20: sirve con el actual
  - [ ] **P1** `vite` 5 → 6.4.4 y `vitest` 2 → 4.1.11 (con `@vitejs/plugin-react` compatible): arregla las 2 críticas (`vitest` con su UI y `tinypool`), la alta de `vite` y las moderadas de `esbuild` y `@vitest/mocker`. Corren con Node 20 (vite 7/8 y vitest 5 piden Node >= 20.19 o 22: no usar con el Node actual). Son solo herramientas de desarrollo: no están en lo que se publica
  - [ ] **P2** `tailwindcss` 3 → 4: las 5 restantes (`braces`, `micromatch`, `chokidar`, `postcss-selector-parser`, `postcss-nested`/`fast-glob`) vienen de su cadena y solo afectan al *build* sobre nuestro propio código. Migración grande (configuración y plugin distintos): se deja para cuando haya tiempo
  - No usar `npm audit fix --force`: mezcla los tres cambios mayores de golpe
- [ ] **P1** CI: lint, typecheck y tests
- [ ] **P1** Hosting estático barato
- [ ] **P2** Instalable en el celular (PWA)

## 7. Lado del cliente (web primero, mobile después)

Decisiones del 2026-10-15 (resumen en `docs/STATE.md`). La web va a tener **dos áreas** que comparten la misma API, los helpers y el estilo: **comercio** (lo que ya existe) y **cliente**. Se arma primero en web para pulir flujos y estilo, y que la app mobile reutilice todo.

- [ ] **P0** **RECORDATORIO — ingreso real del cliente.** El cliente entra con su teléfono y un código de un solo uso que se le manda (WhatsApp o SMS): recién ahí es un usuario verificado. Hoy se **simula** (se elige un teléfono). Sin la verificación real **no se puede publicar**: cualquiera vería los saldos de cualquier número. Hay que reemplazar la simulación antes de salir
- [x] Diseño del lado del cliente y de "Mi comercio" hecho en Claude Design (`design/platita-cliente.codigo.html` y `design/platita-mi-comercio.codigo.html`, 2026-10-15)
- [x] Estructura de código: dos áreas en el mismo repo, el comercio bajo `/comercio` y el cliente bajo `/cliente`, con todas las rutas en `src/lib/routes.ts` (2026-10-15)
- [~] **P0** Pantalla de entrada ("Soy cliente" / "Soy un comercio") hecha; falta el ingreso **simulado** del cliente
- [ ] **P1** **Lugares**: lista de los comercios que eligieron aparecer, con categoría y marca de si tienen una promo activa
- [ ] **P1** **Detalle de un lugar**: promos activas, dirección con mapa, horarios, categoría, descripción, foto y el saldo del cliente en ese comercio
- [ ] **P1** **Mis saldos**: lo que tiene en cada comercio
- [ ] **P1** **Perfil**: nombre, teléfono y cerrar sesión
- [ ] **P1** Botón "Cargar saldo" deshabilitado con la etiqueta "Próximamente" (a futuro, el cliente podrá cargar transfiriéndole al comercio que elija; hoy solo mira)
- [~] **P1** **Pestaña "Mi comercio"** del lado del comercio (`src/pages/MiComercio.tsx`, 5 secciones y barra de guardado; tests pasando, falta verla en el navegador contra el backend nuevo). Desvíos del diseño: la descripción es solo recomendada (el backend no la exige) y la foto se carga con un enlace (no hay subida todavía)
- [ ] **P2** QR personal del cliente en su perfil, para mostrarle al cajero
- [ ] **P2** Más ideas a medida que aparezcan

Reglas ya decididas: el cliente **solo mira** (no carga por su cuenta); un comercio **solo aparece si lo activa**; la categoría la elige el comercio y **no se cambia seguido**; dirección, mapa, horarios, descripción y foto los edita el comercio (porque se puede mudar, abrir otro local o cambiar el horario).

**Decidido el 2026-10-15 (segunda ronda):**
- **Categoría:** se puede cambiar una vez cada **90 días**. Si necesita cambiarla antes, el comercio nos escribe y la cambiamos nosotros; el front lo dice en un **tooltip** al lado del selector.
- **Varios locales:** un comercio puede tener más de uno y **lo único que cambia es la dirección** (se muestran varias ubicaciones). Hoy no es importante, pero el modelo y la pantalla quedan preparados para más de uno.
- **Mapa:** un botón **"Cómo llegar"** que abre el mapa del celular con la dirección. Sin mapa propio ni coordenadas.
- **Supuesto a confirmar:** los **horarios** son del comercio (uno solo), no de cada local; si más adelante cada local tiene los suyos, se mueven al local.
