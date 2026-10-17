# Prompt para Claude Design: pestaña "Mi comercio" (perfil público del comercio)

Pegarlo tal cual y **adjuntar** `design/platita-diseno-b.codigo.html` como
referencia del estilo. Guardado el 2026-10-15.

````text
Diseñá una pantalla NUEVA para la app de los COMERCIOS de "Platita" (saldo prepago para comercios de barrio en Uruguay). Ya existen las pantallas Mostrador, Clientes, Promos y Reactivar (te adjunto el archivo de referencia del estilo). Esta es una pestaña más del menú, llamada "Mi comercio": es el PERFIL PÚBLICO del comercio, lo que los clientes ven en su app.

Mantené exactamente el estilo existente: colores (fondo #F6ECD9, tarjeta #FFFAF0, tinta #33201A, texto secundario #6E5240, borde #DCC7A0, acción #B8412B con sombra #7D2616, mostaza #E0A93B con sombra #A77A1C, saldo y éxito #2F6B4A, línea #EADCBC, arena #E3D3B2), tipografías (Bricolage Grotesque 800 para títulos y números, Nunito 700/800 para texto), objetivos táctiles de 48px o más, botones grandes con sombra de color, radios de 18 a 28px, español rioplatense. Lo usa el dueño o el personal del comercio, a veces desde el celular y a veces desde una compu, así que pensalo para las dos cosas.

CONTENIDO (un solo formulario, en secciones, con un botón "Guardar cambios" siempre a mano)

1. APARECER EN LA APP
   Un interruptor grande "Aparecer en la app". Viene APAGADO por defecto. Explicalo en una línea ("Si lo prendés, los clientes te encuentran en Lugares"). Si falta algo para poder prenderlo (por ejemplo, no hay ningún local cargado), mostrar qué falta. Al lado, una vista previa de cómo se ve la tarjeta del comercio en la lista de Lugares de los clientes.

2. DATOS
   - Descripción corta (hasta 280 caracteres, con contador).
   - Foto: botón para subir, cambiar o quitar, con vista previa.

3. CATEGORÍA
   Elegir una: Cafetería, Barbería y peluquería, Pilates y yoga, Panadería, Lavadero, Otro. Al lado del selector, un ícono de ayuda (ⓘ) con un tooltip que diga: "La categoría no se puede cambiar seguido: una vez cada 90 días. Si necesitás cambiarla antes, escribinos y la cambiamos nosotros." Diseñá también el estado BLOQUEADO: el selector deshabilitado con el texto "Podés cambiarla desde el 12 de enero".

4. LOCALES
   La lista de direcciones del comercio. Cada una tiene una etiqueta opcional (ej. "Pocitos") y la dirección (ej. "Av. Brasil 2500, Pocitos"). Un botón "Agregar otro local" y la posibilidad de dar de baja un local (no se borran, se dan de baja). Una nota: "Los clientes ven un botón Cómo llegar con esta dirección". Por ahora la mayoría va a tener un solo local, así que con uno solo tiene que verse limpio. NO diseñes un mapa ni un selector de pin.

5. HORARIOS
   La semana, de lunes a domingo. Cada día tiene uno o más tramos (de 09:00 a 13:00 y de 16:00 a 20:00), un botón "Agregar tramo" y un interruptor "Cerrado". Un atajo "Copiar a todos los días" o "Copiar de otro día". Los horarios son del comercio, uno solo para todos los locales.

ESTADOS: guardando, guardado con éxito, error con "Reintentar", y errores de validación junto a cada campo (por ejemplo, un tramo donde "hasta" es antes que "desde", o dos tramos superpuestos).

PEDIDO: mostrame la pantalla completa en celular y en web, el estado de categoría bloqueada, y el estado del interruptor cuando todavía falta algo.
````
