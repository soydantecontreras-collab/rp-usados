# RP Usados — primera integración web v6.1

Prueba local del 26/09/2026. El pipeline funciona a aproximadamente 48 FPS en la GPU integrada probada; **todavía no está listo para producción por peso, preparación inicial y equivalencia de iluminación**. No se desplegó el sitio.

**Preview:** http://127.0.0.1:9400/?rp_hero_preview=1

**Comparación con la Home conservada:** http://127.0.0.1:9400/

Agregar `&hero_debug=1` expone `window.__RP_HERO_DIAGNOSTICS__` para inspección. No agrega paneles a la interfaz.

## Qué se integró

- Fuente aprobada: `C:/Users/dante.DESKTOP/Downloads/RP_Usados_Hero_v6_1.blend`. SHA-256 verificado sin cambios: `8b7d0887934afafeb0380e37f1358be2a7ef4c637bddc99efd0de995d0d52e9b`.
- Copia separada: `blender/web-integration-v6-1/RP_Usados_Hero_v6_1_WEB.blend`.
- GLB, poster del primer frame, entorno HDR y metadatos en `theme/rp-usados/assets/hero/v6-1/`.
- Cámara evaluada y horneada en sus 72 frames originales. Se conservaron las animaciones de las dos hojas de puerta. El exportador produce tres clips; un único `AnimationMixer.setTime(progress * 3)` mantiene cámara y puertas sincronizadas.
- GSAP/ScrollTrigger obtiene el progreso del scroll nativo y reversible. Sin rueda interceptada, snaps ni pausas. La distancia es 650–1000 px según viewport; a 1440 × 900 son 855 px. **Tres segundos corresponden al clip; el tiempo real depende de cómo se desplace la persona.**
- Hero prácticamente a pantalla completa, debajo del header de 72 px en desktop. Marca y acceso al catálogo discretos, sin composición de texto lateral.
- Handoff provisional entre 87 % y 100 %: disminuye el canvas y aparecen las secciones HTML existentes. Se conserva su orden y contenido; la transición definitiva hacia el catálogo no se diseñó en esta prueba.
- “Ver vehículos” abre directamente el catálogo existente, incluso antes de que cargue la escena.

## Aislamiento y fallback

La variante sólo se activa en la Home con `rp_hero_preview=1`; sin ese parámetro se conserva el hero anterior. No se modificaron plantillas de catálogo/ficha, precios, WhatsApp, administración, contenido comercial ni datos.

Three.js 0.186.1 fue anunciado antes de instalarse y es la única dependencia nueva de ejecución. Se reutilizan GSAP y ScrollTrigger. El bootstrap detecta el hero y sólo importa el módulo pesado en desktop con puntero fino, ancho mínimo de 900 px, sin reducción de movimiento ni ahorro de datos.

El enqueue de JavaScript utiliza la URL con hash de Vite sin añadir `?ver=`: así los imports al entry resuelven al mismo módulo y no duplican la inicialización. El bootstrap también impide montar dos renderers sobre el mismo hero. Es un ajuste de carga de assets, no de lógica de negocio.

Mobile y `prefers-reduced-motion` muestran el render estático. El recorte móvil prioriza el acceso y el cartel reales, sin barras vacías. Fallos de JavaScript conservan el HTML; fallos de GLB/WebGL y un timeout de 30 segundos conservan el poster y la navegación. No hay pantalla vacía ni reintentos continuos.

Se renderiza por cambios de progreso/resize, no con un bucle permanente. Se pausa fuera de viewport y cuando el documento se oculta. `pagehide`, cambios de preferencia y pérdida del contexto liberan geometrías, texturas, materiales, sombras, listeners y contexto WebGL. BFCache usa pausa/reanudación.

## Mediciones

WordPress Playground 6.8 / PHP 8.3, build Vite de producción, Microsoft Edge headless, Windows, **AMD Radeon 760M integrada mediante ANGLE/D3D11**, viewport 1440 × 900, DPR 1. No representan todas las computadoras ni una conexión pública.

| Dato | Resultado |
|---|---:|
| GLB | 30.434 MB |
| Texturas incluidas en el GLB | 25.209 MB, 42 imágenes |
| Entorno HDR separado | 2.097 MB |
| Poster WebP | 146.9 kB |
| JS diferido del hero, con Three + GSAP + loaders | 1.010 MB minificado / 315.2 kB gzip |
| Geometría GLB | 105 meshes, 116.502 triángulos |
| Materiales | 147; incluye copias para albedos horneados |
| Luces exportadas | 18 puntuales/direccionales + 6 áreas reconstruidas desde metadatos |
| Animación | 3.000 s; cámara + dos hojas |
| Preparación hasta primer frame | 8,50 s en la prueba final |
| Descarga local / parseo | 53 ms / 187 ms; no extrapolables a Internet |
| Movimiento | 47,9 FPS de rAF; 142 frames renderizados en 3,008 s, aproximadamente 47,2 FPS efectivos |
| Frame inicial después de precarga | Aproximadamente 203 ms |
| Memoria JS observada | 79,3 MB; no equivale a memoria GPU |
| Renderer en frame inicial | 207 geometrías, aproximadamente 51 texturas GPU; 772 draw calls incluyendo pases |

La descarga local tomó menos de un segundo: **no es un tiempo de carga por Internet**. Sólo GLB + HDR requieren unos 13 segundos teóricos a 20 Mbit/s, antes de latencia y procesamiento. No se midió memoria GPU en bytes con fiabilidad.

Se precargan las variantes AgX/sRGB y lineales de transmisión para que el vidrio no obligue a compilar de nuevo durante el primer frame. Se quitaron ocho faroles de fondo a más de 40 metros del origen del local. La prueba final verifica **un canvas y una descarga GLB**. La tarea larga máxima observada fue de **445 ms**, seguida de 206 ms; ya no se observó el bloqueo de varios segundos de las primeras pruebas. Queda margen para reducir inicialización y alcanzar 60 FPS con más regularidad. El percentil 95 de intervalo de frame durante el recorrido fue 27,8 ms.

## Diferencias visuales comprobadas frente a Blender

| Elemento | Estado web / diferencia | Recomendación antes de producción |
|---|---|---|
| Arquitectura, cámara, puertas, cartel | Se usan los objetos y animaciones de v6.1. Cámara con desplazamiento de lente y recorte adaptativo. | Aprobar encuadre en navegador. |
| Pinturas con nodos Mix | Se horneó únicamente el color base de 15 objetos, conservando mapas de normal/roughness y UV originales. | Revisar costuras y densidad cercana; no se reemplazó la paleta. |
| Cielo procedural | Captura HDR lineal del mundo original. | Afinar correspondencia del entorno y contraste con la referencia. |
| Luces de área | glTF no las transporta; se leen posición, orientación, tamaño, color y potencia del archivo y se crean RectAreaLight. **Sin sombras de área equivalentes a Cycles.** | Hornear iluminación estática del original. |
| Iluminación global | Three.js no reproduce los rebotes y la oclusión de Cycles. La fachada y el interior quedan más claros/planos. | Lightmaps de iluminación indirecta/oclusión y menos luces activas. Requiere una siguiente iteración aprobada. |
| Unidades de luz | Exportación glTF SPEC; se compensa el factor 683 del exportador para mantener la convención radiométrica de los mapas y emisiones de Blender. | Validar fotométricamente al definir la iluminación web final. |
| AgX | Se conserva exposición 0,9; Three usa AgX, pero no incorpora el look exacto “Medium High Contrast” de Blender. | Conversión/LUT del look aprobado, sin inventar un grading. |
| Vidrios | Se conserva transmisión física. Refracción, capas superpuestas y sombras no coinciden exactamente con Cycles; es costosa. | Definir una aproximación específica tras comparar imágenes. |
| Sombras | Tres focos importantes generan sombras; las áreas y las luces lejanas no tienen el mismo cálculo que Cycles. | Decidir qué sombras dinámicas son necesarias durante las puertas. |

La limitación de sombras de área está documentada en [RectAreaLight](https://threejs.org/docs/pages/RectAreaLight.html). La precarga y liberación siguen las APIs de [WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html); el progreso usa [ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/).

**No se presenta esta versión como equivalente fotorealista al render original.** Las diferencias de iluminación son claramente visibles al pasar del poster al canvas.

## Verificación y límites

`tools/hero-qa.mjs` verifica montaje y descarga únicos, navegación inicial por teclado, scroll hacia adelante/atrás, pausa fuera de pantalla, resize desktop, ciclo de visibilidad mediante eventos simulados, limpieza al activar reducción de movimiento, mobile de 390 px y 320 px, fallback sin JS, fallo GLB, fallo WebGL y salto al catálogo durante descarga pendiente. Ver `blender/web-integration-v6-1/qa/qa-report.json`.

`tools/hero-lifecycle-qa.mjs` pasó pérdida real de contexto WebGL, timeout de descarga a los 30 segundos con acceso posterior al catálogo y zoom CSS al 200 %. Su resultado queda en `qa/lifecycle-report.json`. La prueba de pestaña oculta automatiza el evento/estado; no debe confundirse con una medición del planificador de cada navegador real.

El smoke test del sitio existente pasó en desktop/tablet/mobile, teclado, zoom 200 % y navegación sin JS. No se pidieron assets 3D en Home sin variante, catálogo, búsqueda ni página 404. No hay unidades cargadas en el WordPress local: **la ficha con una unidad real no se validó visualmente**; su código y lógica no cambiaron y no se inventó stock para la prueba.

Build Vite y manifest correctos; 22 PHP validados con PHP 8.3. Tema activado en WordPress local. ZIP generado de 27,84 MB, raíz `rp-usados`, manifest y GLB incluidos, sin `node_modules`, fuentes ni herramientas de build. No se publicó ni se instaló en un servidor del cliente. La advertencia de bundle >500 kB permanece documentada; el módulo pesado es diferido.

Capturas: `qa/desktop-initial.png`, `desktop-middle.png`, `desktop-arrival.png`, `desktop-threshold.png`, `desktop-inside.png`, `mobile.png`. `diagnostic-inside-without-transition.png` oculta temporalmente el handoff **sólo para inspección**, no representa el estado visible final de la web.

## Reproducir y revisar

1. Build: `pnpm --dir theme/rp-usados build`.
2. Preview: `powershell -File tools/start-preview.ps1` desde la raíz. Si el puerto 9400 ya está activo, reutilizar el servidor.
3. Abrir la URL de prueba. Mientras se prepara el 3D se ve el primer frame estático. En mobile/reduced motion permanece estático.
4. `node tools/hero-qa.mjs` y `node tools/hero-lifecycle-qa.mjs` usan el runtime Playwright disponible en esta máquina; `RP_PLAYWRIGHT_PACKAGE` permite otra ruta en el test principal.
5. Para regenerar desde Blender: ejecutar `export_web.py` sobre el archivo aprobado con `--background --disable-autoexec`, luego `export_environment.py` para la captura lineal. El script de refinamiento permite reexportar la copia sin repetir los albedos. Los scripts nunca guardan sobre Downloads.

## Antes de producción final

Primero aprobar esta integración y el comportamiento del recorrido. Recomiendo una siguiente prueba enfocada en **iluminación estática horneada fiel a Cycles**, texturas comprimidas para GPU, consolidación de materiales idénticos y reducción selectiva del entorno fuera de cámara. Eso debería mejorar simultáneamente fidelidad, compilación, memoria y FPS. Después medir en hardware adicional y conexiones limitadas. Mantener mobile estático hasta demostrar que otra opción aporta valor.

No hace falta inventar un logo, una puerta ni más arquitectura para continuar: esos elementos están en el archivo aprobado. No se requiere ningún asset crítico adicional para esta prueba. No se avanzó a optimización final, producción móvil 3D ni rediseño de la web.
