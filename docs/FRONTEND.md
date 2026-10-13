# Frontend — stack, estructura y cómo agregar cosas

Foto del código tal como está. Si el código cambia, esto se actualiza en el
mismo cambio (ver [`AGENTS.md`](AGENTS.md)). Los tokens visuales y las
pantallas están en [`DISENO.md`](DISENO.md).

## Stack (decidido el 2026-10-13)

| Pieza | Elección | Por qué |
|---|---|---|
| Base | React 18 + TypeScript estricto + Vite 5 | El diseño ya está hecho en HTML/React; es una app detrás de login, sin necesidad de SEO; un link alcanza para el piloto, sin tiendas de apps |
| Estilos | Tailwind CSS 3 | Los tokens de `DISENO.md` viven en `tailwind.config.ts` |
| Datos de la API | TanStack Query | Cargando, error, caché y reintentos resueltos |
| Navegación | React Router 6 | |
| Validación | zod | La misma librería que el backend |
| Tests | Vitest + Testing Library (jsdom) | |

Se descartó **Expo / React Native**: obliga a reescribir el diseño (no hay
HTML ni CSS), la versión web es de segunda, y para el piloto un link es
más simple que una app. Es reversible: el cliente de la API, los helpers de
dinero y teléfono y las validaciones se reutilizan en React Native. Se
eligió **Vite 5** porque, según lo que se sabe, corre en Node 20.12; las
versiones nuevas piden Node 20.19 o 22. Verificarlo al subir de versión.

## Estructura

```
src/
  main.tsx, App.tsx       arranque, QueryClient y rutas
  config.ts               ÚNICO lugar que lee variables de entorno, validadas con zod
  index.css               Tailwind + base
  lib/
    money.ts              pesos ↔ centésimos, formato $1.200, lectura de lo que escribe la persona
    phone.ts              normalizar y formatear teléfonos uruguayos
    dates.ts              "Vino hace 12 días" (días de calendario locales)
    merchant.ts           useMerchantId(): el comercio configurado
    idempotency.ts        clave de idempotencia por operación (reintentar sin duplicar)
    payment.ts            formas de pago (efectivo, Mercado Pago, otro) y su nombre
    useDebounced.ts       espera a que termine de escribir (buscadores)
    useMediaQuery.ts      si la pantalla cumple una condición (ej. ancho de escritorio), y se actualiza sola
    api/
      client.ts           ÚNICA puerta a la API: fetch, ApiError, errores de red
      errors.ts           mensaje para personas según el code del backend
      types.ts            tipos de lo que devuelve el backend
      endpoints.ts        una función por endpoint
  components/
    Layout.tsx            menú inferior (celular) y lateral oscuro (web), chip del comercio
    Button.tsx            botones grandes del diseño (acción, mostaza, claro) y su versión como enlace
    movimiento.tsx        piezas de las pantallas que mueven saldo: reintento seguro, pantalla de éxito
    HoyEnElMostrador.tsx  panel de los movimientos de hoy (Mostrador en pantalla grande)
    states.tsx            vacío, cargando, error y éxito
  pages/                  una pantalla por archivo: una por pantalla (Mostrador, CargarSaldo, Cobrar, Clientes, Ficha, Ajuste, Promos, PromoForm y Reactivar); Placeholder.tsx solo para rutas inexistentes
  test/setup.ts           configuración de los tests
design/                   referencia visual (ver DISENO.md)
```

## Variables de entorno

Se leen solo en `src/config.ts`. Para trabajar en local, crear un `.env`
(ignorado por git) en la raíz:

```
# Dónde está la API. En desarrollo se deja /api (Vite lo reenvía al backend).
VITE_API_URL=/api
# Solo desarrollo: a qué backend reenvía Vite las llamadas a /api.
VITE_API_PROXY_TARGET=http://localhost:3001
# Mientras no haya login: el id de un comercio creado en el backend.
VITE_MERCHANT_ID=
```

El `.env.example` commiteado lista las tres variables sin valores; los
valores por defecto y su explicación son los de este bloque. Una variable
vacía vale lo mismo que no estar (usa el valor por defecto): solo
`VITE_MERCHANT_ID` hace falta de verdad. (El entorno de
la IA no puede escribir archivos `.env*`: los edita una persona.)

## Comandos

| Comando | Qué hace |
|---|---|
| `npm install` | Instala dependencias |
| `npm run dev` | Servidor de desarrollo (Vite) en `http://localhost:5173` |
| `npm run typecheck` | Chequeo de tipos sin generar nada |
| `npm run test:run` | Corre los tests una vez (`npm test` queda en modo watch) |
| `npm run build` | Chequea tipos y genera `dist/` |

## Cómo conectar con el backend en local

1. Levantar el backend (ver su README): `PORT=3001 npm run dev` en
   `../project-platita-backend`. Se usa el 3001 porque el 3000 suele estar
   ocupado.
2. Crear un comercio en la consola de pruebas del backend
   (`http://localhost:3001/dev`) y copiar su `id`.
3. Ponerlo en `VITE_MERCHANT_ID` del `.env` de este repo y levantar con
   `npm run dev`.

**CORS:** el backend todavía no lo configura. En desarrollo Vite lo evita
con un proxy: el navegador llama a `/api/...` (mismo origen) y Vite lo
reenvía al backend sacando el prefijo `/api`. En producción habrá que
resolverlo (pedido en el TODO, §4).

## Cómo agregar una pantalla

1. Verificar en [`DISENO.md`](DISENO.md) qué endpoints usa. Si falta uno, se
   registra como pedido al backend en el TODO (no se simula).
2. Si hace falta un endpoint o un tipo nuevo: `lib/api/endpoints.ts` y
   `lib/api/types.ts`.
3. Crear `src/pages/<Pantalla>.tsx` y reemplazar el `Placeholder` en
   `App.tsx`.
4. Datos que se leen: `useQuery`. Acciones que mueven plata (cargar, cobrar,
   ajustar): `useMutation`, **nunca con reintento automático**
   (`QueryClient` ya lo apaga) para no duplicar un movimiento.
5. Resolver los cuatro estados con `components/states.tsx`.
6. Toda cifra de dinero pasa por `lib/money.ts` y todo teléfono por
   `lib/phone.ts`.
7. Actualizar `TODO.md`, `STATE.md`, `CHANGELOG.md` y, si cambia el mapa
   pantalla → endpoint, `DISENO.md`.
