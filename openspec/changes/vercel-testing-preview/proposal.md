## Why

El frontend aprobado en 460b176 necesita una URL pública para testing en dispositivos reales. El repositorio contiene un tema clásico WordPress, no una aplicación autónoma para Vercel.

## What Changes

Preparar un export de presentación desde WordPress local sin modificar tema, medios, lógica o datos. Publicarlo sólo después de confirmar con el usuario el alcance estático. No publicar fixtures QA ni credenciales. No crear producción, dominio o integración Git automática.

## Capabilities

### New Capabilities
- `testing-preview`: copia pública de presentación con trazabilidad al commit y recursos aprobados.

## Impact

Sólo herramientas de exportación, documentación y salida local ignorada. Administración, datos reales, ficha comercial y WhatsApp confirmado no están disponibles en esta preview sin infraestructura/datos adicionales.


## Revisión aprobada 2026-10-05

El pedido actual sustituye las restricciones históricas de catálogo vacío y ficha única: el export completo incluye nueve DEMO explícitos y sus fichas desde la instalación aislada, sin incorporarlos al paquete productivo. Fuente main después del checkpoint, directorio nuevo, allowlist WebP/CUR y evidencia de integridad. No se modifican backend, hero ni diseño; sólo se sincroniza el copy final suministrado. Proceso/evidencia actual: VERCEL_TESTING_PREVIEW.md y tools/.preview/complete-testing/ (informes operativos locales, excluidos del upload y Git). Los checks previos arriba corresponden a su publicación histórica.
