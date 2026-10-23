# Platita — frontend

Panel web para comercios de barrio en Uruguay, pensado para el celular del
mostrador. El cajero escribe el teléfono de un cliente y, en segundos, le
**carga saldo** (con bono por la promo que corresponda) o le **cobra**
descontando de su saldo. Platita no toca la plata: solo registra el saldo; la
carga se cobra en efectivo o en la cuenta del comercio.

React + TypeScript + Vite + Tailwind. Es solo la cara visible: toda la lógica y
los datos viven en el backend (repo hermano `project-platita-backend`).

## Cómo levantarlo, paso a paso

Necesitás **Node 20 o más** (se recomienda el 22), **Docker** (para la base de
datos del backend) y los dos repos clonados **uno al lado del otro**:

```
antes_proyecto/
  project-platita-backend/
  project-platita-frontend/   ← este
```

### 1. Levantar el backend

```bash
cd project-platita-backend
cp -n .env.example .env
docker compose up -d          # la base de datos
npm install
npx prisma migrate deploy     # crea las tablas
PORT=3001 npm run dev         # el servidor, en el puerto 3001
```

Se usa el puerto 3001 porque el 3000 suele estar ocupado. Dejá esa terminal
abierta.

### 2. Cargar los datos de ejemplo (una sola vez)

Con Node 22 y la rama del backend con dueños (`nvm use` dentro del backend):

```bash
npm run db:seed          # carga los datos de ejemplo e imprime qué teléfono entra a qué cuenta
```

(`npm run db:reset-seed` vacía TODA la base de desarrollo y la vuelve a cargar.)
El ingreso es con el celular y un código; con el backend en modo de pruebas
(`OTP_PROVIDER=dev`) **los teléfonos del seed entran con el código `000000`**, y la
pantalla de ingreso lo avisa. Cuentas de prueba:

| Teléfono | Quién es | A dónde entra |
|---|---|---|
| `099 000 001` | Ana | Dueña de 2 comercios (Café de la Esquina, Barbería Don Pablo): **pregunta a cuál**; también clienta de la panadería |
| `099 000 003` | Carla | Dueña de 3 (Panadería La Espiga, Lavadero Brillo, Estudio Pilates & Yoga Sol); también clienta del café |
| `099 000 002` | Beto | Solo cliente, con saldo en 3 comercios (uno en $0): va al lado del cliente |
| cualquier otro | — | Cliente sin saldo; no puede crear un comercio si su número no está habilitado (`ALLOWED_MERCHANT_PHONES` del backend) |

Para probar un mensaje de verdad, ver "Ingreso real" en `docs/BACKEND.md` del
backend (Twilio, con números verificados).

### 3. Levantar el frontend

En **otra terminal**:

```bash
cd project-platita-frontend
npm install
cp .env.example .env
```

Las dos variables del `.env` pueden quedar vacías: tienen valores por defecto.
Después:

```bash
npm run dev
```

Abrí **http://localhost:5173**. Es la pantalla de inicio: a un lado los lugares
que están en Platita y al otro, entrar con tu celular. Según tus cuentas, la
entrada te lleva sola al lado del **cliente**, a tu **comercio**, o te pregunta a
cuál si tenés varios. Crear un comercio nuevo (Perfil → **Cambiar de cuenta o ver
mis comercios** → **Sumar mi comercio**) solo lo pueden hacer los teléfonos que
habilita el backend; si el tuyo no está, la pantalla lo avisa.

### 4. Probarlo

1. Entrá con **`099 000 001`** (Ana) y elegí **Café de la Esquina**. En **Mostrador**
   buscá un cliente del seed o escribí un teléfono nuevo y **Crear cliente**.
2. **Cargar saldo** → elegí un monto → mirá el bono → **Listo, confirmar**. Probá
   también **Cobrar**, **Ajuste**, y **Reactivar** (hay clientes que no vienen hace
   más de 30 días, como Hugo en el Pilates de Carla).
3. Mirá **Mi comercio** (descripción, local, horarios, "Aparecer en la app") y **Promos**.
4. Para ver el otro lado, abrí **otra ventana de incógnito** (la sesión se guarda en
   el navegador) y entrá con **`099 000 002`** (Beto): Lugares, Detalle, **Mis saldos**
   y Perfil.
5. Cambiá de cuenta con **Cambiar de cuenta** (arriba, en el área del comercio).

## Qué hace cada pantalla

| Pantalla | Para qué sirve |
|---|---|
| **Mostrador** | Buscar un cliente por teléfono, ver su saldo y pasar a cobrar o cargar. En pantalla grande también muestra los movimientos de hoy |
| **Cargar saldo** | Registrar una carga, con la forma de pago y el bono que corresponde |
| **Cobrar** | Descontar del saldo; si no alcanza, dice cuánto falta |
| **Clientes** | Lista con búsqueda por nombre o teléfono, y su ficha con el historial |
| **Ajuste** | Corregir un saldo, con un motivo obligatorio |
| **Promos** | Crear, editar y apagar las promos (no se borran) |
| **Reactivar** | Clientes que hace tiempo no vienen |
| **Mi comercio** | El perfil público: descripción, foto, categoría, locales, horarios y si aparece en la app de los clientes |

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Levanta la app en http://localhost:5173 |
| `npm run typecheck` | Revisa los tipos |
| `npm run test:run` | Corre todos los tests una vez |
| `npm run build` | Revisa los tipos y genera la versión para publicar en `dist/` |

## Variables de entorno (`.env`)

| Variable | Para qué | Si está vacía |
|---|---|---|
| `VITE_API_URL` | Dónde está el backend | Usa `/api` (el proxy de desarrollo) |
| `VITE_API_PROXY_TARGET` | Solo desarrollo: a qué backend reenvía `/api` | Usa `http://localhost:3001` |

Vite lee el `.env` **solo al arrancar**: si lo cambiás, reiniciá `npm run dev`.

## Probarlo desde el celular

Con la compu y el celular en la **misma red wifi**, levantá el frontend así:

```bash
npm run dev -- --host
```

Vite muestra una dirección "Network" (algo como `http://192.168.1.20:5173`):
abrila en el celular. Hacelo solo en una red de confianza.

## Si algo no anda

| Pasa esto | Probablemente |
|---|---|
| Al entrar vuelve siempre al inicio | La sesión venció o el backend la cerró: pedí un código de nuevo |
| "Este comercio no es tuyo" | El comercio es de otra persona, o es uno anterior a los dueños y todavía no tiene (el backend lo asigna con `npm run db:assign-merchant`) |
| No aparece el nombre del comercio arriba | El backend no está corriendo o no es de tu cuenta |
| "No hay conexión con el servidor" | El backend no está corriendo en el puerto 3001 |
| El backend dice que el puerto 3000 está ocupado | Usá `PORT=3001 npm run dev` en el backend |
| La búsqueda por teléfono o el bono fallan | El backend está desactualizado: traé su última versión, corré `npx prisma migrate deploy` y reinicialo |

## Dónde está cada cosa

| Qué | Dónde |
|---|---|
| Reglas para quien trabaje en el proyecto (personas e IAs) | [`docs/AGENTS.md`](docs/AGENTS.md) |
| Estado actual | [`docs/STATE.md`](docs/STATE.md) |
| Qué falta, por prioridad | [`TODO.md`](TODO.md) |
| Stack, estructura del código y cómo agregar una pantalla | [`docs/FRONTEND.md`](docs/FRONTEND.md) |
| Tokens de diseño, pantallas y qué endpoint usa cada una | [`docs/DISENO.md`](docs/DISENO.md) |
| Historia de lo que se hizo | [`docs/CHANGELOG.md`](docs/CHANGELOG.md) |
| Diseño de referencia (abrir en el navegador) | `design/platita-diseno-b.codigo.html` |

## Backend

La API y las reglas del negocio viven en el repo hermano
`project-platita-backend` (GitHub: `german607/project-platita-backend`).
Su documentación (`docs/BACKEND.md`, `docs/EJEMPLO.md`) es la referencia del
contrato de la API; `docs/EJEMPLO.md` cuenta un caso completo paso a paso.
