# Prompt para Claude Design: el lado del cliente

Pegarlo tal cual y **adjuntar** `design/platita-diseno-b.codigo.html` como
referencia del estilo. Guardado el 2026-10-15.

````text
Diseñá las pantallas del CLIENTE de "Platita", pensadas primero para el celular y con una versión web. Platita es saldo prepago para comercios de barrio en Uruguay (peluquerías, cafeterías, panaderías, lavaderos, pilates). El cliente es la persona que va a esos comercios: carga saldo con una bonificación ("cargá $1.000 y recibís $1.200") y después paga descontando ese saldo.

IMPORTANTE: ya existe la app de los COMERCIOS con un estilo definido (te adjunto el archivo de referencia). El lado del cliente tiene que verse como parte de la MISMA familia: mismos colores, tipografías, formas y tono. No inventes un estilo nuevo.

ESTILO (el mismo de la app de comercios)
- Colores: fondo #F6ECD9, tarjeta #FFFAF0, tinta (texto) #33201A, texto secundario #6E5240, borde #DCC7A0, acción (botón principal) #B8412B con sombra #7D2616, mostaza #E0A93B con sombra #A77A1C, saldo y éxito #2F6B4A, línea de separación #EADCBC, arena (deshabilitado) #E3D3B2.
- Tipografías: títulos y números en Bricolage Grotesque 800; texto en Nunito 700/800.
- Reglas: montos con formato $1.200 (punto de miles); objetivos táctiles de 48px o más; botones grandes de 64 a 72px de alto con sombra de color abajo; radios de 18 a 28px; cálido y cercano, nada corporativo.
- Español rioplatense, sin tecnicismos.

CONCEPTO CLAVE: el saldo de cada comercio es CERRADO: solo se usa en ese comercio. Por eso NO sumes los saldos de distintos lugares en un total.

PANTALLAS (en este orden de importancia)

1. LUGARES (pantalla principal)
   Lista de los comercios que tienen el servicio. Arriba un buscador por nombre y chips para filtrar por categoría (Todos, Cafeterías, Peluquerías y barberías, Pilates y yoga, Panaderías, Lavaderos, Otros).
   Cada tarjeta: foto, nombre, categoría, la dirección corta y una marca clara de si tiene una PROMO ACTIVA (etiqueta verde "Promo activa") o no (etiqueta apagada "Sin promo"). Si el cliente ya tiene saldo ahí, mostrar "Tenés $1.200".
   Estados: vacío ("No hay lugares con este filtro"), cargando y error con "Reintentar".

2. DETALLE DE UN LUGAR (al tocar una tarjeta)
   Foto grande, nombre, categoría, descripción corta.
   - Promos: lista de las promos activas, cada una dicha así: "Cargando $1.000 o más, te regalo $200", con el nombre de la promo si lo tiene (por ejemplo "Promo de verano") y una descripción opcional.
   - Dónde queda: una o VARIAS direcciones (un comercio puede tener varios locales); cada una con un botón "Cómo llegar" que abre el mapa del celular. NO dibujes un mapa embebido.
   - Horarios: la semana completa, con HOY resaltado, varios tramos por día (ej. 9 a 13 y 16 a 20), días "Cerrado", y un aviso "Abierto ahora" o "Cerrado ahora".
   - Tu saldo acá: el saldo del cliente en ese comercio, bien grande.
   - Un botón "Cargar saldo" DESHABILITADO con la etiqueta "Próximamente" (más adelante el cliente va a poder cargar transfiriéndole al comercio).

3. MIS SALDOS
   Lista de los comercios donde el cliente tiene saldo: nombre, categoría y el saldo grande de cada uno. Al tocar uno, va al detalle del lugar. Sin total general. Estado vacío: "Todavía no tenés saldo en ningún lugar. Cargá saldo en un comercio y aparece acá."

4. PERFIL
   Nombre (editable), teléfono con una marca de "verificado", una tarjeta "Mi código QR" (por ahora un lugar reservado con "Próximamente": más adelante se le muestra al cajero) y el botón "Cerrar sesión".

5. ENTRADA E INGRESO
   - Primera pantalla: el logo "platita" y la pregunta "¿Cómo querés entrar?" con dos opciones grandes: "Soy cliente" y "Soy un comercio".
   - Ingreso de cliente, paso 1: el teléfono (formato 099 123 456) y el botón "Mandame el código".
   - Paso 2: un código de 6 dígitos en casillas grandes, "Reenviar código" con cuenta regresiva y los errores "Código incorrecto" y "El código venció".

NAVEGACIÓN: en el celular, un menú inferior con Lugares, Mis saldos y Perfil. En la versión web, el mismo contenido centrado (ancho máximo cerca de 900px) con el menú arriba.

PEDIDO: mostrame primero las pantallas 1 (Lugares), 2 (Detalle) y 3 (Mis saldos) en formato celular, con sus estados. Después sigo con el resto y la versión web.
````
