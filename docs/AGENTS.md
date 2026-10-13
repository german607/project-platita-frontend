# Reglas para quien (o la IA que) trabaje en este proyecto

Este proyecto puede pasar por distintas sesiones de IA en distintos
momentos — la misma IA en otra sesión, u otra IA distinta, u otra persona
que se incorpora. Para que el traspaso sea inmediato, sin tener que
releer una conversación entera para reconstruir el contexto, este repo
lleva su propio registro en markdown. Es la fuente de verdad, no una
conversación de chat en particular.

Este repo es el **frontend** de Platita (panel web para comercios de
barrio en Uruguay). El **backend** vive en otro repo, hermano de este:
`../project-platita-backend` (GitHub: `german607/project-platita-backend`).
El negocio, las reglas del dominio y la API se definen allá; acá solo se
consumen.

## Regla obligatoria

Cualquier cambio de código, de diseño, o decisión de producto/arquitectura
que se tome se registra **en el mismo cambio** (no "después"):

- [`STATE.md`](STATE.md) — se **reescribe** para reflejar la realidad
  ahora mismo. No es un historial: es una foto del presente. Si algo que
  decía deja de ser cierto, se corrige o se borra.
- [`CHANGELOG.md`](CHANGELOG.md) — se **agrega** una entrada nueva al
  final, con fecha. Nunca se borra ni se reescribe una entrada vieja: es
  historia. Si algo quedó mal documentado, se corrige con una entrada
  nueva que lo aclara, no editando la vieja.
- [`../TODO.md`](../TODO.md) — **el único backlog** del frontend, por área
  y con prioridad P0/P1/P2. Si el cambio resuelve un pendiente, se marca
  (`[x]` si se verificó corriéndolo, `[~]` si está implementado pero sin
  verificar). Si genera un pendiente nuevo, se agrega en su sección. No se
  mantiene otra lista de pendientes en ningún otro lado.
- [`FRONTEND.md`](FRONTEND.md) — si el cambio toca el stack, la estructura
  de carpetas, las variables de entorno o los comandos, se actualiza ahí.
- [`DISENO.md`](DISENO.md) — si el cambio toca colores, tipografías,
  pantallas, estados o el mapa pantalla → endpoint, se actualiza ahí.

## Al arrancar una sesión nueva

Leer en este orden:
1. [`STATE.md`](STATE.md) — dónde estamos, ahora.
2. [`../TODO.md`](../TODO.md) — qué falta y con qué prioridad.
3. [`FRONTEND.md`](FRONTEND.md) — stack, estructura del código y cómo
   agregar una pantalla; y [`DISENO.md`](DISENO.md) si el trabajo toca la
   interfaz: tokens, pantallas y qué endpoint usa cada una.
4. Los docs del backend, si el trabajo toca la API:
   `../project-platita-backend/docs/BACKEND.md` (endpoints y reglas) y
   `.../docs/EJEMPLO.md` (flujo completo narrado).
5. [`CHANGELOG.md`](CHANGELOG.md) — solo si hace falta más detalle
   histórico de por qué algo quedó como quedó.

No asumir que lo que dice una conversación de chat vieja sigue vigente
si contradice estos archivos — estos archivos ganan.

## Dónde se ponen las reglas (para cualquier IA o agente)

Cada herramienta busca sus reglas en un lugar distinto. Para no duplicar
contenido, **las reglas reales viven acá (`docs/AGENTS.md`)** y los demás
archivos son punteros de una línea:

| Herramienta | Archivo que lee automáticamente |
|---|---|
| Claude Code | `CLAUDE.md` (raíz) |
| Codex, Cursor, Copilot y otros | `AGENTS.md` (raíz) |

Si se suma otra herramienta con su propio archivo de reglas, se crea un
puntero a este documento — no se copian las reglas.

## Convenciones del proyecto

- Idioma de la documentación, de los textos de la interfaz y de los
  mensajes de commit: español. Interfaz en español rioplatense, tono
  cercano y sin tecnicismos ("saldo", "cargar", "cobrar", "promo").
- **El backend manda.** La API real está documentada en el repo del
  backend. Si la interfaz necesita algo que la API no ofrece, **no se
  inventa ni se simula en silencio**: se registra como pedido al backend
  en [`../TODO.md`](../TODO.md) (sección "Pedidos al backend") y se avisa.
  **No se busca un camino alternativo que sea menos eficiente** (varias
  llamadas donde una sola alcanzaría, filtrar de más en el cliente, cálculos
  que le tocan al servidor): se pide y se sigue con otra cosa, porque tarde o
  temprano el backend lo tendrá. Un rodeo solo se acepta si es tan eficiente
  como lo sería el endpoint pedido, y queda anotado igual.
- **Dinero:** la API recibe pesos y devuelve centésimos de peso (enteros).
  La conversión y el formato ($1.200, punto de miles, sin decimales si el
  monto es entero) se hacen en **un solo lugar** del código; ninguna
  pantalla convierte por su cuenta. Nunca `float` para acumular montos.
- **Teléfonos:** el usuario escribe como quiere (`099 123 456`); lo que
  llega al backend y lo que se muestra sale de un solo helper.
- **Diseño:** `design/` es la referencia visual y `DISENO.md` documenta
  sus tokens. No se inventan colores, tamaños ni tipografías fuera de esos
  tokens: si hace falta uno nuevo, se agrega a `DISENO.md` primero.
- Mobile first: se diseña y se prueba primero en el celular del mostrador.
  Objetivos táctiles de al menos 48px.
- Toda pantalla que consume la API implementa los cuatro estados:
  vacío, cargando, error y éxito.
- Ningún secreto en el repo. La configuración va en variables de entorno
  (`.env`, ignorado por git, y `.env.example` documentado).
- Trabajo en ramas propias, no directo en `main`. Commits solo cuando el
  usuario lo pida. Este repo usa la identidad personal y no firma commits
  (configuración heredada de `~/.gitconfig-personal`).
- No se declara que algo "anda" sin haberlo corrido: lo escrito pero sin
  verificar se anota como tal en `STATE.md` y se marca `[~]` en el TODO.
