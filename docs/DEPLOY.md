# Despliegue: Neon + Render + Cloudflare Pages

Plan para tener la app corriendo en internet **sin costo**, con el mismo esquema que
usó iwant (ver `../iwant/docs/DEPLOYMENT.md`). Escrito el 2026-10-25. Los pasos en
los paneles los hace una persona; acá queda qué clickear y qué valores poner.

> **Estado:** todavía **no hay nada desplegado**. Este documento es el plan. Cuando se
> haga, hay que dejar acá las URLs reales y actualizar "Estado actual" al final.

## Qué va a dónde

| Pieza | Servicio | Plan | Para qué |
|---|---|---|---|
| Base de datos | **Neon** (Postgres) | Free | Un **proyecto nuevo**, aparte de iwant |
| Backend (API) | **Render** (Web Service) | Free | Corre `node dist/server.js` del repo del backend |
| Frontend | **Cloudflare Pages** | Free | Sirve los archivos estáticos de `dist/` |

Cada pieza es un proyecto **propio**: no se pisa con iwant. Lo único compartido son los
topes de la cuenta (ver "Límites").

## Lo que ya tiene el backend para esto (verificado leyendo el repo)

- `npm run build` (compila a `dist/`) y `npm start` (`node dist/server.js`). Pide **Node >= 22**.
- `GET /health` para el chequeo de vida.
- `Dockerfile` (por si algún día se pasa a contenedor) y migraciones de Prisma:
  `npx prisma migrate deploy` (no `db push`: acá sí hay migraciones).
- Variables: `DATABASE_URL`, `PORT` (la pone Render), `NODE_ENV`, `CORS_ORIGINS`,
  `TRUST_PROXY`, `OTP_PROVIDER`, `TWILIO_*`, `OTP_REAL_PHONES`, `ALLOWED_MERCHANT_PHONES`,
  `ALLOW_INSECURE_AUTH`, `SESSION_TTL_DAYS`.
- En producción **se niega a arrancar** con el proveedor de códigos de prueba (`dev`),
  salvo `ALLOW_INSECURE_AUTH=true`; y sin `ALLOWED_MERCHANT_PHONES`, **nadie** puede crear
  comercios. Las rutas `/users/*` y la consola `/dev` solo existen fuera de producción.

## Orden de trabajo

### 0. Antes de empezar
- Mergear a la rama principal los cambios del front **y** del backend juntos (el front ya
  manda el token y el backend ya exige dueños). Render y Pages despliegan de una rama:
  usar la que se decida como "estable" (`main`).
- Decidir si es **demo con datos de mentira** o **uso real** (ver "Códigos de ingreso").

### 1. Neon: la base
1. Entrar a Neon → **New project**. Nombre: el que sea (por ejemplo `ombu`). Región: la
   misma que se use en Render (recomendado: **AWS US East 2 (Ohio)** y en Render **Ohio**,
   para que backend y base queden cerca; confirmar que existen en los paneles).
2. En **Connection details**, copiar la cadena **directa** (la que **no** tiene
   `-pooler` en el host) y comprobar que termina en `?sslmode=require`. Esa es la
   `DATABASE_URL`. (Prisma migra mejor sin el *pooler*; con la carga de una prueba no hace
   falta.)
3. **No** pegarla en ningún archivo del repo: va solo en el panel de Render.

### 2. Render: el backend
1. Render → **New → Web Service** → conectar el repo `project-platita-backend`, rama estable.
2. Configuración:
   - **Runtime:** Node. **Root Directory:** (vacío, el backend está en la raíz de su repo).
   - **Build Command:** `npm ci --include=dev && npx prisma generate && npm run build && npx prisma migrate deploy`
     (`--include=dev` porque Render pone `NODE_ENV=production` y sin eso no instala
     `tsc` ni `prisma`; `migrate deploy` aplica las migraciones pendientes en cada deploy).
   - **Start Command:** `npm start`
   - **Health Check Path:** `/health`
   - **Plan:** Free. **Node:** 22 (variable `NODE_VERSION=22`, o un archivo `.nvmrc`; el repo
     ya tiene `.nvmrc` con 22).
3. **Variables de entorno** (panel *Environment*; nunca en el repo):

   | Variable | Valor |
   |---|---|
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | la cadena directa de Neon |
   | `TRUST_PROXY` | `true` (Render va delante: sin esto los límites por IP no sirven) |
   | `CORS_ORIGINS` | la URL de Cloudflare Pages, **sin barra final** (se completa en el paso 4) |
   | `OTP_PROVIDER` | `twilio` (uso real) o `dev` (demo con datos de mentira; ver más abajo) |
   | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SID` | las de Twilio (con `twilio`, o para `OTP_REAL_PHONES`) |
   | `ALLOWED_MERCHANT_PHONES` | los teléfonos que pueden crear comercios, separados por coma |
   | `ALLOW_INSECURE_AUTH` | `true` **solo** si `OTP_PROVIDER=dev` (demo) |
   | `OTP_REAL_PHONES` | (opcional, modo mixto con `dev`) tus teléfonos que se verifican de verdad |

   `PORT` la pone Render sola.
4. **Create Web Service.** El primer deploy tarda unos minutos. Al terminar, probar
   `https://<servicio>.onrender.com/health` → `{"ok":true}`.

### 3. Datos de ejemplo (opcional, solo para demo)
Desde **tu computadora**, con el backend clonado y la cadena de Neon (no la subas a ningún lado):

```bash
DATABASE_URL="postgresql://…neon…?sslmode=require" npm run db:seed
```

Esto carga los comercios y personas del seed (cuentas de prueba en el README del front).
**Cuidado:** `npm run db:reset-seed` vacía toda la base; no usarlo en una base con datos
reales.

### 4. Cloudflare Pages: el front
1. Cloudflare → **Workers & Pages → Create → Pages → Connect to Git** → repo `project-platita-frontend`, rama de producción (`main`).
2. Configuración de build:
   - **Framework preset:** None (o Vite).
   - **Build command:** `npm ci && npm run build`
   - **Build output directory:** `dist`
   - **Variables (Production y Preview):**
     - `NODE_VERSION` = `22`
     - `VITE_API_URL` = `https://<servicio>.onrender.com` (sin barra final). **Va adentro del
       build**: si cambia, hay que volver a desplegar el front.
     - `VITE_APP_NAME` = (opcional) el nombre que se ve; si no, `Ombú`.
3. **Save and Deploy.** La URL queda del estilo `https://<proyecto>.pages.dev`.
4. Volver a Render y poner esa URL en `CORS_ORIGINS` (sin barra final); Render redespliega.
5. Las rutas del front (`/cliente/lugares`, `/comercio/...`) funcionan al recargar: Pages
   devuelve `index.html` para rutas desconocidas (modo SPA) mientras no exista un `404.html`.

### 5. Probar de punta a punta
- [ ] `…/health` del backend responde `{"ok":true}`.
- [ ] La pantalla de inicio carga y muestra los lugares (con seed) o "Pronto vas a ver…".
- [ ] Entrar con un celular y su código; con el seed, `099 000 002` (Beto) y `000000` si es demo.
- [ ] Como Ana (`099 000 001`): elige comercio, abre Mostrador, carga un saldo.
- [ ] Como Beto, en otra ventana: ve el saldo en Mis saldos.
- [ ] Recargar una página interna (`F5`) no da 404.
- [ ] En la consola del navegador no hay errores de **CORS**.

## Códigos de ingreso: demo o real

- **Demo con datos de mentira** (`OTP_PROVIDER=dev` + `ALLOW_INSECURE_AUTH=true`): cualquiera
  entra con `000000` **como cualquier número**, y por lo tanto puede ver los saldos de
  cualquiera. Sirve para mostrarle la app a alguien **solo con datos inventados**. Con
  `OTP_REAL_PHONES` se protegen tus propios números (esos sí van por SMS).
- **Uso real** (`OTP_PROVIDER=twilio`): hace falta Twilio. Con la **cuenta de prueba** solo
  manda mensajes a números **verificados de antemano** en la consola de Twilio; para que
  cualquiera pueda entrar hay que pasar a una cuenta paga y ver si Uruguay pide registrar
  el remitente. Hoy no se debe publicar con datos reales sin esto resuelto.

## Qué esperar del plan gratis

- **Render duerme el backend a los 15 minutos** sin uso: el primer pedido tarda unos
  30 a 50 segundos. Neon además duerme a los 5 minutos (despierta en menos de un segundo).
  Es normal en las pruebas; la app muestra "Buscando lugares…" / "Mandando…" mientras espera.
- **Cada `git push` a la rama de producción redespliega** solo, en Render y en Pages. Pages
  gasta un *build* de los gratis en cada push (también en las ramas de PR: tiene *previews*).
- **Límites (confirmar en los paneles):** Neon free, 100 proyectos, 1 GB cada uno y 20 GB en
  total; Pages, unos 500 builds por mes; Render free comparte las horas mensuales entre
  los servicios gratuitos de la cuenta.

## Pedidos al backend (para pasarle)

> Hola. Vamos a desplegar el backend en **Render (free) + Neon**, y el front en Cloudflare
> Pages. Revisé el repo y casi todo está: `build`, `start`, `/health`, `TRUST_PROXY`,
> `CORS_ORIGINS`, `prisma migrate deploy`. Pedidos chicos:
> 1. **Confirmar o corregir** el *Build Command* que voy a usar en Render:
>    `npm ci --include=dev && npx prisma generate && npm run build && npx prisma migrate deploy`
>    y el *Start Command* `npm start` (con Node 22 y `NODE_ENV=production`).
> 2. **Un `render.yaml`** (Blueprint) en la raíz con el servicio web gratis, esos comandos,
>    `healthCheckPath: /health` y las variables de entorno **sin valores** (para completar en
>    el panel), así se crea con un clic y queda documentado.
> 3. **`db:seed` y `db:reset-seed` con un freno de seguridad**: que se nieguen a correr si
>    `NODE_ENV=production` (que no se pueda vaciar una base real por error) y que pidan una
>    confirmación explícita (por ejemplo `--yes`) si la `DATABASE_URL` no es de `localhost`.
> 4. **El nombre de la app en una variable** (`APP_NAME`, hoy el proyecto se llama "Ombú"
>    en clave): para el texto del mensaje si es posible, la consola `/dev`, el nombre de la
>    base y del contenedor.
> 5. **Contar qué pasa con la conexión de Neon** al despertar (primer pedido tras dormir):
>    si Prisma necesita reintentos o un `connect_timeout` en la `DATABASE_URL`, decir cuáles.
> Si algo no coincide con esto, avisame con lo exacto.

## Estado actual

- Nada desplegado. URLs (completar cuando existan): front `…`, backend `…`, Neon `…`.
