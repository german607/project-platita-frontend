# Candidatos de nombre (para decidir)

Resumen del proyecto para pasarle a otras IAs: [`NOMBRE-DEL-PROYECTO.md`](NOMBRE-DEL-PROYECTO.md).
Este archivo es la hoja de seguimiento: se van sumando las ideas de otras IAs y
se marca qué se verificó. **Nada de esto está confirmado como libre**: las
búsquedas del 2026-10-24 fueron superficiales (web abierta, sin buscar en el
registro de marcas ni en tiendas de apps uruguayas). Hay que comprobar dominio,
redes y marca antes de elegir.

## Propuestos por Claude (2026-10-24)

| Nombre | Idea | Cómo suena | Riesgos / lo que se encontró |
|---|---|---|---|
| **Yapa** | La "yapa" es el extra que el comercio te regala: es literalmente la promo | "Tengo yapa en la panadería", "Entrá a Yapa" | Se parece al oído a **Yape** (la billetera del BCP, muy conocida en la región). No apareció una marca igual de fidelización en una búsqueda rápida |
| **Saldito** | El producto es el saldo, dicho con cariño de barrio | "Tengo saldito en la peluquería" | Es el mismo patrón diminutivo que "Platita", por si eso era parte de lo que no convencía. No apareció una marca igual; hay "Saldos Digitales" (Colombia), distinta |
| **La Libreta** | La libreta de toda la vida del almacén ("anotá en la libreta"), pero al revés: el cliente ya pagó | "Me anoto en La Libreta" | La libreta clásica era **fiado** (deuda): puede confundir el concepto. Cálido y nostálgico. No apareció una app igual |
| **Sumá** | Imperativo rioplatense: "sumá" saldo, "sumá" promos | "Sumá y volvé" | Lleva tilde (el teclado y el dictado complican). Palabra muy común: probable que haya marcas parecidas (no se buscó) |
| **Fiel** | Fidelidad del cliente y del comercio | "Soy cliente Fiel de la barbería" | Muy genérico: difícil de registrar y de ubicar en buscadores. No se buscó |
| **Bonito** | "Bono" + lo lindo de recibirlo | "Me hicieron un Bonito" | Palabra común, muchas marcas; humor que puede cansar. No se buscó |
| **Barrio** | La idea de pertenencia al barrio | "Mis saldos en Barrio" | Muy genérico; no transmite ganancia. No se buscó |
| **Vecino** | Los comercios son "los vecinos"; confianza | "Saldo en Vecino" | Genérico; no transmite beneficio. No se buscó |

**Descartados al buscar** (ya existen o están muy usados):
- **Vuelve**: hay una app de fidelización con ese nombre (sellos y premios por recurrencia).
- **Alcancía**: lo usan bancos y apps de ahorro de la región para productos de ahorro.
- **Chanchito**: hay una app financiera con ese nombre en México.

**Mis tres favoritos hoy:** 1) **Yapa** (el significado es el más fuerte, el riesgo es
la cercanía con Yape), 2) **Saldito** (el más claro), 3) **La Libreta** (el más cálido,
pero hay que cuidar el tema del fiado).

## Sugeridos por otras IAs

*(pegar acá las listas que vayan llegando, con la IA que las propuso)*

| Nombre | Propuesto por | Idea | Riesgos que mencionó |
|---|---|---|---|
|  |  |  |  |

## Qué verificar de los finalistas antes de elegir

- [ ] **Dominio**: `.uy` (se registra en nic.uy) y `.com`.
- [ ] **Redes**: usuario libre en Instagram, TikTok y WhatsApp Business.
- [ ] **Tiendas de apps**: buscar el nombre en Google Play y App Store (Uruguay y región).
- [ ] **Marca**: consultar el buscador de la Dirección Nacional de la Propiedad
      Industrial (Uruguay) y, si hay planes de crecer, el de Argentina y Brasil.
      Mirar las clases de software, servicios financieros y publicidad/fidelización.
- [ ] **Doble sentido** en lunfardo/rioplatense y en inglés/portugués.
- [ ] **Prueba de oído**: decirlo en voz alta a 5 personas (un comercio y un cliente
      incluidos) y pedirles que lo escriban.

## Cuando haya nombre

El nombre hoy está escrito a mano en unos pocos lugares del front (título de la
pestaña, el logo de los menús, "Entrá a …", "Lugares en …", `index.html`, `package.json`)
y en el backend (`package.json`, `docker-compose.yml`, el nombre de la base en
`.env.example`, y la consola `/dev`). Plan: **una sola variable** (`VITE_APP_NAME` en el
front, con el nombre provisional como valor por defecto) para que cambiarlo sea tocar
un valor, y los textos nuevos del SMS/WhatsApp del backend también salen de su
configuración.
