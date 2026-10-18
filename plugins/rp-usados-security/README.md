# RP Usados — Seguridad de stock

Plugin de seguridad y panel privado `/gestion`, versión 1.1.0.

Instalar y activar como plugin independiente antes de usar el tema actualizado.
La activación otorga capabilities de Vehículo al Administrador y crea
`rp_stock_manager`. No cambia roles de usuarios existentes ni migra inventario.
El Administrador asigna ese rol a la cuenta del dueño cuando corresponda.

El gestor puede administrar todo el stock, pero sólo editar/borrar sus imágenes
de stock. Puede conservar y utilizar imágenes heredadas ya asociadas al mismo
vehículo. No puede incorporar IDs ajenos arbitrarios ni reasignar archivos.

Uploads del gestor: JPEG, PNG y WebP, 12 MiB, 6000 px por lado y 24 MP como máximos;
20 imágenes distintas por vehículo y 40 uploads pendientes sin vehículo. El
Administrador conserva acceso completo a Media; los límites del gestor no se
aplican al Administrador. La validación de estructura de datos sí se aplica.

La desactivación revoca las escrituras/uploads del rol, conserva lectura,
usuarios, stock, archivos y acceso del Administrador. No borrar manualmente el
directorio del plugin mientras haya cuentas gestoras activas: una eliminación
manual omite el hook de desactivación. El plugin debe estar activo junto al tema.

Ver `SECURITY_FOUNDATION.md` en el repositorio para instalación, pruebas,
restricciones de desarrollo y requisitos de hosting.

## Panel privado

El panel utiliza usuarios, `wp_signon()` y cookies nativas de WordPress. El
Administrador y `rp_stock_manager` pueden ingresar; los demás roles reciben
acceso denegado. Login y recuperación tienen CSRF de invitado ligado a cookie
HttpOnly y límite de intentos. No hay JWT, contraseñas de producto ni datos de
autenticación en almacenamiento del navegador.

Rutas: `/gestion/`, `/gestion/nuevo/`, `/gestion/vehiculos/{id}/`. El namespace
REST privado es `rp-usados/v1/gestion`, con permisos por objeto, nonce de cookies,
schemas y respuestas no cacheables. Formularios POST proporcionan guardado y
subida básicos sin JavaScript. El tema actual debe estar activo: se reutilizan
su CPT, campos y validadores. No es una migración del inventario.

Antes de empaquetar:

```powershell
node tools/build-gestion.mjs
node tools/package-security-plugin.mjs
```

El ZIP incluye PHP, templates y assets compilados; excluye fuentes JS/CSS,
herramientas, fixtures y credenciales. El build requiere las dependencias Vite
ya instaladas del tema. Los assets se compilan separadamente y se cargan sólo
en el panel. No sustituye el build del frontend público.

Publicar exige marca, modelo, año, estado comercial y portada. Borradores
incompletos están permitidos. El título es automático; una edición conserva
el slug. Vendido conserva el vehículo y su URL, pero sale del stock activo.
Una revisión firmada detecta ediciones obsoletas; las escrituras del panel
se serializan por objeto. Payloads inválidos se rechazan antes de escribir.

Quitar una foto elimina únicamente su asociación con portada/galería: nunca
borra el archivo. La política anterior también cuenta attachments vinculados
al vehículo para el cupo de uploads: quitar una asociación no libera ese cupo.
Al alcanzarlo, un Administrador debe revisar los archivos conservados. No se
amplió el límite ni se agregó borrado físico automático.

Ver `GESTION_LOCAL.md` para acceso de testing, resultados y límites de hosting.
