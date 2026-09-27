# Etapa 2A — recorte visible en el acceso

La observación del usuario es correcta: en la prueba de 4,75 s, el acceso libre deja ver el interior esquemático durante demasiado tiempo. Esta revisión **termina la presentación 3D visible en el frame 85**.

| | Ensayo de ritmo anterior | Recorte visible nuevo |
| --- | ---: | ---: |
| Video 3D presentado | 4,79 s | **3,54 s** |
| Último fotograma de la cámara | 20 cm adentro | **2,00 m afuera**, con el marco del acceso todavía visible |
| Trayectoria completa en Blender | 4,75 s hasta 20 cm adentro | **Se conserva sin alterar** en otra escena |

La distinción entre **video visible** y **trayectoria física** es deliberada. A los 3,5 s la cámara aún no cruzó la puerta, aunque el encuadre ya da sensación de estar mirando adentro. Los 1,25 s restantes del recorrido completo incluyen el cruce a los 4,5 s y el final 20 cm adentro. En una futura integración, la interfaz debería empezar a tomar el cuadro a partir del marco del acceso y cubrir esa continuación. **No se implementó esa transición ni se decidió su técnica.**

Esto evita mantener en pantalla los bloques del interior, pero el video aislado termina en un punto de entrega: no representa por sí solo un hero final. La apertura de la puerta sigue pendiente de fotos o video que documenten el mecanismo real. No se modificaron edificio, materiales, texturas, interior ni sitio web.

El [Blender v003](../RP_Usados_Blockout_2A_v003_handoff.blend) contiene la escena visible `RP_2A_VISIBLE_UNTIL_PORTAL_F85` y la trayectoria íntegra `RP_2A_PATH_A_4_75S_PROVISIONAL`. Los archivos v001 y v002 siguen separados. El [tablero de revisión](review/index.html) muestra el video recortado junto a la prueba completa y el último fotograma visible.

Para la fase web sigue pendiente una acción clara **«Ver vehículos»** que permita saltar la experiencia. No se implementó en esta etapa.
