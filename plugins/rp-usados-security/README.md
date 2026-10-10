# RP Usados — Seguridad de stock

Infraestructura de seguridad, sin interfaz ni endpoints nuevos de `/gestion`.

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
