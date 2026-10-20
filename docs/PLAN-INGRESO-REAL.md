# Plan: ingreso real del cliente (código por mensaje)

> **Estado (2026-10-20):** el backend lo implementó (PR #8) con algunas diferencias
> respecto de este plan: la sesión es **un solo token opaco de 60 días que se
> renueva al usarlo** (no hay `accessToken`/`refreshToken` ni `/auth/refresh`),
> `verify-code` devuelve `{ token, expiresAt, user }`, y existe `GET /auth/config`.
> El front ya está adaptado. Lo que vale es `docs/BACKEND.md` del backend; este
> documento queda como registro de la idea y de cómo se cambia de proveedor.

Escrito el 2026-10-18. Es el P0 de `TODO.md` §7: hoy el ingreso del cliente está
**simulado** (código `000000`, `POST /users` sin verificar) y **no se puede
publicar así**. Este documento es para pasarle al backend y también deja
registrado cómo se cambia de proveedor.

## 1. Idea

La persona escribe su celular, recibe un código de 6 dígitos por mensaje, lo
escribe y queda con la sesión abierta durante semanas. **No hay usuario ni
contraseña.** El código se pide una sola vez por dispositivo (y cuando la
sesión vence), no en cada visita.

Meta de diseño: **el proveedor del mensaje es intercambiable**. Cambiar de
Twilio a otro, o de SMS a WhatsApp, es escribir un archivo y cambiar una
variable de entorno. Nada más del sistema se entera.

## 2. Cómo se hace fácil de cambiar

Todo lo que dependa del proveedor vive detrás de **una interfaz** y en **un solo
archivo por proveedor**. El resto del backend (rutas, sesiones, base de datos)
solo conoce la interfaz.

```ts
// src/modules/auth/otp/provider.ts
export type OtpChannel = "sms" | "whatsapp";

export interface OtpProvider {
  /** Manda un código al teléfono (E.164, ej. +59899123456). */
  start(phone: string, channel: OtpChannel): Promise<void>;
  /** true si el código es el correcto y no venció. Un código sirve una sola vez. */
  check(phone: string, code: string): Promise<boolean>;
}
```

Implementaciones, **una por archivo**, y se elige con `OTP_PROVIDER`:

| `OTP_PROVIDER` | Archivo | Para qué |
|---|---|---|
| `dev` | `otp/dev.ts` | Desarrollo y tests. Acepta solo `000000`, no manda nada ni cuesta nada. **Es el valor por defecto fuera de producción** |
| `twilio` | `otp/twilio.ts` | Twilio Verify. Twilio genera, manda, vence y limita los códigos; el backend solo llama `start` y `check` |
| `propio` (si se quiere) | `otp/propio.ts` | Código generado y guardado por nosotros (con hash) + cualquier proveedor de SMS barato (Plivo, etc.). Más trabajo y más responsabilidad de seguridad |

Reglas:
- **Producción no arranca con `OTP_PROVIDER=dev`.** Igual que ya pasa con `INSECURE_USER_ROUTES`: el backend se niega a iniciar y lo dice.
- **Cambiar de proveedor = tres pasos:** (1) crear `otp/<nombre>.ts` que cumpla `OtpProvider`; (2) sumarlo al mapa de `otp/index.ts`; (3) poner `OTP_PROVIDER=<nombre>` y sus credenciales. No se toca ninguna ruta ni el front.
- **Las credenciales van solo en variables de entorno** (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SID`), nunca en el código ni en el repo.
- **El canal también se elige por configuración** (`OTP_CHANNEL=sms|whatsapp`), no en el front. Pasar de SMS a WhatsApp no cambia la API ni la pantalla.
- Un test de contrato corre las mismas pruebas contra `dev` y contra cada implementación (con la llamada a la red simulada): si un proveedor nuevo las pasa, sirve.

## 3. Proveedor para empezar

**Twilio Verify por SMS.** Es lo que menos trabajo da: no hay que guardar ni
vencer códigos. Costo aproximado por verificación a Uruguay: **US$ 0,05**
(tarifa de Verify) **+ US$ 0,085** (el SMS) = unos **US$ 0,14**. En prueba, la
cuenta gratis de Twilio solo envía a números que se verifican de antemano.

**A confirmar antes de contratar** (los precios salen de páginas de terceros y de
la web de cada proveedor): el precio actual a Uruguay en la página oficial de
Twilio, el crédito de prueba que da, y si Uruguay exige registrar un nombre de
remitente para los SMS.

Alternativas ya analizadas, por si hay que cambiar: Plivo + código propio (SMS a
unos US$ 0,04, más trabajo nuestro), WhatsApp directo con Meta (el mensaje más
barato, pero hay que verificar la empresa y aprobar la plantilla), Firebase Auth
(ata la identidad a Google). Detalle y fuentes en la conversación del 2026-10-18;
si hace falta, se copian acá.

## 4. API que necesita el front

Todas bajo `/auth`. Errores con la forma de siempre: `{ error, code, details? }`.

| Endpoint | Entra | Sale |
|---|---|---|
| `POST /auth/request-code` | `{ phone }` | `204`. Normaliza el teléfono y manda el código. `429 TOO_MANY_REQUESTS` con `{ retryAfterSeconds }` si pide demasiados |
| `POST /auth/verify-code` | `{ phone, code }` | `{ accessToken, refreshToken, user }` (el `user` con la forma de hoy: `id, phone, name, createdAt`). Si la persona no existe, **se crea** (como hoy `POST /users`) |
| `POST /auth/refresh` | `{ refreshToken }` | `{ accessToken, refreshToken }` nuevos (rotación: el viejo deja de servir) |
| `POST /auth/logout` | `{ refreshToken }` | `204`. Invalida esa sesión |
| `GET /me` | — (Bearer) | el usuario |
| `PATCH /me` | `{ name }` (Bearer) | el usuario |
| `GET /me/balances` | — (Bearer) | **misma forma** que `GET /users/:id/balances` hoy |

Códigos de error que el front muestra distinto (`code`):
`INVALID_PHONE`, `CODE_INCORRECT`, `CODE_EXPIRED`, `TOO_MANY_ATTEMPTS`,
`TOO_MANY_REQUESTS`, `INVALID_REFRESH_TOKEN` (la sesión se cerró: volver a pedir código).

### Reglas de seguridad (importantes)
- **Mismo mensaje para teléfono conocido y desconocido** en `request-code`: no revelar si alguien tiene cuenta.
- **Límites:** por teléfono (p. ej. 1 código cada 30 s, 5 por hora) y por IP; **máx. 5 intentos** de `verify-code` por código, después hay que pedir otro. Cada SMS cuesta plata: sin límites, alguien puede vaciar la cuenta.
- El código dura **5 minutos** y **sirve una sola vez** (lo garantiza Twilio Verify; si es propio, hay que hacerlo a mano).
- **Tokens:** `accessToken` corto (15 min, JWT firmado con `JWT_SECRET`); `refreshToken` opaco y largo (60 días), guardado **con hash** en una tabla `Session`, con rotación y detección de reutilización. Nunca devolver el hash.
- Los saldos y el perfil salen **solo de `/me/*`**, nunca de un `id` que mande el cliente.
- Cuando `/me/*` esté, las rutas `/users/*` (ingreso sin verificar) se **eliminan**, junto con `INSECURE_USER_ROUTES`. Las del comercio (`/merchants/...`) no cambian.

### Datos nuevos
Tabla `Session { id, userId, refreshTokenHash, createdAt, expiresAt, revokedAt?, lastUsedAt, userAgent? }`.
Variables nuevas: `OTP_PROVIDER`, `OTP_CHANNEL`, `JWT_SECRET`, `TWILIO_*`.
Un teléfono se **marca verificado** al primer `verify-code` correcto (`User.phoneVerifiedAt`).

## 5. Qué cambia en el front (lo hago yo)

- `lib/sesionCliente.tsx` pasa a guardar `{ accessToken, refreshToken, user }` en lugar de solo `userId`. Sigue siendo **el único lugar** que sabe de la sesión.
- `lib/api/client.ts` manda `Authorization: Bearer` en las rutas del cliente, y ante un `401` intenta `POST /auth/refresh` una vez y reintenta; si falla, cierra la sesión y manda al ingreso.
- `Ingreso`: el primer paso llama `request-code`, el segundo `verify-code`. Los estados "Código incorrecto" y "El código venció" ya existen y pasan a depender de los códigos de error del backend. La cuenta regresiva de reenvío usa `retryAfterSeconds`. Se saca la leyenda "el código es 000000" (solo se muestra con el proveedor `dev`, si el backend lo avisa).
- `useSaldos` y el Perfil pasan a `/me/balances` y `PATCH /me`.
- "Cerrar sesión" llama `POST /auth/logout`.
- Tests: se actualizan los de `pages/cliente/` y se suman los de renovación de token.

## 6. Orden de trabajo

1. **Backend:** interfaz `OtpProvider` + proveedor `dev` + `/auth/*` y `/me/*` con sesiones. Con el proveedor `dev` ya se puede probar todo el flujo **sin gastar nada**.
2. **Front:** adaptar sesión, ingreso y llamadas (contra el backend con `dev`).
3. **Backend:** proveedor `twilio`, con la cuenta de prueba y números verificados.
4. **Los dos:** probar de punta a punta con un celular real.
5. **Backend:** quitar `/users/*` y `INSECURE_USER_ROUTES`.
6. Antes de publicar: producción con `OTP_PROVIDER` real, límites activos y `JWT_SECRET` propio.

## 7. Preguntas abiertas

- ¿Uruguay exige registrar el nombre del remitente de los SMS? (a confirmar con el proveedor)
- ¿El comercio también va a entrar con código por mensaje? Es el mismo mecanismo, pero con otro tipo de sesión (y el comercio hoy no tiene login: `TODO.md`, "Auth para comercios"). Conviene diseñar `Session` sin dar por hecho que siempre es un cliente.
- ¿Cuánto debe durar la sesión? Propuesta: refresh de 60 días.
