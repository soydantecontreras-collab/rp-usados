# RP Usados — mapa de responsabilidades

Estado vigente 18/10/2026: el frontend está aprobado y cerrado. Este mapa describe
separación de responsabilidades, no autorización para reemplazar diseño. La
guía actual de continuidad es `PROJECT_HANDOFF.md`; `PRODUCTION_DEPLOY.md` explica
la instalación. `/gestion` reside en `plugins/rp-usados-security/inc/gestion/`
y sus templates/assets propios; `inc/cache.php` concentra la frontera privada
de caché y la invalidación genérica de stock. El CPT permanece en el tema.

Actualización: el reemplazo autorizado ya está implementado localmente. Ver `PRODUCTION_FRONTEND.md`. Las clasificaciones siguientes describen los contratos preservados; la Home activa usa catálogo completo y Hero V2, no destacados ni V1. `inc/frontend.php` contiene adaptadores de presentación y el tamaño completo del archivo; los módulos de datos/administración siguen intactos.

Este documento identifica qué conviene conservar al rehacer la interfaz. La clasificación describe la responsabilidad principal; algunos archivos de plantillas son necesariamente híbridos.

## Núcleo funcional / backend a conservar

| Ruta | Responsabilidad |
| --- | --- |
| `theme/rp-usados/functions.php` | Bootstrap de módulos del tema. |
| `theme/rp-usados/inc/post-types/vehiculo.php` | Registro del CPT `vehiculo`, archivo y capacidades. |
| `theme/rp-usados/inc/vehicle-data.php` | Esquema de metadatos, sanitización, estados, consultas de catálogo/destacados, protección del precio y texto, URL específica de WhatsApp. |
| `theme/rp-usados/inc/vehicle-admin.php` | Metabox nativo, nonces, permisos, guardado, validación y carga de la galería. |
| `theme/rp-usados/src/scripts/admin.js` | Selector y previsualización de la galería desde la biblioteca de medios. |
| `theme/rp-usados/inc/setup.php` | Soportes de WordPress, menús, thumbnails y configuración base. |
| `theme/rp-usados/inc/customizer.php` | Ajustes validados de WhatsApp global y media aprobada. WhatsApp es funcional; los controles del hero pueden reemplazarse con el frontend. |

Claves que deben permanecer compatibles: post type `vehiculo`, slug `vehiculos`, prefijo PHP `rp_usados_`, prefijo meta `rp_` y text domain `rp-usados`.

## Capa híbrida: lógica de presentación que debe migrarse con cuidado

| Ruta | Qué preservar |
| --- | --- |
| `theme/rp-usados/archive-vehiculo.php` | Query del catálogo y ausencia de precios; el markup puede rehacerse. |
| `theme/rp-usados/single-vehiculo.php` | Precio sólo en ficha, galería, estado y CTA específico; la composición visual puede rehacerse. |
| `theme/rp-usados/template-parts/vehicle/whatsapp.php` | Estado pendiente y uso de la URL segura generada en backend. |
| `theme/rp-usados/template-parts/vehicle/card.php` | Hechos permitidos en listados y ausencia de precio/descripción libre. |
| `theme/rp-usados/template-parts/vehicle/empty.php` | Estado vacío sin inventar stock. |
| `theme/rp-usados/inc/assets.php` | Lectura del manifest de Vite y modo dev; los nombres de entradas pueden cambiar si se actualiza en conjunto. |

## Frontend / diseño reemplazable

| Ruta | Responsabilidad actual |
| --- | --- |
| `theme/rp-usados/front-page.php` | Orden y composición de la Home. |
| `theme/rp-usados/template-parts/home/` | Hero, trayectoria, servicios, destacados y ubicación. |
| `theme/rp-usados/header.php` y `footer.php` | Estructura visual global y navegación. |
| `theme/rp-usados/index.php` | Fallback de presentación. |
| `theme/rp-usados/src/styles/` | Tokens, tipografía, layouts, responsive y toda la identidad visual actual. |
| `theme/rp-usados/src/scripts/main.js` | Entrada del frontend y hooks de mejora progresiva. |
| `theme/rp-usados/style.css` | Metadata del tema; conservar cabecera válida aunque cambien estilos. |
| `artifacts/` y `design-qa.md` | Evidencia del diseño respaldado; no forma parte del runtime. |

## Tooling y distribución

- `theme/rp-usados/vite.config.js`, `package.json`, `pnpm-lock.yaml` y `scripts/package-theme.mjs`: build y empaquetado.
- `tools/`: WordPress Playground, validación PHP, smoke tests y evidencia de QA.
- `dist/`: salida regenerable; no versionada salvo `.gitkeep`.

## Contratos que no deben romperse

No reemplazar presentación sin un pedido explícito. Cualquier mantenimiento debe
preservar llamadas `rp_usados_*`, ausencia de precios en listados, exclusión de
vendidos, galerías, CTA contextual y mejoras progresivas. Destacados y filtros
no forman parte del catálogo público aprobado. La lógica y assets del panel
privado no deben cargarse en el frontend público ni viceversa.
