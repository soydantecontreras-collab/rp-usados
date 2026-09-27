# Verificación de la exploración — 23/09/2026

> **Histórico: primera iteración.** La revisión vigente está en [REVIEW_ITERATION_2.md](REVIEW_ITERATION_2.md). Las capturas actuales están en `review/iteration-2/`.

## Alcance

Material estático independiente en `explorations/stage-1/` y documento raíz `STAGE_1_DESIGN.md`. Sin cambios de código del tema, de WordPress, de stock, de WhatsApp ni de precios. No se usó Blender ni Three.js. No se publicaron archivos ni se regeneró el paquete instalable para incluir esta exploración.

La comparación visual de la tipografía se basa en un solo DOM con dos variables de familia. Mismos tamaños, pesos, contenido y reglas de composición en A, B y C. El navegador carga sólo las dos familias necesarias al abrir una ruta; si se comparan otras en la misma sesión quedan en caché. Todas están autoalojadas con licencia.

## Comprobación en navegador

Edge/Chromium de escritorio, automatizado con Playwright del runtime ya disponible, sin instalar dependencias en el proyecto. `review.mjs` y `review/results.json` conservan el procedimiento y resultados.

- 12 combinaciones de ruta y viewport: A/B/C × 1440, 768, 390 y 320 px; sin errores JavaScript, imágenes rotas ni desborde horizontal.
- Familias cargadas verificadas contra estilos computados: Bricolage/Manrope, Newsreader/Instrument y Manrope/Archivo.
- Catálogo: 3 columnas a 1440, 2 a 768 y 1 a 390/320.
- Skip link como primer foco. Cambio de ruta con inputs nativos, filtros de muestra, limpiar, reservado en ficha, galería, mensajes de CTA, Escape, contención del foco y devolución al botón de origen.
- Reduced motion: transiciones desactivadas y scroll directo. Sin JavaScript: contenido visible y enlace al catálogo funcional; comparador y diálogo de muestra requieren JavaScript y están identificados así.
- Zoom CSS al 200% sin desborde. Esto no sustituye comprobar zoom nativo y tecnologías de asistencia en la futura web integrada.

## Revisión visual de capturas

1. **Apertura desktop A/B/C:** se mantiene el díptico, escena y CTA. La serif B y Manrope C producen saltos diferentes sin alterar el tamaño para favorecer una ruta. El área de foto mantiene su proporción y el texto se adapta.
2. **Catálogo:** sin cajas elevadas ni sombras, fotos 3:2 reservadas y fila estable de año/km. Estado textual visible. No hay precios ni inventario fabricado.
3. **Entrada mobile:** título, CTA y dirección se leen antes de la imagen; la esquina permanece reconocible en recorte vertical. No hay superposición del texto sobre una fachada compleja.
4. **Unidad mobile:** una columna, título de escala mayor, flecha táctil de 44 px y año/km ordenados. Los patrones se identifican como muestra.
5. **Nosotros:** foto real y texto en columnas distintas; jerarquía de «Desde 1990», heading y cuerpo separada de la lógica del catálogo. La fotografía carga correctamente; no queda un bloque vacío por lazy loading en la captura final.
6. **Ficha de muestra:** galería/resumen separados en desktop y foco retenido; reservado se conserva al abrir desde su composición correspondiente. Precio únicamente en este contexto y con dato pendiente.

## Contraste medido

Cálculo WCAG sobre colores sólidos sRGB de los tokens, no auditoría automática completa de cada píxel de las fotografías.

| Combinación | Relación |
| --- | ---: |
| Tinta / papel | 13,67:1 |
| Texto secundario / papel | 5,85:1 |
| Papel / noche | 14,53:1 |
| Foco azul / papel | 6,05:1 |
| Foco claro / noche | 10,08:1 |

## Verificación del proyecto existente

- `npm.cmd --prefix theme/rp-usados run build`: aprobado (Vite 6.4.3).
- Manifest Vite válido y sus archivos de entrada presentes.
- ZIP existente: entradas bajo `rp-usados/`, sin `node_modules`, `src`, `vite.config.js` o `package.json`. Se inspeccionó, no se sustituyó.
- Comparación del `git diff --binary` antes/después: idéntico para todos los archivos previamente versionados. Los cambios preexistentes de AGENTS, IMPLEMENTATION_PLAN, README y `.gitkeep` no se atribuyen a esta exploración.
- No hubo cambios PHP/CPT: no se reactivó WordPress ni regeneraron enlaces. PHP no apareció en PATH durante esta verificación; no se declara un lint PHP nuevo.

## Límites y pendientes

No es una prueba de performance de un hero 3D ni de stock real. Falta validar la ruta elegida con inventario/fotos reales, teléfono físico y lectores de pantalla en la implementación. No se certifica WCAG completo con estas comprobaciones.

El estudio generado es una referencia de iluminación con reinterpretaciones identificadas en `media/README.md`. El PNG grande y las capturas de revisión no son assets de producción. No se optimizaron ni publicaron como tales.

El servidor local de revisión usa `127.0.0.1:9411`; puede reiniciarse desde la raíz con Python mediante `python -m http.server 9411 --bind 127.0.0.1`. Alternativamente, abrir `index.html` directamente. La galería y los filtros son demostraciones con feedback, no están conectados a WordPress.
