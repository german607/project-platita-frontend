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
| **Mostrador** | Buscar cliente por teléfono; ver nombre y saldo; ir a Cargar o Cobrar. Estado "cliente nuevo". | `GET /merchants/:m/customers?search=` para buscar sin crear; `POST /merchants/:m/customers` para crear | Implementado en `src/pages/Mostrador.tsx`. Busca con `?phone=` (teléfono exacto, el backend normaliza y no crea nada). `POST` hace *buscar o crear*, por eso solo se usa al apretar "Crear cliente". En pantalla grande, a la derecha, va el panel "Hoy en el mostrador" (`src/components/HoyEnElMostrador.tsx`): los últimos 10 movimientos de todo el comercio desde las 00:00 de hoy (`GET /merchants/:m/transactions`), con cliente, hora, tipo, detalle y monto; los bonos aparecen como filas aparte (el diseño solo dibuja cargas y cobros) y cada fila lleva a la ficha. En el celular no se muestra ni se pide. |
| **Cargar saldo** | Monto, forma de pago y vista previa del bono ("$1.000 + bono $200 = $1.200"). | `POST /customers/:c/topups`; `GET /merchants/:m/bonus-rules` para la vista previa | No hay endpoint de vista previa: el bono se calcula en pantalla con las reglas activas (la de mayor mínimo alcanzado) y la respuesta del `POST` confirma el real. Implementado en `src/pages/CargarSaldo.tsx`. Se aparta del diseño en dos cosas, a propósito: **no se preselecciona $1.000** (el botón de confirmar queda deshabilitado hasta elegir un monto) y la pantalla de éxito es una tarjeta verde y no ocupa toda la pantalla. La vista previa la calcula el backend (`GET /merchants/:m/bonus-preview`, la misma función que la carga real) y muestra el nombre de la promo si la tiene; el bono real es el que devuelve el `POST`. Cada confirmación manda una clave `Idempotency-Key`: si se corta la red o falla el servidor, "Reintentar" reenvía la misma clave y no se carga dos veces; si se cambian los datos, es una operación nueva. |
| **Cobrar** | Monto, nota opcional, saldo antes y después. Estados "éxito" y "saldo insuficiente". | `POST /customers/:c/charges` | `422 INSUFFICIENT_BALANCE` trae `details.balance` y `details.needed` para mostrar "Le faltan $X". Implementado en `src/pages/Cobrar.tsx`. El monto se escribe en el propio número grande (el diseño no dibuja cómo se ingresa). Si no alcanza, no se cobra: se muestra "Le faltan $X", un botón a Cargar saldo y el botón de cobrar deshabilitado; si el saldo cambió y el backend rechaza, el faltante sale de su respuesta, y al cambiar el monto el aviso se borra. Igual que Cargar saldo, manda una clave de idempotencia y ofrece "Reintentar" con la misma clave si se corta la red o falla el servidor. |
| **Ficha del cliente** | Saldo, última visita, historial con filtro por tipo. | `GET /customers/:c`, `GET /customers/:c/transactions?type=` | Paginado por cursor (`nextCursor`). Implementado en `src/pages/Ficha.tsx` (ruta `/clientes/:id`). Cinco filtros (Todos, Cargas, Bonos, Cobros, Ajustes), uno por tipo del backend. El detalle de cada fila es la forma de pago (cargas) o la nota (cobros y ajustes); un bono dice de qué promo salió (su nombre o, si no tiene, "Promo $1.000+"); los bonos viejos, que no guardan la promo, solo dicen "Bono". En pantalla grande, columna izquierda con saldo y accesos, y panel "Movimientos" a la derecha. Los movimientos se traen de a 8 en el celular y de a 15 en pantalla grande, con "Ver más movimientos" (se decidió así el 2026-10-13: la lista no se alarga de golpe). |
| **Ajuste** | Corrección con signo y nota obligatoria. | `POST /customers/:c/adjustments` | Es el único modo de corregir: no se editan ni borran movimientos. Implementado en `src/pages/Ajuste.tsx` (ruta `/ajustar/:id`). Se aparta del diseño a propósito: **no se preselecciona "Restar"**; hay que elegir sumar o restar. El saldo no puede quedar en negativo (se avisa antes de guardar y también si el backend lo rechaza). Éxito: tarjeta verde que vuelve a la ficha. Igual que las otras, con clave de idempotencia y "Reintentar" si se corta la red. |
| **Clientes** | Lista con búsqueda por nombre o teléfono y saldo de cada uno. | `GET /merchants/:m/customers?search=&limit=&cursor=` | Paginado. Implementado en `src/pages/Clientes.tsx`. Lista en el celular y tabla (nombre, celular, última visita, saldo) en pantalla grande. El buscador espera a que termine de escribir y manda el texto tal cual: el backend entiende nombres y teléfonos en cualquier formato, también parciales. Paginado con "Ver más clientes". |
| **Promos** | Listar, crear, editar, activar/desactivar reglas. | `GET` y `POST /merchants/:m/bonus-rules`, `PATCH /bonus-rules/:id` | Las reglas no se borran, se desactivan. Implementado en `src/pages/Promos.tsx` y `PromoForm.tsx` (rutas `/promos`, `/promos/nueva`, `/promos/:id/editar`). Interruptor Activa/Apagada que cambia el estado al instante; las promos no se borran. El formulario avisa si ya hay otra promo activa con el mismo mínimo (el backend aplica una sola). Cada promo puede tener nombre y descripción (opcionales, no están en el diseño: se agregaron a pedido): con nombre, ese es el título y lo que da pasa a subtítulo. Muestra "Usada N veces" en todos los tamaños (el diseño solo la dibuja en la web); no cuenta los bonos anteriores a que el backend guardara de qué promo salía cada uno. |
| **Reactivar** | Clientes sin visita en N días (60 por defecto). Botón de WhatsApp "próximamente". | `GET /merchants/:m/inactive?days=` | El envío de WhatsApp no existe en el backend todavía. Implementado en `src/pages/Reactivar.tsx`. Los días van de 10 en 10 (mínimo 10, máximo 365). Cada cliente muestra su saldo y el contador es el total de inactivos que informa el backend, no solo lo cargado. Si el cliente nunca vino, se dice y se cuenta desde que se anotó. Los botones de WhatsApp están deshabilitados ("próximamente"). |

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

## Lado del cliente (pendiente de diseño)

Todavía no hay diseño: se va a hacer en Claude Design, con el mismo estilo
(tokens, tipografías y reglas de arriba), pensado primero para el celular.
Las pantallas decididas el 2026-10-15, y lo que va a necesitar cada una del
backend (a pedir, ver el TODO §4):

| Pantalla | Qué muestra | Qué hace falta del backend |
|---|---|---|
| **Lugares** | Los comercios que eligieron aparecer, con categoría y una marca de si tienen una promo activa | Listado público de comercios visibles, con categoría y `promo activa` |
| **Detalle de un lugar** | Promos activas, dirección con mapa, horarios, categoría, descripción, foto y el saldo del cliente ahí | Perfil público del comercio y sus promos activas |
| **Mis saldos** | Lo que el cliente tiene en cada comercio | `GET /me/balances` (con el cliente verificado) |
| **Perfil** | Nombre, teléfono, cerrar sesión; más adelante, QR personal | Sesión del cliente |
| **Ingreso** | Teléfono y código de un solo uso | Verificación por código (hoy se simula) |

El botón "Cargar saldo" del cliente va deshabilitado con "Próximamente".
Del lado del comercio se suma una pestaña con su perfil público (dirección y
mapa, horarios, foto, descripción, categoría e "Aparecer en la app").

Los prompts para Claude Design de estas pantallas están guardados en
`design/prompts/` (uno para el cliente y otro para la pestaña del comercio).
La dirección se muestra con un botón "Cómo llegar" que abre el mapa del
celular; no hay mapa propio.

### Mi comercio (hecho el 2026-10-15)

Diseño: `design/platita-mi-comercio.codigo.html`. Código: `src/pages/MiComercio.tsx`
y `src/pages/mi-comercio/`. Cómo se aparta del diseño, a propósito:

- **Menú:** la pestaña va aparte, al fondo del menú lateral y a la derecha de la
  barra inferior en el celular, para no entrar por error (se usa poco).

- **La descripción es recomendada, no obligatoria**: el diseño la lista entre lo
  que falta para prender el interruptor, pero el backend solo exige un local y
  una categoría. Se muestra en la lista ("recomendado") sin bloquear.
- **La foto se carga con un enlace**, con su vista previa y "Quitar": el
  backend todavía no guarda archivos (pedido en el TODO).
- **"Copiar de otro día"**: el diseño no aclara de qué día se copia; quedó como un
  selector de día (por defecto el lunes) y el botón "Copiar a todos los días".
- **Locales**: además de "Dar de baja" se puede "Dar de alta" de nuevo, porque
  no se borran. Un local nuevo todavía sin guardar se puede "Quitar".
- **Horarios**: el cierre "24:00" que acepta el backend no se puede escribir en
  el selector de hora del navegador; se usa 23:59. Hasta 6 tramos por día.
- **Guardar** manda solo lo que cambió. Si se apaga "Aparecer en la app" se
  guarda primero el comercio y después los locales; si no, al revés. Lo ya
  guardado no se vuelve a mandar al reintentar.
- La categoría se muestra **bloqueada** sumando 90 días a `categoryChangedAt`;
  el 422 del backend manda igual (pedido: que devuelva la fecha).
