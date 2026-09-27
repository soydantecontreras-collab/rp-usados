# RP Usados — reglas permanentes del proyecto

Este repositorio contiene la base del sitio de **RP Usados**, una concesionaria de vehículos usados de Ciudadela, Buenos Aires. Estas reglas son vinculantes para cualquier persona o agente que trabaje en el proyecto.

## Hechos confirmados

- Nombre comercial: RP Usados.
- Fundación: 1990.
- Trayectoria: 36 años a 2026.
- Dirección: Chacabuco 399, Ciudadela, Buenos Aires, Argentina.
- La empresa toma vehículos usados como parte de pago.
- La empresa ofrece financiación y venta en cuotas.
- La web no permite comprar vehículos directamente.
- El stock se administra dinámicamente.
- El catálogo no muestra precios.
- El precio se muestra únicamente en la ficha individual de cada vehículo.
- Cada ficha individual debe tener un botón de WhatsApp específico para esa unidad.

## Datos que no se pueden inventar

No afirmar ni completar dueño, equipo, teléfonos, WhatsApp, email, horarios, marcas especializadas, estadísticas, reseñas, redes sociales, métodos o condiciones de financiación, historias de la empresa ni ningún otro dato no confirmado.

Cuando un dato sea necesario y todavía no esté validado, escribir exactamente:

`[dato pendiente — confirmar con el cliente]`

No reemplazar el marcador por ejemplos que parezcan reales. Los textos de prueba deben identificarse como datos de desarrollo y nunca publicarse.

## Alcance técnico obligatorio

- WordPress sin WooCommerce.
- Tema clásico personalizado en PHP.
- Sin Elementor, builders ni Full Site Editing.
- Catálogo mediante el Custom Post Type `vehiculo`.
- CSS y JavaScript fuente compilados con Vite.
- El tema debe poder empaquetarse como un `.zip` instalable.
- GSAP y ScrollTrigger sólo pueden incorporarse a una interacción con propósito explícito. No agregar animaciones ornamentales o repetitivas.
- Respetar `prefers-reduced-motion`; el contenido y las acciones nunca deben depender del movimiento.

## Estado actual y límites de fase

Actualización aprobada 27/09/2026: Hero V2 A desktop y render vertical mobile cerrados; Stage 1 / Iteración 02 es la fuente visual productiva, con Manrope + Archivo. La Home normal usa prerender responsive, negro, puente web, curva sutil y catálogo completo del CPT sin filtros/destacados/precios. Esta actualización sustituye la dirección visual provisional descrita más abajo. No rediseñar ni rerenderizar heroes, no volver a Three.js, no deploy sin aprobación. Ver `PRODUCTION_FRONTEND.md` para implementación y datos pendientes. Usar frontend-design-codex y ui-ux-pro-max para este frontend, sin skills redundantes.

La fase actual está autorizada por el pedido de continuación: primera versión de la Home, catálogo dinámico y ficha individual con administración nativa. Aplicar el concepto “Trayectoria en movimiento” con la paleta provisional negro/rojo/blanco indicada por el cliente. No crear stock, imágenes de vehículos ni contenido comercial ficticio.

Las fotografías actuales del local tomadas por el dueño fueron recibidas como referencia el 22 de septiembre de 2026. Tienen prioridad sobre Street View para colores, fachada, cartel, materiales y estado actual; Street View sólo es referencia secundaria para geometría, proporciones y contexto urbano. Ante diferencias, prevalecen las fotos actuales: el acceso de la esquina es negro en ellas, aunque aparece rojo en Street View. Consultar `VISUAL_REFERENCES.md` y sus archivos de referencia.

Logo original, fotografías y datos confirmados de unidades, video o render aprobado, WhatsApp y condiciones específicas siguen pendientes. La falta de estos materiales no bloquea esta versión visual: dejar espacios intencionales y el marcador de dato pendiente donde sea necesario. Instagram @rpusados es una referencia pública aportada por el usuario, no una confirmación de sus horarios o teléfono.

Usar frontend-design primero y apple-design para principios. La primera auditoría design-qa de la Home sin stock quedó autorizada y completada; repetirla cuando se incorporen stock y media reales.

## Enfoque de desarrollo

1. Mantener separadas presentación, registro de contenido y carga de assets.
2. Escapar toda salida y sanitizar toda entrada con APIs de WordPress.
3. Proteger escrituras administrativas con permisos y nonces.
4. Usar HTML semántico, navegación por teclado, foco visible y contraste WCAG 2.2 AA.
5. Diseñar mobile-first sin depender del hover.
6. Mantener el catálogo y la ficha individual accesibles sin JavaScript.
7. Tratar JavaScript como mejora progresiva.
8. No mostrar precio en archivos, resultados de búsqueda, relacionados, tarjetas, datos estructurados de listado ni respuestas auxiliares creadas para el catálogo.
9. En la ficha individual, generar el CTA de WhatsApp con el vehículo identificado por título y URL. El sitio no puede pasar a producción hasta que el número real esté confirmado.
10. No agregar un checkout, carrito, reserva con pago ni mensajes que impliquen compra online.

## Dirección de diseño

`frontend-design` guía la identidad visual y evita soluciones de plantilla. Los principios de `apple-design` se aplican sólo como referencia de claridad, jerarquía, ritmo, accesibilidad y feedback; no se imita la estética ni la identidad visual de Apple.

La dirección inicial está documentada como provisional en `IMPLEMENTATION_PLAN.md`. No convertir esos tokens en una identidad definitiva sin contrastarlos con materiales reales de RP Usados.

## Estructura y convenciones

- Documentación de proyecto en la raíz.
- Tema en `theme/rp-usados/`.
- PHP modular en `theme/rp-usados/inc/`.
- Fuentes de frontend en `theme/rp-usados/src/`.
- Build de Vite en `theme/rp-usados/assets/dist/`.
- Paquete instalable en `dist/rp-usados.zip`.
- Prefijo PHP: `rp_usados_`.
- Prefijo de metadatos: `rp_`.
- Text domain: `rp-usados`.

## Verificación mínima antes de entregar cambios

- Ejecutar el build de producción.
- Revisar que el manifest de Vite pueda ser leído por el tema.
- Validar sintaxis PHP cuando haya un runtime disponible.
- Probar activación en WordPress y regeneración de enlaces permanentes si cambió el CPT.
- Probar teclado, foco, zoom al 200 %, ancho móvil y `prefers-reduced-motion`.
- Confirmar que ningún listado muestra precios.
- Confirmar que el `.zip` instala el tema bajo la carpeta `rp-usados` y no contiene `node_modules`, fuentes de desarrollo ni herramientas de build.
