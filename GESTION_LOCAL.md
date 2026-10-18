# RP Usados — primera versión local de gestión

Fecha: 10/10/2026. Base: `47e96a9090f273026c5c7c747cfad5aad3bcd82c`.
Implementación local pendiente de aprobación; sin commit, push ni deploy.

## Probar ahora

- URL: http://127.0.0.1:9540/gestion/
- Usuario: `rp-stock-local`.
- Contraseña aleatoria: abrir `tools/.preview/gestion-local/access.json`.
- Esta instancia WordPress está aislada, con fixtures DEMO; no administra stock real.
- Credenciales fuera del webroot, ignoradas por Git. No son una cuenta de producción.
- Para reiniciar desde la raíz, ejecutar `tools/start-gestion-preview.ps1`, con
  el puerto 9540 libre. Recrea fixtures y credenciales; no conserva ediciones de
  esta sesión de testing. El script no hace build: compilar plugin y tema antes.

El servidor escucha solamente loopback. Para pruebas físicas posteriores se
requiere habilitar LAN explícitamente con las herramientas existentes; no se
expuso el panel a Internet en esta entrega.

## Arquitectura

Todo el panel vive en `plugins/rp-usados-security/`:

| Módulo | Responsabilidad |
|---|---|
| `inc/gestion-access.php` | Autenticación nativa, CSRF de invitado, rate limiting, recuperación real y autorización |
| `inc/gestion-routes.php` | Páginas privadas, headers no-cache/noindex, formularios POST y renovación segura de nonce |
| `inc/gestion-service.php` | Validación completa, título, publicaciones/estados, revisión de concurrencia y asociaciones de fotos |
| `inc/gestion-rest.php` | REST privado, schemas/allowlists y permisos server-side |
| `templates/gestion/` | Login, recuperación, acceso denegado, listado y formulario |
| `src/gestion/` | Mejora progresiva, uploads/progreso real, orden de fotos, feedback y recuperación de sesión |

Los módulos existentes de roles y Media siguen siendo la autoridad de
capabilities y uploads. No se movió ni reconstruyó el CPT del tema. Se reutilizan
los ocho campos actuales y los validadores existentes. Descripción corresponde
a `post_content`; portada y galería utilizan sus asociaciones existentes.

Listado: stock activo, disponibles, reservados, vendidos, borradores; búsqueda
por marca/modelo/versión. Filas compactas en desktop, tarjetas administrativas
en mobile. Cambio de estado con respuesta real y confirmación para vendido.
No se ofrecen borrado de vehículos ni borrado físico de archivos.

La revisión HMAC del contenido rechaza una edición obsoleta con 409. Un lock
serializa escrituras del panel. No se promete una transacción SQL global frente
a plugins externos que escriban directamente sin pasar por este servicio.
Cada payload se valida antes de mutar; hay restauración del snapshot ante fallo
detectado en las escrituras del servicio.

La sesión vencida mantiene lo escrito en memoria y ofrece reautenticación en
otra pestaña. Un bridge GET de sesión, protegido por cookie y origen, renueva
el nonce sin relajar permisos REST. No se persiste el formulario en localStorage.
Recargar/cerrar la pestaña puede perder cambios no guardados; se advierte al salir.

## Fotos

- JPEG/PNG/WebP, 12 MiB, 6000 px por lado y 24 MP; límites existentes intactos.
- Portada anterior conservada hasta éxito de reemplazo; última selección gana.
- Galería conserva orden de selección aunque las subidas terminen desordenadas.
- Dos subidas concurrentes, preview local, progreso XHR real y reintento individual.
- Orden por arrastre desktop o botones accesibles; quitar sólo asociación.
- HEIC/HEIF muestra una explicación clara; no se almacena ni convierte.
- Seleccionar fotos en una unidad nueva crea un borrador privado para alojarlas.
  Si se abandona, ese borrador permanece recuperable; no hay borrado automático.
- La política previa cuenta también attachments vinculados al vehículo aunque
  ya no estén en portada/galería. Al llegar al cupo, quitar una asociación no
  permite nuevas subidas: requiere revisión administrativa de archivos. Se
  conserva esa restricción de seguridad; su ergonomía puede revisarse por separado.

Sin JS: login, filtros/búsqueda, crear/editar/publicar y uploads multipart.
La reordenación y eliminación visual de asociaciones requieren JS; el fallback
lo explica. Marcar vendido exige una confirmación explícita también sin JS.

## Verificación

| Comprobación | Resultado |
|---|---|
| Servicio y REST en WordPress 6.8.11 / PHP 8.3.33 | 103 comprobaciones pasaron |
| HTTP real / cookies nativas / Edge 155 | 61 comprobaciones pasaron |
| Seguridad previa, PHP | 161 comprobaciones pasaron |
| Seguridad previa, HTTP nativo | 18 comprobaciones pasaron |
| Regresión pública desktop y 375/390/430 | 47 comprobaciones pasaron |
| Hero: assertions y red | 23 assertions y 3 pruebas pasaron |
| Flujo real de interfaz, uploads/publicación/edición/vendido | 11 comprobaciones pasaron |
| Carreras de respuesta de uploads | Orden de galería y última portada pasaron |
| Sintaxis PHP | 43 archivos válidos |
| Build público y manifest | Correctos; hashes de assets públicos sin cambios |
| Build independiente del panel | Correcto; CSS ≈15,34 KB / JS ≈15,65 KB sin nuevas dependencias |
| Audit de tema y herramientas | 0 vulnerabilidades reportadas |

La suite cubre anónimo, subscriber, gestor y Administrador; CSRF, nonce inválido
o ausente, IDs ajenos, MIME falso, HEIC, payload malformado sin borrar valores,
publicación incompleta, slug y moneda legados, edición concurrente, sesión vencida,
upload/reintento, orden y asociación de galería, formularios sin JS y estados.

En los tests HTTP heredados, el fixture desactiva sólo la redirección de comodidad
del gestor a `/gestion` para poder seguir probando el editor nativo; no desactiva
permisos. Los tests nuevos verifican el comportamiento del panel normalmente.

Capturas de listado/formulario 1440/375/390/430 en
`tools/.preview/gestion-local/qa/` y `tools/.preview/gestion-http/`.
Sin overflow, sin errores JS/404 en el panel, controles de 16px y focus visible.
Verificación adicional a 720px como referencia de layout al 200%.
Emulación desktop Edge: no equivale a pruebas físicas Safari/iPhone o Android.

## Pendientes antes de publicar el panel

- Verificar SMTP y recuperación de contraseña mediante un correo real en staging.
  No se simula envío exitoso cuando `retrieve_password()` informa fallo.
- Instalar en WordPress real con HTTPS, exclusión de caché para `/gestion` y REST
  privado, cookies/configuración de proxy correctas, backups y usuario del dueño.
- Verificar límites PHP/webserver de subida y capacidades de imagen del hosting.
- Probar teclado móvil, selector de fotos y sesión en dispositivos físicos.
- El rate limiting propio cubre acceso/recuperación del panel. La protección de
  otros accesos WordPress, como wp-login/XML-RPC, corresponde al hardening global.
- No hay conversión HEIC; depende de aprobación y soporte futuro del hosting.
- Listado acotado a 100 unidades por filtro, suficiente para el stock previsto;
  paginación o archivo histórico amplio son una ampliación posterior.

No cambió ningún archivo fuente del tema ni sus assets públicos. No se cargan
hero, videos, GSAP ni cursores del frontend público dentro del panel.
