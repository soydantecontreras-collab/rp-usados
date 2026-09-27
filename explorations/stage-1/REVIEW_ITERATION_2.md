# Revisión de Stage 1 — Iteración 2

24/09/2026. Exploración local; no es un despliegue ni una modificación del tema WordPress.

## Resultado

- Manrope en interfaz/títulos/cuerpo y Archivo en datos: verificado mediante estilos computados y fuentes realmente cargadas. Sólo se cargan esas dos familias.
- Catálogo sin formulario, inputs ni selectores. Seis muestras explícitas, disponibles/reservadas, sin importes ni unidades reales inventadas.
- Clic sobre foto, título y specs abre la misma página de ficha. Un único enlace envuelve cada tarjeta; no hay controles interactivos anidados.
- Navegación al detalle sin JavaScript verificada. La galería de muestra y el aviso de WhatsApp requieren JS; no representan cambios a la lógica del sitio actual.
- Hover medido: escala 1,015 en la capa de imagen. Reduced motion desactiva transiciones y transformaciones. No se revelan datos sólo en hover.
- Galería con botones, vistas y flechas del teclado; estado reservado conservado en la ficha de muestra.
- WhatsApp abre un aviso de número pendiente, sin contactar a nadie. Contención de foco, Escape y devolución de foco al botón original comprobados.
- Home y ficha revisadas a 1440, 768, 390 y 320 px, sin desborde horizontal ni errores JS propios. Zoom CSS al 200% también sin desborde después de ajustar el envolvimiento del header.
- Mapa de Google cargado y revisado visualmente en desktop/mobile, con marcador R.P. Usados, controles y atribución. Los enlaces Cómo llegar/Abrir Maps permanecen fuera del iframe.

## Comprobaciones visuales

1. **Superficies:** el catálogo usa concreto y la información piedra clara; Nosotros grafito, financiación clara, ubicación gris y contacto negro. La web no se volvió enteramente oscura.
2. **Tipografía:** Manrope domina lectura y navegación; Archivo queda en numeración y labels. Se retiró el comparador A/B/C.
3. **Catálogo:** dos filas de tres unidades de muestra en desktop; una columna en teléfono. El cambio de hover no mueve el layout ni los datos.
4. **Ficha:** galería a ancho de pantalla, encabezado propio y franja de specs; no modal ni card agrandada. Mobile apila los controles sin depender de hover.
5. **WhatsApp:** símbolo reconocible monocromo y copy explícito dentro del sistema de botones. Barra de consulta sólo en ficha, con safe area y espacio final reservado.
6. **Ubicación:** panel de dirección y mapa forman una composición; en mobile se apilan. El mapa mantiene colores y atribución de Google.
7. **Logo e imágenes:** espacio original pendiente, sin wordmark inventado. Se retiraron las fotos institucionales de relleno. El estudio anterior se mantiene sólo en el hero provisional, identificado como tal.

## Contraste

Mediciones sRGB de pares sólidos:

| Par | Relación |
| --- | ---: |
| Tinta / concreto | 9,59:1 |
| Texto secundario / piedra | 5,65:1 |
| Blanco / negro | 15,83:1 |
| Acento cálido / negro | 5,94:1 |
| Acento oscuro / blanco | 7,34:1 |

El acento sobre grafito da 4,34:1: se reserva a números grandes. El label pequeño de Nosotros usa una variante más clara. Los botones de galería tienen foco negro sobre superficie clara. Esto no constituye una auditoría WCAG completa ni validación con lector de pantalla.

## Evidencia y comandos

- `node explorations/stage-1/review-iteration-2.mjs`: prueba reproducible con Playwright y Edge ya disponibles en el entorno; sin instalar paquetes.
- Resultados y capturas actuales: `review/iteration-2/`. Las capturas fuera de esa carpeta pertenecen a la iteración anterior.
- `npm.cmd --prefix theme/rp-usados run build`: aprobado. Manifest válido y archivos referidos presentes.
- No se alteraron fuentes PHP/JS/CSS del tema, administración ni datos; se preservó el `.gitkeep` preexistente al ejecutar el build. No se reactivó WordPress ni cambiaron enlaces permanentes porque no hubo cambios funcionales.

## Límites intencionales

- No hay logo original ni fotografías de stock confirmadas. Por eso las muestras no permiten juzgar todavía color, crop ni calidad comercial de un vehículo real.
- No se realizó una nueva generación raster. El PNG del hero es el estudio previo sin optimización de distribución; no es asset final.
- El mapa usa la inserción pública obtenida desde Google Maps, sin SDK, clave ni cuenta de facturación. En esta exploración se carga de forma directa para revisarlo; diferir la carga será parte de la integración. El contenido externo puede tardar o fallar y no se presenta como validación de teléfonos/horarios.
- El zoom probado incluye CSS al 200% y múltiples viewports; queda pendiente validación en teléfono físico, zoom nativo y tecnologías de asistencia sobre la implementación integrada.
- El número real de WhatsApp sigue pendiente. No hay mensajes enviados ni enlaces a un número ficticio.
- No se ejecutó Blender, blockout ni integración 3D. La Etapa 2 requiere autorización del usuario.

## Abrir la revisión

`http://127.0.0.1:9411/explorations/stage-1/` y `vehiculo.html` en la misma carpeta.

Si el servidor se detiene: desde la raíz, `python -m http.server 9411 --bind 127.0.0.1`. También se pueden abrir los HTML directamente; el mapa requiere conexión a Google.
