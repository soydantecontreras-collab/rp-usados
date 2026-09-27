# Hero V2 — corrección de recarga mobile

27/09/2026. Integración local: http://127.0.0.1:9400/ . Sin deploy.

## Causa reproducida
El primer seek restaurado se enviaba desde `loadeddata`, antes de recibir la primera notificación del compositor. En la traza fallida, con caché vacía y CPU ralentizada 4×, ocurrió:

| Tiempo desde navegación | Evento / estado |
|---|---|
| 1374 ms | Controlador creado; source mobile seleccionado; progreso restaurado ≈0,56 |
| 1447 ms | `loadedmetadata`, readyState 1 |
| 1459 ms | `loadeddata`, readyState 4; envío inmediato del seek a 1,667 s |
| 1460 ms | Primer `requestVideoFrameCallback`: todavía frame 0, mientras el seek estaba en curso |
| 1466 ms | `pageshow`; restauración de página confirmada |
| 1475 ms | `seeked` + `canplay`, readyState 4, seeking false, currentTime correcto |
| 8 s después | Sin callback del frame solicitado; `busy=true`, `decoded=true`, poster visible |

Fuente: `artifacts/hero-reload/failure-trace.json`, fallo en la recarga 11 del lote instrumentado con estrés. No fue un MP4 ausente, error de descarga, source desktop incorrecto, rechazo de autoplay ni progreso perdido. El controlador esperaba indefinidamente una notificación de presentación que no llegó en ese orden de arranque. La traza permite afirmar esta carrera en el controlador; no atribuir una causa interna más específica al decodificador del navegador.

`requestVideoFrameCallback` notifica presentación al compositor, no equivale a `loadeddata` ni a terminar un seek; su sincronización es best effort según la [especificación de WICG](https://wicg.github.io/video-rvfc/). La corrección evita superponer el primer seek a esa primera presentación.

## Cambio acotado
`seek-controller.js`:
- Retiene el último progreso solicitado mientras carga, sin enviar el primer seek hasta confirmar el frame inicial.
- Registra el siguiente callback **antes** de enviar otro seek.
- Conserva una sola búsqueda pendiente y descarta objetivos intermedios obsoletos.
- Al reanudarse, vuelve a evaluar el frame ya confirmado, sin exigir otro callback para quitar el poster.
- Poster sólo se oculta con presentación confirmada del objetivo, sin seek activo y con restauración de página completada.

`main.js`:
- Corrige un segundo caso verificado de inicialización: una página iniciada oculta no tenía controlador y `visibilitychange` sólo intentaba reanudar uno existente. Ahora, al hacerse visible, crea el controlador si es elegible y visible.
- `pageshow` usa la misma comprobación de visibilidad, incluyendo retorno por BFCache.

No se agregaron timers, reproducción automática, `play()`, reintentos de descarga, cambios de progreso, estilos ni medios. Instrumentación temporal retirada del código productivo. Se conservó la telemetría previa `__RP_V2__` que ya utilizaba la integración aprobada.

## Revisión de los puntos solicitados
1. Responsive selecciona `dataset.src` antes de crear el controlador. Se asigna `src` una vez y se llama a `load()` con listeners ya registrados. Sólo se solicita el recurso correspondiente.
2. `loadedmetadata` puede llegar con readyState 1; no basta para buscar. Se espera readyState ≥2 y ahora también primera presentación confirmada cuando existe rVFC.
3. `loadeddata` / `canplay` despiertan la preparación, pero no saltan la nueva condición de presentación inicial.
4. Poster → video sigue condicionado al frame realmente presentado, no a asignar `currentTime`.
5. ScrollTrigger conserva una única fuente de progreso. Un progreso recibido antes de cargar se guarda y se aplica al estar listo.
6. Inicio en scrollY 0 y restauración a 56 % se verificaron de forma separada.
7. Autoplay restringido: el entorno rechaza cualquier `play()` si se llamara; hubo **cero llamadas** y cero promesas rechazadas.
8. Visibility, page restore, BFCache, retorno desde catálogo y reduced motion se probaron aparte.

## Recargas consecutivas

| Ancho | WordPress local | Fixture HTTP con caché efectiva | Total |
|---|---:|---:|---:|
| 375 px | 60 | 40 | 100 |
| 390 px | 60 | 40 | 100 |
| 430 px | 60 | 40 | 100 |
| Total | 180 | 120 | **300** |

**0 bloqueos / 300 recargas.** Cada lote cruza arriba/mitad con frío/caliente: 15 repeticiones por combinación en WordPress y 10 en el fixture. Cada recarga incluye avance, retroceso, vuelta a cero y ráfaga de objetivos que debe terminar en el último frame solicitado. CPU ralentizada 4×; video real, decodificador y compositor reales de Edge/Chromium.

WordPress local devuelve `Cache-Control: public, max-age=0`, por lo que sus recargas reutilizando contexto no acreditan por sí solas un hit de caché HTTP. El fixture **sólo de QA** en 9460 sirve los mismos bytes con `max-age=3600`: se registraron 60 respuestas de video desde caché, y 60 recargas con caché deshabilitada/vaciada. No se cambiaron headers del sitio productivo ni el backend.

Evidencia:
- `artifacts/hero-reload/reload-report.json`: 180 recargas con el controlador de seek corregido.
- `artifacts/hero-reload/cache-fixture/reload-report.json`: 120 recargas con ambos cambios finales y caché verificada.
- `artifacts/hero-reload/summary.json`: resumen y hashes de archivos protegidos.
- `artifacts/hero-reload/lifecycle-report.json`: 22 comprobaciones adicionales.
- `tools/hero-seek-controller.test.mjs`: 20 aserciones de orden de eventos; el caso central falla con el controlador anterior y pasa con el corregido.
- `artifacts/hero-reload/production-regression/report.json`: 180 comprobaciones de regresión productiva correctas, incluidos desktop, responsive, fallback y funcionalidades existentes.

## Lifecycle y límites
- Reduced motion: 375/390/430, recarga, poster vertical, acceso al catálogo y ninguna descarga MP4.
- Inicio oculto y ocultar/mostrar con objetivo pendiente: reanudación correcta. La visibilidad se inyectó en la prueba, porque las pestañas headless se reportan visibles.
- Historial: BFCache real confirmado con `pageshow.persisted=true`; progreso/frame recuperados. Además se ejercitó explícitamente el par pagehide/pageshow persistente.
- Orientación verificada en contexto táctil fresco. Chromium pierde la emulación de touch tras BFCache (`maxTouchPoints` pasa de 1 a 0); no se confundió esa limitación del harness con un cambio del dispositivo real.
- Error de red: fallback conserva poster. Sin rVFC: ruta `seeked` + oportunidad de pintura verificada.
- No se dispone de iPhone/Safari físico: los resultados mobile corresponden a emulación Chromium/Edge, no se presentan como QA de Safari.

## Archivos productivos modificados
Sólo `theme/rp-usados/src/scripts/hero-v2/seek-controller.js` y `theme/rp-usados/src/scripts/hero-v2/main.js`, más build Vite/ZIP regenerado. Archivos PHP de datos/admin, header, plantilla hero, CSS hero, selector responsive y ambos MP4 conservan los hashes previos. El CSS compilado conserva el mismo hash `app-o9IATcWH.css`. Sin cambios de FPS, resolución, calidad, Blender, composición o backend.

Pruebas y documentación: `tools/hero-reload-qa.mjs`, `tools/hero-lifecycle-qa.mjs`, `tools/hero-seek-controller.test.mjs`, `tools/hero-cache-fixture.mjs`, este informe, artefactos y `openspec/changes/hero-mobile-reload/`.
