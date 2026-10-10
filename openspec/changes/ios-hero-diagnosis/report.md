# Diagnóstico inicial Safari / iPhone — 07/10/2026

Nota de archivo (10/10/2026): se conserva este informe como evidencia histórica. Los ejecutables y copias locales temporales no forman parte del producto; los tres scripts de diagnóstico no trackeados se retiraron durante el cierre técnico. No se reabrió la investigación ni se aplicó un fix iOS.

## Resultado y alcance

No se aplicó ningún fix al tema ni se cambió diseño/media/backend. La preview principal conserva exactamente su HTML (SHA-256 comprobado). Se añadió solamente tooling de diagnóstico y una copia full-page independiente. El dueño confirma iOS 26 y fallo aparentemente desde la carga; no hay captura ni lecturas del dispositivo afectado.

Prueba pública independiente: https://vercel-testing-460b176-r2-9l9hirkjs-dante42.vercel.app/ios-debug/
Local: http://127.0.0.1:9498/ios-debug/
Deployment READY, target preview, sin reasignar el alias del dueño.

## A–C. Elementos, causa y grado de certeza

Confirmado en código: `.hero-stage` usa `100dvh - 60px` en mobile; `.hero-visual` usa `lvh` capturado menos header; `.hero-overlay` usa `svh` capturado menos header. Poster/video tienen cajas coincidentes, cover, posición 50% 0 y ninguna escala/traslación CSS adicional. El overscan no es un zoom extra independiente: el aumento es resultado de cover al llenar un canvas alto.

El recorte de foto/video es real y calculable. Es una combinación de relación de aspecto, lvh capturado, cover y clipping. No es exclusivo de iOS. No hay evidencia suficiente para afirmar que explica todo el problema del dueño, especialmente si también afecta tipografía, catálogo o ficha.

WebKit local 26.5: no overflow horizontal de la Home en perfiles SE 320/375, iPhone 13/14 390, Pro 393 y Pro Max 430. Header 60px, CTA dentro del viewport de referencia; todos los perfiles presentaron metadata 1080x1920 / 3s y estado inicial ready. El motor de Windows usa la ruta sin requestVideoFrameCallback; no tiene Safari UI, safe areas ni compositor iOS. En una captura inicial su video apareció negro pese al estado ready, por lo que no certifica fidelidad/composición de Safari real.

Meta correcto: width=device-width, initial-scale=1. No viewport-fit=cover. No se debe añadir automáticamente: amplía el área bajo el hardware y requiere revisar safe areas. El header no aplica env(safe-area-inset-top); el CTA del hero tampoco aplica safe-area-inset-bottom. Con viewport-fit auto Safari puede insetar el contenido; ausencia de padding no demuestra por sí misma el fallo. Lecturas env=0 de Windows NO son las del iPhone.

No text-size-adjust explícito. Chromium informa auto; WebKit local no muestra inflación respecto a tamaños computados esperados (título catálogo Home 34px; CTA 12px; line-height correspondiente). No justifica un hack global. No anchos 100vw/padding ni elementos visibles fuera del ancho de documento detectados en la Home local. Comprobación adicional de archivo y ficha Vento en WebKit a 375/390/430: overflow documental 0px, títulos dentro del ancho disponible; las diapositivas secundarias quedan dentro de la galería horizontal recortada, no generan overflow del documento. No equivale a validar todas las fichas ni el escalado físico de Safari.

## D–E. Dimensiones y recorte

430x932 es el perfil CSS de pantalla del dispositivo; NO su viewport web con barras. El descriptor Playwright iPhone 15 Pro Max usa viewport 430x739 y DPR3. No es una medición del iPhone del dueño. En este WebKit de escritorio todas las unidades vh/svh/dvh/lvh valen 739px porque no hay barras Safari: wrapper/stage 679px, canvas679px, overlay679px, CTA y661..711, inner/client/visual 430x739, offsets0, safe0. Cover renderiza 430x764.44: sin recorte lateral, 85.44px abajo dentro del canvas. La caja del video mide 430x679; el bitmap es otra medida.

Sensibilidad explícita (variables sólo de prueba, no datos Safari): pequeño739 / máximo898, ancho430, header60:

| Viewport dinámico | Stage | Canvas | Overlay | Imagen y | CTA y | Canvas oculto abajo |
|---|---:|---:|---:|---:|---:|---:|
|739|679|838|679|60|661|159|
|755 (+16)|695|838|679|60|661|143|
|811 (+72)|751|838|679|60|661|87|
|898|838|838|679|60|661|0|

Video y poster mantienen la misma caja/crop. Bitmap 471.375x838: recorte20.6875px por lado, 8.78% del ancho total. No recorte vertical dentro del canvas; sí recorte inferior temporal del wrapper. No deformación del aspect-ratio. Si el máximo fuese932, canvas872, bitmap490.5x872, recorte30.25px/lado (12.33% total), ocultos193px abajo al inicio. Este último es un cálculo, no medición física.

El script inicial captura svh/lvh una vez y sólo recaptura si cambia el ancho. Esa decisión conserva Android estable, pero también congela una eventual lectura inicial incorrecta en Safari. Su coherencia con visualViewport y safe areas debe medirse antes de sustituirla.

## F–G–I. Propuesta mínima, todavía no aplicada

No hay evidencia para quitar overscan globalmente ni instalar una rama por UA/modelo.

1. Capturar una sesión Safari26 con barras visibles/ocultas y escala. Si el svh capturado coloca CTA fuera del área visible real, limitar únicamente la referencia inicial del overlay a esa área útil medida y mantenerla estable. Android con lectura coherente conserva su referencia actual.
2. Si el lvh capturado es incompatible con el máximo observable, corregir esa captura/validación, manteniendo canvas anclado arriba. Si lvh es correcto y el recorte calculado coincide, se trata del trade-off de cover, no de una unidad rota: un ajuste de crop requerirá aprobación visual. No prometer simultáneamente cobertura completa, cero crop y relación 9:16 inalterada en cualquier proporción.
3. Safe area sólo si una medición/captura demuestra superposición. No añadir viewport-fit=cover ni restar píxeles del modelo. Text-size-adjust:100% sólo si se demuestra inflación de texto.

Cualquier diferencia futura debe activarse por geometría observada/capacidad (incluido soporte de presentación de video), nunca por iPhone 15 Pro Max/Safari user-agent. Riesgo: una captura corregida cambia crop/altura útil inicial; hay que contrastarla con Android físico aprobado. Estas propuestas no están implementadas.

## Hallazgo adicional reproducido en motor local

Durante scroll/anchor rápido tras reload, el controller de una ejecución (perfil14Pro) registró “El navegador no pudo buscar el frame solicitado.” El callback failure pasa body[data-mode] a static; el track pierde el tramo de scroll y el catálogo se desplaza (título y=-727.81). Ocurrió también en otros perfiles en ejecuciones anteriores, no es una rama por modelo.

Es un riesgo real del código de fallback, aunque no prueba un fallo Safari/iOS26 desde el primer frame. Propuesta separada: si falla media tras iniciar el recorrido, conservar la geometría documental y poster/acciones, en vez de colapsar el track durante scroll. Antes de tocarlo hay que validar el camino requestVideoFrameCallback de Safari real; el port Windows probado no dispone de él. No se aplicó esta corrección.

## H. Verificación sin el dispositivo aquí

Se puede validar layout, soporte CSS, dimensiones y código con WebKit local; no certificar barra Safari, Dynamic Island, gestos ni compositor iOS. Para esos comportamientos hace falta iPhone remoto o Safari Simulator en macOS/Xcode, no disponible en este host Windows. No se contrató servicio pago.

La ruta pública es Home completa: header -> hero -> puente -> curva -> catálogo y resto. Panel fijo plegable, no iframe ni scroll del hero dentro de panel. Registrar carga, primer gesto, barras ocultas, final y retroceso. Tocar “Descargar mediciones JSON” al terminar; no envía datos automáticamente. El panel es diagnóstico temporal fuera del tema.

Probes: UA, meta, inner/client/visualViewport/offset/scale, vh/svh/dvh/lvh, env top/bottom/left/right, DPR/orientación, boxes/header/media/poster/CTA/catálogo, intrinsic media/readyState, presentación, progreso y errores. Eventos resize, scroll, visualViewport resize/scroll, orientationchange, pageshow, media y ResizeObserver; historial limitado600 muestras. La comparación de cajas usa rects sin confundir tamaño CSS con bitmap renderizado.

Chromium referencia 375/390/430: imagen/CTA 0px de movimiento a +16/+72, sin overflow. Un resize desktop agranda todas las unidades a la vez y no emula barra Android: el canvas capturado al inicio queda corto72px si se cambia manualmente la altura sin establecer un máximo independiente. Esa observación NO invalida el Android físico aprobado. La sensibilidad WebKit con máximo independiente demuestra canvas estable, 0px de movimiento y cobertura al crecer.

Evidencia operativa: tools/.preview/ios-hero-qa/{webkit-report.json,chromium-report.json,public-check.json}, screenshots y deployment metadata. Faltan valores reales de iPhone/Safari26, captura de lo cortado y comparación con esa sesión. No se declara causa única confirmada ni QA físico aprobado.

## Referencias técnicas primarias

- Unidades small/large/dynamic: https://webkit.org/blog/12445/new-webkit-features-in-safari-15-4/
- viewport-fit y safe areas: https://webkit.org/blog/7929/designing-websites-for-iphone-x/
- Pantalla física de iPhone 15 Pro Max: https://support.apple.com/en-us/111828
- Safari 26: https://developer.apple.com/documentation/safari-release-notes/safari-26-release-notes

Estas referencias explican mecanismos; no prueban por sí mismas un bug específico en el teléfono afectado.
