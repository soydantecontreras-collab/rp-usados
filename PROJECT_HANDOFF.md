# Entrega técnica de RP Usados

Estado documental: 18/10/2026 · candidato objetivo `v1.0.0-rc1`. Este documento describe la entrega y operación del sistema; no certifica un deploy realizado ni autorización de producción.

## Qué se entrega

- Tema clásico propio `theme/rp-usados/`, WordPress sin WooCommerce ni builders.
- CPT `vehiculo` y esquema de metadatos existente, catálogo sin precios y ficha con precio y WhatsApp contextual.
- Hero prerender responsive aprobado, desktop y mobile independientes; no Three.js, GLB o HDR en la ejecución productiva.
- Plugin `plugins/rp-usados-security/`: rol/capabilities, política de imágenes, panel `/gestion`, login nativo WordPress con interfaz propia, REST privado y guardado validado.
- Fuentes locales Manrope/Archivo, compilación Vite pública y privada, lockfiles, suites y empaquetado instalable.
- Guías de despliegue, seguridad, stock, backups y caché vinculadas abajo.

La base de seguridad aprobada es `47e96a9`; el panel integrado proviene de `origin/gestion-rebuild` (`30b39bf`). La implementación original queda preservada en `gestion-original-desktop` (`44932e7`) como historia, no como segunda versión productiva. El hash final del RC se consulta en Git/tag y en el reporte de release; no sustituirlo por un hash antiguo.

## Mapa del sistema

| Responsabilidad | Ubicación |
| --- | --- |
| Presentación pública, Home, archivo y ficha | `theme/rp-usados/` |
| Registro CPT y datos compartidos | `theme/rp-usados/inc/post-types/vehiculo.php`, `inc/vehicle-data.php`, `inc/vehicle-admin.php` |
| Roles y política de Media | `plugins/rp-usados-security/inc/roles.php`, `inc/media.php` |
| Gestión: autenticación, servicio, REST y router | `plugins/rp-usados-security/inc/gestion/` |
| Privacidad de caché e invalidación del stock | `plugins/rp-usados-security/inc/cache.php` |
| Vistas y assets privados | `plugins/rp-usados-security/templates/gestion/`, `src/`, build en `assets/dist/` |
| Hero web actual | `theme/rp-usados/assets/hero/v2/` y módulos públicos del tema |
| Pruebas y herramientas locales | `tests/`, `tools/` |
| Requisitos/cambios y evidencia de proceso | `openspec/` y reportes de release |

`/gestion` es una ruta servida por el plugin; no requiere una Página ni un template del editor WordPress. El plugin sigue utilizando el esquema del tema activo; no son productos independientes intercambiables. Los ZIP se despliegan juntos después de compilar.

## Contratos de datos y API

CPT `vehiculo`, archivo `/vehiculos/`, prefijo PHP `rp_usados_`, text domain
`rp-usados`. La descripción utiliza `post_content`, el título `post_title` y la
portada `_thumbnail_id`; no cambiar automáticamente el permalink al editar.

| Campo persistido | Uso |
| --- | --- |
| `rp_marca`, `rp_modelo`, `rp_version` | Identificación de la unidad |
| `rp_anio`, `rp_kilometraje` | Año y kilómetros, con vacío distinto de cero |
| `rp_precio_monto`, `rp_precio_moneda` | Precio/moneda; ARS/USD nuevos, moneda válida heredada conservada |
| `rp_estado_stock` | `disponible`, `reservado`, `vendido` |
| `rp_galeria_ids` | Array ordenado de IDs de attachments autorizados |
| `rp_destacado` | Legado conservado; no se utiliza para una sección de destacados ni se edita en gestión |
| `rp_whatsapp_numero`, `rp_whatsapp_mensaje` | Overrides legados conservados; el panel no los expone |
| `_rp_gestion_revision` | Marcador interno de concurrencia; no editar manualmente |

Namespace privado `rp-usados/v1/gestion`:

| Método/ruta | Función |
| --- | --- |
| GET `/vehiculos` | Listar con `filtro`, `buscar`, `pagina` |
| GET `/vehiculos/{id}` | Datos autorizados de una unidad |
| POST `/vehiculos` | Crear borrador o publicación validada |
| PATCH `/vehiculos/{id}` | Guardar con revisión vigente |
| POST `/vehiculos/{id}/publicacion` | Cambiar publicación con revisión |
| PATCH `/vehiculos/{id}/estado` | Cambiar estado comercial con revisión |
| POST `/fotos` | Multipart `foto` y destino `vehiculo`, con límites y autorización |

Las rutas completas comienzan en `/wp-json/` o la URL REST que genere WordPress.
Los nombres de transporte (`marca`, `precio`, `portada`, `galeria`, etc.) se
traducen a metadatos por el servicio: no confundirlos con nombres de columnas.
Mutaciones de vehículos aceptan sólo el objeto JSON permitido, no parámetros
auxiliares; fotos tienen su contrato multipart. Cookies nativas y nonce
`X-WP-Nonce` no sustituyen las capabilities por objeto.
`/gestion/sesion/` entrega el challenge CSRF y procesa la reautenticación nativa;
no es un login JWT. Recuperación de contraseña enlaza al mecanismo nativo.

`rp_stock_manager` tiene capabilities específicas de vehículos y Media de stock;
el filtro server-side limita cualquier grant adicional accidental. No puede
administrar entradas, páginas, usuarios, plugins, themes, settings o código.
La interfaz no ofrece borrado físico de unidades o archivos. El Administrador
técnico conserva mantenimiento; no compartirlo con el dueño.

## Operación cotidiana

El dueño usa `/gestion/` con su cuenta real de rol `rp_stock_manager`: listado, filtros, búsqueda, cargar/editar, fotos, precio, publicación y estados. No necesita wp-admin. El Administrador técnico conserva mantenimiento, usuarios y configuración; no debe prestarse esa cuenta para el stock diario.

Publicación y estado son ejes distintos: un borrador no es público; Disponible/Reservado publicados aparecen en catálogo; Vendido sale del stock activo y conserva la unidad y ficha directa. Quitar una foto elimina la asociación, no el attachment. No hay checkout, pago de reservas ni eliminación física automática.

Para publicar se requieren marca, modelo, año, estado y portada. Precio, kilometraje, versión, galería y descripción pueden estar vacíos. El título se genera automáticamente y al editar se conserva el slug. Detalles y resolución de errores: [STOCK_ONBOARDING.md](STOCK_ONBOARDING.md).

## Contactos y contenido confirmados

- RP Usados, fundación 1990.
- Chacabuco 399, Ciudadela, Buenos Aires, Argentina; mapa actual confirmado.
- WhatsApp `+54 9 11 2534-8193` / `wa.me/5491125348193`, a configurar en WordPress, no como secreto ni placeholder.
- Foto institucional del dueño y copy aprobados. La imagen no se presenta como histórica.
- Financiación prendaria: banco para vehículos de hasta 13 años, 12–60 meses, fija/variable; financiera para cualquier año, 8–24 meses, fija en pesos/dólares, con la aclaración aprobada sobre tasa en dólares. Permutas caso por caso; consignación sin cargo. No agregar bancos, porcentajes, garantías o condiciones no confirmadas.

No completar horarios, email, responsables, inventario o testimonios con ejemplos que parezcan reales. Usar `[dato pendiente — confirmar con el cliente]` cuando corresponda. Las excepciones de presentación de DEMO en previews anteriores no autorizan inventario ficticio productivo.

## Build, QA y paquetes

Usar Node 24 y pnpm fijado en el proyecto. `pnpm run setup` prepara dependencias; `pnpm build` compila ambos productos y revisa manifests. `pnpm verify:rc` reúne verificaciones, suites, audit y empaquetado según el `package.json` vigente. Las pruebas con datos se ejecutan en instancias desechables, no en producción.

Salidas: `dist/rp-usados.zip` y `dist/rp-usados-security.zip`. Builds, ZIP, DB, uploads locales, reportes y credenciales se excluyen de Git y se regeneran. Registrar hashes de los paquetes realmente instalados. WordPress, DB y PHP se proporcionan en el hosting; una preview estática Vercel no sustituye esa instalación.

Para revisión local, `pnpm preview:gestion` inicia la instalación de pruebas de loopback. Sus cuentas aleatorias se consultan en el archivo local ignorado indicado por el launcher; no se entregan como cuenta real. Esa instancia desechable no es persistencia para inventario. La limpieza mediante `pnpm clean:preview` se hace sólo sobre artifacts locales reconocidos y con procesos detenidos; nunca sobre un backup o instalación del cliente.

Los informes históricos, incluido `GESTION_REBUILD.md`, describen versiones y ejecuciones de su fecha. Para instalación/operación actual prevalecen estas guías y el reporte del candidato. No copiar conteos de tests anteriores como prueba de la versión presente. Emulación Chromium tampoco es una prueba física de Safari/iOS.

La selección del panel reconstruido y los controles recuperados de la implementación anterior están registrados en [la comparación funcional del 18/10/2026](docs/decision/20261018_gestion-comparison.md). Los resultados ejecutados de la release deben indicar la versión real de WordPress y PHP de cada fixture: no confundir un runtime que resuelve `latest` con la versión declarada como objetivo.

## Qué debe entregarse por canal privado

| Elemento | Estado |
| --- | --- |
| Dominio y titularidad/renovación | [dato pendiente — confirmar con el cliente] |
| Hosting/plan, acceso técnico y facturación | [dato pendiente — confirmar con el cliente] |
| Cuenta individual del dueño y email de recuperación | [dato pendiente — confirmar con el cliente] |
| Cuenta Administrador de mantenimiento y recuperación | [dato pendiente — confirmar con el cliente] |
| Transporte de correo, backups externos y acceso de emergencia | [dato pendiente — confirmar con el cliente] |
| Responsable de actualizaciones, incidentes y soporte | [dato pendiente — confirmar con el cliente] |
| Inventario inicial, fotos y autorización de publicación | [dato pendiente — confirmar con el cliente] |

No almacenar estas credenciales en Git, tickets públicos o capturas. El repositorio documenta el procedimiento y la versión; un gestor de secretos almacena los accesos.

## Pendientes que bloquean considerar cerrada producción

1. Hosting/dominio confirmados, HTTPS, PHP/DB/transacciones, límites de uploads y almacenamiento comprobados.
2. Instalación de los ZIP del RC en staging WordPress real; cuentas propias y correo de recuperación efectivo.
3. Exclusiones de caché y, si se habilita caché HTML, adaptador de purga del proveedor probado tras modificar stock.
4. Backup externo, retención, responsables y restauración ensayada con objetivos de recuperación acordados.
5. QA físico en URL del hosting, especialmente Android/Chrome e iPhone/Safari, con recursos responsive, scroll, reload y galería.
6. Inventario real autorizado o decisión explícita de arrancar vacío; nada de DB/fixtures DEMO en producción.
7. Aprobación explícita del dueño para salida, registro del commit/paquetes publicados y smoke test posterior.

No se inventa un “todo listo” para controles que requieren acceso al hosting. Tampoco se interpreta el RC como autorización de deploy.

## Guías de operación

- [PRODUCTION_DEPLOY.md](PRODUCTION_DEPLOY.md): recorrido de 24 pasos de staging a publicación autorizada.
- [PRODUCTION_SECURITY_CHECKLIST.md](PRODUCTION_SECURITY_CHECKLIST.md): controles automáticos, manuales, de hosting y posteriores al deploy.
- [CACHE_POLICY.md](CACHE_POLICY.md): privacidad, invalidación de stock y límites de CDN/proxy.
- [BACKUP_RESTORE.md](BACKUP_RESTORE.md): copias, ensayo, rollback y recuperación.
- [STOCK_ONBOARDING.md](STOCK_ONBOARDING.md): guía de uso y primera carga real.

Para futuras modificaciones: leer `AGENTS.md`, conservar el frontend y la seguridad aprobados, usar una rama de trabajo y repetir las pruebas que correspondan. No reactivar V1/Three.js, renders o exploraciones en producción. Los cambios creativos y las nuevas decisiones de negocio requieren aprobación separada.
