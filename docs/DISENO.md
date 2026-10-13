# Diseño — tokens, pantallas y mapa a la API

La referencia visual es **la dirección B, "Cálida y de barrio" (versión
afinada)**, elegida el 2026-10-13 entre tres direcciones generadas en
Claude Design. Si este documento y los archivos de `design/` se
contradicen, hay que resolverlo y dejar uno solo: ver la regla en
[`AGENTS.md`](AGENTS.md).

## Archivos en `design/`

| Archivo | Qué es |
|---|---|
| `platita-diseno-b.codigo.html` | **La referencia principal.** HTML estático (sin scripts, estilos inline) con todas las pantallas y estados, en versión celular y web. Tiene un comentario inicial con los tokens. Se abre directo en el navegador. |
| `platita-diseno-b.export.html` | Export original de Claude Design ("bundled"): arma la página con un runtime propio y trae las tipografías incrustadas. Respaldo. |
| `platita-diseno-b.legible.html` | El mismo diseño extraído del bundle anterior. Respaldo; es redundante con el `.codigo.html`. |
| `direcciones-seleccion-*.png` | Capturas de las tres direcciones comparadas. |

Los dos respaldos se pueden borrar cuando haya código real que los
reemplace.

## Tokens

| Token | Valor | Uso |
|---|---|---|
| fondo | `#F6ECD9` | Fondo de la app |
| tarjeta | `#FFFAF0` | Tarjetas y paneles |
| tinta | `#33201A` | Texto principal |
| texto secundario | `#6E5240` | Texto de apoyo |
| borde | `#DCC7A0` | Bordes y divisores |
| acción | `#B8412B` (sombra `#7D2616`) | Botones principales, enlaces |
| mostaza | `#E0A93B` (sombra `#A77A1C`) | Acento, avisos |
| saldo / éxito | `#2F6B4A` | Saldo, confirmaciones |
| crema | `#E8D9BB` | Texto sobre el menú lateral oscuro |
| rosa | `#F0A794` | Logo "platita" sobre el menú oscuro |
| línea | `#EADCBC` | Divisores dentro de tarjetas |
| arena | `#E3D3B2` | Botón deshabilitado, insignia de ajuste, separadores en celular |
| insignias | `#D8E8DC` carga, `#F3DFA6` bono, `#F1CFC6` cobro | Etiqueta del tipo de movimiento en la ficha |

Sombras "de color" (efecto de botón que se hunde al apretar): tarjeta `0 5px 0 #DCC7A0`, botón de acción `0 5px 0 #7D2616`, botón mostaza `0 5px 0 #A77A1C`. Radios: tarjeta 18, campo 22, botón 24, panel 28.

**Tipografías** (Google Fonts: Bricolage Grotesque 500/700/800 y Nunito
600/700/800): títulos y números en *Bricolage Grotesque* 800; texto en
*Nunito* 700/800.

**Reglas visuales:** montos con formato `$1.200` (punto de miles);
objetivos táctiles de 48px o más; botones principales de 64–72px de alto;
radios de 18 a 28px. El diseño web es de 1100px de ancho con menú lateral
de 200px; el celular, marcos de 340×690.

## Pantallas y endpoint que usa cada una

Los endpoints están definidos en el backend
(`../project-platita-backend/docs/BACKEND.md`). En esta tabla, `:m` es el
`merchantId` y `:c` el `customerId`.

| Pantalla | Qué hace | Endpoints | Notas |
|---|---|---|---|
| **Mostrador** | Buscar cliente por teléfono; ver nombre y saldo; ir a Cargar o Cobrar. Estado "cliente nuevo". | `GET /merchants/:m/customers?search=` para buscar sin crear; `POST /merchants/:m/customers` para crear | Implementado en `src/pages/Mostrador.tsx`. Como la búsqueda del backend no normaliza, se busca por los dígitos del número ya normalizado y se filtra por teléfono exacto. `POST` hace *buscar o crear*, por eso solo se usa al apretar "Crear cliente". El diseño web incluye un panel "Hoy en el mostrador" con los movimientos del día: la API no tiene ese listado (pedido en el TODO). |
| **Cargar saldo** | Monto, forma de pago y vista previa del bono ("$1.000 + bono $200 = $1.200"). | `POST /customers/:c/topups`; `GET /merchants/:m/bonus-rules` para la vista previa | No hay endpoint de vista previa: el bono se calcula en pantalla con las reglas activas (la de mayor mínimo alcanzado) y la respuesta del `POST` confirma el real. Implementado en `src/pages/CargarSaldo.tsx`. Se aparta del diseño en dos cosas, a propósito: **no se preselecciona $1.000** (el botón de confirmar queda deshabilitado hasta elegir un monto) y la pantalla de éxito es una tarjeta verde y no ocupa toda la pantalla. La vista previa se calcula con las promos activas (`src/lib/bonus.ts`, misma regla que el backend: mayor mínimo alcanzado, empate por menor id); el bono real es el que devuelve el `POST`. Si se corta la red al confirmar no hay "reintentar": no se sabe si se registró y el backend no tiene idempotencia (pedido P0 en el TODO). |
| **Cobrar** | Monto, nota opcional, saldo antes y después. Estados "éxito" y "saldo insuficiente". | `POST /customers/:c/charges` | `422 INSUFFICIENT_BALANCE` trae `details.balance` y `details.needed` para mostrar "Le faltan $X". Implementado en `src/pages/Cobrar.tsx`. El monto se escribe en el propio número grande (el diseño no dibuja cómo se ingresa). Si no alcanza, no se cobra: se muestra "Le faltan $X", un botón a Cargar saldo y el botón de cobrar deshabilitado; si el saldo cambió y el backend rechaza, el faltante sale de su respuesta, y al cambiar el monto el aviso se borra. Igual que Cargar saldo, si se corta la red al cobrar no hay "reintentar" (sin idempotencia en el backend). |
| **Ficha del cliente** | Saldo, última visita, historial con filtro por tipo. | `GET /customers/:c`, `GET /customers/:c/transactions?type=` | Paginado por cursor (`nextCursor`). Implementado en `src/pages/Ficha.tsx` (ruta `/clientes/:id`). Cinco filtros (Todos, Cargas, Bonos, Cobros, Ajustes), uno por tipo del backend. El detalle de cada fila es la forma de pago (cargas) o la nota (cobros y ajustes); el bono no dice de qué promo salió porque el backend no lo guarda (pedido en el TODO). En pantalla grande, columna izquierda con saldo y accesos, y panel "Movimientos" a la derecha. |
| **Ajuste** | Corrección con signo y nota obligatoria. | `POST /customers/:c/adjustments` | Es el único modo de corregir: no se editan ni borran movimientos. Implementado en `src/pages/Ajuste.tsx` (ruta `/ajustar/:id`). Se aparta del diseño a propósito: **no se preselecciona "Restar"**; hay que elegir sumar o restar. El saldo no puede quedar en negativo (se avisa antes de guardar y también si el backend lo rechaza). Éxito: tarjeta verde que vuelve a la ficha. Sin "reintentar" si se corta la red. |
| **Clientes** | Lista con búsqueda por nombre o teléfono y saldo de cada uno. | `GET /merchants/:m/customers?search=&limit=&cursor=` | Paginado. Implementado en `src/pages/Clientes.tsx`. Lista en el celular y tabla (nombre, celular, última visita, saldo) en pantalla grande. El buscador espera a que termine de escribir y, si son números, saca el 0 inicial y el prefijo de país porque el teléfono se guarda como `+598…`. Paginado con "Ver más clientes". |
| **Promos** | Listar, crear, editar, activar/desactivar reglas. | `GET` y `POST /merchants/:m/bonus-rules`, `PATCH /bonus-rules/:id` | Las reglas no se borran, se desactivan. Implementado en `src/pages/Promos.tsx` y `PromoForm.tsx` (rutas `/promos`, `/promos/nueva`, `/promos/:id/editar`). Interruptor Activa/Apagada que cambia el estado al instante; las promos no se borran. El formulario avisa si ya hay otra promo activa con el mismo mínimo (el backend aplica una sola). No se muestra "Usada N veces": el backend no lo sabe (pedido en el TODO). |
| **Reactivar** | Clientes sin visita en N días (60 por defecto). Botón de WhatsApp "próximamente". | `GET /merchants/:m/inactive?days=` | El envío de WhatsApp no existe en el backend todavía. Implementado en `src/pages/Reactivar.tsx`. Los días van de 10 en 10 (mínimo 10, máximo 365). No se muestra el saldo de cada cliente porque la lista de inactivos no lo trae (pedido en el TODO). El contador cuenta lo cargado y agrega "+" si hay más páginas. Si el cliente nunca vino, se dice y se cuenta desde que se anotó. Los botones de WhatsApp están deshabilitados ("próximamente"). |

**Estados por pantalla:** vacío, cargando, error y éxito. En el diseño
están dibujados entre otros "Mostrador · cliente nuevo", "Cobrar · éxito",
"Cobrar · saldo insuficiente", "Clientes · vacío", "Promos · vacío",
"Promos · crear / editar" y "Reactivar · vacío".

## Convenciones de datos que la interfaz debe respetar

- Los montos que entran a la API van en **pesos**; los que salen vienen en
  **centésimos de peso**: 120000 se muestra `$1.200`.
- Los teléfonos se guardan como `+598XXXXXXXX`; el usuario escribe
  `099 123 456` o `99123456`.
- Los errores llegan como `{ error, code, details? }`. La interfaz se
  apoya en `code` (`INSUFFICIENT_BALANCE`, `NOT_FOUND`,
  `VALIDATION_ERROR`…), no en el texto del mensaje.
- Los listados llegan como `{ data, nextCursor }`.
- Todavía no hay login: el comercio se fija por configuración mientras no
  exista autenticación.
