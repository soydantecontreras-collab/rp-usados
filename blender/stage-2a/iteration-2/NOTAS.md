# RP Usados — Etapa 2A, segunda prueba de ritmo

**Actualización:** la [tercera prueba](../iteration-3/NOTAS.md) recorta la parte final visible del interior. Esta página describe la versión completa de 4,75 segundos conservada para comparar.

**Para aprobación.** La dirección inicial A fue aprobada. Esta revisión cambia sólo la cámara y su tiempo de ensayo en Blender. Las medidas siguen siendo aproximadas y la puerta real no está documentada.

## Archivos

- [Blender v002](../RP_Usados_Blockout_2A_v002_ritmo.blend), con escena nueva `RP_2A_PATH_A_4_75S_PROVISIONAL`. El [v001](../RP_Usados_Blockout_2A_v001.blend) sigue disponible sin sobrescribir.
- [Tablero de comparación y fotogramas](review/index.html).
- [Video nuevo](review/RP-2A-A-4_75s-20cm-PROVISIONAL.mp4) y [video anterior](../review/RP-2A-recorrido-PROVISIONAL.mp4).
- [Muestras exactas de cámara y resultados geométricos](path_4_75s.json).

## Lo que cambió

| | Ensayo anterior | Ensayo nuevo |
| --- | ---: | ---: |
| Tiempo diseñado | 12 s | **4,75 s** (115 fotogramas a 24 fps; MP4 de 4,79 s) |
| Cámara inicial | A, 34 mm | **La misma A, 34 mm y posición** |
| Inicio del movimiento | Progresivo, contemplativo | **Empieza en el primer fotograma**; ya avanzó unos 1,15 m a los 0,38 s |
| Cruce del plano de acceso | Aproximadamente 10,25 s | **4,50 s** |
| Profundidad final | 75 cm adentro | **20 cm adentro** |
| Detalle interior | Mínimo | El mismo; sin nuevos elementos |
| Puerta | Cerrada en escena base, omitida para ensayo | Igual: **sin animación de apertura** |

La duración baja aproximadamente un 60 %. La profundidad final baja unos 55 cm, o 73 %. **Estos segundos son un ensayo en Blender para representar la sensación de 4–5 segundos de scroll natural; no definen todavía una longitud de scroll, un autoplay ni el comportamiento web.**

## Desarrollo del recorrido

1. **0–1 s:** se reconoce la esquina en A y la aproximación comienza de inmediato. A 1 s, la cámara ya está unos 4 m más cerca.
2. **1–3,4 s:** avance directo, altura estable y focal fija. La trayectoria termina de alinearse con el acceso. Hacia 3,4 s la cámara queda a unos 2,4 m de la entrada.
3. **3,4–4,33 s:** desaceleración breve. El marcador de puerta en la línea de tiempo es solamente una **reserva narrativa**; no mueve ninguna puerta. Su coordinación real depende del mecanismo que aporte el dueño.
4. **4,33 s:** punto recomendado para que empiece la futura conversión visual del espacio en interfaz. La cámara está a unos 12 cm afuera. La transformación debería cubrir el cruce, con continuidad de geometría, luz y composición, sin corte o flash. **No hay interfaz ni transición implementadas en esta prueba.**
5. **4,50–4,75 s:** la cámara cruza el plano de acceso y termina sólo 20 cm adentro. La parte posterior del interior queda fuera del recorrido.

La futura web deberá incluir una acción clara **«Ver vehículos»** para ir directamente al catálogo, además de respetar movimiento reducido. Esta etapa sólo reserva ese requisito; no construye su control ni su destino.

## Lo que muestran y lo que no muestran los renders

El acceso se ve abierto desde el primer fotograma **únicamente en la escena de ensayo**. Esto expone el interior antes del cruce, porque aún desconocemos cómo se abre realmente. Por esa razón, el tramo final aislado es una validación de distancia y cámara, no de la estética final del umbral. La escena cerrada original permanece en el archivo.

Las fotos actuales del dueño siguen gobernando fachada y colores actuales. No se corrigieron medidas del local porque todavía no se entregaron medidas nuevas. Tampoco se añadieron materiales, texturas, autos, mobiliario ni infraestructura.

## Comprobaciones

- Archivo v002 guardado por separado y v001 preservado.
- Cámara A inicial, altura 1,78 m y focal 34 mm mantenidas; roll máximo imperceptible.
- 115 fotogramas de transformación horneada; máximo de desplazamiento en esta escala aproximada: 5,49 m/s.
- El centro de la cámara no cruza geometría en el ensayo con acceso libre. Eso no valida la luz real ni la futura hoja/guía de puerta.
- Primer y último frame, llegada y cruce renderizados para revisión.
- Tablero revisado a 1440 y 390 px: imágenes sin fallos ni desbordamiento. Ambos MP4 cargan; el nuevo se reprodujo de principio a fin en navegador.

## Para decidir

¿Se aprueban **4,75 s de ritmo de ensayo**, la desaceleración final y el cierre a **20 cm dentro**, conservando A? Si el avance central se siente demasiado rápido, se puede reducir la distancia inicial manteniendo la dirección A y volver a validar el encuadre. La apertura y la transición real quedarán pendientes de referencias y autorización de la etapa siguiente.
