# V2 A — integración del render mobile aprobado

Implementada localmente el 27 de septiembre de 2026. Pendiente de revisión del usuario y prueba en Safari/iPhone real. Sin deploy ni cambios de backend, catálogo, Blender o assets desktop.

## Preview

http://127.0.0.1:9420/hero-v2/transition/

La misma URL sirve desktop y mobile. Para revisar en esta computadora, usar viewport de 375, 390 o 430 px. `127.0.0.1` en un teléfono apunta al propio teléfono: esta URL no implica acceso desde otro dispositivo.

## Fuente y codificación

Fuente encontrada: `C:/Users/dante.DESKTOP/Downloads/render/RP_hero_mobile_0001-0144.mp4`. Copia idéntica conservada en `blender/prerender-v2/mobile-source/RP_hero_mobile_0001-0144.mp4`.

- SHA256: `167b2c0825a93fe3a5013837182f74a5416e145f88201d0567e52983874621f5`.
- 720 × 1280, 48 fps, 144 frames, 3 segundos, H.264 High, YUV 4:2:0 de 8 bits, BT.709 limitado, sin audio.
- 1.397.480 bytes; bitrate total aproximado de 3,73 Mbps.
- El blend mobile asociado configura 720 × 1280 al 100 %, 48 fps y frames 1–144. Sólo se inspeccionó; no se renderizó ni guardó.
- No se encontró secuencia PNG/EXR en la carpeta de salida ni en el repositorio. La fuente disponible ya está comprimida; la transcodificación no recupera detalle perdido.

Ambos candidatos conservan resolución, velocidad, encuadre y color del video aprobado: libx264, preset slow, High, yuv420p, GOP 4, sin B-frames, sin audio y faststart. No se horneó curva, puente ni una nueva corrección visual.

| Candidato | Bytes | MB decimales | Bitrate total | SSIM frente a la fuente |
|---|---:|---:|---:|---:|
| **CRF 18 elegido** | 2.378.680 | 2,38 | 6,34 Mbps | 0,994331 |
| CRF 20 comparativo | 1.915.616 | 1,92 | 5,11 Mbps | 0,992910 |

CRF 18 conserva mejor la imagen por 463 KB adicionales. Ambos tuvieron seeking equivalente en la prueba local; se prioriza calidad de puertas, luces y gradientes. El aumento frente a la fuente responde a keyframes cada cuatro frames y ausencia de B-frames para facilitar acceso aleatorio, no a mayor resolución.

El poster dedicado se extrae del primer frame del MP4 final y pesa 581.521 bytes (0,58 MB). La conversión YUV → RGB usa matriz BT.709 y el PNG se etiqueta sRGB para coincidir con la presentación del video en Chromium. Sin filtro de exposición, gamma artística ni recorte. Diferencia media medida entre poster y primer frame: 1,22/255 por canal; no se detecta el salto global de luminosidad que producía la etiqueta de transferencia anterior.

Pipeline reproducible: `blender/prerender-v2/encode-mobile.py`. El reporte `mobile-encoding-report.json` registra el archivo original utilizado y los comandos/hash de ambos resultados; la copia archivada es idéntica y es la entrada del script para próximas ejecuciones.

## Integración

- Selección mobile: ancho inferior a 900 px o dispositivo táctil con puntero grueso y sin hover. Así una rotación mantiene el video vertical.
- HTML picture y preload con media queries sirven sólo el poster correspondiente. El video no tiene src inicial; el controlador asigna únicamente el MP4 seleccionado cuando corresponde cargarlo.
- Se conserva el controlador compartido de seeking: un destino pendiente y el más reciente, seguimiento del frame presentado mediante requestVideoFrameCallback. Sin autoplay y sin interceptar rueda/touch.
- Se conserva el progreso al rotar o cruzar el breakpoint de layout. El perfil puede cambiar en un resize real de desktop; sólo entonces se solicita la otra fuente.
- Mobile muestra el frame completo con object-fit contain. Las proporciones distintas del viewport se resuelven con negro; landscape conserva el video vertical sin cortar la composición.
- Header oscuro de 60 px, controles existentes. La secuencia sigue siendo video → negro → puente HTML/CSS → curva sutil de 66 px → catálogo.
- El video mobile ya contiene el final negro aprobado; no se añade una nueva caída de exposición. Fondo y puente mobile usan negro RGB 0/0/0. El último frame medido tiene media inferior a 0,001 y máximo 4/255.
- Reduced motion, ahorro de datos, ausencia de JavaScript o fallo de media conservan el poster mobile y acceso al catálogo. No descargan MP4 en reduced motion/sin JS. Un fallo de descarga pasa a estado estático sin bucle de reintentos.
- Desktop conserva el mismo MP4 y poster, header, curva, progreso y tratamiento visual de V2 A.

## Métricas

Medidas en Edge/Chromium 154 en esta computadora, mediante viewport/touch emulado y servidor localhost. No son mediciones de GPU/decodificador de un teléfono ni tiempos de una red móvil. Caché fría se fuerza con CDP; caliente mediante recarga.

| Medida | Desktop 1440 × 900 | Mobile 390 × 844 emulado |
|---|---:|---:|
| Video | 1600 × 900 / 48 fps | 720 × 1280 / 48 fps |
| Duración | 3 s | 3 s |
| MP4 | 4,78 MB | 2,38 MB |
| Bitrate total aproximado | 12,74 Mbps | 6,34 Mbps |
| Preparación hasta primer frame, caché fría | 175 ms | 22 ms |
| Preparación, caché caliente | 48 ms | 25 ms |
| Navegación hasta comprobación de listo | 260 ms | 122 ms |
| Frames presentados/s, avance en 3 s | 46,7 | 46,3 |
| Frames presentados/s, retroceso en 3 s | 46,3 | 46,3 |
| Seek p95, avance / retroceso | 2,5 / 3,1 ms | 2,7 / 2,7 ms |
| Desfase p95 respecto del destino | 20,8 ms | 20,8 ms |

Mobile 375 y 430 px: preparación fría de 33 y 45 ms; caliente de 31 y 25 ms. La primera navegación desktop también incluye calentamiento de navegador/proceso: no tomar estas cifras como una comparación controlada de hardware.

En barridos rápidos de 500 ms, mobile resuelve el último destino sin acumular seeks obsoletos: p95 de seek 2,5 ms, desfase p95 de 41,7 ms. Se omiten frames intermedios al recorrer tres segundos en medio segundo, como corresponde. La frecuencia RAF del monitor no representa los FPS del video.

CRF 20: 46,3 frames presentados/s en ambas direcciones, p95 2,4 ms adelante y 2,8 ms atrás; no mostró una ventaja significativa sobre CRF 18. Heap JS observado de unos 3,2 MB en ambos perfiles, **sin incluir buffers de video, decoder, GPU ni memoria total del navegador**.

Frente a poster-only: ahora mobile tiene aproximación/apertura reversibles y encuadre dedicado, a cambio de 2,38 MB de video más su poster y trabajo de decodificación. Poster-only sigue siendo el fallback seguro.

## QA y evidencia

60 comprobaciones en `explorations/hero-v2/qa/mobile-integration/report.json`, más 8 de teclado/ciclo de vida en `qa/transition/lifecycle.json` y 31 regresiones de transición/fallback en `qa/transition/report.json`: 99 comprobaciones aprobadas.

- 375, 390 y 430 px; portrait y rotación a 932 × 430; retorno a portrait.
- Avance lento, normal y rápido; retroceso, inversión brusca y regreso arriba.
- Recarga a mitad del recorrido: recupera el progreso y la fuente correcta.
- Sólo MP4/poster elegidos en carga inicial; rotación táctil no solicita desktop.
- Poster/video coincidentes; final negro continuo con el puente; curva sutil.
- Botón Ver vehículos, foco de teclado, diálogo WhatsApp y retorno de foco; zoom CSS 200 %.
- Reduced motion, video bloqueado y JavaScript deshabilitado; catálogo accesible.
- Sin errores JS ni overflow horizontal en los casos probados.
- Sin solicitudes a Three.js, GLB, HDR o recursos V1.
- Build Vite independiente correcto. No se recompiló ni modificó el tema productivo.

Capturas: `explorations/hero-v2/qa/mobile-integration/390-initial.png`, `390-middle.png`, `390-end.png`, `390-landscape.png`, `390-catalog.png` y `1440-initial.png`.

## Archivos de esta iteración

- `explorations/hero-v2/transition/main.js`: selección de fuente, fallbacks y preservación de progreso al cambiar layout.
- `explorations/hero-v2/transition/responsive-media.js`: reglas compartidas de selección.
- `explorations/hero-v2/transition/style.css`: frame vertical completo, negro y curva mobile.
- `explorations/hero-v2/transition/create-pages.py`, `index.html` y `pronounced/index.html`: picture, preload y atributos de media. La ruta histórica pronounced conserva su variante desktop; mobile usa siempre curva sutil.
- `explorations/hero-v2/transition/qa-mobile.mjs`; ajuste del caso estático mobile en `qa.mjs`.
- `explorations/hero-v2/public/hero-v2/media/hero-mobile-portrait-crf18.mp4` y poster; CRF 20 y poster sólo como comparación, sin descarga en la preview normal.
- `blender/prerender-v2/encode-mobile.py`, `mobile-encoding-report.json` y copia intacta en `mobile-source/`.
- Este documento, referencia desde `HERO_V2_TRANSITION.md` y checklist OpenSpec.

## Pendientes

1. Validar Safari/iPhone real: este entorno no tiene runtime WebKit ni dispositivo físico. Falta comprobar restricciones de media y seeking bajo su decoder.
2. Medir sobre red móvil real y teléfono modesto; los resultados localhost no justifican afirmar rendimiento universal.
3. Revisión del usuario antes de cerrar desktop + mobile. No se alterará el render aprobado para resolver diferencias visuales sin consultarlo.

No quedan fallos reproducidos en el conjunto de pruebas ejecutado. No hubo rerender, cambios de cámara, animación, geometría, iluminación, puertas, backend, integración Three.js ni deploy.
