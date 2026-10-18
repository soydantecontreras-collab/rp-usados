# Cargar y mantener el stock real

Guía para el dueño y para quien prepare la cuenta de RP Usados. El panel es `/gestion/`; no hace falta usar wp-admin para el trabajo cotidiano. Los vehículos DEMO de las pruebas están aislados y **no son inventario autorizado para producción**.

## Preparación de la cuenta

Un Administrador instala y activa el plugin y el tema, crea la cuenta real y asigna `RP Usados - Gestor de stock`. El dueño recibe su usuario, contraseña y URL por un canal privado. No reutilizar contraseñas ni cuentas de las pruebas locales. Configurar y comprobar el email de recuperación antes de la entrega.

Entrar a la URL HTTPS del sitio seguida de `/gestion/`. Si el login está bloqueado tras varios intentos, esperar el plazo indicado; no insistir ni compartir la contraseña para “desbloquear”. La cuenta Administrador es para mantenimiento técnico y permanece separada.

## Qué preparar antes de cargar

| Campo | Para publicar | Cómo usarlo |
| --- | --- | --- |
| Marca | Obligatorio | Nombre real de la marca |
| Modelo | Obligatorio | Modelo real; no hace falta escribir un título aparte |
| Versión | Opcional | Sólo si está confirmada |
| Año | Obligatorio | Año confirmado, sin texto adicional |
| Estado comercial | Obligatorio | Disponible, Reservado o Vendido |
| Precio | Opcional | Importe sin separadores de miles; no escribir el símbolo de moneda aquí |
| Moneda | Necesaria si hay precio | ARS o USD para unidades nuevas; una moneda válida heredada puede conservarse |
| Kilometraje | Opcional | Kilómetros reales, sin inventarlos cuando no se conocen; cero es un valor, no equivale a vacío |
| Foto principal | Obligatoria | Portada real de esa unidad |
| Galería | Opcional | Otras vistas de la misma unidad |
| Descripción | Opcional | Información confirmada; sin promesas o características inventadas |

El panel no agrega combustible, transmisión ni motor: esos campos no forman parte del esquema aprobado. No cargar datos falsos para completar espacios. El nombre se genera desde **Marca + Modelo + Versión, si existe + Año**. Al editar, se conserva el slug/URL existente.

## Primera carga

1. Tocar **Cargar vehículo**.
2. Completar los datos conocidos. Se puede **Guardar borrador** incompleto.
3. Subir la foto principal y, si se desea, varias fotos a la galería.
4. Esperar el resultado real de las subidas. Reintentar o descartar las fallidas; no asumir que una preview local ya está guardada.
5. Revisar precio/moneda, año, fotos y estado comercial.
6. Elegir **Publicar vehículo** cuando estén completos los requisitos. Confirmar “Cambios guardados” y comprobar su ficha pública.

Un borrador nunca aparece en el catálogo. Guardar borrador sobre una unidad publicada la retira de publicación hasta volver a publicarla: no usar esa acción por error cuando sólo se quiere actualizar el precio.

## Fotos sin Media Library

- Usar JPG/JPEG, PNG o WebP; como máximo 12 MiB por archivo, 6000 px por lado y 24 megapíxeles. Máximo **20 imágenes distintas por vehículo, contando la portada**.
- La política valida el archivo real en el servidor. Cambiar `.heic` a `.jpg` no convierte la imagen ni evita esa validación.
- HEIC/HEIF no está admitido: exportar o convertir la foto a JPG/PNG/WebP antes de subirla. No se realiza una conversión silenciosa.
- Elegir **reemplazar** para cambiar la portada. Una subida fallida conserva la anterior.
- En galería se pueden agregar fotos después, ordenar arrastrando cuando resulte cómodo y utilizar los controles accesibles de orden. **Usar como principal** permite elegir otra portada.
- **Quitar** elimina la asociación con el vehículo. No borra físicamente el archivo. No usar el borrado de Media como solución para ordenar una galería.
- Las fotos subidas pero no asociadas quedan pendientes; existe un límite de 40 pendientes por usuario. Si se alcanza, guardar las asociaciones útiles o pedir revisión técnica; no borrar archivos masivamente.
- Las fotos de vehículos se sirven como medios web públicos. No subir documentación personal, patentes de terceros sin autorización ni imágenes confidenciales esperando que el login proteja su URL.

Con JavaScript se dispone de previews, progreso y reintento individual. Sin JavaScript sigue disponible el formulario PHP y la selección de archivos; las mejoras de orden/progreso no son equivalentes. El hosting puede limitar el tamaño total del lote sin JS aunque cada foto cumpla 12 MiB: subir menos por vez si se informa ese límite.

## Editar una unidad

Desde el listado, **Editar** abre el mismo formulario con los datos existentes. Cambiar sólo lo necesario y elegir **Guardar cambios**. El precio se ve en gestión y en la ficha pública, **nunca en las cards o el catálogo público**. El WhatsApp de la ficha conserva identificación y URL de la unidad; el dueño no necesita configurar un teléfono por vehículo.

Al cambiar estado mediante una acción rápida, esperar confirmación del servidor. Si otra persona modificó la misma unidad, el panel informa el conflicto: revisar o recargar la versión actual antes de guardar. No volver a enviar repetidamente para intentar forzar el guardado.

## Publicación y estado comercial son diferentes

| Situación | Catálogo público | Conservación |
| --- | --- | --- |
| Publicado + Disponible | Aparece | Datos y ficha conservados |
| Publicado + Reservado | Aparece identificado como reservado | Datos y ficha conservados |
| Publicado + Vendido | No aparece en el stock activo | Vehículo y ficha directa conservados según el comportamiento actual |
| Borrador | No aparece | Se puede seguir editando y publicar después |

Para vender, marcar **Vendido** y confirmar el aviso de salida del catálogo. No borrar el vehículo. El listado ofrece Stock activo, Disponibles, Reservados, Vendidos y Borradores, además de búsqueda por marca/modelo/versión. Una venta cancelada se corrige editando el estado; no hace falta crear otra unidad.

## Si algo falla

| Mensaje/situación | Qué hacer |
| --- | --- |
| Campo inválido o requerido | Corregir lo señalado y volver a guardar; no se deben aceptar guardados parciales |
| Foto no admitida | Exportarla a un formato permitido; revisar peso y dimensiones |
| Subida cortada | Reintentar esa foto o descartarla de la cola; verificar conexión |
| Sesión vencida | Iniciar sesión de nuevo mediante la opción del panel y revisar lo escrito antes de guardar |
| Edición simultánea | Revisar la versión más nueva; la recarga explícita puede descartar cambios locales |
| Otro guardado en curso | Reintentar después; si persiste, informar al responsable técnico, sin borrar opciones de WordPress |
| Salir con cambios pendientes | Guardar o aceptar explícitamente descartarlos |

La recuperación temporal guarda campos e IDs ya subidos por pestaña durante un máximo de 15 minutos, sin contraseñas ni archivos binarios pendientes. Es una ayuda ante interrupciones; **no reemplaza guardar un borrador ni un backup**. Cerrar la pestaña, borrar datos del navegador o usar otro dispositivo puede impedir recuperarlos.

## Primera incorporación de inventario real

El dueño debe confirmar lista de unidades, disponibilidad/reserva, año, kilometraje, precio/moneda cuando corresponda y fotografías autorizadas. Cargar primero una unidad real autorizada, comprobar Home, catálogo, ficha, WhatsApp y galería, y continuar con el resto. No migrar usuarios, DB ni fotos DEMO desde Playground.

Pendientes para comenzar esa carga: **[dato pendiente — confirmar con el cliente]**. WhatsApp y mapa ya están confirmados y no requieren inventar reemplazos.
