# QA de carga y acentos de marca

## Alcance aprobado
Verificar el editor nativo del CPT en una instancia local aislada (9440), con cinco unidades y gráficos identificados como QA. No cargar stock ficticio en 9400. Mantener backend, hero, header, videos, estructura y composiciones aprobadas.

## Diseño
Sobriedad editorial: rojo RP como señal de acción, pequeños trazos y números sobre las superficies existentes. Manrope/Archivo y acentos secundarios conservados. Dos familias de respuesta: superficie lateral y desplazamiento mínimo para CTA/WhatsApp; borde/contraste y flecha para controles/cards. Presión breve compartida. 180–260 ms, sin movimiento bajo reduced motion. Foco y touch equivalentes.

## Verificación prevista
- Carga/publicación desde formularios WordPress, imagen principal y galería desde biblioteca.
- Disponible/reservado visibles, vendido excluido, precio sólo ficha, opcionales y ratios.
- Capturas antes/después; desktop y 375/390/430 px, teclado, touch, reduced motion.
- Build, PHP, ZIP, ausencia de cambios en archivos protegidos y regresión del hero.
- Documentar límites reales del formulario, flujo del dueño y pendientes; no deploy.

## Resultado
- Cinco unidades publicadas mediante editor y biblioteca WordPress en 9440. 9400 sin stock QA.
- 14 comprobaciones administrativas y 222 públicas correctas. Galería por botones, teclado, selección directa y swipe emulado; 375/390/430 px sin overflow.
- Dos comportamientos CSS; sólo nueva hoja de acentos e import. Backend, header, hero, videos y controladores sin cambios, comprobados por hash; primer frame/header idénticos por píxel.
- Build, 25 PHP, ZIP de 54 entradas correctos. Regresión completa de 180 comprobaciones pasó al repetir.
- Pendiente documentado: recarga mobile intermitente mantiene poster; apareció una vez en tres recargas mobile del diagnóstico. No se tocó el hero ni se declara resuelto.
- Informe: `VEHICLE_LOADING_QA.md`. Comparación visual local: http://127.0.0.1:9450/ . Sin deploy.
