# RP Usados — Etapa 2A / revisión del blockout

**Actualización:** el usuario aprobó el encuadre A y pidió un recorrido más corto y superficial. La [segunda prueba de ritmo](blender/stage-2a/iteration-2/NOTAS.md) conserva este documento como referencia de la versión inicial de 12 segundos.

24 de septiembre de 2026. **Propuesta para aprobación. No es una reconstrucción medida ni la escena final.**

## Entrega

- [Archivo de trabajo Blender](blender/stage-2a/RP_Usados_Blockout_2A_v001.blend).
- [Tablero de revisión: tres cámaras, recorrido y frames](blender/stage-2a/review/index.html).
- [Video del recorrido provisional](blender/stage-2a/review/RP-2A-recorrido-PROVISIONAL.mp4).
- [Validación técnica](blender/stage-2a/validation.json) y [muestras del recorrido](blender/stage-2a/camera-path.json).

Creado mediante Blender MCP en Blender 5.2.1 LTS. La escena inicial `Scene` —cubo, cámara y luz de fábrica, sin archivo abierto— quedó conservada. No se modificaron el tema WordPress, las exploraciones Stage 1, el backend ni la lógica comercial. No se incorporaron librerías.

## Qué se está validando

La relación entre el frente del portón, la ochava y Chacabuco; la escala aparente del acceso; la lectura del edificio desde la calle; el acercamiento y el ingreso breve. Los renders ocupan 1440 × 844: un área equivalente al viewport de 1440 × 900 menos un header de referencia de 56 px. Ese tamaño de header sirve para esta revisión, no fija todavía el diseño web. No se reservó espacio lateral para copy.

Se incluyeron los paños principales, zócalo oscuro, plano negro de la ochava, tres aberturas de Chacabuco, ventana estrecha junto al portón, portón y reja simplificados, diagonales superiores, silueta del tanque y antena, vereda continua, cordón amarillo, fragmento de cruce, poste, semáforo y dos volúmenes vecinos sin detalle.

Se priorizaron las tres fotos actuales del dueño. Street View se utilizó como apoyo de relación entre frentes. El rojo histórico de la ochava no se trasladó al modelo. El cartel es un panel de posición y volumen sin lettering: **no se inventó ni recreó el logo**. La luz fría exterior y cálida interior sólo facilita leer profundidad. No hay texturas ni materiales finales.

## Cámaras iniciales

Las tres usan 34 mm, altura constante de 1,78 m respecto de la calle y horizonte sin roll. Cambia la posición lateral; no cambia el edificio entre opciones.

| Opción | Intención | Ventaja | Compromiso |
| --- | --- | --- | --- |
| **A · Equilibrado — recomendación preliminar** | Ochava central con ambos frentes legibles. | Reconocimiento global y recorrido casi directo al acceso; evita un paneo fuerte al acercarse. | El portón tiene algo menos de peso que en C. |
| B · Chacabuco | Mayor presencia de las tres aberturas y del frente largo. | Buena lectura de la fachada actual y el ritmo de ventanas. | Comprime visualmente el portón; exige reajustar el inicio de la trayectoria si se elige. |
| C · Portón | Mayor peso del frente ancho y de la estructura superior. | Explica mejor el volumen de la concesionaria. | El poste se acerca al área del acceso y Chacabuco queda más comprimida. |

La recomendación A se basa en reconocimiento y continuidad espacial. No supone aprobación del encuadre.

## Recorrido propuesto

Ensayo de **12 segundos**, 24 fps, frames 1–289. Es un tiempo de revisión del movimiento en Blender; no establece duración obligatoria, distancia de scroll ni autoplay para la web. Focal fija, altura constante, aceleración inicial suave y desaceleración al llegar. La posición lateral se alinea gradualmente con el centro del acceso.

| Momento | Frame | Distancia aproximada al plano de acceso | Qué se evalúa |
| --- | --- | --- | --- |
| Exterior | 1 | 18,6 m afuera | Presencia y reconocimiento de ambos frentes. |
| Aproximación | 109 | 9 m afuera, aproximadamente | Lectura de profundidad y estabilidad. |
| Vista cercana abierta de prueba | 145 | 5,6 m afuera | El acceso empieza a dominar el encuadre. |
| Antes del umbral | 205 | 1,59 m afuera | Las jambas encuadran el interior. |
| Inmediatamente antes | 235 | 0,31 m afuera | Casi toda la fachada ya salió del encuadre. |
| Cruce provisional | 247 | Se cruza el plano de acceso | Paso continuo, sin corte de cámara. |
| Final | 289 | 0,75 m adentro | Composición interior sencilla para estudiar la futura transición. |

Velocidad máxima de la cámara en esta escala hipotética: 2,89 m/s. La distancia real puede modificar esa lectura. No hay oscilación vertical, roll ni cambio de focal. Los transforms están horneados por frame; no dependen de constraints o mecanismos imposibles de trasladar.

**Observación visual importante:** con esta focal, la fachada desaparece del encuadre antes del cruce físico. La futura UI podría empezar a aparecer en ese tramo final mientras el movimiento termina, sin un corte arbitrario. No se implementó fade, UI, apertura ni sincronización con scroll. Conviene validar ahora si el ingreso aporta suficiente sensación espacial; prolongarlo expondría un interior que todavía no está documentado.

## Puerta e interior: qué es provisional

- `RP_2A_CLOSED`: escena base, acceso cerrado mediante una pieza independiente. Sin bisagras, guías, dirección de apertura ni movimiento inventados.
- `RP_2A_PATH_OPEN_PROVISIONAL`: comparte la geometría y omite exclusivamente la colección de puerta para probar la cámara. **Está libre desde el inicio del video. No muestra cómo se abre.**
- El interior contiene suelo, techo, una pared de cierre visual y dos bloques abstractos como referencias de profundidad. No representan un mostrador, autos confirmados, mobiliario ni la distribución real.
- Los volúmenes vecinos, ubicación de postes, anchos de vereda, cubiertas y altura de tanque son aproximaciones visuales.

## Hipótesis dimensionales — no son medidas del local

| Elemento | Valor de trabajo | Estado |
| --- | --- | --- |
| Frente Chacabuco, excluida la ochava | 10,10 m | Hipótesis para blockout. |
| Frente del portón, excluida la ochava | 8,20 m | Hipótesis para blockout. |
| Ochava | 3,54 m; a 45° entre frentes ortogonales | Verificar ancho y ángulo. |
| Altura de fachada | 4,30 m sobre nivel de calle | Hipótesis. |
| Paso del acceso | 1,62 × 2,48 m | Verificar luz libre real. |
| Interior final recorrido | 0,75 m desde el plano del acceso | Elección de ensayo, no medición. |
| Ancho de vereda recta | 1,65 m | Hipótesis; rampas y pendiente todavía simplificadas. |

Medidas reales: `[dato pendiente — confirmar con el cliente]`.

## Referencias que faltan

No hace falta fotografiar toda la manzana. Estas tomas resuelven las incertidumbres que sí afectan al próximo paso:

1. **Ochava frontal completa:** desde la vereda opuesta, cámara horizontal a aproximadamente 1,60 m, lente 1×, a unos 8–12 m del acceso, apuntando perpendicular a su plano. Incluir ambos extremos de la ochava, suelo y coronamiento. Idealmente sin autos tapando el umbral. Permite corregir trapecio negro, proporción de cartel y ancho de acceso.
2. **Cada frente perpendicular:** una foto centrada de Chacabuco y otra del portón desde la vereda opuesta, a distancia suficiente para incluir pared completa y línea de techo. Evitar panorama y ultra gran angular. Permite ubicar anchos, separaciones y alturas de aberturas.
3. **Puerta cerrada y abierta:** foto frontal a 2–3 m, más detalle lateral de cada jamba, parte superior y piso. Un video corto de un ciclo de apertura, si es posible. Esto debe revelar hojas, pivotes/bisagras o guías, recorrido y qué permanece fijo. Mecanismo actual: `[dato pendiente — confirmar con el cliente]`.
4. **Primer tramo interior:** una foto desde el umbral hacia adentro y otra desde aproximadamente 1 m adentro, ambas a altura de ojos y con lente 1×. Incluir piso, techo y laterales. Sólo necesitamos confirmar los primeros 3–5 m visibles; no una sesión del salón completo.
5. **Estructura sobre el portón y cubierta:** tomas desde ambos extremos de la vereda con cámara apuntando a la parte superior. Incluir encuentro con la ochava, diagonales, techo detrás y tanque. Resuelve profundidad e inclinación que una sola fachada no permite deducir.
6. **Vereda/cordón:** dos fotos oblicuas a lo largo de cada frente que incluyan umbral, ochava, rampa, postes y borde de calle. Resuelve pendientes y posiciones antes de afinar la trayectoria.

**Medidas prioritarias:** ancho y altura libres del acceso; ancho total de la ochava; largo de cada frente desde la ochava; altura de coronamiento; ancho/alto del portón. Después: ancho de vereda y altura del escalón. Un croquis con esas cotas sirve. No hace falta un relevamiento profesional para corregir la escala inicial.

**Antes de materiales/cartelería:** logo original en SVG/PDF vectorial, foto frontal legible del cartel y detalles de pintura/revestimiento con luz pareja. No son necesarios para aprobar el recorrido, pero sí para una representación fiel posterior.

## Riesgos detectados

| Riesgo | Consecuencia | Próximo paso recomendado |
| --- | --- | --- |
| Escala deducida de fotos | La entrada puede sentirse demasiado grande o pequeña; modifica velocidad percibida. | Corregir primero luz libre del acceso y anchos de frentes con medidas. |
| Mecanismo de puerta desconocido | La cámara puede interferir con una hoja, reja o guía real. | Mantener la apertura pendiente hasta tener fotos/video. |
| Interior sin referencias suficientes | Un ingreso largo puede sugerir un showroom que no existe. | Mantener el cruce breve y sustituir los bloques por volúmenes documentados. |
| Pérdida temprana del exterior | El último tramo puede resultar más largo de lo útil. | Aprobar profundidad y ritmo del video; la futura transición no debe esperar obligatoriamente al último frame. |
| Poste frente a la esquina | Puede competir con cartel o puerta al mover el ángulo inicial. | Verificar su posición real; ajustar cámara antes de plantear omitirlo. |
| Fachada simplificada | Simetrías, rejas o coronamiento no reproducen todavía todos los detalles. | Corregir geometría que cambia la silueta antes de dedicar tiempo a materiales. |
| Recorte vertical | Este encuadre ancho no valida mobile. | En etapa posterior evaluar una cámara vertical específica o la alternativa 2.5D ya planteada. |
| Muchos objetos pequeños | Bajo número de triángulos no equivale a pocas draw calls. | Tras aprobar forma, agrupar estáticos por material y mantener acceso/cámara separados. |
| Luz de Blender vs. render web | EEVEE no demuestra calidad o rendimiento futuro en Three.js. | La futura prueba técnica debe medirlo; no se declara rendimiento web validado. |

## Verificación realizada

- 184 objetos de malla; **2.244 triángulos** en la escena base, 11 materiales planos de blockout y cero texturas.
- Escalas de malla unitarias, sin subdivisión, rigs, modificadores ni dependencias externas para el recorrido.
- Cámara animada en seis canales de posición/rotación; comprobados frames inicial, intermedios y final con la escena correspondiente activa.
- El centro de la cámara no intersecta geometría durante el recorrido abierto de ensayo. La prueba no certifica holgura real del acceso ni del futuro mecanismo.
- Eje horizontal de cámara estable: componente vertical máxima menor a 0,000001; sin roll apreciable.
- Puerta presente en la escena cerrada y ausente sólo en la escena de ensayo.
- Escena inicial conservada. Archivo de etapa separado. Renders A/B/C, acceso cerrado, aproximación, antes/después y planta de inspección.
- Tablero local comprobado a 1440 y 390 px, sin imágenes rotas ni desbordamiento horizontal. Selector A/B/C y lectura del MP4 comprobados; la revisión usa un servidor local con soporte de búsqueda por tiempo en el video.

No se ejecutaron build, empaquetado ni pruebas WordPress: no hubo cambios en la web.

## Cómo revisar en Blender

Abrir `RP_Usados_Blockout_2A_v001.blend`. La escena guardada es `RP_2A_CLOSED`, frame 1, cámara A. En `2A_09_CAMERAS` están A, B y C y una cámara cercana al acceso. La cámara cenital es sólo de inspección.

Para reproducir el movimiento, seleccionar la escena `RP_2A_PATH_OPEN_PROVISIONAL`, ir al frame 1, entrar en vista de cámara y reproducir la línea de tiempo. Sus marcadores indican aproximación, antes del umbral, cruce y final. No reproducir la cámara de trayectoria esperando que la puerta de la escena cerrada se abra.

Los scripts incluidos documentan la construcción y evitan sobrescribir escenas/archivos existentes. Están pensados para ejecutarse una vez en una copia limpia; el `.blend` es el entregable de revisión.

Para volver a abrir el tablero con reproducción y búsqueda de video: desde la raíz ejecutar `node blender/stage-2a/review/serve-review.mjs` y visitar `http://127.0.0.1:9412/blender/stage-2a/review/`. Es un visor local de archivos, sin dependencias añadidas ni cambios al servidor de la web.

## Aprobación necesaria para continuar

1. Elegir **A, B o C** como encuadre inicial; propongo A.
2. Aprobar o corregir la **proporción aparente del edificio y del acceso**, teniendo presente que falta medirlas.
3. Aprobar o ajustar el **ritmo del acercamiento y la profundidad de ingreso de 0,75 m** del ensayo.

La apertura real queda pendiente de referencias, no se decide por suposición. Esta entrega se detiene en 2A. Materiales, texturas, apertura definitiva e integración web requieren una etapa posterior autorizada.
