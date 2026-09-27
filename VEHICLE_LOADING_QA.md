# Carga de vehículos y pasada de marca — 27/09/2026

## Dónde revisar
- Home normal, sin stock inventado: http://127.0.0.1:9400/
- QA aislado, con cinco unidades publicadas de desarrollo: http://127.0.0.1:9440/#catalogo
- Las imágenes son cartas de prueba, no fotografías ni unidades reales. Todos los títulos y la franja del entorno identifican QA. Esta base de datos y sus uploads son temporales, locales y no entran en el ZIP.
- Administrador QA: http://127.0.0.1:9440/wp-admin/ — sesión de pruebas separada. Credenciales locales en `tools/.preview/vehicle-flow/`, ignoradas por Git; no se publican.

## Resultado del flujo real
Se usaron el editor clásico, Publicar/Actualizar, Imagen principal, la biblioteca y Seleccionar imágenes. No se insertaron los cinco vehículos directamente en la base de datos. Se verificó la persistencia tras guardar y se navegó como visitante sin sesión.

| Caso | Resultado |
|---|---|
| Disponible | Aparece automáticamente; foto, versión, año y km visibles |
| Reservado | Aparece con su rótulo cálido; 0 km no se omite |
| Vendido | No aparece en Home; la ficha directa sigue mostrando Vendido |
| Opcionales vacíos | Sin filas de datos vacías ni valores inventados; foto/precio/contacto pendientes explícitos |
| Galería | Cuatro imágenes: 16:9, 3:2, vertical y cuadrada; botones, teclado y selección directa funcionan |
| Precio | Ausente en cards; visible en ficha con moneda de prueba TST |
| WhatsApp | Enlace específico contiene título y URL de la unidad. Se inspeccionó sin abrir ni enviar mensajes |
| Kilometraje inválido | Al intentar guardar −5 conserva 12345 y muestra el aviso del campo |

Las cards recortan las fotos a 3:2 sin estirarlas. Una foto vertical puede perder contenido arriba/abajo: conviene una principal horizontal con el vehículo completo dentro de ese encuadre. La galería muestra la imagen completa, con espacio lateral cuando corresponde.

## Flujo normal para el dueño
1. Entrar a WordPress → **Vehículos → Añadir vehículo**.
2. Escribir un título que identifique la unidad, sin precio. Completar sólo marca, modelo, versión, año y kilometraje confirmados.
3. Seleccionar **Imagen principal**. En **Galería → Seleccionar imágenes**, elegir fotos de la biblioteca (Ctrl/cmd para selección múltiple; también admite teclado), confirmar **Usar estas imágenes**. La principal aparece primero en la ficha; luego la galería, sin duplicar el mismo archivo. Revisar el orden antes de publicar.
4. Elegir **Disponible** o **Reservado**. Completar monto y moneda confirmados, y WhatsApp sólo si corresponde un número específico. **Publish/Publicar** agrega la unidad automáticamente al catálogo.
5. Abrir la ficha pública, comprobar fotos/datos/precio y el destino de WhatsApp. Para cambios, **Update/Actualizar**. Cuando se vende, cambiar a **Vendido** y actualizar: sale del catálogo sin borrar su ficha.

## Qué exige realmente el sistema
No hay campos de metadatos con `required` ni una validación conjunta que obligue a completar todos. Para ser elegible en catálogo se necesitan publicación y un estado válido Disponible/Reservado. Una unidad sin estado confirmado no se lista. Un título identificable y buenas fotos son necesarios editorialmente, aunque el formulario no los imponga como conjunto.

| Campo | Formato / ausencia |
|---|---|
| Marca, modelo, versión | Opcionales técnicamente; sin marca/modelo se usa el título |
| Año | Entero entre 1886 y el año siguiente al actual; vacío no se muestra |
| Kilometraje | Entero sin puntos/comas de miles, admite cero; vacío no se muestra |
| Precio + moneda | Monto positivo sin separadores de miles; decimal con punto/coma; moneda de tres letras. Si falta alguno, ficha con `[dato pendiente — confirmar con el cliente]` |
| Imágenes | Opcionales técnicamente; ausencia indicada, sin inventar fotos |
| WhatsApp de unidad | Opcional; vacío usa el número global de Apariencia → Personalizar → RP Usados. Si ambos faltan se muestra el aviso, no un destino ficticio |
| Mensaje de WhatsApp | Opcional; título y URL se agregan siempre |
| Descripción | Opcional, sólo datos confirmados |

La instancia QA tiene locale inglés: WordPress usa separador de miles con coma. El formato público depende del idioma de WordPress; no se cambió la configuración ni el backend durante esta pasada. El editor conserva **Destacar en la Home** y una ayuda que menciona destacados: son controles heredados que el nuevo frontend no consume. No hace falta usarlos.

## Ajuste visual acotado
Dos comportamientos, compartidos entre componentes:
- **CTA / WhatsApp:** rojo RP `#b51f2b`, relleno lateral más profundo y flecha direccional; 240 ms. Texto se desplaza sólo 2 px, presión 1 px. WhatsApp conserva icono y contexto explícito.
- **Secundarios / controles / cards:** superficie neutra, cambio contenido de borde/contraste. Flecha de card pasa de acento rojo a pequeña superficie roja; imagen mantiene escala 1.015. Sin rediseñar la card ni ocultar información.

Focus visible independiente del movimiento. Touch activa las mismas acciones. Reduced motion elimina desplazamientos/transiciones y mantiene respuesta inmediata de color. Contraste CTA claro/rojo: **5,97:1**. Los fondos existentes y el estado Reservado se conservan. No se cambió hero, header, tipografía ni distribución.

## Evidencia y límites
- `artifacts/vehicle-flow/admin-report.json`: 14 comprobaciones de editor.
- `artifacts/vehicle-flow/public-report.json`: 222 comprobaciones de frontend y archivos protegidos.
- Desktop 1440/1280, tablet 768 y móviles emulados 430/390/375; fotos, estados, teclado, touch, reduced motion y sin JS.
- Swipe táctil emulado avanza la galería de 1/4 a 2/4. Ampliación CSS al 200 % sin overflow horizontal (no equivale a una prueba del zoom de la interfaz del navegador).
- Capturas antes/después con la misma composición y datos. El “antes” excluye únicamente la nueva hoja de acentos en la respuesta CSS del navegador de QA; no revierte archivos productivos.
- Header/primer frame estático pixel a pixel iguales antes/después, desktop y mobile. Hashes de PHP administrativo, datos, header, hero, controladores y MP4 idénticos.
- Build de Vite y sintaxis de los 25 PHP correctos. ZIP regenerado, sin datos QA.
- Regresión completa de producción: 180 comprobaciones pasaron en la repetición, incluidos forward/reverse, selección única de video, reload, orientación, fallback y ausencia de V1.
- No se simuló contacto comercial real. Sigue pendiente confirmar el número real de WhatsApp. Las cartas QA no sustituyen la validación editorial con fotografías reales.
- Mobile es emulación Chromium/Edge; no prueba física de Safari/iPhone. No hubo deploy.

### Observación pendiente del hero, fuera de esta pasada
**Actualización posterior:** corregida y verificada en la siguiente tarea autorizada; consultar `HERO_RELOAD_FIX.md` (300 recargas sin bloqueo). El párrafo siguiente conserva el diagnóstico histórico de esta pasada.

Una primera ejecución de la regresión venció esperando `ready` tras recargar. En una comprobación adicional de tres recargas desktop y tres mobile, una recarga mobile mantuvo `state: poster` después de 12 segundos; el scroll/progreso sí se restauró. La siguiente recarga funcionó y la repetición completa de 180 comprobaciones pasó. Por ello no se considera resuelto el comportamiento intermitente. Está registrado en `artifacts/vehicle-flow/hero-reload-diagnostic.json`. No se modificó ni se intentó corregir el hero aprobado; requiere diagnóstico separado antes del deploy.

## Archivos de esta pasada
Presentación: `src/styles/brand-interactions.css` y su import en `src/styles/main.scss`. Herramientas: `tools/vehicle-flow-*-qa.mjs`, `tools/vehicle-flow-captures.mjs`. Informe y evidencia en este documento, `artifacts/vehicle-flow/` y `openspec/changes/vehicle-flow-brand-pass/`.
Los cambios anteriores de migración permanecen preservados. No se modificó la lógica de vehículos ni de WhatsApp.
