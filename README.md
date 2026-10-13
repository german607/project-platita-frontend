# Platita — frontend

Panel web para comercios de barrio en Uruguay, pensado para el celular del
mostrador: buscar un cliente por teléfono, cargarle saldo con bonificación
y cobrarle descontando saldo.

> Estado: proyecto base escrito, **todavía sin instalar ni ejecutar**.
> Mirá [`docs/STATE.md`](docs/STATE.md).

React + TypeScript + Vite + Tailwind. Para correrlo en local, con el backend
levantado en el puerto 3001 y un comercio creado:

```bash
npm install
# crear .env con VITE_MERCHANT_ID=<id del comercio>   (ver docs/FRONTEND.md)
npm run dev        # http://localhost:5173
npm run typecheck && npm run test:run
```

## Dónde está cada cosa

| Qué | Dónde |
|---|---|
| Reglas para quien trabaje en el proyecto (personas e IAs) | [`docs/AGENTS.md`](docs/AGENTS.md) |
| Estado actual | [`docs/STATE.md`](docs/STATE.md) |
| Qué falta, por prioridad | [`TODO.md`](TODO.md) |
| Tokens de diseño, pantallas y qué endpoint usa cada una | [`docs/DISENO.md`](docs/DISENO.md) |
| Historia de lo que se hizo | [`docs/CHANGELOG.md`](docs/CHANGELOG.md) |
| Stack, estructura y cómo agregar una pantalla | [`docs/FRONTEND.md`](docs/FRONTEND.md) |
| Diseño de referencia (abrir en el navegador) | `design/platita-diseno-b.codigo.html` |

## Backend

La API y las reglas del negocio viven en el repo hermano
`project-platita-backend` (GitHub: `german607/project-platita-backend`).
Su documentación (`docs/BACKEND.md`, `docs/EJEMPLO.md`) es la referencia
del contrato de la API.
