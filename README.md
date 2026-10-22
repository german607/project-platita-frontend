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

### 2. Dejar listo el ingreso (una sola vez)

El ingreso es con el celular y un código que llega por mensaje. Con el backend en
modo de pruebas (`OTP_PROVIDER=dev`, que es lo normal en desarrollo) **cualquier
celular entra con el código `000000`**; la pantalla de ingreso lo avisa. Para
probar con un mensaje de verdad, ver "Ingreso real" en `docs/BACKEND.md` del
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
cuál si tenés varios. Si todavía no tenés un comercio, entrá, tocá **Cambiar de
cuenta o sumar mi comercio** en tu Perfil y creá uno con su nombre: quedás como
dueña.

### 4. Probarlo

1. Con tu comercio elegido, en **Mostrador** escribí un teléfono (por ejemplo `099 123 456`). Si no
   existe, **Crear cliente**.
2. **Cargar saldo** → elegí $1.000 → mirá el bono → **Listo, confirmar**.
3. Volvé al Mostrador, buscá el mismo teléfono y probá **Cobrar**.
4. Mirá sus movimientos en **Clientes** → entrá a su ficha.

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
