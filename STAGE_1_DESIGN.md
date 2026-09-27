# RP Usados — Etapa 1 / Segunda iteración

**24 de septiembre de 2026 · Exploración para revisión. No se inicia la Etapa 2.**

Esta versión aplica las correcciones del cliente: **Manrope predominante + Archivo técnico, mayor contraste, catálogo sin filtros, tarjetas completamente enlazadas, ficha de pantalla completa, WhatsApp explícito y Google Maps integrado**. No cambia WordPress, administración, consultas de vehículos, precios ni contactos.

## Abrir y recorrer

- [Home de la exploración](http://127.0.0.1:9411/explorations/stage-1/).
- [Ficha de muestra](http://127.0.0.1:9411/explorations/stage-1/vehiculo.html?estado=disponible).
- [Archivos locales](explorations/stage-1/index.html), [ficha local](explorations/stage-1/vehiculo.html).
- [Verificación de esta iteración](explorations/stage-1/REVIEW_ITERATION_2.md).

Para revisar: pasar sobre una tarjeta y tocar foto, texto o specs; entrar a la ficha, cambiar de vista con botones o flechas del teclado; recorrer la ficha en mobile; probar WhatsApp; abrir la sección Ubicación.

Se conservó la fuente de la versión anterior en `explorations/stage-1/archive/iteration-1-source.zip`. Este documento sustituye su recomendación de A, sus filtros y su ficha modal. Las capturas anteriores fuera de `review/iteration-2/` son históricas.

Skills: `frontend-design-codex` como principal y `ui-ux-pro-max` como complemento. No se añadieron skills de frontend redundantes. **No se generaron imágenes nuevas ni se usó Blender.** Se reutilizó únicamente el estudio 2D anterior en el espacio del hero, marcado como provisional. Su función concreta es mantener la referencia de atmósfera hasta probar el blockout; no valida geometría ni logo.

## A. Paleta y superficies con identidad

### Dirección: negro del acceso, gris de fachada, luz del cartel

La interfaz deja de ser una sucesión de superficies blancas. La referencia principal vuelve a la fachada actual del dueño: acceso negro, paños gris claro, zócalo oscuro y letras claras. El pequeño óvalo cálido visible en el cartel permite un acento limitado. No uso el rojo histórico del acceso de Street View como color actual.

| Token | Valor de UI propuesto | Uso y fundamento |
| --- | --- | --- |
| Negro de acceso | `#191A1B` | Hero provisional, cabecera de ficha, contacto, estados. |
| Grafito | `#303334` | Nosotros y entorno de galería. Relación con zócalo y acceso. |
| Concreto | `#C8CAC7` | Fondo del catálogo. Más presencia que el papel casi blanco. |
| Piedra clara | `#E5E5E0` | Información de unidades y financiación. |
| Blanco cálido | `#F5F4EF` | Lectura puntual, botones claros y barra de consulta. |
| Acento del cartel | `#C58A5A` | Marcaciones pequeñas, dato institucional y contacto sobre oscuro. |
| Acento oscuro | `#764323` | Texto/acento sobre claro, para conservar contraste. |

**Son aproximaciones de diseño, no colores oficiales muestreados o códigos de pintura.** El acento cálido se apoya en el cartel fotografiado, pero no se convierte en una nueva identidad naranja. El logo vectorial será la fuente para ajustar sus propios colores. Ni el amarillo del cordón ni la luz azul de la noche se aplican como pintura nueva a la fachada.

Ritmo de superficies: entrada negra → catálogo concreto → Nosotros grafito → financiación piedra clara → ubicación gris con mapa → cierre negro con WhatsApp. La zona clara se conserva donde ayuda a leer; el contraste hace el trabajo de separar.

Sin degradados decorativos, sombras repetidas, glassmorphism ni esquinas redondeadas en cada bloque. Los separadores de sección son cambios de superficie y espacio. La repetición se concentra en unidades porque sirve a la comparación.

## B. Tipografía elegida: C, con roles corregidos

**Manrope lleva la voz general. Archivo se reserva al registro técnico.** Se retiró el selector A/B/C y ya no se carga Bricolage, Newsreader ni Instrument.

| Contenido | Familia | Criterio |
| --- | --- | --- |
| Títulos, títulos de vehículo, cuerpo | Manrope 400–600 | Lectura continua y personalidad moderna. |
| Navegación, botones, WhatsApp, enlaces | Manrope 500–600 | Coherencia con la interfaz general. |
| Año, kilómetros, specs, labels y estado | Archivo 400–500 | Precisión y carácter automotriz sin dominar. |
| Dato de trayectoria | Archivo 500 | Acento editorial puntual, sin repetir gigantes numéricos en otras secciones. |

Ambas son variables y están autoalojadas; la pareja suma unos **58,4 KiB** en los WOFF2 latinos ya descargados. Se conservan licencias OFL. No hay solicitud a Google Fonts al navegar. No se modificaron las fuentes del tema de producción.

Títulos de 34–76 px según contexto; cuerpo 16 px como referencia; labels comerciales pequeños pero legibles. Los años/kilómetros emplean cifras tabulares donde la fuente lo permite. Se mantiene un único sistema de tamaños; no se convierte todo en señalética industrial.

## C. Navegación, botones y enlaces: tres comportamientos

El lenguaje se reduce a tres respuestas. No se suman máscaras, rebotes, parallax y cursores especiales.

1. **Cambio contenido de superficie/contraste — 180 ms.** Navegación entra en un fondo gris; botón oscuro cambia a grafito; botón claro pasa a un tono cálido moderado; la selección de galería invierte contraste.
2. **Dirección — 180 ms.** La flecha avanza unos 3 px hacia el destino; volver desplaza el icono ligeramente a la izquierda. El texto permanece estable.
3. **Proximidad de la fotografía — 240 ms, escala 1,015.** Sólo la capa de imagen de la unidad se acerca; el marco no crece y los datos no saltan.

No hay barra animada bajo cada elemento. Un subrayado puede servir en prosa futura, pero no es el recurso principal del sistema.

En teclado: foco visible de 3 px, estados legibles y enlaces verdaderos. En touch: toda la tarjeta funciona y el estado pressed cambia superficie/contraste; no se revela información indispensable al hover. Con `prefers-reduced-motion`: se eliminan transformaciones y transiciones, manteniendo los estados.

## D. Tarjetas enteramente clickeables

Cada artículo contiene **un único enlace de bloque que envuelve foto, estado, título, versión y specs**. No se usó un `div` con onclick ni un enlace dependiente de una flecha pequeña. Se conserva la posibilidad de abrir en otra pestaña, usar menú contextual y navegar sin JavaScript.

La flecha es una señal visual, no un segundo botón anidado. No hay controles interactivos dentro del enlace. En producción, el nombre accesible será el título real de cada unidad.

Al hover se aclara levemente la superficie, avanza la flecha y se aplica el acercamiento mínimo a la capa fotográfica. No se mueve la tarjeta completa, no se pierde legibilidad y no se agrega un cursor personalizado. Los espacios vacíos demuestran el movimiento del contenedor; la calidad del crop se validará con fotografías reales.

Se muestran seis **muestras explícitas**, para evaluar dos filas en desktop y continuidad en mobile. No son seis unidades creadas en WordPress. «Marca / Modelo», «AAAA» y «00.000 km» son patrones de desarrollo, no datos comerciales.

## E. Catálogo sin filtros

Se eliminaron búsqueda, marca, año, limpiar y feedback de filtrado de esta exploración. El usuario recorre el stock por scroll. No se los reemplazó por otro mecanismo de filtrado o carrusel.

- 3 columnas en desktop amplio; 2 en tablet; 1 en teléfono.
- Fotografías 3:2 con encuadre consistente y sin recortar ruedas o paragolpes.
- Año/km en posiciones estables para leer rápido.
- Disponibles y reservados visibles; vendidos fuera.
- Ningún precio o cuota fuera de ficha.
- Sin destacados, favoritos, compra, reservas pagas ni comparador.
- Para el volumen previsto de 20–30, se propone recorrer todas las unidades en una página, con fotos diferidas después de la primera fila.

El tema actual sigue conservando su paginación y consultas; integrarlas después será trabajo de frontend con la lógica de elegibilidad existente. Esta etapa no cambia el backend para forzar la muestra.

## F. Ficha como experiencia de pantalla completa

La tarjeta ahora abre **una página independiente**, no un diálogo. La composición comienza con el título y estado sobre grafito; la galería cruza todo el ancho de pantalla. Debajo aparece una franja de specs. La información ampliada y precio se desarrollan después del primer campo fotográfico.

### Desktop

Galería de aproximadamente la mitad de la altura visible, ajustable a la foto real, sin columna estrecha de miniaturas ni formulario comercial al lado. Controles anterior/siguiente separados en los extremos, contador y selección de vistas centrada. Luego datos completos, precio y WhatsApp. Barra inferior con consulta siempre accesible y enlace al precio.

### Mobile

Título antes de la foto, galería vertical amplia, controles de 44–48 px, labels claros y año/km debajo. Las vistas se eligen con botones; las flechas del teclado también funcionan cuando la galería recibe foco. No se exige swipe ni hover para operar.

Barra inferior con WhatsApp y acceso al precio, espacio reservado al final del documento y safe area. Se evita superponer texto principal sobre el vehículo. Con fotos reales, usar encuadre completo dentro de un fondo integrado; no ampliar arbitrariamente una toma horizontal hasta cortar el auto.

El precio sólo tiene lugar en esta ficha, con el marcador obligatorio mientras falte. WhatsApp por unidad conservará título y URL de la lógica existente. **La exploración no conecta ni cambia esa lógica**.

La limitación principal está a la vista: sin fotografías reales se valida escala, jerarquía e interacción, pero no la fuerza comercial de una unidad concreta. No se sustituyó por un auto generado para disimularla.

## G. WhatsApp reconocible y logo real pendiente

### WhatsApp

Icono reconocible de WhatsApp más texto explícito: «WhatsApp» en navegación, «Consultar por WhatsApp» en servicios y ficha, «Hablemos por WhatsApp» en contacto. El color del botón pertenece al sistema: negro o claro según superficie; no se pegó una burbuja verde flotante a toda la Home.

Se usa un SVG existente de [Simple Icons](https://github.com/simple-icons/simple-icons/blob/develop/icons/whatsapp.svg), autoalojado, sin instalar una librería. Es un icono de servicio, no una versión del logo RP. Su procedencia está en `media/WHATSAPP_SOURCE.md`.

El número continúa como `[dato pendiente — confirmar con el cliente]`. Al probar los botones se muestra un aviso honesto; **no se abre un número de ejemplo ni se manda un mensaje**. El diálogo es una ayuda de revisión, no el comportamiento comercial final.

### Resultado de búsqueda del logo

Se revisaron assets y nombres de archivos del proyecto, incluidos archivos ocultos pertinentes y formatos SVG/PNG/JPG/PDF/AI/EPS, además de `header.php` y `inc/setup.php`.

- No se encontró el original como asset independiente en este repositorio.
- El tema tiene soporte de `custom-logo`, pero su alternativa actual es una composición de texto.
- Las fotografías contienen cartelería y marcas pequeñas; no equivalen a un archivo de logo.
- Se retiró de la exploración la recreación tipográfica «RP USADOS» como logo.
- Queda un espacio de revisión «Logo original / archivo pendiente», claramente marcado. No se vende como solución visual final.

Necesito que entregues el **SVG original o PDF vectorial**. Si no existe, PNG transparente de buena resolución. Si está cargado en una biblioteca multimedia de WordPress no incluida aquí, sirve la URL exacta del asset. No lo vectorizaré desde una foto ni inventaré variantes sin autorización.

## H. Mapa integrado sin API paga

Se obtuvo el iframe desde **Compartir → Insertar un mapa** en la ficha pública de R.P. Usados. Es la inserción pública de Google Maps, no Maps JavaScript API ni una URL `embed/v1` con clave. No se creó cuenta Cloud, facturación ni API key.

La composición relaciona un mapa amplio con un panel negro de visita: dirección, «Cómo llegar» y «Abrir Google Maps». En mobile, el mapa mantiene una altura útil y el panel continúa debajo. Se conservan controles, atribución y colores propios de Google; no se aplica un filtro que haga ilegible el mapa ni se tapa su marca.

Los enlaces externos de búsqueda/indicaciones usan Maps URLs, que no requieren API key según la [documentación oficial](https://developers.google.com/maps/documentation/urls/get-started). Las coordenadas del destino provienen de la ficha pública consultada, no se adivinaron. No se obtiene ubicación del visitante desde nuestra página: Maps resuelve origen/permisos al abrir indicaciones.

La inserción carga contenido de Google y depende de su red/servicio. Los enlaces externos se mantienen disponibles si el mapa falla. En la integración final, diferir carga al acercarse a la sección, reservar dimensiones y comprobarlo en el dominio real; no cargar un SDK adicional.

La ficha de Google puede incluir horarios, teléfono o reseñas de terceros. **No se copiaron como datos propios confirmados**. El sitio conserva el marcador de horarios y WhatsApp hasta validación del cliente.

## I. Tratamiento de imágenes por sección

| Sección | Qué debería mostrar | Función | Decisión para esta iteración |
| --- | --- | --- | --- |
| Hero | Ochava real, ambos frentes y acceso con identidad actual | Reconocimiento y atmósfera de entrada | Estudio 2D existente, marcado provisional. Ninguna generación nueva. Blockout sólo en Etapa 2 autorizada. |
| Catálogo | Cada unidad real, exterior de tres cuartos y luz pareja | Elegir/comparar estado, silueta y presencia | **Fotos reales nuevas** del inventario confirmado. Espacios reservados mientras falten. |
| Ficha | Exterior completo, lateral, trasera, interior y detalles relevantes | Evaluar la unidad con confianza | **Galería real nueva**, sin retoques que alteren estado o equipamiento. |
| Nosotros | Preferentemente atención real o un detalle auténtico del negocio, si aporta algo | Cercanía/evidencia de empresa establecida | **Sin imagen por ahora:** trayectoria y composición tipográfica. Foto de personas sólo con material autorizado. |
| Financiación/permutas | No necesita imagen | Explicar opciones con claridad | **Prescindir de imagen.** Sin llaves, apretones de manos, dinero ni stock photos. |
| Contacto | No necesita imagen | Reconocer WhatsApp y actuar | **Prescindir de imagen.** Icono de servicio y copy preciso. |
| Ubicación | Mapa real; eventualmente foto frontal nueva de la entrada | Orientar y reconocer dónde entrar | **Mapa integrado.** Foto nueva del acceso sólo si complementa la orientación; no repetir las fotos institucionales anteriores. |
| Logo | Asset original, limpio, sin deformar | Reconocimiento de marca | **Asset original pendiente**; no recorte del cartel ni nueva versión generada. |

Las fotos del dueño siguen siendo fuente principal para el edificio aunque no todas sirvan como imágenes institucionales de la web. Street View sigue siendo secundario. Las fotos no se reutilizan simplemente porque están disponibles.

## J. Assets reales necesarios

### Para arrancar un blockout fiel después de tu aprobación

1. **Logo original:** SVG o PDF vectorial; PNG transparente si no hay vector. Incluir variantes originales existentes sobre claro/oscuro, si las hay.
2. **Acceso de la ochava:** fotos cerrado, a medio abrir y abierto; cámara frontal y horizontal, a 2–4 m si es seguro. Video breve y quieto del mecanismo para ver hojas, guías o bisagras. No inventar apertura.
3. **Escala:** ancho/alto libres de entrada y ancho de la ochava medidos. Si es posible, largo de ambos frentes y altura del borde de fachada.
4. **Umbral e interior inmediato:** toma desde la puerta mirando adentro y otra aproximadamente 1 m adentro, con autorización. Mostrar piso, techo y laterales de los primeros 2–3 m.
5. **Frentes:** una foto perpendicular y nivelada de cada frente, desde la vereda opuesta y sin ultra gran angular; más una diagonal desde cada lado. Sólo desde lugares seguros.
6. **Cartel/materiales:** frontal nítida del cartel y detalles del gris, negro, zócalo, rejas y vidrio con luz pareja. Las fotos existentes ya permiten empezar a entender volúmenes; estas resuelven lo incierto.

### Para validar catálogo/ficha e integrar después

- Un primer set completo de una unidad disponible y una reservada: fotos y datos confirmados. Idealmente exterior de tres cuartos, lateral, trasera, interior y detalles. No hace falta cargar todo el stock para validar composición.
- Después, set consistente del resto del inventario: título, versión, año, kilometraje, estado y precio/moneda para la ficha.
- Número real de WhatsApp. Horarios y condiciones específicas únicamente si se publicarán.
- Foto institucional de personas: **opcional**, no bloquea el blockout ni se pide por defecto.

## Qué queda abierto antes de la Etapa 2

La tipografía C y la eliminación de filtros ya son decisiones tomadas; no las vuelvo a pedir. Esta revisión deja para tu evaluación la nueva distribución de superficies/acento, la tarjeta completa y la ficha de pantalla completa. No hace falta perfeccionar todos los textos o fotos institucionales antes de probar el hero.

**Necesito tu revisión de esta iteración y autorización explícita para iniciar el blockout**, además del material crítico del acceso y la marca. No se inicia Blender automáticamente. No se proponen nuevas librerías, cambio de arquitectura, secciones extra ni generación de imágenes en esta entrega.
