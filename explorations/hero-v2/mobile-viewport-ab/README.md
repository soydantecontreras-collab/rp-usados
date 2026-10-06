# Hero mobile — comparación local A/B

Sólo exploración. El tema productivo, backend, videos, poster, duración, cámara,
curva y recorrido permanecen intactos. No hubo commit, push ni deploy.

## Abrir

Sandbox: http://127.0.0.1:9493/

El servidor está iniciado para esta revisión. Si se cierra, este comando funciona
desde cualquier carpeta de PowerShell:

```powershell
node "C:\Users\dante.DESKTOP\Desktop\rp-usados-gpt\rp-usados\explorations\hero-v2\mobile-viewport-ab\serve.mjs"
```

Seleccionar A/B, luego Inicial / +16 / +72. Hacer scroll **dentro del iframe**.
Cambiar la variante no recarga el video ni modifica el progreso. El formulario
de ancho/altura recarga el escenario explícitamente, desde el primer frame.
Se muestran medidas en píxeles CSS, no píxeles de la captura del teléfono.

Rutas sin inspector:

- A: http://127.0.0.1:9493/hero.html?variant=A
- B: http://127.0.0.1:9493/hero.html?variant=B

En las rutas nativas se captura el `100lvh` real por ancho/orientación. En el
iframe, LVH y SVH no representan barras de navegador: por eso se captura antes
del paint una altura pequeña explícita y un máximo pequeño +72. Los botones
cambian la altura real del viewport hijo. No se descuenta ninguna barra Android.
El servidor es sólo localhost; no se ha publicado para un teléfono físico.

## Responsabilidades

- A usa exactamente el snapshot aprobado del commit
  `3d081cac07b02105634b8f01eaa24423bec53d4d`.
- B usa el mismo wrapper dinámico y controlador de progreso/seek.
- B fija sólo el plano de video/poster al máximo y lo ancla arriba. Usa `cover`
  para llenar el lienzo, sin distorsionar la proporción. El wrapper recorta.
- Texto, CTA y cue mantienen el escenario pequeño aprobado. El sombreado que ya
  acompaña al CTA continúa debajo de ese escenario para evitar un corte tonal.
- B es una propuesta **portrait**. Landscape conserva A: aplicar cover al render
  vertical en horizontal recortaría demasiado edificio.
- La inicialización estructural aprobada ocurre en head, antes del primer paint.
  No hay transición relative → sticky agregada por la sandbox.
- No se añadieron tiempos de espera, compensaciones de scroll, reproducción,
  interceptores de gesto, librerías ni assets. El script de QA usa scrollTo sólo
  como conductor de pruebas, nunca como comportamiento de la página.

## Resultado medido

Chrome desktop con viewports emulados, 05/10/2026. Configuración de referencia:
393 ×760, máximo 393 ×832, header 60. Negro inferior **de layout**:

| Viewport | A: extra wrapper | A: total bajo imagen | B: total bajo imagen |
|---|---:|---:|---:|
| Inicial | 0 | 0,67 px | 0 |
| +16 | 16 px | 16,67 px | 0 |
| +72 | 72 px | 72,67 px | 0 |

A conserva el frame completo. En B el lienzo es de 772 px; la imagen crece
10,50 %. Se recortan 34,20 px del original en cada lateral (9,50 % total del
ancho). Recorte inferior del original de 720 ×1280:

| Viewport | Original oculto abajo | % altura original |
|---|---:|---:|
| Inicial | 119,38 px | 9,33 % |
| +16 | 92,85 px | 7,25 % |
| +72 | 0 | 0 % |

No se recorta por arriba. El suelo visible adicional se revela hacia abajo;
la imagen no se recentra. En el frame inicial se conservan techo, cartel y puerta.
Durante la aproximación se conserva cartel/hojas pero, con el viewport pequeño,
se pierde parte del escalón y del suelo inferior. No es el mismo framing que A.
Texto/CTA conservan exactamente su posición A también al alternar a B.

Con altura inicial 760 y máximo 832, el recorte lateral total B depende del ancho:
375 →13,64 %; 390 →10,19 %; 393 →9,50 %; 430 →0,98 %.
No generalizar esas cifras a un teléfono con otra altura máxima.

En ambas variantes: desplazamiento imagen, título, copy y CTA = **0 px** para
+16/+72. Verificado además durante el recorrido, no sólo con el poster.

## Evidencia y QA

142 comprobaciones sin fallas, 24 recargas (arriba/medio, caché desactivada/habilitada,
375/390/430, ambas variantes). También ancho 393, cambio A/B conservando frame,
forward/reverse, rueda nativa lenta/rápida, orientación, teclado, reduced motion,
fallo de video, sin JS y overflow. Sólo video/poster mobile en estas pruebas;
no escritorio, Three.js, GLB, HDR ni V1. A coincide píxel por píxel con la captura
del snapshot aprobado. Vite build y PHP 8.3 (26 archivos) correctos.

Resultados y capturas, fuera del paquete productivo:
`tools/.preview/hero-mobile-ab/report.json`, `compare-initial-plus-0.png`,
`compare-initial-plus-72.png`, `compare-mid.png`, `compare-arrival.png`.
En comparaciones: A izquierda; B derecha. La tira roja es el identificador DEMO
del snapshot aprobado, no instrumentación añadida al sitio.

QA reproducible con el runtime Playwright/Sharp disponible localmente:

```powershell
node "C:\Users\dante.DESKTOP\Desktop\rp-usados-gpt\rp-usados\explorations\hero-v2\mobile-viewport-ab\qa.mjs"
```

El servidor aprobado de referencia en 9492 debe estar activo para la comparación
píxel por píxel. `RP_QA_RUNTIME` permite indicar otro package.json que resuelva
Playwright y Sharp. `RP_AB_SNAPSHOT` permite indicar otro snapshot equivalente;
no se regeneró ni reutilizó un output diferente para esta sandbox.

## Recomendación y límites

B portrait es la candidata a probar en Android real si se acepta el encuadre
más cerrado y la pérdida parcial del escalón/suelo. Cumple estabilidad y cobertura
simultáneamente en la simulación. A preserva más contexto y el frame completo.
No sustituir producción antes de la elección visual y la prueba física.

No se ha medido el Android del usuario, su barra de gestos ni el máximo LVH que
entrega Chrome en él. Cero hueco web no significa eliminar la barra del sistema.
Viewport teclado abierto/pinch zoom y Safari real quedan fuera de esta evidencia.
No hay emulación fiable de las barras móviles reales dentro de un iframe desktop.
