# Preview estática completa — testing, no producción

## Revisión del dueño — 2026-10-07

La instrucción más reciente autoriza una presentación sin carteles/textos DEMO,
exclusivamente en el export estático. Usar RP_OWNER_PREVIEW=1, el WhatsApp
confirmado RP_PREVIEW_WHATSAPP=5491125348193 y una URL de alias de preview
dedicada en RP_OWNER_PUBLIC_ORIGIN. El exportador quita las etiquetas conocidas,
reproduce los placeholders de grilla sin texto y conserva fotos/layout/medios.
No modifica la instalación WordPress ni los fixtures originales. La procedencia
queda documentada en el reporte externo al upload; robots/noindex se conservan.

Incluye ambos headers aprobados, hamburger mobile accesible y cierre automático,
overscan actual y mobile v4 1080x1920/48 fps, desktop 1600x900/48 fps intacto.
WhatsApp y mapa están confirmados; las referencias históricas a contacto pendiente
en este documento no describen esta revisión. Las condiciones comerciales exactas,
stock real y hosting WordPress productivo siguen fuera de esta preview.

Commit/push antes del export; directorio nuevo y vacío; QA de ese output y URL
pública. Sólo target preview en el proyecto existente, sin promoción a producción.
Los resultados operativos de esta ejecución quedan en tools/.preview/owner-review/.

## Estado actual (2026-10-05)

Nueva preview autorizada: corrección aprobada del escenario mobile estable.
Envolvente negra 100dvh, escena/media/copy/CTA con 100svh capturado antes del
primer paint, sticky/travel estructurales antes del módulo de media.
QA del export y publicación comprueban +16/+72 px y carga diferida del módulo
sin salto, además de todo el contenido DEMO y la selección exclusiva de recursos.
No cambios a videos, diseño, backend o contenido respecto al checkpoint aprobado.

La nueva publicación usa el checkpoint de main creado con el mensaje "Refine vehicle experience, catalog interactions and business sections". Se genera un directorio NUEVO bajo tools/.preview/ después del commit y del build. Nunca se recicla un export anterior.

Fuente: tema clásico WordPress aprobado + instalación DEMO aislada en http://127.0.0.1:9470/. Exportador: tools/export-vercel-demo-preview.mjs. Home, /vehiculos/ y nueve fichas DEMO: disponibles y reservados, vendido excluido; no precios en listado. Cada página identifica DEMO VISUAL / NO ES STOCK REAL; precios y fotografías son contenido de desarrollo. No se incorporan estos posts al tema ni al inventario real.

Incluye los heroes desktop/mobile sin alterar sus archivos, 100dvh/svh, puente negro/curva sutil; ficha editorial/galería progresiva; cards B; cursores convencionales rojo/negro; botones aprobados; foto institucional real (no histórica); copy final de financiación suministrado por el cliente. WebP y CUR se incluyen en la allowlist de export.

## Procedimiento reproducible

1. Auditar status, secretos y temporales; build/package Vite; PHP 8.3; QA local.
2. Commit y push main; verificar árbol limpio.
3. Exportar desde la instalación aislada a tools/.preview/vercel-complete-COMMIT-FECHA/. Configurar RP_EXPORT_REPORT en tools/.preview/complete-testing/export-report.json. El reporte registra commit, fecha, rutas, bytes y SHA-256.
4. Servir ESE output estático y validar con tools/vercel-demo-preview-qa.mjs, además de tools/vehicle-experience-qa.mjs, tools/brand-cursors-qa.mjs y tools/institutional-qa.mjs. Los reportes operativos se guardan fuera del upload, en tools/.preview/complete-testing/.
5. Vincular solamente el proyecto aislado existente vercel-testing-460b176-r2; publicar con target preview, sin --prod, sin dominio ni Git automático. Registrar URL única, commit y metadatos del deployment en tools/.preview/complete-testing/.
6. Repetir QA sobre la URL pública: desktop, 375/390/430, forward/reverse, reload, fallbacks, reduced motion, selección exclusiva de medios, cards, galería/lightbox, mapa, textos, cursores Chrome/Edge y hashes de assets.

RP_PREVIEW_URL y RP_PREVIEW_QA_OUT parametrizan el QA del export; RP_DEMO_URL y RP_QA_OUT parametrizan las comprobaciones de componentes. No publicar reportes ni credenciales.

## Diferencias frente a WordPress

Snapshot estático noindex: sin wp-admin, PHP remoto, base, stock dinámico ni flujo de edición. Formas/contacto mantienen el marcador pendiente; no hay un destinatario WhatsApp confirmado ni se inventa. Mapa externo conservado. Las URLs de WordPress local se vuelven relativas y se retiran discovery/feeds/emoji/speculation de runtime ausente. El diseño y los assets compilados no se reinterpretan.

El navegador real Safari/iPhone queda para la prueba física del cliente; QA Chromium touch no equivale a hardware real. Antes de producción faltan stock/fotos/precios reales, WhatsApp confirmado y hosting WordPress.

## Archivo histórico

Los informes anteriores en artifacts/vercel-preview/ y artifacts/vercel-demo-preview/ se conservan como evidencia de sus checkpoints. Sus URLs NO identifican automáticamente esta nueva preview. La URL y el hash efectivos de la publicación más reciente se entregan junto al reporte operativo local.
