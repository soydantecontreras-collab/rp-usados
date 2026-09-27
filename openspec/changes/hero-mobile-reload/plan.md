# Hero V2: presentación determinista tras recargar

## Requisito y alcance
Corregir el bloqueo intermitente en poster cuando el video mobile está disponible. Mantener fuente, encuadre, FPS, calidad, scroll y transición aprobados. No tocar PHP/backend, CSS, Blender ni medios. No deploy.

## Investigación y diseño
Trazar selección responsive → carga → readyState/eventos → seek → frame presentado → puerta de revelado, incluyendo restauración de scroll y suspensión. Instrumentación temporal en memoria, sin introducir esperas/reintentos que alteren el comportamiento. Guardar una traza fallida antes de elegir el cambio mínimo.

## Criterios de aceptación
- Regresión dirigida reproduce la causa original y pasa tras corregirla.
- Lotes consecutivos en 375/390/430, frío/caliente, arriba/mitad, avance/retroceso.
- Reduced motion se verifica por separado sin descargar video.
- Visibility/pageshow, error y restricción de autoplay no dejan un bloqueo interno.
- Sin temporizadores arbitrarios, reproducción automática ni logs temporales en producto.
- Build, documentación y hash de archivos visuales/medios sin cambios.

## Tareas
- [x] Capturar causa y orden real de eventos.
- [x] Corregir únicamente el controlador afectado y su reanudación visible.
- [x] Retirar instrumentación de producto.
- [x] Ejecutar lotes y documentar resultados/limitaciones reales.

## Diseño final y verificación
La traza confirma `loadeddata → primer seek → callback frame 0 → seeked readyState 4`, sin callback del objetivo. Se serializó primera presentación/primer seek y se registró el próximo callback antes de enviar otro objetivo. Al volver visible se crea el controlador omitido durante inicio oculto; al reanudar se revisa el frame ya confirmado.

Sólo dos módulos productivos: `seek-controller.js` (integración con media/compositor) y `main.js` (lifecycle). Sin timers, play(), cambios PHP/CSS/medios ni dependencias.

20 aserciones de orden; la regresión central falla con la versión anterior. 300 recargas, 100 por ancho, 0 bloqueos. 22 verificaciones lifecycle y 180 comprobaciones de regresión productiva correctas. 60 respuestas MP4 acreditadas desde caché en fixture local. Instrumentación temporal retirada; informe `HERO_RELOAD_FIX.md`. Safari físico no disponible; visibility inyectada, BFCache real confirmado. Sin deploy.
