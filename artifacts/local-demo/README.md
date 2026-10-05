# Revisión local — RP Usados, 30/09/2026

## Accesos

- Home normal sin stock ficticio: http://127.0.0.1:9400/
- Home DEMO aislada: http://127.0.0.1:9470/
- Archivo DEMO: http://127.0.0.1:9470/vehiculos/
- Ficha con galería: http://127.0.0.1:9470/vehiculos/demo-vento/
- Ficha reservada: http://127.0.0.1:9470/vehiculos/demo-hilux/
- Ficha con opcionales ausentes: http://127.0.0.1:9470/vehiculos/demo-duster/

La instancia `9470` es **sólo local**. Contiene 9 registros elegibles (2 reservados) y 1 vendido excluido del catálogo. Todos los nombres indican DEMO; la moneda `TST`, los años, versiones y kilómetros son datos de desarrollo. No se incluyó número de WhatsApp inventado. Sólo la primera ficha usa tres fotografías ilustrativas; las demás imágenes son patrones marcados como QA para comprobar relaciones de aspecto y recortes. Ninguno de estos medios se incluye en el paquete del tema.

## Capturas

- `home-desktop.png`, `home-mobile-390.png`: hero.
- `catalog-desktop.png`, `catalog-mobile-390.png`: comienzo del catálogo.
- `ficha-desktop.png`, `ficha-mobile-390.png`, `ficha-info-mobile-390.png`: galería y datos.
- `nosotros-section-desktop.png`, `nosotros-section-mobile-390.png`: sección Nosotros completa.
- `financiacion-section-desktop.png`, `financiacion-section-mobile-390.png`: sección comercial completa.
- `hero-handoff-mobile-375.png`, `hero-handoff-mobile-390.png`, `hero-handoff-mobile-430.png`: final oscuro del hero.

## Verificación

`report.json`: 81 comprobaciones en Edge/Chromium desktop y mobile emulado, sin errores de página. Abarca 375/390/430 px, viewport que crece y se contrae, continuidad escenario/puente/curva, recursos de video por dispositivo, reserva/vendido, ausencia de precio en catálogo, galería, campos ausentes, reduced motion, sitio normal vacío, y reflow equivalente a zoom 200 %. `tools/hero-lifecycle-qa.mjs`: 22 comprobaciones adicionales de ciclo de vida, orientación y fallback. Safari/iPhone físico no estuvo disponible en este entorno; el ajuste del viewport requiere confirmación final en el teléfono donde se observó el corte.

La foto de Nosotros es actual y fue enviada por el dueño. El mismo contenedor admite reemplazarla por una histórica o institucional real, conservando composición y caption. Si no llega material real, cualquier imagen generada requerirá aprobación antes de incorporarse.
