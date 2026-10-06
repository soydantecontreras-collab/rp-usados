# Hero mobile: tres capas independientes

Experimento local, páginas completas sin iframe ni selector. No modifica el tema,
backend, hero productivo, videos, posters, scroll controller ni curva aprobada.
Sin commit, push o deploy.

## Abrir

- A, actual: http://127.0.0.1:9496/hero-mobile-current/
- B, propuesta: http://127.0.0.1:9496/hero-mobile-three-layer/

El servidor está iniciado. Para volver a abrirlo desde cualquier carpeta:

```powershell
node "C:\Users\dante.DESKTOP\Desktop\rp-usados-gpt\rp-usados\explorations\hero-v2\mobile-three-layer\serve.mjs"
```

Las rutas nativas capturan CSS SVH y LVH antes del primer paint, por ancho. No
usan números de un teléfono ni queries para controlar la experiencia física.
El header ocupa su altura aprobada; wrapper/canvas/overlay descuentan sólo ese
header, nunca la barra de Android.

## Capas de B

1. Wrapper sticky: altura dinámica aprobada `100dvh - header`, overflow hidden.
2. Media: video/poster en LVH capturado menos header, anclado arriba, cover.
3. Overlay: referencia SVH capturada menos header, independiente del plano media.

El wrapper revela el canvas. No se recalcula el canvas ni el overlay cuando
cambia sólo la altura. El sombreado aprobado del CTA continúa de forma
translúcida sobre el video en la parte que se revela; no es un relleno negro
opaco. Landscape conserva el video vertical completo con contain.

La B anterior ya ampliaba el media plane dentro del escenario pequeño. Esta
variante deja explícita la separación estructural entre plano de medios y
overlay. No pretende introducir otra cámara o una nueva composición.

## Mediciones

Chromium del navegador integrado, viewports 375/390/430. Para emular barras en
desktop se capturó SVH=760 y LVH=832 y se redimensionó el viewport real del
documento a 760/776/832. En un navegador desktop, SVH y LVH normalmente cambian
ambas al redimensionar la ventana: por eso la simulación es explícita.

La ruta de medición de B es:
http://127.0.0.1:9496/hero-mobile-three-layer/?measure=1&small=760&maximum=832
La de A acepta la misma query. No tiene iframe ni panel ni scroll propio.
La simulación oculta sólo la scrollbar de desktop para reproducir la anchura
útil de mobile. No bloquea el scroll. Las rutas nativas no usan ese ajuste.

En los tres anchos, imagen/título/texto/CTA tienen **0 px de movimiento** para
+16 y +72. Wrapper bottom crece exactamente 16/72. Media B termina en 832,
overlay termina en 760, CTA top=682. Misma cámara a mitad: currentTime=1.146833,
scrollY=323, sin cambio al expandir el viewport.

| Expansión | Extra vacío del wrapper A | Vacío B | Bajo imagen A, 390 px | Bajo imagen B |
| --- | ---: | ---: | ---: | ---: |
| Inicial | 0 | 0 | 3,33 | 0 |
| +16 | 16 | 0 | 19,33 | 0 |
| +72 | 72 | 0 | 75,33 | 0 |

La columna bajo imagen A incluye el letterbox original de contain, además del
vacío que aparece por DVH. Se mide cobertura, no simplemente píxeles oscuros.
En los últimos 20 px de la captura +72: A es negro puro; B conserva color del
mismo suelo del video (luma media 23/255, sin píxeles casi negros en esa muestra).
El video final negro y la navegación del sistema Android son otra cosa.

## Crop de B

| Ancho | Recorte lateral total | Por lateral |
| --- | ---: | ---: |
| 375 | 13,64% | 6,82% |
| 390 | 10,19% | 5,09% |
| 430 | 0,98% | 0,49% |

Recorte inferior del original 720x1280 en los tres anchos:

- Inicial: 9,33% (119,38 px fuente).
- +16: 7,25% (92,85 px fuente).
- +72: 0%.
- Superior: 0%. El crecimiento revela suelo, no recentra el edificio.

En 390 px la imagen crece 11,35% frente a A. Techo/cartel/puerta se conservan
en el primer frame. En la llegada, con las barras visibles, hay menos suelo y
escalón: es el coste que debe decidirse visualmente.

## Evidencia

En `tools/.preview/hero-three-layer/`:

- `geometry.json`: 18 estados medidos, ambos documentos, 375/390/430, +0/+16/+72.
- `scroll.json`: primer gesto 19 px, forward/reverse, expansión a mitad, reload.
- `extra.json`: reload a mitad, captura CSS real, orientation, skip/focus.
- `report.json`: 103 verificaciones sobre las observaciones guardadas.
- `compare-0.png`, `compare-72.png`: izquierda A, derecha B, mismo primer frame.
- `b-mid.jpg`: cámara durante la aproximación.
- `build-check/`: build Vite validado en output aislado; assets productivos intactos.

Los resultados se verificaron mediante lectura DOM en el navegador integrado,
sin instalar listeners/debug en producción. `summarize.mjs` valida observaciones
y genera comparaciones; no es un driver de navegador ni reemplaza una prueba física.
JS syntax checks y build Vite pasaron. Media hashes idénticos y git diff del tema vacío.

## Límite y recomendación

B cumple la geometría buscada en la simulación. Recomendación: probar esta B
en Chrome Android real antes de adoptarla. La animación real de sus barras,
la UI de Android y el gesture pill no se pueden reproducir con esta emulación.
No asumir que el delta real sea 72: proviene de LVH/SVH del dispositivo.

Semántica de unidades: [MDN, viewport-relative lengths](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/length#relative_length_units_based_on_viewport).
