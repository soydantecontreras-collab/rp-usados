# Diseño y responsabilidades

Dirección visual cerrada: transposición de Stage 1/02 y Hero V2 transition sutil. Manrope UI y Archivo datos, sin nuevos conceptos o assets generados.

- Presentación: header/footer, front-page, archive, single y template-parts; obtener datos mediante helpers existentes, escapar salidas.
- Integración frontend: inc/frontend.php para consultas/presentación compartida y logo/contacto; inc/assets.php conserva manifest Vite y añade preload condicional de posters sólo Home.
- CSS: sustituir entrada antigua por estilos aprobados; descartar reglas exclusivas de exploración y hero viejo de la compilación.
- JS: entrada común mínima, galería progresiva; módulo hero dinámico sólo en Home, copia del controller y selector responsive aprobados, sin cambio de timing.
- Assets: copiar bytes aprobados de los dos MP4/posters, fuentes locales, icono WhatsApp y silueta secundaria; custom logo nativo, no recrearlo.
- Backend excluido: vehicle-data.php, vehicle-admin.php, post-types, admin.js, sanitización, permisos, campos y customizer.
- Empaquetado excluye archivos V1 conservados como referencia; retirar dependencia Three del paquete productivo, preservando historia y exploración.
- QA WordPress Playground aislado sin stock; otro entorno sólo de desarrollo con fixtures rotulados para verificar estados/precios/galería, no presentarlos como inventario real ni incluirlos en ZIP.

No hay imagen original separada de logo ni inventario confirmado en repo al inspeccionar. Mantener fallback aprobado y soporte nativo listo; pedir ubicación del original. No falsear foto de automóvil.
