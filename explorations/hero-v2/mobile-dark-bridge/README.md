# Mobile: negro integrado al hero

Prueba independiente autorizada el 06/10/2026. No adopta una variante en el tema
ni modifica producción/preview principal, Blender, videos, posters o backend.
No commit/push. La base es el snapshot aprobado 3d081ca y el layout A estable,
sin overscan ni cambio de crop: wrapper DVH y escena/copy/CTA SVH capturada.

## Probar

- Local: http://127.0.0.1:9497/hero-mobile-dark-bridge/
- Temporal pública con contenido ampliado: https://rp-usados-hero-ab-20261006-5c3p1jqxm-dante42.vercel.app/hero-mobile-dark-bridge/
- Prueba anterior conservada: https://rp-usados-hero-ab-20261006-69remn481-dante42.vercel.app/hero-mobile-dark-bridge/

Documento completo: header -> hero -> puente negro -> curva sutil -> sección
mínima. Sin iframe, panel o scroll propio. No pretende publicar toda la Home.

## Contenido ampliado para la prueba física

La sección posterior ahora es clara, con título CATÁLOGO / TEST, tres bloques
ficticios identificados como DEMO y un checkpoint al final. Altura mínima 150svh,
en flujo normal, sin scroll interno. content-test.css sólo afecta ese contenido.
El hero, effect.css, puente y SVG de curva permanecen idénticos al export anterior.

QA local desktop y 375/390/430: hero completo, curva, sección clara y 600+px de
scroll posterior. QA público desktop: scrollY 360 -> 1548 (sección clara) -> 2177
(checkpoint final). A 390px: 1672 -> 2423. El stage está fuera del viewport al
llegar al catálogo; no captura el scroll. No errores de consola. Evidencia en
tools/.preview/hero-dark-bridge-content-qa/. Nuevo deploy temporal target null,
proyecto principal intacto. La validación real de las barras sigue pendiente.

Desde la raíz del repositorio:

```powershell
node explorations/hero-v2/mobile-dark-bridge/build.mjs
node explorations/hero-v2/mobile-dark-bridge/serve.mjs
```

## Tratamiento

El primer frame tiene cero cobertura añadida. El fundido crece desde el borde
inferior con el progreso; su extremo termina en #000 para mezclarse con el
wrapper. El espacio adicional DVH sigue existiendo físicamente, pero se integra
con ese negro. No se rellena ampliando o recentrando la fotografía.

Una máscara SVG en coordenadas del video oscurece sólo el vano libre y protege
las hojas/barrotes/manijas. Su posición sigue el frame presentado por el callback
del seek controller existente, no el tiempo solicitado. Opacidad máxima 99,4%.
La geometría de la máscara es una prueba trazada contra el render aprobado;
necesita aprobación visual en el teléfono, no se considera un asset final.

Un plugin Vite de esta carpeta modifica sólo el bundle experimental en un output
ignorado. Importa el helper de efecto sin editar los scripts del tema. Un solo
progreso, un solo controlador de seeks, sin RAF/timeline adicional. El SVG se
reajusta mediante ResizeObserver al tamaño real de la imagen con contain.
Desktop no aplica efectos; landscape conserva el video vertical completo.
Sin JS o con reduced motion/fallo de video permanece el fallback aprobado.

## Evidencia

Build Vite exitoso (15 módulos). Sintaxis JS válida. Git diff del tema vacío.
Hashes de los cuatro videos/posters exportados idénticos a los originales.
72 verificaciones geométricas/estado sobre lectura DOM en Chromium: 375/390/430,
+16/+72, ida/vuelta y restauración del aspecto inicial. Imagen/CTA: movimiento
0 px; wrapper: crecimiento 16/72 px. Negro exterior y fundido enlazan visualmente.
También se revisaron llegada cercana, reload a mitad, landscape y desktop.

La preview pública presentó el video mobile y la máscara sincronizada, reload a
mitad, avance/reversa y salto al contenido con foco. Sin errores/warnings de
consola. HTML, CSS experimental y módulo hero públicos coinciden byte por byte
con el export limpio. Deployment READY, target null; destinos del proyecto
principal permanecen idénticos antes/después. Proyecto temporal separado.

Reportes/capturas: `tools/.preview/mobile-dark-bridge/` y
`tools/.preview/hero-dark-bridge-deploy/`. Frames JPG extraídos sólo para análisis
no se exportaron ni se publicaron. Sin Three.js/GLB/HDR o secuencia de imágenes.

El QA desktop simula SVH=760 y crecimiento real de la ventana para +16/+72 usando
una query explícita de medición. La URL pública normal no fija alturas de ningún
teléfono. Chrome Android, su animación de barras y la franja del sistema requieren
la prueba física del usuario. Reduced motion se revisó en código, no mediante
emulación de la preferencia del SO en esta ejecución. No se afirma resuelto el
notch físico hasta esa prueba.
