# RP Usados — prueba independiente de prerender V2

## Alcance

V2 reproduce el archivo aprobado `C:/Users/dante.DESKTOP/Downloads/RP_Usados_Hero_v6_1.blend` mediante Cycles. No modifica la escena original, backend, tema productivo ni V1. La interfaz reutiliza `explorations/stage-1/style.css`, fuentes Manrope/Archivo, icono WhatsApp y el catálogo explícito de muestra de Iteración 02. No hay stock ficticio nuevo, precios ni filtros. Las cards completas enlazan a la ficha de estudio existente; no se migró la ficha productiva.

## Preview y reproducción

- A, seeking: http://127.0.0.1:9420/hero-v2/
- B, compacta: http://127.0.0.1:9420/hero-v2/compact/
- Candidato reducido: http://127.0.0.1:9420/hero-v2/mobile-study/

Desde la raíz del repositorio:

```powershell
node theme/rp-usados/node_modules/vite/bin/vite.js --config explorations/hero-v2/vite.config.mjs
node theme/rp-usados/node_modules/vite/bin/vite.js build --config explorations/hero-v2/vite.config.mjs
node explorations/hero-v2/qa.mjs
```

Vite y GSAP son dependencias existentes. FFmpeg es una herramienta local de producción, extraída del wheel `imageio-ffmpeg` 0.6.0 bajo `tools/.preview/ffmpeg`; no se agregó una dependencia al frontend. El build aislado no sustituye el build WordPress ni produce un ZIP instalable del tema.

## Pipeline visual

`blender/prerender-v2/render.py` se ejecuta en un proceso Blender separado, sin guardar el `.blend`. Conserva cámara, puerta, geometría, materiales, luces, AgX/Medium High Contrast y exposición +0,9. Renderiza 1600×900 con 64 muestras y denoising. Muestrea el mismo intervalo aprobado de frames 1–72 en 144 imágenes a 48 fps, sin prolongarlo: 3 segundos.

Los PNG intermedios son archivos offline para codificación y NO una secuencia descargada por el navegador. `encode.py` genera MP4 H.264/yuv420p, sin audio, con `moov` antes de `mdat`. El color de salida de Blender se mantiene en SDR, matriz YUV BT.709 y transferencia sRGB etiquetada. No hay nueva exposición, LUT o iluminación web.

- A: GOP 4, CRF 18, sin B-frames.
- B: GOP 48, CRF 20, hasta 2 B-frames.
- Reducida: 960×540, GOP 4, CRF 20.

Cada poster PNG se decodifica de su propio MP4: mismo primer frame, composición y pipeline. El navegador comprueba la diferencia entre ese PNG y su video decodificado; pequeñas diferencias de redondeo YUV/RGB no equivalen a un cambio de iluminación.

## Scroll, transición y fallback

Un progreso 0–1 de ScrollTrigger determina el frame solicitado y el blend de la transición. Scroll nativo, sin autoplay, rueda interceptada ni snaps. Se solicita el centro inicial del intervalo de cada frame para evitar redondear hacia el frame anterior. Una sola búsqueda puede estar en curso; mientras termina, sólo se conserva el destino más reciente.

`requestVideoFrameCallback` verifica presentación. `seeked` se mide por separado y no se interpreta como presentación inmediata. En navegadores sin esa API se usa `seeked` más una oportunidad de pintado; esa ruta tiene menor capacidad de verificación y se documenta como limitación.

La UI aparece durante el último 16% del progreso. El video se retira entre 82–94% sobre la superficie oscura, mientras la sección de catálogo entra con el scroll y gana opacidad hasta 100%. El caption se retira entre 76–84% para evitar texto superpuesto a las cards. Todas las curvas derivan del mismo progreso. “Ver vehículos” salta directamente al catálogo y coloca allí el foco. No depende de que termine la carga.

Rutas estables sin query selector. La restauración de scroll se sincroniza con `pageshow` y un frame del navegador. Ante fallo de video se conserva el poster del nuevo hero. Con JavaScript ausente o fallido, la composición base muestra el hero estático y catálogo normal. Reduced motion y mobile normal usan poster; el video móvil reducido sólo se activa en la ruta de evaluación. Al ocultar o abandonar el hero no se lanzan nuevas búsquedas.

## Evidencia y métricas

La evidencia definitiva se guarda en:

- `blender/prerender-v2/render-report.json`: fuente, hash, ajustes y tiempo de render.
- `blender/prerender-v2/encoding-report.json`: pesos, comandos, SSIM y orden de átomos MP4.
- `explorations/hero-v2/qa/report.json`: latencias, frames presentados, avance/retroceso, reload y comprobaciones.
- `explorations/hero-v2/qa/`: capturas desktop, transición, catálogo y mobile.

Las mediciones de red local con caché desactivada NO representan una conexión de Internet. El FPS de requestAnimationFrame NO es el FPS de frames nuevos del video. El heap JS NO es memoria total del decodificador/GPU. Safari/iPhone físico requiere un dispositivo real: emular touch en Chromium no lo valida.

## Pendientes de producción

Esta entrega es una prueba de dirección. Logo vectorial original y número de WhatsApp confirmado siguen pendientes; se conserva el comportamiento de muestra aprobado. No se migra Home, administración, ficha o contenido institucional. El recorte mobile y la estabilidad temporal del denoising deben revisarse visualmente antes de producción. La validación de Safari/iPhone queda limitada por el entorno disponible.

## Resultados medidos — 26/09/2026

Edge/Chromium 154 en Windows, viewport desktop 1440×900; el candidato móvil se midió con viewport/touch emulados a 390×844, sobre la misma computadora. El equipo permite callbacks de pantalla cercanos a 144 Hz; eso NO significa que el video tenga 144 fps. El contenido tiene 48 fps.

| Medida | A · Seeking | B · Compacta | Candidato reducido |
|---|---:|---:|---:|
| Video | 5,62 MB | 2,46 MB | 1,80 MB |
| Poster PNG | 1,11 MB | 1,08 MB | 0,47 MB |
| Resolución | 1600×900 | 1600×900 | 960×540 |
| Preparación local, caché desactivada | 126 ms | 45 ms | 31 ms |
| Preparación al recargar con caché habilitada y previamente poblada | 52 ms | 61 ms | 27 ms |
| Seek p95, avance | 2,7 ms | 30,2 ms | 2,5 ms |
| Seek p95, retroceso | 2,4 ms | 29,4 ms | 2,3 ms |
| Frames presentados en 3 s, avance / retroceso | 141 / 141 | 126 / 126 | 141 / 141 |
| Desfase temporal p95 al retroceder | 20,8 ms | 62,5 ms | 20,8 ms |
| SSIM contra fuente, después de convertir a YUV | 0,9858 | 0,9800 | 0,9819, contra fuente reducida |

Preparación: desde creación del controlador hasta presentación correcta y restauración de scroll. No incluye todo el tiempo de navegación. HTTP servido por Vite local; estas cifras no son una predicción de hosting público. `seeked` y presentación se registraron por separado. A y B se compararon con el mismo controlador y fuente, con distinta compresión/GOP.

**Recomendación:** A para evaluar la ruta visual definitiva. B reduce 56% el tamaño del video, pero su retroceso presenta menos frames y mayor retraso. No conviene cambiar a B sólo por el ahorro.

Prueba adicional con 10 Mbps de descarga y 50 ms de latencia simulados: primer frame listo a **2.191 ms desde navegación**, preparación del controlador **1.342 ms**. En ese instante había 0,418 s de video buffered. Un salto inmediato al 70% del recorrido se presentó en **214 ms**, mediante búsqueda/rango; el acceso al catálogo siguió operativo. Una red peor puede dejar momentáneamente el último frame mientras llega el solicitado. No se insertan esperas obligatorias ni se oculta ese coste mediante temporizadores.

JS del build V2: **121,56 KB / 47,94 KB gzip**, incluidos GSAP/ScrollTrigger y controlador. CSS **24,19 KB / 5,90 KB gzip**. Fuentes **59,77 KB** entre ambas. No contiene Three.js, GLB ni HDR. No se descargan los tres videos: cada ruta solicita su candidato; mobile normal, reduced motion y sin JS no solicitan ninguno.

Heap JS observado al preparar: **aproximadamente 3,1 MB**. Esto excluye memoria nativa del decoder/GPU. Un frame YUV420 de 1600×900 ocupa unos **2,16 MB** sin comprimir; uno RGBA, **5,76 MB**. Una hipótesis de 4–8 superficies YUV serían **8,6–17,3 MB**, más buffers de presentación, poster y archivo. No existe una medición directa de esa memoria en este entorno; no se presenta esta estimación como consumo real total.

El poster se extrajo del primer frame de cada MP4. Comparando el video decodificado por Chromium con ese PNG en canvas, la diferencia media por canal fue **1,18/255** en desktop y **1,22/255** en el reducido. Hay diferencias locales de conversión/interpolación de crominancia (máximos 38/43/31), principalmente en bordes: no se afirma igualdad pixel a pixel entre decodificadores. La inspección visual no mostró el cambio global de luz/exposición de V1.

### Verificación

- **34 comprobaciones** del recorrido, posiciones, avance/reverso, reload, resize, visibilidad simulada, salto y foco, fallbacks, ausencia de V1 y errores JS: aprobadas.
- **11 comprobaciones adicionales** de teclado, link completo de card, fuentes, diálogo WhatsApp, zoom CSS 200%, reduced motion en vivo, rueda real de Playwright, fallo de JS y red limitada: aprobadas.
- Capturas revisadas: primer frame, mitad, transición, catálogo y candidato móvil. Header discreto, escena protagonista, tipografía/paleta aprobadas, cards sin precios/filtros y CTA legible comprobados.
- Build aislado de Vite: aprobado. No se alteraron PHP ni CPT; no corresponde reactivar WordPress, cambiar permalinks o generar un ZIP de tema para esta exploración.
- `moov` precede a `mdat` en los tres MP4. Sin pista de audio. Videos permanecen pausados y se controlan por búsqueda.
- Fuente SHA-256 antes/después: `8b7d0887934afafeb0380e37f1358be2a7ef4c637bddc99efd0de995d0d52e9b`.
- Blender interactivo permaneció en Scene, frame 1, sin cambios pendientes. Render en proceso separado: 984 s aproximadamente.
- WebKit de Playwright no está instalado; no hay iPhone físico. **Safari/iPhone no validado.** Mobile público de esta preview conserva poster; la ruta reducida es sólo evaluación.

### Límites para la decisión

1. Aprobar personalmente encuadre, calidad comprimida y ritmo de la transición; el blend sigue siendo provisional.
2. Revisar el video reducido en hardware móvil real antes de habilitarlo como experiencia principal.
3. Revisar temporalmente ruido/denoising y aliasing de rejas/cables antes del render final. No se añadieron materiales ni detalle.
4. El poster lossless ronda 1,1 MB; una futura optimización debe mantener el mismo pipeline y volver a medir su handoff.
5. El catálogo es la composición de muestras de Iteración 02, no un inventario migrado. Logo/número de contacto siguen pendientes.
