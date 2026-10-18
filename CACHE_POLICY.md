# Política de caché

RC `v1.0.0-rc1` · 18/10/2026. Aplica al WordPress real, plugin de caché, proxy del hosting y CDN. Las exclusiones deben configurarse en **todas** las capas. Las cabeceras PHP no pueden deshacer una respuesta ya servida por una caché anterior a WordPress.

## Matriz de tratamiento

| Recurso o condición | Política |
| --- | --- |
| `/gestion` y `/gestion/*`, incluido login y `/gestion/sesion/` | Bypass total de caché compartida; respuesta privada/no-store |
| REST `/wp-json/rp-usados/v1/gestion/*`, también errores 401/403/409/422 | Privado/no-store; no almacenar datos ni nonces |
| Mismas rutas REST con `?rest_route=/rp-usados/v1/gestion/...` | Misma exclusión: el formato de URL no elimina la privacidad |
| Cualquier usuario autenticado | No servir ni almacenar HTML/REST privado mediante caché de página compartida |
| POST, PATCH, PUT, DELETE; login/logout y uploads | Nunca cachear; reenviar método, cuerpo, cookies y headers necesarios |
| `wp-admin`, `wp-login.php` y AJAX administrativo | Bypass según WordPress; no romper operaciones técnicas |
| Home, `/vehiculos/` y fichas anónimas | Empezar sin caché HTML compartida o con revalidación conservadora; activarla sólo si la purga de stock está integrada y probada |
| CSS/JS/fuentes con nombre de contenido hasheado | Pueden usar caché pública larga e `immutable` mientras el nombre cambie con su contenido |
| Videos/posters del hero con nombres fijos | Revalidación o TTL acotado; no `immutable` permanente sobre una URL que se reemplaza |
| Fotos públicas de vehículos | Caché pública de medios con nombres/versiones coherentes; purgar si se sustituye un archivo bajo la misma URL |

No utilizar “cache everything” ni una regla global que ignore `Set-Cookie`, `Cache-Control`, cookies `wordpress_logged_in_*`/`wordpress_sec_*` o `X-WP-Nonce`. El challenge `rp_gestion_csrf` tampoco debe quedar congelado por una página de login compartida. No bloquear REST entero como medida de seguridad: el panel lo utiliza con permisos reales.

## Protección de la aplicación

El plugin emite cabeceras privadas y `DONOTCACHEPAGE` para la gestión; las respuestas REST privadas conservan esa política incluso ante error. La capa de caché del plugin extiende el tratamiento a sesiones autenticadas y detecta la variante `rest_route`. Eso **no instala ni configura** un CDN o plugin de caché del proveedor.

En staging verificar con dos navegadores separados: uno gestor autenticado y otro anónimo. El anónimo nunca debe recibir listado privado, precios administrativos, formularios con sesión ajena ni un nonce reutilizado desde la respuesta del gestor.

## Invalidación del stock

El plugin mantiene una cola de vehículos afectados por escrituras en el CPT, metadatos `rp_*`, portada y borrado. La invalidación se despacha al cierre de la solicitud después del guardado; limpia la caché de objetos del vehículo y notifica:

```php
do_action( 'rp_usados_stock_cache_invalidated', $payload );
```

Contrato del evento:

```text
vehicle_ids: lista de IDs afectados
urls: Home, archivo /vehiculos/ y fichas afectadas, incluida URL previa al borrar
reason: stock_changed
```

Un adaptador del proveedor puede escuchar este evento para purgar **esas URL exactas**. Una escritura revertida puede provocar también una invalidación extra: una expulsión de caché redundante es segura y no equivale a una escritura confirmada. No se ejecutan solicitudes externas arbitrarias, purgas globales de object cache ni una integración supuesta con DonWeb/Cloudflare/otro servicio. La API concreta de purga depende del hosting **[dato pendiente — confirmar con el cliente]**.

Si el proveedor no ofrece una purga comprobable, mantener desactivada su caché HTML para Home, archivo y fichas. Un TTL corto reduce la duración de datos viejos pero no garantiza que un vendido salga inmediatamente; no debe venderse como equivalente a la purga.

## Verificación antes de habilitar caché pública

1. Con caché fría y después caliente, consultar Home/archivo/ficha anónimos.
2. Guardar precio: cambia en ficha; sigue ausente en cards/listados.
3. Cambiar Disponible → Reservado: se refleja en las superficies públicas correspondientes.
4. Cambiar a Vendido: sale de Home/archivo y se conserva la ficha directa según la lógica actual.
5. Volver a Disponible, pasar a Borrador y republicar; revisar los tres destinos en cada caso.
6. Reemplazar portada/reordenar galería y comprobar que HTML y derivados no permanezcan viejos.
7. Verificar las URL indicadas por el evento y la respuesta real del adaptador. No declarar purga exitosa porque se ejecutó sólo el hook.
8. Repetir desde otro navegador anónimo y desde CDN/origen si ambos existen; revisar `Age`, `Cache-Control`, `Vary`, `Set-Cookie` y el indicador de caché del proveedor, si lo ofrece.
9. Confirmar que `/gestion`, REST con ruta normal y `rest_route`, login y errores privados no producen HIT compartido.
10. Probar MP4 con Range: el servidor/CDN debe conservar `206 Partial Content` y `Content-Range` para seeking; no transformar el video de forma que rompa reproducción inversa por scroll.

Los uploads directos son archivos públicos de stock, no un repositorio de documentación privada. La autorización del endpoint de subida no convierte las URL de las fotos en archivos privados.

## Actualizaciones y rollback

Desplegar assets nuevos junto a su manifest; evitar un manifest que apunte a archivos aún no subidos. Conservar los assets hasheados previos durante la ventana de despliegue/retorno cuando corresponda para no romper documentos abiertos. Para nombres fijos del hero, purgar o versionar conscientemente la URL si algún día cambia el archivo, sin modificar el video durante este RC.

Tras un rollback, purgar HTML y las URL fijas reemplazadas; no vaciar toda la DB u object cache como sustituto de identificar qué versión está sirviendo cada capa. Registrar reglas y TTL reales fuera de estas recomendaciones antes de firmar el despliegue.

Referencia de contexto: [optimización y capas de caché de WordPress](https://developer.wordpress.org/advanced-administration/performance/optimization/). La política específica de RP Usados la define este documento y su implementación; no se deduce automáticamente de esa guía general.
