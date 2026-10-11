# RP Usados — Seguridad y gestión de stock

Infraestructura de seguridad existente más panel privado server-rendered `/gestion/`.

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

Usuarios y cookies nativas de WordPress, `wp_signon()`, nonces REST y del
formulario, challenge CSRF anónimo firmado y rate limit de login. Sólo
Administrador o `rp_stock_manager` con las capabilities correspondientes.
No hay JWT, localStorage, SPA ni credenciales en el bundle.

Rutas: `/gestion/`, `/gestion/nuevo/`, `/gestion/vehiculos/{id}/`.
REST privado: `/wp-json/rp-usados/v1/gestion/vehiculos`, `/{id}`,
`/{id}/publicacion`, `/{id}/estado` y `/fotos`.
`/gestion/sesion/` renueva el login nativo mediante challenge CSRF.
Los datos privados responden `private, no-store` y `noindex`.

El panel aplica la política de fotos también al Administrador. La biblioteca
nativa del Administrador conserva sus permisos anteriores. HEIC/HEIF se rechaza
con un mensaje específico. Quitar una asociación nunca borra el attachment.
Las nuevas subidas quedan pendientes hasta guardar un vehículo validado.

CSS/JS del panel se compilan por separado del tema:

```sh
cd plugins/rp-usados-security
pnpm install --frozen-lockfile
pnpm build
```

Desde la raíz: `node tools/package-security-plugin.mjs` genera el ZIP del
plugin sin dependencias ni herramientas de desarrollo. Requiere las
dependencias de empaquetado ya documentadas del tema. Fuentes y licencias de
Manrope/Archivo se incluyen localmente, sin consultas externas.

El layout, login, filtros, carga y guardado funcionan con PHP sin JavaScript.
Las mejoras JS añaden progreso real, previews, orden de galería, protección
de cambios sin guardar y recuperación de sesión. Los datos de recuperación
se guardan sólo en `sessionStorage`, por pestaña, con validez de 15 minutos;
jamás incluyen contraseñas, cookies ni nonces. Un guardado exitoso los elimina.

En producción usar HTTPS y excluir `/gestion/*`, `/gestion/sesion/*` y
`/wp-json/rp-usados/v1/gestion/*` del caché/CDN. Las cabeceras del plugin no
pueden controlar un proxy configurado para ignorarlas. Respaldar DB/uploads.
