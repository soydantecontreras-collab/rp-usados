# RP Usados — producción visual 001

## Estado de la entrega

Primera pasada de producción en Blender, pendiente de referencias y aprobación visual. **No es la escena fotorealista final.** La ausencia de cartelería original, el interior esquemático y algunos detalles todavía estimados impiden cerrar la fidelidad del resultado. No hay integración web.

Archivo: `RP_Usados_Hero_Visual_v001.blend`, con mapas utilizados empaquetados. Escena principal: `RP_VISUAL_01_APPROVED_CAMERA`. Las versiones de blockout permanecen separadas e intactas.

## Cámara y revisión

Se comprobaron posición, rotación y focal contra las 115 muestras originales. No se alteraron. El video muestra únicamente frames **1–85 a 24 fps: 3,54 segundos**, igual que la última revisión aprobada. No se añadió tiempo dentro del local.

| Vista | Frame | Uso |
|---|---:|---|
| A. Inicial | 1 | Encuadre A aprobado, exterior completo |
| B. Medio | 43 | Aproximación y lectura de materiales |
| C. Llegada | 85 | Final visible aprobado, aproximadamente 2 m antes del umbral |
| D. Antes de cruzar | 105 | Diagnóstico de continuación; aproximadamente 12,5 cm afuera |
| E. Apenas adentro | 115 | Diagnóstico de continuación; 20 cm adentro |
| F. Materiales | — | Ocho muestras con iluminación neutral, en escena independiente |
| G. Luz exterior | 43 | Comparación con B, apagando las luces cálidas y el acento del cartel |

**D y E no forman parte del video.** La continuación física se conserva para evaluar la futura transición, sin prolongar el segmento visible. No se implementó UI ni apertura de puerta.

## Producción realizada

- Pintura gris clara, zócalo carbón y acceso negro, según fotos actuales. No se recuperó el acceso rojo de Street View.
- Mapas de albedo de pintura horneados en Blender con variación superficial sutil, mapas normales, vidrio transmisivo y metal pintado. Shaders de producción: Principled, Image Texture y Normal Map.
- Texturas PBR de asfalto y concreto. UVs con escala física aproximada. No hay displacement ni subdivisión.
- Rejas, travesaños, carpinterías, jambas, profundidad de acceso, alféizares, estructura superior, techo parcial, tanque, juntas de baldosas y cordón curvo.
- Semáforo, poste, cables y copa del árbol visible como contexto limitado. La ubicación y masa vegetal siguen siendo aproximadas.
- Luz exterior fría, interior cálido contenido y acento sobre el panel del cartel. Las luces de producción describen una puesta fotográfica, no nuevas instalaciones reales.
- Interior limitado al piso y planos de cierre. No se inventó inventario, decoración ni un showroom. Se excluyeron las dos masas interiores del blockout porque no representan objetos documentados.
- No se recreó el logo ni lettering comercial; panel negro pendiente de asset original. La puerta permanece como pieza provisional separada, sin bisagra o mecanismo supuesto.

## Materiales: orden de la lámina F

Arriba, de izquierda a derecha: pintura gris, zócalo carbón, pintura negra de la ochava, metal pintado.

Abajo, de izquierda a derecha: vidrio, concreto de vereda, asfalto, pintura amarilla del cordón.

El gris aparente cambia con la luz. No se presentan colores HEX oficiales ni códigos de pintura confirmados.

## Peso y compatibilidad

Datos exactos en `validation.json`:

- 59.699 triángulos evaluados; 360 objetos de malla visibles. La copa concentra una parte importante de la geometría.
- 22 materiales usados; 10 mapas utilizados de 1K y 2K.
- Texturas utilizadas: **12,99 MB** en disco antes de compresión específica para web.
- Memoria de texturas estimada: **106,3 MB** con RGBA8 y mipmaps. Es una estimación conservadora, no una medición de GPU.
- Geometría estimada: **2,73 MB** de buffers, suponiendo 32 bytes por vértice e índices de 32 bits. No equivale a un GLB real ni incluye todos los canales posibles.
- Todas las mallas verificadas con escala 1. Sin colisiones de la línea central de cámara. Esta comprobación no certifica dimensiones reales ni holgura de una puerta todavía desconocida.

El recuento actual sirve para producción y sigue pendiente de agrupar mallas estáticas y reducir materiales/draw calls. Antes de web harán falta empaquetado ORM, compresión de texturas y ajuste de vegetación según dispositivo. **No se hizo optimización web ni se midieron FPS de navegador.**

Los materiales tienen una estructura compatible con exportación PBR. Todavía no se verificó un round trip glTF. El vidrio necesitará validar soporte de transmisión. Las luces de área, el cielo y los rebotes de Cycles **no se trasladan automáticamente**: deberán hornearse o reproducirse con un entorno y luces apropiados en una fase posterior.

## Referencias necesarias para cerrar producción

1. **Logo original** en SVG, PDF vectorial o PNG transparente de buena resolución. Además, foto frontal del cartel de la ochava y de las franjas de texto de los ventanales, sin reflejos fuertes, para reproducir composición y proporciones reales. No alcanza con elegir una tipografía parecida.
2. **Interior inmediato:** desde el umbral, teléfono a unos 1,60 m, cámara 1× horizontal: una foto al frente, otra hacia el portón y otra hacia Chacabuco. Deben incluir piso, techo y los primeros 3–5 m. Sirven para reemplazar los planos esquemáticos sin modelar todo el local.
3. **Acceso y puerta:** foto frontal completamente cerrada y abierta, detalles de jambas superior/inferior y un video corto del movimiento completo. La animación sigue pendiente.
4. **Medidas mínimas:** ancho libre y alto libre del acceso; ancho total de la ochava. Si es posible, longitud de ambos frentes, altura de fachada y ancho de vereda. Permiten calibrar la reconstrucción fotográfica.
5. **Superficies cercanas:** fotos a 0,5–1 m de pared gris, zócalo, plano negro, carpintería y baldosa, de frente y con luz difusa. Una vista algo más alejada debe mostrar en qué sector se tomó cada detalle.
6. **Estructura superior y encuentro de cubierta:** una foto desde cada frente, a 8–12 m si puede hacerse con seguridad, sin gran angular extremo; que incluya borde de techo, diagonales y tanque. No hace falta subir al techo ni entrar a la calzada.

## Riesgos pendientes

- Proporciones reconstruidas desde fotografías; no son un relevamiento medido.
- Cartelería ausente: impide evaluar por completo el reconocimiento de marca.
- Interior sin referencias suficientes: todavía se lee demasiado vacío en los diagnósticos cercanos.
- Acabado actual todavía más limpio y regular que el real. Debe ajustarse con los detalles de superficie solicitados, sin inventar deterioros específicos.
- Contexto y vegetación simplificados. No representan un levantamiento urbano exacto.
- Render de Cycles no garantiza el mismo resultado en tiempo real. Falta aprobar la imagen antes de resolver esa transferencia.

## Fuentes de textura

Texturas descargadas sin modificar del API público de Poly Haven; licencia [CC0](https://polyhaven.com/license). Fuentes y tamaños en `textures/sources.json`; los tres albedos derivados se documentan en `textures/baked-paint.json`.

- [Painted Plaster Wall](https://polyhaven.com/a/painted_plaster_wall): microrelieve y variación tenue de albedo, sin adoptar su color original.
- [Asphalt 02](https://polyhaven.com/a/asphalt_02): calle.
- [Concrete Floor Worn 001](https://polyhaven.com/a/concrete_floor_worn_001): microrelieve de concreto y piso provisional.

Las fotografías del dueño permanecen sin modificaciones. No se usaron renders generados como referencia arquitectónica.

## Próximo control

Revisar exterior, contraste de luz y materiales como una primera pasada. Completar las referencias pendientes antes de cerrar cartelería, puerta e interior. La aprobación para web sigue pendiente; esta entrega no autoriza Three.js, GSAP, WordPress o cambios de UI.

