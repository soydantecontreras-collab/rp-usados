# Base de `/gestion` para el release candidate — 18/10/2026

## Fuentes y decisión

- Base de seguridad aprobada: `47e96a9090f273026c5c7c747cfad5aad3bcd82c`.
- Implementación anterior preservada en `gestion-original-desktop`: `44932e7`.
- Reconstrucción comparada: `origin/gestion-rebuild`, `30b39bfcd6aedb37c02f553ee6bec8bcd0008134`.
- Método: comparación directa de árboles y código mediante `git show`/`git diff`; sin evaluar preferencias creativas como defectos.

**Se adopta la reconstrucción como única base del panel.** No se mantienen dos implementaciones activas ni se mezclan sus componentes públicos. La anterior queda en su rama de respaldo. La reconstrucción mejora búsqueda, paginación, transporte privado, subidas pendientes y recuperación de sesión. Antes de RC se incorporan únicamente las correcciones objetivas enumeradas abajo.

## Comparación funcional

| Área | Reconstrucción | Resultado / acción RC |
|---|---|---|
| Login | `wp_signon`, cookies nativas, challenge de invitado firmado y ligado a cookie HttpOnly, SameSite Strict | Conservar. El nonce REST ya se vincula a la cookie de la sesión recién creada. |
| Rate limiting | Lectura/incremento de transients separados; borrado del límite IP tras éxito | Sustituir por incrementos SQL atómicos con ventana de 15 minutos: 8 intentos por cuenta y 32 por IP. No reiniciar al ingresar. |
| Acceso | Rol/capability de stock | Agregar fallo cerrado si faltan CPT o validadores del tema. |
| WordPress administrativo | No redirigía al gestor | Reponer redirección de navegación normal a `/gestion`, conservando rutas técnicas y acceso de Administrador. Las capabilities siguen siendo la protección real. |
| Recuperación de clave | Sin enlace | Añadir enlace a recuperación nativa de WordPress, con retorno a `/gestion`. SMTP pendiente de verificación real en staging; no se simula envío. |
| Listado | Búsqueda por términos sobre marca/modelo/versión, filtros y paginación real | Superior a la búsqueda de cadena completa y límite único de la anterior; conservar. |
| Crear/editar | Título automático, URL existente estable, borrador/publicación y estado separados | Mantiene los requisitos aprobados. |
| Guardado | Validación previa, mutex por vehículo y transacción con rollback | Conservar; ampliar prueba de compatibilidad con descripción HTML ya existente. |
| Descripción | `sanitize_textarea_field` eliminaba formato HTML legado | Usar `wp_kses_post`, sin añadir editor enriquecido ni permitir HTML inseguro. |
| Fotos | Cola secuencial, progreso real, reintento, HEIC detectado, previews, pendientes antes de asociación | Conservar. La sustitución de portada funciona al límite de 20 imágenes sin modificar la portada ante fallo. |
| Galería | Reordenar con arrastre y botones Anterior/Siguiente; quitar asociación sin borrar archivo | Mantiene teclado/touch y no introduce borrado físico. |
| Upload sin JS | Validaba todo el batch antes de subir; si fallaba una subida posterior perdía las referencias a las anteriores en el formulario | Conservar y volver a mostrar únicamente IDs pendientes autorizados, para reintentar y guardarlos explícitamente. |
| Sesión caducada | Reautenticación inline, nonce renovado para la misma cuenta, recuperación temporal de formulario | Superior al flujo con pestaña auxiliar; conservar. Las credenciales no se almacenan. |
| Conflicto | Revisión optimista comparada dentro del mutex; recarga explícita | Conservar. No reemplazar silenciosamente la revisión enviada por la revisión actual. |
| Seguridad REST | JSON estricto, allowlist, permisos por objeto, nonce, cabeceras privadas y CSP | Conservar. No añadir autenticación frontend ni secretos. |
| Accesibilidad | Formularios semánticos, diálogo nativo, focus, estado accesible, botones para ordenar, fallback POST | Conservar y verificar en QA, sin cambios creativos. |

## Riesgos operativos que permanecen explícitos

1. **Mutex abandonado.** La reconstrucción no roba automáticamente un lock por antigüedad. Ante terminación abrupta de PHP, `rp_gestion_lock_{id}` (o `rp_gestion_lock_new_{user}`) puede seguir bloqueando guardados con 409. Es preferible una intervención administrativa controlada a permitir dos escritores simultáneos. Antes de retirar un lock: verificar que no haya proceso activo, respaldar, inspeccionar su valor y borrar mediante comparación exacta de clave y valor. No exponer un botón de desbloqueo al gestor ni borrar locks masivamente por tiempo.
2. **Transacciones.** La garantía de rollback debe verificarse en el motor de tablas del hosting real; usar InnoDB en WordPress/MySQL. Las pruebas locales utilizan SQLite/Playground.
3. **Límites de login.** El contador usa `REMOTE_ADDR`, nunca un encabezado reenviado aportado por el cliente. El reverse proxy del hosting debe entregar una IP confiable. Estos límites corresponden al login del panel; la protección general de `wp-login.php` debe resolverse también en hosting/WAF.
4. **Fotos pendientes.** Un formulario abandonado puede dejar attachments propios sin asociación, sujetos al límite existente de 40 pendientes. No se borran físicamente desde el panel; su limpieza debe ser una tarea administrativa consciente.
5. **Email.** Recuperación de contraseña, remitente, SMTP y entrega real deben probarse en staging. El enlace nativo puede mostrar la pantalla de recuperación WordPress; no se crea un servicio de correo alternativo.

## Verificación incorporada

`tests/gestion/release-auth.php`, incluido por el runner real de WordPress `tools/gestion-tests.mjs`, cubre: fallo cerrado sin CPT, contadores y expiración, límites por cuenta/IP, no asignación de nuevos contadores tras bloquear IP, cookie/challenge firmado, sesión nativa y nonce recién emitido, conservación del límite tras login válido, redirección administrativa/excepciones técnicas, HTML compatible/sanitizado y referencias de fotos autorizadas al reintentar.

Resultado del 18/10: **135 comprobaciones aprobadas en WordPress 6.8.11 / PHP 8.3.33**, incluyendo el guardado explícito posterior de las asociaciones recuperadas. Una pasada preliminar anterior aprobó 134 comprobaciones en WordPress 7.1.3 / PHP 8.5.10; no se confunde esa ejecución con el entorno mínimo fijado. El runner usa `preferredVersions` en el blueprint, además de los argumentos CLI. La validación sintáctica PHP 8.3 aprobó 44 archivos en este punto del RC.

El QA HTTP/multipart, teclado, responsive y la regresión pública se ejecutan en la validación general del RC. No se modifica el hero, diseño público, modelo de datos ni lógica comercial.

La suite histórica `tests/security/http-fixture.php` desactiva **sólo la redirección de navegación** mediante un MU plugin creado dentro de su WordPress efímero, para seguir comprobando los permisos y nonces de los formularios nativos. No desactiva capabilities, política de imágenes ni validación. Ese archivo no pertenece al paquete instalable. La suite HTTP de `/gestion` comprueba por separado la redirección real que sí debe recibir el gestor.
