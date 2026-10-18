# Checklist de seguridad de producción

Candidato `v1.0.0-rc1` · 18/10/2026. No marcar una casilla por estar escrita en esta guía. Registrar fecha, responsable y evidencia del entorno al que aplica. Las pruebas locales automáticas no certifican SSL, correo, CDN, permisos del servidor ni restauraciones del hosting.

**Clasificación:** AUTOMÁTICO = verificable por las suites del repositorio; MANUAL = revisión humana del candidato/configuración; HOSTING = depende de infraestructura; POST-DEPLOY = debe repetirse en la URL publicada. La aprobación final exige resolver los puntos aplicables de las cuatro categorías.

## AUTOMÁTICO — candidato local

- [ ] Los builds públicos y privados y ambos manifests son válidos; PHP y JavaScript pasan sintaxis.
- [ ] Anónimo y Subscriber no pueden listar, crear, modificar ni subir mediante la gestión; el rol autorizado y el Administrador mantienen su acceso.
- [ ] Capabilities por objeto y allowlist se comprueban en servidor, no sólo en botones. No se aceptan IDs de otros tipos ni attachments ajenos fuera de la política.
- [ ] Login propio usa `wp_signon()` y sesión nativa; no hay contraseñas hardcodeadas, JWT ni secretos en frontend.
- [ ] CSRF previo al login y nonces en formulario/REST rechazan solicitudes inválidas. Una sesión vencida no permite una escritura.
- [ ] Rate limit atómico: hasta 8 intentos por identificador y 32 por IP en 15 minutos, incluidos intentos correctos; no se reinicia por un login exitoso. Se usa `REMOTE_ADDR`, sin confiar ciegamente en forwarded headers.
- [ ] REST privado tiene `permission_callback` y comprueba objeto, esquema y revisión. Un payload inválido conserva valores previos; errores no se interpretan como borrados intencionales.
- [ ] Las escrituras validadas usan transacción y bloqueo por vehículo; una edición antigua no sobrescribe una más nueva.
- [ ] Publicar exige marca, modelo, año, estado y portada; borrador puede estar incompleto. Vendido sale del catálogo sin borrar la unidad.
- [ ] Subidas verifican extensión, MIME real, decodificación y límites. HEIC/HEIF, SVG, MIME falso, archivos no imagen y tamaños/dimensiones inválidos se rechazan.
- [ ] Política de fotos del panel: JPEG/PNG/WebP, 12 MiB, 6000 px por lado, 24 MP, 20 imágenes distintas y 40 pendientes. El panel aplica esos límites también al Administrador; su Media Library nativa conserva los permisos administrativos existentes.
- [ ] Quitar una foto no ejecuta borrado físico. Un fallo de upload no elimina la portada previa; sin JS se conservan las asociaciones válidas necesarias para reintentar.
- [ ] Salidas HTML/atributos/URL tienen escaping contextual. Contenido legado permitido se trata con `wp_kses_post`; no se ejecuta HTML arbitrario.
- [ ] `/gestion`, sesiones autenticadas y respuestas REST privadas/errores emiten política no-store; se reconoce la variante de ruta `rest_route`.
- [ ] El catálogo carga portadas, no galerías completas; listado público y serializers auxiliares de catálogo no revelan precios.
- [ ] Los ZIP no contienen DB, uploads de desarrollo, fixtures DEMO, cuentas, logs, herramientas, `.blend`, secuencias PNG o dependencias; sí contienen los builds y licencias necesarios.
- [ ] `pnpm audit:all` no presenta vulnerabilidades conocidas sin resolver o tiene excepciones explícitas justificadas y aprobadas. No actualizar ni forzar overrides sólo para ocultar un aviso.

Ejecutar `pnpm verify:rc` y conservar su reporte identificado por commit. Si una suite necesita datos, debe ejecutarse en una instalación desechable; nunca usar la DB real como fixture. Los conteos y versiones efectivamente ejecutados pertenecen al reporte de la release, no se heredan de documentos históricos.

## MANUAL — aplicación y operación

- [ ] Comparar el commit/tag, SHA-256 de ZIP y manifests con lo que se va a instalar. Revisar diff y archivos nuevos, no sólo que Git esté limpio.
- [ ] Buscar secretos también en el historial si hubo una exposición. Un secreto publicado debe rotarse; borrarlo del último commit no basta.
- [ ] Mantener cuenta técnica Administrador y cuenta del dueño `rp_stock_manager` separadas, individuales y con contraseñas robustas. No entregar una cuenta de Playground.
- [ ] Probar mínimo privilegio real del gestor: sin entradas/páginas, plugins, themes, settings, usuarios o código. Redirigir wp-admin es UX, no la única barrera de permisos.
- [ ] No crear usuarios reales ni importar inventario sin autorización del cliente. Asegurar que fixtures y cualquier presentación DEMO no se mezclen con stock productivo.
- [ ] Revisar campos/contacto: WhatsApp `5491125348193` y mapa confirmados; ninguna información pendiente se reemplaza por ejemplos comerciales inventados.
- [ ] No instalar plugins de seguridad, caché, correo o media sin revisar su necesidad y compatibilidad. Evitar dos capas que dupliquen login, nonces o transformen el video.
- [ ] Revisar que `/gestion` no sea una Página del CMS y que nadie haya agregado un builder, SPA o autenticación paralela.
- [ ] Verificar recuperación de contraseña nativa con email correcto y entrega real. No dar un mensaje de éxito inventado cuando el correo falla.
- [ ] Revisar el uso de un equipo compartido: cerrar sesión y no guardar archivos personales en el stock. La recuperación local usa `sessionStorage` por pestaña durante 15 minutos, sin contraseñas/nonces; no es un almacenamiento confidencial para documentos.
- [ ] Definir quién mantiene WordPress, PHP, tema/plugin y dependencias; acordar revisión de avisos y pruebas antes de actualizaciones importantes.
- [ ] Guardar accesos y códigos de recuperación en un gestor de contraseñas o canal privado. No incluirlos en Git, tickets públicos, capturas o esta documentación.

## HOSTING — bloquear salida si lo esencial falta

- [ ] HTTPS válido, renovación y redirecciones; WordPress detecta HTTPS correctamente detrás del proxy. Cookies seguras y mismo origen para panel/REST.
- [ ] PHP y DB con soporte vigente y combinación probada. Tablas InnoDB y transacciones efectivas; validar permisos SQL de la cuenta de aplicación.
- [ ] Límites PHP, proxy y WAF permiten las fotos admitidas; GD/Imagick y Fileinfo funcionan. Archivos temporales y uploads escribibles sólo para quien corresponde.
- [ ] `WP_ENVIRONMENT_TYPE=production`, `WP_DEBUG=false`, `WP_DEBUG_DISPLAY=false`; `display_errors` desactivado y logs no públicos. No dejar `phpinfo`, Vite o Playground expuestos.
- [ ] `DISALLOW_FILE_EDIT=true`, salts únicos y configuración protegida. Sin permisos 777, directory listing ni lectura web de DB, backups, `.env`, `.git`, llaves o logs.
- [ ] Impedir ejecución de scripts dentro de uploads mediante configuración específica del servidor. No pegar reglas Apache en Nginx o alterar `.htaccess` sin revisar la instalación.
- [ ] Servidor/CDN/plugins excluyen `/gestion*`, REST privado, autenticados, non-GET y login. Aplicar [CACHE_POLICY.md](CACHE_POLICY.md) y no asumir que un header PHP alcanza.
- [ ] WAF/rate limiting de infraestructura protege las superficies nativas que correspondan, incluido `wp-login.php`. El límite del login propio no cubre automáticamente todos los logins de WordPress. No bloquear PATCH, multipart, `X-WP-Nonce`, REST o rutas técnicas necesarias.
- [ ] XML-RPC se evalúa según uso real: restringir/deshabilitar si no se utiliza y registrar la decisión; no bloquear REST completo.
- [ ] Correo saliente y recuperación nativa probados; credenciales SMTP fuera del repositorio. Los fallos de correo tienen responsable de resolución.
- [ ] Backups de DB + uploads + código/configuración, retención acordada, copia externa y restauración ensayada. El backup comercial anunciado por el hosting debe comprobarse en el plan contratado.
- [ ] Cabeceras de seguridad revisadas sin romper mapa, video o fuentes. El panel ya tiene CSP propia; no trasladarla ciegamente al frontend público, que integra Google Maps.
- [ ] Staging aislado, sin indexación y con accesos distintos. No copiar escrituras/cookies de staging a producción.

## POST-DEPLOY — URL y dispositivo reales

- [ ] Login/logout/recuperación, gestor y Administrador funcionan por HTTPS; Subscriber/anónimo siguen denegados en REST y panel.
- [ ] Cuenta con sesión y navegador anónimo separados nunca intercambian respuestas privadas ni nonces por caché.
- [ ] Crear borrador, publicar una unidad autorizada, editar precio/fotos, reservar y vender; no usar datos ficticios como stock real.
- [ ] Verificar la purga desde otro navegador anónimo: Home/archivo/ficha reflejan estado y datos actuales. Integración con CDN/proveedor comprobada, no sólo ejecución de un hook.
- [ ] Desktop descarga su hero y mobile el suyo; seeking/Range, poster, reload, scroll reversible y fallback funcionan en el hosting.
- [ ] Menú, anchors, ficha, imágenes, WhatsApp por unidad y mapa funcionan. Probar teléfonos físicos; no afirmar cobertura de Safari iOS sólo por Chromium emulado.
- [ ] Sin 404 nuevos, errores JS/PHP, credenciales en respuesta, HTML privado cacheado ni logs accesibles.
- [ ] Ejecutar backup posterior a la configuración final y registrar una prueba de restauración o su fecha programada antes de considerar cerrada la operación.

## Fuentes y alcance

Las garantías específicas del panel se verifican en su código y suites. Como referencia para decisiones de infraestructura: [hardening de WordPress](https://developer.wordpress.org/advanced-administration/security/hardening/), [HTTPS](https://developer.wordpress.org/advanced-administration/security/https/) y [debug de producción](https://developer.wordpress.org/advanced-administration/debug/debug-wordpress/). Este checklist no afirma que el hosting haya sido auditado ni promete ausencia absoluta de riesgos.
