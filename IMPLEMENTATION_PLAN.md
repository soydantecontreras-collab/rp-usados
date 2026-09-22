# RP Usados — dirección e implementación

## Estado y alcance

Esta versión continúa la base con la Home autorizada por el segundo brief, el catálogo dinámico, la ficha y la administración nativa del CPT. Sustituye la dirección provisional clara/azul de la fase inicial por el concepto solicitado: **Trayectoria en movimiento**.

Hechos: RP Usados, fundada en 1990, 36 años de trayectoria a 2026; Chacabuco 399, Ciudadela, Buenos Aires, Argentina; toma de usados como parte de pago y financiación/venta en cuotas. Sin compra directa online. El catálogo no muestra precios.

Instagram @rpusados fue aportado como referencia visual pública; sus teléfonos y horarios no están confirmados. No se incorporaron a la web.

## Dirección visual de la primera versión

Aplicar frontend-design como guía principal; apple-design aporta jerarquía, legibilidad, control del usuario y movimiento con propósito. No trasladar convenciones de aplicaciones nativas ni identidad visual de Apple. La primera revisión design-qa quedó documentada en `design-qa.md`.

### Tokens y contraste

| Token | Valor | Función |
| --- | --- | --- |
| `--color-ink` | `#0B0B0D` | Fondo profundo |
| `--color-surface` | `#17181C` | Grupos y superficies secundarias |
| `--color-brand` | `#E5262A` | Línea de recorrido y acentos decorativos |
| `--color-brand-bright` | `#FF4A4A` | Acciones, foco y detalles activos |
| `--color-text` | `#F4F2F0` | Texto principal |
| `--color-muted` | `#A7A7AA` | Texto secundario |

Contrastes calculados con luminancia relativa WCAG: texto/fondo 17.61:1; secundario/superficie 7.39:1; rojo brillante/fondo 5.93:1. Los botones usan rojo brillante con texto oscuro. Texto claro sobre rojo base da 4.05:1 y no se usa para texto normal.

Paleta provisional proporcionada por el usuario, no manual de marca oficial.

### Tipo, ritmo y composición

Archivo Variable autoalojada (SIL OFL, licencia incluida), pesos regulares y firmes, cifras tabulares para datos, cuerpo mínimo 16px. El hero utiliza un tratamiento amplio de “Desde 1990”; los títulos se alinean a la izquierda y escalan con clamp(). Texto de lectura limitado a 72ch.

Una línea roja continua sugiere recorrido y contorno sin representar una unidad de stock. El hero reserva la media bajo el contenido y conserva una composición deliberada cuando está vacía. La cifra 36 está vinculada explícitamente al año 2026.

```text
Desktop                             Compacto
Marca         navegación            Marca
                                    navegación visible
Desde                               Desde
1990.            línea de recorrido  1990.
Ver vehículos                       Ver vehículos
Trayectoria      enlace             Trayectoria / enlace

Desde 1990       36 años             Desde 1990
                                    36 años
Servicios: dos columnas             Servicios apilados
Destacados: 3 / estado vacío         Destacados: 1 / vacío
Dirección        datos del lugar    Dirección / datos
Footer                              Footer
```

No se usa un menú hamburguesa: los tres destinos siguen disponibles sin JavaScript. No hay carruseles, overlays persistentes ni reveals repetitivos. La ubicación presenta únicamente la dirección confirmada en una lista estructurada; “Cómo llegar” abre una búsqueda de esa dirección en Google Maps.

### Autocrítica del plan antes de construir

Negro y rojo son parte del brief, por lo que se conservaron. Para evitar un resultado intercambiable con una landing automotriz, la composición se concentra en el dato propio “Desde 1990”, el ritmo tipográfico y una sola línea. Se descartaron vehículos genéricos, slogans y efectos de velocidad. Las secciones de servicios presentan sólo posibilidades confirmadas.

La firma sigue siendo provisional: el logo original y las imágenes reales tendrán que convivir con esta jerarquía. Las fotografías no deben tapar texto ni degradar contraste; el hero aplica un velo oscuro cuando se carga media.

## Arquitectura

```text
theme/rp-usados/
├── inc/
│   ├── setup.php
│   ├── assets.php
│   ├── post-types/vehiculo.php
│   ├── vehicle-data.php        # esquema, validación, consultas y guardas
│   ├── vehicle-admin.php       # metabox nativo y biblioteca de medios
│   └── customizer.php          # contacto confirmado y media del hero
├── template-parts/
│   ├── home/                  # hero, trayectoria, servicios, destacados, ubicación
│   └── vehicle/               # card, empty, whatsapp
├── src/scripts/               # main.js y admin.js
├── src/styles/                # tokens y estilos
├── licenses/Archivo-OFL.txt
├── assets/dist/               # Vite: manifest, CSS, JS y WOFF2
├── front-page.php
├── archive-vehiculo.php
├── single-vehiculo.php
├── header.php / footer.php / index.php
└── scripts/package-theme.mjs
```

El PHP genera todo el contenido y los enlaces. JavaScript mejora únicamente el selector de imágenes del administrador. El frontend queda utilizable sin JS; GSAP no está importado.

El CPT reside en el tema por la arquitectura solicitada. Un futuro plugin de dominio deberá conservar claves y slug para garantizar continuidad del inventario al cambiar de tema.

## Modelo del vehículo implementado

Título, descripción e imagen destacada usan campos nativos de WordPress. El título nunca debe incluir un precio.

| Clave | Tipo/validación | Uso |
| --- | --- | --- |
| `rp_marca` | Texto sanitizado | Ficha |
| `rp_modelo` | Texto sanitizado | Ficha |
| `rp_version` | Texto sanitizado | Ficha |
| `rp_anio` | Entero, 1886 a año actual + 1 | Card y ficha |
| `rp_kilometraje` | Entero no negativo | Card y ficha |
| `rp_precio_monto` | Decimal positivo normalizado, hasta 2 decimales | Sólo ficha |
| `rp_precio_moneda` | Tres letras mayúsculas, sin valor predeterminado | Sólo ficha |
| `rp_estado_stock` | disponible / reservado / vendido | Visibilidad y estado |
| `rp_destacado` | 0 / 1 | Selección para Home |
| `rp_galeria_ids` | IDs únicos de imágenes válidas, orden conservado | Galería |
| `rp_whatsapp_numero` | 8–15 dígitos internacionales, opcional | Receptor por unidad |
| `rp_whatsapp_mensaje` | Texto sanitizado, opcional | Consulta por unidad |

Marca/modelo se implementan como texto confirmado; no se crean términos ni marcas de ejemplo. Taxonomías y filtros quedan para la fase que conozca el volumen y variedad del stock real.

Metadatos registrados con `show_in_rest: false`, capacidades y sanitizadores. El guardado del metabox verifica nonce, permisos, autosave y revisiones. Los campos inválidos conservan el valor anterior y muestran aviso; un campo vacío elimina el valor. No asumir que el soporte de revisiones del post implica versionado de sus metadatos.

La galería usa la biblioteca nativa y permite ordenar IDs sin JavaScript. Los contactos e importe deben revisarse editorialmente: validar formato no equivale a confirmar datos comerciales.

## Reglas de consulta y precio

- Destacados: publish + disponible + destacado, máximo tres, más recientes primero.
- Catálogo: publish + disponible o reservado, doce por página.
- Vendidos y unidades sin estado quedan excluidos del catálogo; los vendidos conservan su ficha y estado.
- Cards y fallback de búsqueda nunca renderizan descripción, extracto, precio ni moneda.
- Descripciones/extractos de vehículos se ocultan en listados, feeds y respuestas REST anónimas para evitar filtración editorial de precios.
- La función de precio devuelve vacío salvo en el contexto individual de la unidad consultada.
- No se crean datos estructurados de precio, carrito ni pago.
- Si faltan importe o moneda en la ficha, mostrar el marcador exacto de dato pendiente.

## WhatsApp

Primero se usa el número específico de la unidad, luego el global del Personalizador. Ambos parten vacíos y deben ser confirmados por el cliente. El enlace usa el mensaje, título y URL canónica codificados.

Sin número confirmado se muestra un botón inactivo con explicación y el marcador. No se inserta un número extraído de Instagram ni un contacto de ejemplo. Es un pendiente para lanzamiento, no para esta revisión visual.

## Media y movimiento

- Logo: control nativo de WordPress; fallback tipográfico sin afirmar que es el logo oficial.
- Hero: imagen real o render aprobado; WebM opcional con poster y controles nativos.
- Sin imagen: línea y tipografía, sin placeholder de error ni stock ficticio.
- Sin fotografía de una unidad: marcador explícito.
- Video sin autoplay. Verificar material mudo/decorativo o proveer subtítulos/transcripción antes de publicar un clip que comunique información.
- Hooks `data-motion`: hero, hero-title, hero-actions, contour, trajectory.
- Futura integración GSAP + ScrollTrigger sólo con justificación, imports condicionales, matchMedia y limpieza.
- Nada oculto esperando JS. Reduced motion desactiva transiciones.

## Fases y aceptación

1. **Base y primera versión visual:** Home modular, administración, catálogo, ficha, tokens y build. Entrega actual.
2. **Revisión del cliente:** revisar composición, logo real, fotos/render y campos con inventario real.
3. **Design QA:** completado para la Home sin stock: escritorio/tablet/móvil/compacto, teclado, foco visible, contraste contextual, zoom al 200 %, consistencia, estado vacío y capturas. Repetir cuando exista stock y media real.
4. **Contenido y operación:** contacto confirmado, condiciones de financiación, estados, flujo editorial y pruebas de carga reales. Decidir filtros si el inventario lo justifica.
5. **Publicación:** seguridad, compatibilidad en hosting, SEO con datos verificados, imágenes, caché, páginas legales según necesidades confirmadas y prueba limpia del ZIP.

Criterios de esta versión: PHP válido, Home y estado vacío renderizados, build/manifest correctos, ningún precio en catálogo, botones sin URLs falsas, navegación sin JS y paquete instalable sin herramientas. Los smoke tests técnicos no sustituyen design-qa ni la prueba final con stock real.

## Referencias de implementación

- [WordPress: register_post_meta](https://developer.wordpress.org/reference/functions/register_post_meta/).
- [WordPress: pre_get_posts](https://developer.wordpress.org/reference/hooks/pre_get_posts/).
- [WordPress: save_post por tipo](https://developer.wordpress.org/reference/hooks/save_post_post-post_type/).
- [Playground CLI](https://developer.wordpress.org/playground/developers/local-development/wp-playground-cli/).
- apple-design: accessibility.md › Vision; layout.md › Visual hierarchy; typography.md › Conveying hierarchy; motion.md › Best practices. Se aplican los principios a web.

## Pendientes

Logo original; fotografías reales del local/unidades o render de Blender aprobado; WebM si se decide utilizarlo; WhatsApp confirmado; formato y moneda reales de los importes; condiciones de financiación; horarios y email sólo si el cliente los confirma y pide mostrarlos; nueva revisión design-qa con stock y media reales; instalación en el hosting definitivo.

Para datos necesarios sin confirmar: `[dato pendiente — confirmar con el cliente]`.
