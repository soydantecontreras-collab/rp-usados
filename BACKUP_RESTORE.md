# Backup, restauración y rollback

RC `v1.0.0-rc1` · 18/10/2026. Un commit o un ZIP recupera código, **no** recupera el inventario, usuarios, configuración o fotografías subidas. WordPress necesita un respaldo coherente de DB y archivos. [Referencia oficial de backups](https://developer.wordpress.org/advanced-administration/security/backup/).

## Qué respaldar

| Componente | Por qué |
| --- | --- |
| DB completa de la instalación | Vehículos, metadatos, precios, publicación/estados, asociaciones, usuarios, roles y opciones |
| `wp-content/uploads/` | Originales y tamaños derivados de las fotos; la DB sólo guarda referencias |
| Tema y plugin instalados, incluidos assets compilados | Reproducir la versión realmente servida y sus manifests |
| `wp-config.php` y configuración del servidor/proxy | Conexión DB, salts, HTTPS y reglas; tratar como secretos |
| Datos operativos | Versión WordPress/PHP/DB, plugins activos, commit/tag, hashes de ZIP, DNS y reglas de caché |

Guardar secretos cifrados y restringidos, fuera del webroot y de Git. No ofrecer backups como archivos descargables del sitio. Mantener una copia externa al hosting con acceso independiente: una caída o intrusión de la cuenta no debe destruir la única copia.

## Política que hay que acordar

Propuesta inicial, pendiente de aceptación: DB y uploads diarios, backup antes de cambios técnicos/importaciones importantes, 14 diarios y 4 semanales con copia externa. La frecuencia debe ajustarse al volumen de cambios y a la pérdida tolerable; no se afirma que esa retención esté contratada.

| Decisión | Estado |
| --- | --- |
| Responsable de generar y comprobar backups | [dato pendiente — confirmar con el cliente] |
| Proveedor, destino externo y cifrado | [dato pendiente — confirmar con el cliente] |
| Frecuencia y retención definitivas | [dato pendiente — confirmar con el cliente] |
| RPO: cuántas horas de cambios se pueden perder | [dato pendiente — confirmar con el cliente] |
| RTO: tiempo máximo objetivo de recuperación | [dato pendiente — confirmar con el cliente] |
| Contacto y acceso de emergencia | [dato pendiente — confirmar con el cliente] |

Si se contrata DonWeb, confirmar en la cuenta qué incluye realmente el plan y cómo obtener una copia: [documentación oficial de backups](https://soporte.donweb.com/es/articles/15971250-web-hosting-y-wordpress-hosting-copias-de-seguridad-plan-incluido-backup-diario-y-restauracion). No confundir backup del proveedor con restauración ya ensayada.

## Generación y verificación

1. Registrar fecha, entorno, versión y responsable.
2. Para una copia consistente, coordinar una ventana sin escrituras o usar un snapshot coherente. Un dump de DB y unos uploads copiados horas después pueden no corresponder al mismo estado.
3. Generar DB + archivos y copiar configuración/manifest/identidad de release.
4. Comprobar éxito de la tarea, integridad del archivo, tamaño razonable, SHA-256 y acceso real a la copia externa. Una notificación automática por sí sola no demuestra un backup utilizable.
5. No borrar el respaldo anterior hasta validar el nuevo y cumplir retención.
6. Restaurar periódicamente en un entorno aislado y completar el ensayo de abajo. El backup debe poder abrirse sin depender del mismo servidor que se intenta recuperar.

WP-CLI, si está disponible, puede exportar/importar DB; el panel del hosting también es válido. Ejecutar operaciones sobre **la instalación y DB identificadas**, nunca deducir la DB por un nombre parecido. No guardar comandos con contraseñas literales en historial o documentación.

## Ensayo de restauración antes de producción

1. Crear una instalación aislada con URL/DB distintas, no indexable y protegida de acceso público.
2. Desactivar correo saliente real y cualquier integración externa mientras se prueba. No enviar mensajes o acciones al cliente desde la copia.
3. Restaurar DB, uploads y los archivos de la misma versión; configurar conexión de esa copia de forma privada.
4. Si cambia el dominio, usar reemplazo que respete datos serializados. Con WP-CLI, comenzar por `wp search-replace 'URL_ANTERIOR_CONFIRMADA' 'URL_NUEVA_CONFIRMADA' --all-tables-with-prefix --skip-columns=guid --dry-run`; revisar el alcance y hacer backup antes de quitar `--dry-run`. Los tokens se reemplazan antes de ejecutar, no son dominios reales. [Comando oficial](https://developer.wordpress.org/cli/commands/search-replace/).
5. Reinstalar/activar plugin y tema cuando corresponda, comprobar el rol del gestor y regenerar enlaces permanentes.
6. Entrar como Administrador y gestor; revisar muestra de unidades disponibles, reservadas, vendidas y borradores, precios y asociaciones de imágenes. Probar edición y guardado sobre la copia.
7. Verificar Home, catálogo sin precios, fichas, galería, videos y posters; ninguna referencia debe apuntar accidentalmente a la DB o uploads de producción.
8. Registrar tiempo invertido, archivos faltantes, pérdida de datos observada y resultado. Corregir el procedimiento y repetir si falla.

## Rollback de código

Si sólo falla una release y la DB sigue íntegra:

1. Detener nuevas escrituras de gestión durante la intervención y crear un backup del estado actual.
2. Identificar el último par **compatible** de tema/plugin y sus assets. No desactivar/eliminar el plugin manualmente como sustituto de actualizarlo; su hook de desactivación cambia permisos del gestor.
3. Restaurar ese par y sus manifests sin dejar una carpeta parcialmente actualizada. Mantener las fotos subidas y la DB actual si el problema no exige retroceder datos.
4. Purgar las URL afectadas y la caché de archivos fijos que hayan cambiado, según [CACHE_POLICY.md](CACHE_POLICY.md).
5. Probar login, lectura y una escritura autorizada; luego habilitar nuevamente la operación.

No restaurar una DB vieja para resolver sólo un CSS o JS roto: eso perdería vehículos/ediciones posteriores. Si hubo cambio de esquema, validar compatibilidad de la versión anterior antes del rollback.

## Restauración por pérdida o corrupción de datos

1. Pausar escrituras y conservar evidencia/logs protegidos. Si hay sospecha de intrusión, aislar el entorno y rotar credenciales afectadas antes de reabrir.
2. Obtener aprobación sobre el punto de recuperación y la pérdida de cambios posterior a ese backup. Nunca sobrescribir stock reciente sin comunicarlo.
3. Respaldar también el estado averiado para poder investigar o recuperar cambios concretos.
4. Restaurar DB y archivos del mismo punto consistente, con código compatible.
5. Revisar usuarios, roles, contacto, medios y conteos por estado; comparar una muestra contra los datos del dueño.
6. Vaciar/purgar sólo las capas necesarias, invalidar sesiones si se rotan salts y probar recuperación de acceso.
7. Completar smoke test público y privado, registrar incidente y acordar cómo reincorporar operaciones perdidas.

## Guardado bloqueado por un mutex abandonado

El panel no roba locks por antigüedad. Un proceso PHP que termine abruptamente puede dejar `rp_gestion_lock_{id}` o `rp_gestion_lock_new_{usuario}` y causar 409 persistente.

Procedimiento exclusivo del responsable técnico: identificar la unidad/cuenta, comprobar que no exista un guardado activo ni worker en ejecución, obtener backup, leer la opción exacta y liberar **sólo esa opción si su valor sigue siendo el inspeccionado** mediante comparación atómica. No ejecutar un borrado masivo de opciones ni una liberación automática por tiempo. Si el valor cambió, abortar e investigar: puede haber otro proceso legítimo.

## Registro de restauraciones

Guardar fecha, entorno, backup/origen, commit/tag, hashes, operador, duración, controles aprobados y decisiones sobre pérdida de datos. No incluir credenciales, dumps o fotos personales en el registro del repositorio. El ensayo y los objetivos RPO/RTO quedan pendientes hasta probarlos con el hosting real.
