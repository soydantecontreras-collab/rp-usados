# Despliegue WordPress de RP Usados

Guía operativa del candidato `v1.0.0-rc1`, preparada el 18/10/2026. **Preparar un candidato no autoriza publicarlo.** El hosting, dominio y credenciales finales siguen pendientes; ninguna prueba local demuestra por sí sola que el hosting esté configurado.

La aplicación final requiere **WordPress real + base de datos + almacenamiento persistente**. Vercel y los exports estáticos anteriores sirvieron para revisión visual: no ejecutan `/gestion`, no administran stock y no son la arquitectura productiva.

## Datos que deben completarse fuera del repositorio

| Dato | Estado |
| --- | --- |
| Hosting y plan contratado; DonWeb es una posibilidad | [dato pendiente — confirmar con el cliente] |
| Dominio, acceso DNS y origen canónico HTTPS | [dato pendiente — confirmar con el cliente] |
| Responsable técnico y contacto de incidentes | [dato pendiente — confirmar con el cliente] |
| Cuenta real del dueño y email de recuperación | [dato pendiente — confirmar con el cliente] |
| Correo saliente, backup, retención y restauración contratados | [dato pendiente — confirmar con el cliente] |
| Inventario inicial y fotografías autorizadas | [dato pendiente — confirmar con el cliente] |

WhatsApp **confirmado**: `5491125348193`; dirección y mapa **confirmados**: Chacabuco 399, Ciudadela, Buenos Aires. No son placeholders. No incluir contraseñas ni accesos de hosting en esta tabla o en Git.

## Ruta de despliegue: 24 pasos

1. **Identificar la versión.** Registrar `git rev-parse HEAD`, tag RC y estado limpio. La base de seguridad fue `47e96a9`; el panel aprobado procede de `origin/gestion-rebuild` (`30b39bf`). La implementación anterior se preserva en una rama histórica y no se mezcla en el paquete. El commit final del candidato se obtiene del tag, no de un hash copiado de un informe antiguo.
2. **Revisar el contenido.** Excluir secretos, `.env`, `wp-config.php`, DB, `tools/.preview`, cuentas de prueba, screenshots, fixtures, secuencias PNG, `.blend` y herramientas. Conservar sólo código instalable, licencias y assets web necesarios. No importar el snapshot local de pruebas.
3. **Instalar dependencias reproducibles.** En una copia del repositorio, usar Node 24 y la versión pnpm fijada por el proyecto. Ejecutar `pnpm run setup` desde la raíz. No instalar Node ni pnpm en el hosting para servir WordPress.
4. **Validar y compilar.** Ejecutar los comandos de verificación indicados debajo. Resolver cualquier error antes de empaquetar. Un audit sin avisos no sustituye los controles de WordPress, servidor y permisos.
5. **Generar y revisar los dos ZIP.** `pnpm package` debe producir `dist/rp-usados.zip` y `dist/rp-usados-security.zip`, con carpetas raíz `rp-usados/` y `rp-usados-security/`. Registrar SHA-256 y tamaño de ambos. Comprobar manifests, CSS/JS y los videos/posters utilizados; un ZIP sin build no es instalable funcionalmente.
6. **Preparar staging separado.** Instalar en un entorno con URL, DB y archivos distintos de producción, protegido de visitas no autorizadas e indexación. Los datos sintéticos sólo pueden vivir allí. No compartir cookies, credenciales ni escrituras con producción.
7. **Confirmar versiones y transacciones.** El plugin declara WordPress 6.8+ y PHP 8.1+, pero no se recomienda un PHP sin soporte. Para el hosting, partir de PHP 8.3+ con soporte vigente y MySQL 8.0+ o MariaDB 10.11+, probando la combinación elegida. Las tablas escritas por el guardado deben usar InnoDB/transacciones; SQLite de Playground no valida esa infraestructura. Ver [requisitos oficiales de WordPress](https://wordpress.org/about/requirements/) y [soporte de PHP](https://www.php.net/supported-versions.php).
8. **Configurar PHP e imágenes.** Verificar GD o Imagick con JPEG/PNG/WebP, Fileinfo, carpeta temporal, permisos y espacio. `upload_max_filesize` debe admitir 12 MiB; `post_max_size` debe ser mayor y admitir el lote utilizado, incluyendo overhead. Ajustar también límites del proxy/WAF y `max_file_uploads`. JS sube archivos individualmente; el fallback sin JS envía el lote completo: 20 fotos de 12 MiB no caben en un POST de 32 MiB. Usar lotes pequeños o aumentar el límite conscientemente. Probar memoria y tiempos con fotos reales, sin valores ilimitados. [Directivas PHP](https://www.php.net/manual/es/ini.core.php).
9. **Resolver dominio y HTTPS.** Elegir www o sin www, emitir certificado válido y redirigir HTTP/canonizaciones sin bucles. Si hay proxy, confirmar que WordPress detecte HTTPS correctamente y que las cookies sean seguras; no confiar en headers enviados libremente por clientes. El panel y REST deben permanecer en el mismo origen.
10. **Crear un backup de retorno.** Antes de instalar o reemplazar, respaldar DB, uploads, tema, plugin y configuración del destino. Conservar la versión anterior y probar la restauración en un entorno separado. Seguir [BACKUP_RESTORE.md](BACKUP_RESTORE.md).
11. **Instalar WordPress.** Usar una distribución oficial actual y compatible verificada en staging. Crear una DB y usuario de aplicación con permisos necesarios para esa DB, sin privilegios globales. No copiar los usuarios de Playground.
12. **Aplicar configuración de producción.** Configurar credenciales y salts sólo en el servidor; `WP_ENVIRONMENT_TYPE=production`, `WP_DEBUG=false`, `WP_DEBUG_DISPLAY=false`, `DISALLOW_FILE_EDIT=true` y HTTPS administrativo. Quitar `RP_USADOS_VITE_DEV_SERVER`. No publicar logs ni archivos de diagnóstico. Ajustar `display_errors` en PHP. No desactivar actualizaciones globalmente mediante constantes copiadas sin una política de mantenimiento.
13. **Instalar plugin y tema.** Subir/activar `rp-usados-security.zip`; después instalar/activar `rp-usados.zip`. El plugin crea el rol y capabilities; no asigna usuarios ni migra vehículos. El panel necesita el esquema del tema activo. Si el plugin se desactiva, el gestor pierde escritura: no eliminar su carpeta manualmente como método de actualización.
14. **Comprobar rutas.** Guardar enlaces permanentes desde WordPress y probar `/`, `/vehiculos/`, una ficha válida y `/gestion/`. `/gestion` se sirve mediante el router del plugin: **no crear una Página de WordPress llamada Gestión ni asignarle un template**. Comprobar reglas Apache/Nginx si hay 404.
15. **Configurar identidad y contacto.** Revisar título del sitio, idioma español y zona horaria de Buenos Aires; usar el logo real cuando esté configurado. En Personalizar → RP Usados, establecer el WhatsApp confirmado `5491125348193`. Comprobar mapa y destino de “Cómo llegar”; no sustituir los valores confirmados ni inventar horarios.
16. **Crear cuentas reales.** Mantener una cuenta técnica Administrador separada. Crear para el dueño una cuenta individual con rol `RP Usados - Gestor de stock` (`rp_stock_manager`), email validado y contraseña robusta entregada por canal privado. Comprobar que acceda a `/gestion` y no pueda administrar usuarios, plugins, temas, settings, entradas ni páginas. Ver [PRODUCTION_SECURITY_CHECKLIST.md](PRODUCTION_SECURITY_CHECKLIST.md).
17. **Comprobar recuperación y correo.** Probar recuperación nativa de contraseña y entrega real del email. Configurar el transporte del hosting/SMTP si hace falta; no simular un envío correcto. Verificar remitente y recepción antes de depender de este mecanismo.
18. **Configurar caché.** Aplicar [CACHE_POLICY.md](CACHE_POLICY.md), incluyendo exclusiones en servidor, CDN y plugins. Probar navegación anónima y autenticada; ninguna respuesta privada, nonce o precio administrativo debe pasar a caché compartida. La existencia de `DONOTCACHEPAGE` no controla un CDN que se ejecuta antes de PHP.
19. **Verificar media del hero.** Servir MP4 y PNG locales con MIME correcto y soporte de solicitudes Range/206. Desktop usa `hero-desktop-1080-crf18.mp4`; mobile usa `hero-mobile-v4-1080-crf18.mp4`, con sus posters. Confirmar un solo recurso por dispositivo, scroll reversible y fallback. No regenerar videos ni cambiar mapping durante el despliegue.
20. **Mantener inventario limpio.** Una instalación nueva puede arrancar sin stock. No subir fixtures ni DB de demostración como inventario. Para cargar unidades reales, obtener autorización y datos del dueño y seguir [STOCK_ONBOARDING.md](STOCK_ONBOARDING.md). Si staging usa DEMO, identificarlo allí y no migrarlo a producción.
21. **Probar el flujo completo en staging.** Login/logout, borrador incompleto, publicación válida, precio/moneda, portada, galería, reordenamiento, reservado, vendido y vuelta a disponible. Probar errores, sesión vencida y dos ediciones simultáneas. Ningún archivo se debe borrar al quitar una asociación.
22. **Hacer QA público y físico.** Home, anchors, menú, catálogo sin precios, ficha con precio/WhatsApp contextual, galería/lightbox, mapa y secciones. Revisar 375/390/430, teclado, reduced motion y teléfonos reales Android/Chrome e iPhone/Safari cuando se disponga. Chromium responsive no certifica Safari iOS ni las barras reales del navegador.
23. **Solicitar autorización de salida.** Registrar la aceptación del dueño, checklist de seguridad, backup probado, stock válido o vacío y responsables de recuperación. Sólo con autorización explícita efectuar el cambio de dominio/publicación. La preparación del RC no equivale a esa autorización.
24. **Validar y cerrar después de publicar.** Repetir smoke test con URL definitiva, HTTPS, caché, login, video y una edición controlada. Confirmar que lo vendido desaparezca en sesión anónima tras purgar caché. Registrar fecha/commit/ZIP/hash, accesos entregados sin secretos en Git y criterios de rollback. Si falla acceso o integridad, detener escrituras y seguir la restauración acordada.

## Comandos del candidato

Desde la raíz, en una máquina de desarrollo preparada:

```sh
pnpm run setup
pnpm browsers:install
pnpm build
pnpm check
pnpm test:security
pnpm test:gestion
pnpm test:http
pnpm test:security-http
pnpm audit:all
pnpm package
pnpm test:install
```

`pnpm verify:rc` reúne la validación del candidato; consultar `package.json` para la secuencia exacta vigente. Los reportes deben identificar fecha, runtime y commit. No ejecutar fixtures ni suites que generan datos contra una DB de producción.

Configuración mínima orientativa del `wp-config.php` **del servidor**, sin duplicar constantes ya definidas y después de comprobar HTTPS/proxy:

```php
define( 'WP_ENVIRONMENT_TYPE', 'production' );
define( 'WP_DEBUG', false );
define( 'WP_DEBUG_DISPLAY', false );
define( 'DISALLOW_FILE_EDIT', true );
define( 'FORCE_SSL_ADMIN', true );
```

DB, salts, correo y accesos se configuran por canal privado. No copiar `wp-config.php` a Git ni publicar un `phpinfo()` para comprobarlo. No establecer `DISALLOW_FILE_MODS` sin una estrategia explícita de actualizaciones: esa constante abarca más que el editor de código. [Configuración oficial de WordPress](https://developer.wordpress.org/advanced-administration/wordpress/wp-config/).

Si un plan DonWeb resulta elegido, verificar capacidades y condiciones **del plan contratado**, no de un artículo comercial: [ayuda oficial de hosting](https://soporte.donweb.com/es/collections/19672178-web-hosting-y-wordpress-hosting), [SSL](https://soporte.donweb.com/es/articles/15851380-ssl-instalar-el-certificado-ssl-incluido-en-tu-plan) y [backups](https://soporte.donweb.com/es/articles/15971250-web-hosting-y-wordpress-hosting-copias-de-seguridad-plan-incluido-backup-diario-y-restauracion). No se presupone que esas prestaciones estén disponibles o activadas en la cuenta del cliente.
