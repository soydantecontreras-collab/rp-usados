# V2 A — Iteración de header, oscuridad y transición

Actualización 27/09/2026: el usuario aprobó desktop V2 A y curva sutil. Mobile ahora integra el render vertical aprobado; consultar [HERO_V2_MOBILE.md](HERO_V2_MOBILE.md) para estado, métricas y QA vigentes. Las referencias a mobile poster-only y curva pendiente en este documento describen la iteración anterior.

Estado: implementada como exploración local, pendiente de aprobación visual. Sin deploy.

## Revisar

- Curva sutil: http://127.0.0.1:9420/hero-v2/transition/
- Curva marcada: http://127.0.0.1:9420/hero-v2/transition/pronounced/
- V2 A anterior conservada: http://127.0.0.1:9420/hero-v2/

Las dos variantes nuevas comparten todo salvo la altura de la curva: 96 / 184 px en desktop, 66 / 112 px en mobile. La sutil es la recomendación preliminar: enlaza las superficies con menos recorrido adicional.

## Criterio visual y alcance

Un cierre publicitario sobrio: fachada reconocible → acceso oscuro → superficie negra → curva → catálogo de Iteración 02. El edificio sigue siendo protagonista. Manrope + Archivo y las tarjetas permanecen intactas.

Header negro de 64 px en desktop y 60 px en mobile; navegación y WhatsApp pertenecen a la misma superficie. El recurso SVG simplifica exclusivamente el contorno del vehículo de la referencia recibida el 26/09. No es un nuevo logo. El nombre de la empresa se presenta como texto de interfaz. No se copiaron la placa, las redes, el teléfono ni sus afirmaciones comerciales. La acción de WhatsApp conserva el aviso de número pendiente de la exploración anterior.

El catálogo mantiene su composición y contenido de muestra. Sólo cambia su arranque: desaparece la superposición de paneles y el borde horizontal anterior; se incorpora una curva en el flujo del documento y espacio antes del encabezado. El puente oscuro mide entre 64 y 100 px en desktop, 40 px en mobile. No hay pausa temporal obligatoria: puede recorrerse rápidamente o saltarse con Ver vehículos.

## Video

Fuente: los 144 frames Cycles originales de V2 A. No se cambió la trayectoria, el timing de las puertas, la resolución ni la duración de 3 s / 48 fps.

Se calculó una máscara auxiliar en una instancia de Blender en segundo plano, leyendo la cámara y la geometría del acceso del archivo aprobado. Workbench se utilizó únicamente para esa máscara de oclusión; no reemplaza el render visible. La máscara cubre el interior y respeta las hojas del acceso. Se compone offline sobre el video y se añade un fundido final entre 2,55 y 2,90 s. Así el interior tampoco puede aparecer durante un seek atrasado o inverso. El cierre HTML también oculta el poster cuando se recarga en el final del recorrido.

La escena original y la instancia interactiva de Blender no se modificaron. SHA256 del archivo fuente conservado:

`8b7d0887934afafeb0380e37f1358be2a7ef4c637bddc99efd0de995d0d52e9b`

MP4 corregido de puertas: **4.779.248 bytes / 4,78 MB**, H.264, GOP 4, CRF 18, sin B-frames ni audio, faststart. Poster extraído del primer frame del bitstream nuevo. Ambos usan el mismo crop en CSS. Los assets originales A/B y la primera versión oscura permanecen disponibles como referencia.

Comprobación del color exterior contra el poster A: diferencia media por canal de aproximadamente 0,9–1,4 sobre 255 en cielo/fachada, atribuible a recompresión; no se aplicó una nueva gradación de color. Comparación poster/video en Chromium: diferencia media 1,18 sobre 255. La lectura central del interior oculto es RGB 8/8/8.

## Implementación

- `explorations/hero-v2/transition/`: HTML de ambas variantes, estilos acotados, recurso SVG y controlador de esta iteración.
- Comparte `explorations/hero-v2/seek-controller.js` sin cambios: un seek pendiente y el último destino, presentación observada con requestVideoFrameCallback.
- `blender/prerender-v2/transition-mask.py` y `encode-transition.py`: pipeline reproducible sin guardar el blend fuente. Las máscaras offline no se descargan en la web.
- `explorations/hero-v2/vite.config.mjs`: incorpora las dos entradas nuevas al build aislado.
- No se modificaron el tema PHP, backend, CPT, precios, ficha, Stage 1, V1 ni las rutas anteriores de V2.

## Verificación

Build Vite de producción correcto. 31 comprobaciones de las dos variantes y fallbacks, más 8 de ciclo de vida y accesibilidad, en Chromium/Edge 154. Evidencia en `explorations/hero-v2/qa/transition/`.

- Primer frame, color exterior, alineación de oscuridad en el acceso y cierre negro revisados en capturas.
- Ambas curvas y el espacio del encabezado del catálogo revisados a 1440 × 900.
- Mobile a 390 × 844, fallback estático sin descargar MP4; controles del header accesibles.
- Avance, retroceso, reversión rápida y resize mantienen sincronía.
- Recarga en el final: permanece negro, no reaparece el hero anterior.
- Ver vehículos funciona con teclado; foco en catálogo; cierre de diálogo devuelve foco.
- Zoom CSS al 200 %, movimiento reducido y JavaScript deshabilitado: contenido accesible, sin desbordamiento horizontal.
- Fallo forzado de video: poster y navegación siguen funcionando.
- Ninguna solicitud a Three.js, GLB o HDR en estas rutas.

Comandos:

```powershell
node theme/rp-usados/node_modules/vite/bin/vite.js build --config explorations/hero-v2/vite.config.mjs
node explorations/hero-v2/transition/qa.mjs
node explorations/hero-v2/transition/qa-lifecycle.mjs
```

Limitaciones: no hay validación en un iPhone/Safari real en este entorno. El catálogo sigue siendo la muestra aprobada, sin stock ficticio ni conexión nueva al backend. La máscara es un tratamiento de video para esta evaluación; no pretende ser una nueva solución de iluminación de la escena Blender. La adopción del header, la silueta y la variante de curva queda pendiente de aprobación.

## Corrección puntual: puertas legibles sobre el interior oscuro

La primera máscara del vano estaba delante de las hojas cuando éstas giraban hacia adentro. Por esa razón también ocultaba sus superficies; no era una carencia de luz de la escena original.

Se agregó `blender/prerender-v2/door-preservation-mask.py`: una segunda pasada de cobertura de hojas opacas y marco, con las mismas poses/cámara y oclusiones arquitectónicas, sin el plano negro artificial. Se resta esa cobertura de la máscara del vano antes de componer. Los materiales de vidrio quedan excluidos de la recuperación para no volver a mostrar el showroom. Se restauran únicamente los píxeles originales de las piezas, incluidas las manijas y los barrotes: no se agregaron luces, halos ni nueva geometría visible.

La fuente `.blend`, el recorrido, la animación, el fundido 2,55–2,90 s, el header, las curvas, el catálogo y el controlador de scroll no cambiaron. La instancia interactiva de Blender ya contenía cambios sin guardar al comenzar esta corrección; no se guardó ni se modificó. La máscara se produjo en un proceso separado leyendo el archivo fuente aprobado.

El nuevo par `hero-fast-dark-doors.mp4` / `poster-fast-dark-doors.png` tiene nombres propios para evitar que una caché conserve el video defectuoso. Ambas previews estables apuntan a ese par.

Validación específica: `check-door-preservation.py` compara video anterior/corregido en seis momentos de apertura y acercamiento (frames 35, 50, 65, 80, 100 y 115). En superficies de puerta previamente tapadas, la lectura RGB media pasa de aproximadamente 8 a 38–87; el interior permanece cerca de 8. El último frame sigue negro. Evidencias numéricas en `blender/prerender-v2/door-visibility-check.json`. Capturas de navegador de la apertura, puerta abierta, manijas, marco y cierre revisadas en `explorations/hero-v2/qa/transition/`. Las 31 verificaciones de ambas previews y fallbacks volvieron a pasar; build de producción correcto.
