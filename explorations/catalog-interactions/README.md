# Comparación local de interacciones de catálogo

Sandbox independiente. No se importa desde el tema, no cambia WordPress y no forma parte del paquete instalable.

**Dirección A/B/C/D descartada por el cliente.** Se conserva sólo como archivo de exploración. La implementación local vigente usa flecha/mano estáticas rojo/negro en http://127.0.0.1:9470/, documentadas en `theme/rp-usados/src/assets/cursors/README.md`.

## Identidad interactiva global — tercera exploración

Abrir **http://127.0.0.1:9480/global.html**. Es una mini web con selector A/B/C/D persistente, header, hero estático de referencia, catálogo, lectura, galería funcional, enlaces, contacto demo y footer. El contenido se mantiene idéntico al cambiar de sistema. Los cursores todavía no están integrados en producción.

- **A — Precisión:** punto exacto con envolvente mínima. La envolvente se estira en botones, se abre en fotografía/cards y se reduce en enlaces. Es la alternativa más contenida.
- **B — Rodaje:** rueda instrumental pequeña, radios que giran según la distancia recorrida y aguja roja que responde a velocidad. Mayor reconocimiento automotriz sin una ilustración de auto. Vuelve a un estado quieto al detenerse.
- **C — Cinta:** trazo flexible con una línea roja secundaria. Conserva la dirección del gesto, se curva durante el movimiento y se pliega sobre botones. Es la opción más gestual; no deja una estela permanente.
- **D — Encuentro (recomendada):** punto/rombo de contacto exacto y una marca abierta secundaria. En superficie libre permanecen cerca; sobre un botón la marca llega a su borde, en cards al límite de la fotografía y en galería al borde más cercano. La respuesta pone el énfasis en lo que el usuario toca, con una sensación de ajuste/ensamble.

Las cuatro adaptan el contraste en superficies claras/oscuras/fotografías, responden a presión y recuperan el cursor nativo en campos y texto seleccionable. Sólo se habilitan con mouse fino y hover; touch y reduced motion mantienen interacción nativa. Un control permite desactivarlas manualmente.

Motor único en `global-cursor.js`: SVG pequeño, transform para posición, interpolación temporal y un RAF por demanda. Los trazos SVG de C/D y atributos de A/B cambian localmente; no hay máscaras, filtros, shaders, librerías nuevas ni un RAF por card. El loop se detiene al estabilizarse. `AbortController` permite eliminar listeners al desmontar. Coste observado del callback JS p95 ~0,10 ms para las cuatro en Chromium local; excluye raster/composición GPU y no constituye una garantía en otros equipos. Evidencias en `artifacts/catalog-cursors/global/qa.json`.

Para trasladar la elegida: modularizar el motor en el frontend, mapear componentes existentes a estados, cargarlo sólo en desktop apto, conservar la activación progresiva y el desmontaje. Eliminar entonces el selector, los contadores y la instrumentación exclusiva del sandbox. No requiere GSAP para esta prueba.

La interacción de cards **B — Cambio de plano editorial** sí fue autorizada e incorporada al CSS del tema: foto con zoom contenido, información que sube 8 px, título 2,5 % y divisor que cambia su relación con el plano. Se mantiene el enlace nativo completo, sin cursor personalizado productivo.

Para regenerar el contenido demo desde WordPress local: `node create-global.mjs`. Para QA: desde la raíz del repositorio, `node explorations/catalog-interactions/global-qa.mjs`.

## Cursores — segunda exploración

Abrir http://127.0.0.1:9480/cursors.html. Las tres cards comparten Cambio de plano editorial (B); únicamente cambia el cursor.

- Speed Trace: indicador de 4 px y dos estelas de 1 px, longitud por velocidad hasta 22/13 px. Al detenerse, la estela vuelve a cero.
- Encuadre abierto: dos esquinas opuestas dentro de aproximadamente 16 px, con un pequeño desplazamiento relativo y cierre al presionar.
- Faceta táctil: dos caras geométricas de 12 × 14 px, con separación inferior a 1 px y flexión lateral máxima de 8 grados.

Fuera de card, touch, reduced motion, pérdida de foco y JavaScript desactivado se conserva/restaura el cursor del sistema. RAF por demanda; sin GSAP, nuevas fotos, filtros o máscaras. El enlace nativo abre la ficha local inmediatamente. cursor-qa.mjs guarda la evidencia en artifacts/catalog-cursors/.

Abrir http://127.0.0.1:9480/. La fila inicial compara A/B/C con la misma card Vento DEMO capturada del catálogo local. Los botones superiores permiten ampliar una alternativa; el click sobre la card abre la ficha local DEMO en otra pestaña.

## Iniciar

Desde esta carpeta: node serve.mjs. Para volver a capturar la card, con WordPress DEMO ya iniciado en 9470: node create-demo.mjs.

## Alternativas

- **A — Tensión de bastidor:** foto en contrapunto al movimiento (máximo 7/5 px), borde y superficie sutiles, tipografía estable. RAF con suavizado; se detiene al llegar al objetivo.
- **B — Cambio de plano editorial:** zoom contenido, panel elevado 8 px, título 2,5 % y divisor que se acomoda. CSS de 260 ms, sin seguimiento por JS.
- **C — Luz rasante:** una sola imagen, capa transparente con backdrop-filter y máscara horizontal de bordes suaves. RAF sólo sobre la fotografía. Sin nueva foto, glow ni cursor custom.

Las tres conservan cursor normal, enlace nativo, foco y medidas iguales. Los efectos se restringen a hover/puntero fino; reduced motion y touch dejan la foto estática.

## Medición

node qa.mjs usa Playwright del runtime local. Evidencias y métricas: artifacts/catalog-interactions/.

Los valores de tiempo JS son coste del callback, no tiempo GPU. El filtro y máscara de C pueden exigir más composición en GPU aunque no aparezcan como eventos Paint. Se comparó en Chromium local; no constituyen un presupuesto final de rendimiento ni certificación de equipos modestos.
