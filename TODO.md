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
- [ ] **P1** Panel "Hoy en el mostrador" (columna derecha del diseño web); depende del pedido al backend de movimientos del comercio
- [~] **P0** Cargar saldo con vista previa del bono (`src/pages/CargarSaldo.tsx`, `src/lib/bonus.ts`; 11 tests de la pantalla + 5 del bono pasando; falta verla en el navegador). Decisiones: no se preselecciona ningún monto y, si se corta la red al confirmar, no hay "reintentar" (ver el pedido de idempotencia)
- [~] **P0** Cobrar, con los estados "éxito" y "saldo insuficiente (le faltan $X)" (`src/pages/Cobrar.tsx`, 11 tests pasando; falta verla en el navegador)
- [~] **P0** Navegación celular (menú inferior) y web (menú lateral oscuro de 200px) con el chip del comercio (`src/components/Layout.tsx`, según el diseño; sin ver en el navegador). Las rutas `/cobrar/:id` y `/cargar/:id` son de relleno

## 3. Gestión

- [~] **P1** Ficha del cliente con historial paginado y filtro por tipo (`src/pages/Ficha.tsx`; 8 tests pasando; falta verla en el navegador)
- [~] **P1** Ajuste manual (monto con signo, nota obligatoria) (`src/pages/Ajuste.tsx`; 11 tests pasando; falta verla en el navegador)
- [~] **P1** Clientes: lista con búsqueda y saldo, paginada (`src/pages/Clientes.tsx`; 8 tests pasando; falta verla en el navegador)
- [~] **P1** Promos: listar, crear, editar y activar/desactivar (`src/pages/Promos.tsx` y `PromoForm.tsx`; 17 tests pasando; falta verlas en el navegador). Falta del diseño web: "Usada N veces" (ver pedidos al backend)
- [~] **P1** Reactivar: lista de inactivos con días configurables; botón de WhatsApp deshabilitado ("próximamente") (`src/pages/Reactivar.tsx`; 8 tests pasando; falta verla en el navegador). Falta del diseño: el saldo de cada cliente (ver pedidos al backend)

## 4. Pedidos al backend

Cosas que la interfaz necesita y la API de hoy no resuelve. No se simulan
en el frontend: se piden y se registran acá hasta que existan.

- [ ] **P0** CORS: el backend no lo configura, así que el navegador va a bloquear las llamadas desde otro origen (por ejemplo `localhost:5173` hacia `localhost:3001`). Solución en desarrollo: proxy del servidor de desarrollo o `@fastify/cors` en el backend
- [ ] **P1** Búsqueda por teléfono: `GET /merchants/:m/customers?search=` no normaliza, así que `099123456` **no encuentra** a `+59899123456`. El frontend lo rodea buscando por los dígitos del número ya normalizado (`59899123456`) y filtrando por teléfono exacto; sigue siendo mejor que el backend normalice el término o ofrezca búsqueda exacta por teléfono
- [ ] **P1** Movimientos del comercio del día, para el panel "Hoy en el mostrador" del diseño web (por ejemplo `GET /merchants/:m/transactions?from=`): hoy solo hay movimientos por cliente
- [ ] **P0** Autenticación de comercios (hoy cualquiera con un id opera): hasta que exista, el frontend usa un comercio fijo por configuración
- [ ] **P1** Buscar un cliente por teléfono **sin crearlo** de forma explícita (hoy `POST …/customers` es "buscar o crear")
- [ ] **P0** Idempotencia en cargas, cobros y ajustes (por ejemplo un header `Idempotency-Key`): sin ella, si se corta la conexión al confirmar no se sabe si el movimiento se registró y reintentar podría duplicarlo; hoy el frontend avisa que se revise el saldo y no ofrece reintentar
- [ ] **P1** Vista previa del bono en el servidor (hoy se calcula en pantalla con las reglas activas, duplicando la regla del backend: `src/lib/bonus.ts`)
- [ ] **P1** Unificar unidades de la API (hoy entra pesos y sale centésimos)
- [ ] **P2** Que un movimiento de bono diga de qué promo salió (hoy `BONUS` no lo guarda y la ficha solo puede decir "Bono"; el diseño muestra "Promo $1.000+")
- [ ] **P1** Incluir el saldo de cada cliente en `GET /merchants/:m/inactive`: el diseño de Reactivar lo muestra y hoy no viene; no se arma con una consulta por cliente
- [ ] **P2** Cuántas veces se usó cada promo (el diseño web de Promos dice "Usada 38 veces"); depende de que el bono guarde de qué promo salió
- [ ] **P2** Total de clientes inactivos: el contador "N clientes" de Reactivar hoy cuenta lo cargado y agrega "+" si hay más páginas
- [ ] **P2** Envío de WhatsApp a inactivos (hoy el botón queda deshabilitado)

## 5. Calidad

- [ ] **P0** Probar a mano el flujo completo contra el backend real: buscar → cargar con bono → cobrar → saldo (el caso narrado está en `../project-platita-backend/docs/EJEMPLO.md`)
- [x] Tests de los helpers de dinero y teléfono y del cliente de la API (20 tests pasando, 2026-10-13)
- [ ] **P1** Tests de pantalla para los casos de plata: saldo exacto, saldo insuficiente, monto con decimales
- [ ] **P1** Checklist de prueba manual en un celular real, en el mostrador
- [ ] **P1** Accesibilidad: contraste, objetivos táctiles de 48px o más, uso con una mano
- [ ] **P2** Pruebas de punta a punta automatizadas

## 6. Despliegue

- [ ] **P1** Revisar `npm audit`: al instalar (2026-10-13) reportó 15 vulnerabilidades (2 críticas, 6 altas). No se analizaron; no usar `npm audit fix --force` sin mirar qué cambia
- [ ] **P1** CI: lint, typecheck y tests
- [ ] **P1** Hosting estático barato
- [ ] **P2** Instalable en el celular (PWA)
