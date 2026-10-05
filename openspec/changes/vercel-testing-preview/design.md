## Context

main limpio en 460b17621cd6ebadd8c30ac862acc4d147aaee58. Vite 6.4.3, PHP 8.3, WordPress local. Vercel CLI 60.1.3 sin sesión activa. PHP es un runtime comunitario en Vercel y no existe una instalación/base de datos remota configurada.

## Goals / Non-Goals

Mantener idénticos los videos, posters, CSS y JS compilados; servir Home/archivo y sus assets por HTTPS. No convertir a headless, agregar runtime PHP comunitario, reconstruir interfaz, publicar datos ficticios como stock o modificar backend.

## Decisions

### Decision: export de presentación aislado

Obtener HTML directamente del WordPress local vacío, convertir URLs locales a rutas relativas y copiar sólo recursos publicados mediante una lista permitida. Conservar CSS de WordPress requerido. Retirar descubrimiento API/editor, feeds, REST, reglas especulativas y emoji loader que apuntan a runtime inexistente. Añadir noindex a HTML/configuración de preview.

### Decision: confirmación del límite estático

El usuario aprobó explícitamente alcance estático y demo identificada para revisar layout. No presentar un export como WordPress remoto funcional. No hay fichas reales para exportar ni número confirmado de WhatsApp.

### Decision: ficha demo aislada

Generar una ficha con el PHP original en una instalación local separada. Título/descripcion explican DEMO / no es una unidad en venta. Datos comerciales y contacto permanecen pendientes; imágenes son patrones existentes que dicen NO ES STOCK, no fotos de vehículos. Exportar únicamente la ficha en /demo/ficha/ y sus imágenes. No publicar la base, administración, Home ni catálogo del entorno demo. Home principal sigue vacía.

## Architecture / Flow

Build Vite → HTML WordPress → tools/export-vercel-preview.mjs → tools/.preview/vercel-testing-460b176/ → verificación local → Vercel preview → QA público.

El exportador es integración de hosting, no una capa nueva de frontend. Ningún archivo del tema se edita. Carpeta de upload contiene HTML, CSS, JS, fuentes, SVG, PNG, MP4, robots/config y nada más. Informes quedan fuera.

## Data or API Changes

Ninguno. Inventario vacío real. No exponer wp-admin/wp-json ni bases locales.

## Risks / Trade-offs

No hay escritura ni actualización de stock en el export. Safari físico queda a cargo de testing del usuario. CLI temporal puede tener vencimiento; registrar duración real si se utiliza.

## Alternatives Considered

WordPress remoto requiere hosting PHP/base/configuración adicional. Runtime comunitario y base remota cambian el alcance. Next.js/headless viola el pedido de conservar stack.


## Revisión aprobada 2026-10-05

El pedido actual sustituye las restricciones históricas de catálogo vacío y ficha única: el export completo incluye nueve DEMO explícitos y sus fichas desde la instalación aislada, sin incorporarlos al paquete productivo. Fuente main después del checkpoint, directorio nuevo, allowlist WebP/CUR y evidencia de integridad. No se modifican backend, hero ni diseño; sólo se sincroniza el copy final suministrado. Proceso/evidencia actual: VERCEL_TESTING_PREVIEW.md y tools/.preview/complete-testing/ (informes operativos locales, excluidos del upload y Git). Los checks previos arriba corresponden a su publicación histórica.
