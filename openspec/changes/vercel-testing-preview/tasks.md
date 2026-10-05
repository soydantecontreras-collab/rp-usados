## 1. Preparación
- [x] 1.1 Verificar rama, commit y status.
- [x] 1.2 Ejecutar build/paquete y sintaxis PHP.
- [x] 1.3 Preparar export con allowlist y hashes de medios.
- [x] 1.4 Verificar frontend exportado y exclusión de secretos/fixtures/V1.

## 2. Publicación y validación
- [x] 2.1 Obtener decisión sobre alcance estático (usuario aprobó preview y demo explícita).
- [x] 2.1a Exportar ficha demo separada con plantilla real, campos pendientes y patrones de prueba; no incorporarla al stock.
- [x] 2.2 Publicar preview. Vercel creó targets production implícitos al inicializar; se retiraron ambos. API final confirma sólo una preview activa y ningún target de producción.
- [x] 2.3 Verificar HTTPS, rangos MP4 y selección desktop/mobile; scroll, reload y fallbacks: 134 checks y 36 reloads públicos, 0 fallos.
- [x] 2.4 Documentar URL, commit, resultados y limitaciones con evidencia.


## Revisión aprobada 2026-10-05

El pedido actual sustituye las restricciones históricas de catálogo vacío y ficha única: el export completo incluye nueve DEMO explícitos y sus fichas desde la instalación aislada, sin incorporarlos al paquete productivo. Fuente main después del checkpoint, directorio nuevo, allowlist WebP/CUR y evidencia de integridad. No se modifican backend, hero ni diseño; sólo se sincroniza el copy final suministrado. Proceso/evidencia actual: VERCEL_TESTING_PREVIEW.md y tools/.preview/complete-testing/ (informes operativos locales, excluidos del upload y Git). Los checks previos arriba corresponden a su publicación histórica.
