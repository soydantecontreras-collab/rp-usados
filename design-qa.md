# RP Usados — design QA de la primera versión visual

## Fuente y estado evaluado

- Dirección de referencia: `IMPLEMENTATION_PLAN.md`.
- Capturas de la primera versión: `artifacts/qa-baseline-desktop.png` y `artifacts/qa-baseline-mobile.png`.
- Implementación auditada: tema en `theme/rp-usados/`, Home local sin stock y sin media aprobada.
- Capturas finales: `artifacts/home-desktop.png`, `artifacts/home-tablet.png` y `artifacts/home-mobile.png`.
- Comparación completa: `artifacts/design-qa-comparison.png`.
- Comparación enfocada: `artifacts/design-qa-focus.png`.
- Evidencia de foco: `artifacts/focus-desktop.png`.

## Viewports y pruebas

- Desktop: 1440 × 1000.
- Tablet: 768 × 1024.
- Mobile: 390 × 844.
- Compacto: 320 × 740.
- Zoom: 200 % mediante zoom CSS, sin desborde horizontal.
- Movimiento reducido: activo durante las capturas.
- JavaScript desactivado: catálogo y estado vacío operativos.

## Hallazgos iniciales

- P2 — La ilustración de ubicación hecha con CSS podía leerse como un mapa real y no aportaba información verificable.
- P2 — Los signos de flecha y marcas decorativas hechos con caracteres/CSS eran inconsistentes entre acciones y servicios.
- P2 — La marca decorativa del estado vacío añadía ruido visual sin ayudar a comprender que no hay unidades publicadas.
- Sin P1: no hubo contenido cortado, desbordes, controles inaccesibles ni precios fuera de la ficha.

## Correcciones

- Se reemplazó la falsa vista de mapa por una lista tipográfica con dirección, localidad, provincia y país, todos confirmados.
- Se retiraron los pictogramas decorativos de servicios y CTAs de la Home; la jerarquía queda sostenida por tipografía, espaciado y bordes.
- Se simplificó el estado vacío y se mantuvo el acento rojo como borde estructural.
- No se alteraron la paleta, el concepto “Desde 1990”, la arquitectura de secciones ni el contenido comercial confirmado.

## Comparación e iteración

1. Baseline: jerarquía, contraste y responsive correctos; tres elementos decorativos resultaron ambiguos o genéricos.
2. Revisión corregida: los servicios se leen con menos ruido, el estado vacío conserva prioridad clara y ubicación comunica datos reales sin simular un activo inexistente.
3. Verificación final: cuatro anchos sin overflow, foco de 3 px visible, orden inicial de teclado correcto, catálogo sin JavaScript operativo y cero precios en Home/catálogo.

## Pendientes

- Repetir la auditoría cuando existan logo, fotografías y stock reales.
- Validar el botón de WhatsApp dentro de una ficha real cuando el número confirmado esté cargado.
- Realizar prueba manual adicional con lector de pantalla en el entorno final de publicación.

## Resultado final

passed
