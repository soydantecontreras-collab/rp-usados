# Reconstrucción privada de gestión

Nota de continuidad 18/10/2026: informe histórico de la fuente aprobada
`30b39bf`. Ya está integrado en main; las mejoras objetivas respecto de la
implementación anterior se registran en
`docs/decision/20261018_gestion-comparison.md`. Para comandos y límites actuales,
usar `README.md`, `PROJECT_HANDOFF.md` y `PRODUCTION_DEPLOY.md`.

Base: `47e96a9090f273026c5c7c747cfad5aad3bcd82c`.
Rama de trabajo: `gestion-rebuild`. Reconstrucción aprobada para versionar en
esta rama, sin merge a `main` ni deploy. No modifica el tema.

## Dirección y arquitectura

Panel de trabajo para administrar vehículos, no una landing ni un dashboard
SaaS. Manrope para lectura/controles, Archivo para cifras tabulares; grafito
`#202124`, canvas `#f3f4f5`, papel `#ffffff`, texto secundario `#555b63`, rojo de
acción `#b91d2a` y foco `#005fcc`. Desktop: encabezado, filtros/búsqueda,
filas de stock. Mobile: la misma información en tarjetas con controles táctiles.
Formulario agrupado según la tarea y publicación en una sección diferenciada.
Sin animaciones, dependencias SPA o cambios a la identidad pública.

```text
Desktop                          Mobile
RP USADOS           Cerrar       RP USADOS      Cerrar
Gestión      + Cargar             Gestión de stock
Filtros / búsqueda                + Cargar vehículo
Foto / unidad / año / km          Filtros / búsqueda
Precio / estado / editar          Foto
                                 Unidad / versión / año
                                 Km / precio / estado
                                 Editar / Cambiar estado
```

`frontend-design` orienta la utilidad específica de stock y el uso contenido
del rojo; no hay hero, métricas decorativas ni tarjetas estadísticas.
De `apple-design` se traducen sólo fundamentos web de legibilidad, jerarquía,
foco y feedback (`typography.md`, `layout.md`, `accessibility.md`, `color.md`,
`entering-data.md`, `feedback.md`, `progress-indicators.md`); no convenciones
nativas ni identidad visual de Apple.

El plugin `rp-usados-security` contiene:

- `inc/gestion/service.php`: DTO privado, búsqueda, allowlist, validación completa,
  publicación y título automático, autorización de imágenes, mutex por unidad,
  revisión optimista y transacción de DB. Conserva slug al editar.
- `inc/gestion/auth.php`: login WordPress, challenge CSRF por navegador firmado,
  limitación por IP/usuario (8 intentos fallidos, 15 minutos), cabeceras privadas.
- `inc/gestion/rest.php`: permisos/nonce y objetos en cada endpoint, carga segura.
- `inc/gestion/router.php`: rutas PHP independientes de plantillas/assets públicos;
  login, logout y guardado alternativo sin JS.
- `templates/gestion/`: layout, login, listado y formulario.
- `src/modules/`: API, formulario, listado y fotos; Vite propio y fuentes locales.

Se reutilizan sin editar `inc/roles.php`, `inc/media.php`, CPT y validadores del
tema. El tema debe estar activo: el plugin verifica disponibilidad de su esquema.
El backend no introduce combustible, transmisión, motor, destacado ni WhatsApp
por unidad en el panel. La administración pública existente queda intacta.

## Instancia local aislada

Requiere Node compatible con el runtime Playground del repo, pnpm y Edge para QA.
Desde la raíz:

```sh
cd tools
pnpm install --frozen-lockfile
cd ../theme/rp-usados
pnpm install --frozen-lockfile
pnpm build
cd ../../plugins/rp-usados-security
pnpm install --frozen-lockfile
pnpm build
cd ../..
node tools/gestion-preview.mjs
```

URL: `http://127.0.0.1:9540/gestion/`. Sólo loopback, sin autologin.
WordPress/PHP/SQLite aislados; no conecta con un hosting o inventario real.
Los cinco registros iniciales y patrones de imagen están marcados DEMO.
Las pruebas pueden agregar más registros DEMO temporales.

Credenciales aleatorias de esta instancia: `tools/.preview/gestion/accounts.json`.
Archivo ignorado, montado fuera de la raíz web. No copiarlo al hosting ni a Git.
Al reiniciar se genera otra instancia y otras contraseñas: esta preview no es una
instalación persistente para carga de stock real.

Pruebas:

```sh
node tools/check-php.mjs
node tools/gestion-tests.mjs
node tools/security-tests.mjs
node tools/gestion-http-qa.mjs
node tools/security-http-qa.mjs
```

Para Playwright fuera del PATH, `RP_PLAYWRIGHT_PACKAGE` apunta al package.json
del paquete instalado o a su runtime. HTTP/UI necesita la preview de gestión
encendida. La regresión pública `tools/security-public-qa.mjs` usa la DEMO rica
separada en 9470, generada por `tools/create-demo-preview.mjs`.
Reportes/capturas están en `tools/.preview/`, excluidos de Git.
La prueba HTTP termina comprobando el bloqueo de login: esperar 15 minutos o
reiniciar la preview antes de volver a ingresar. El reinicio cambia contraseñas.

## Límites y operación

- Confirmar en el hosting real WordPress 6.8+, PHP 8.1+, soporte de transacciones
  (InnoDB), HTTPS y exclusiones de caché. SQLite/WASM es una prueba local, no
  equivalencia total de infraestructura de producción.
- Los mutex no se roban por tiempo: si un proceso muere durante un guardado,
  revisar y eliminar sólo la opción `rp_gestion_lock_{id}` afectada, después de
  confirmar que no hay otro guardado en curso. No borrar opciones masivamente.
- Las subidas fallidas no reemplazan la portada. Los uploads exitosos sin guardar
  conservan un attachment pendiente; no hay borrado automático destructivo.
- Previews, reintentos, ordenamiento táctil/teclado, recuperación de sesión y
  avisos de navegación son mejoras JS. Sin JS siguen disponibles login, filtros,
  creación/edición, uploads y guardado PHP; no el progreso o la sesión modal.
- La recuperación temporal sólo conserva campos e IDs ya subidos, no archivos
  binarios aún pendientes ni contraseñas. Un conflicto exige recargar explícitamente.
- No hay edición/borrado de usuarios ni eliminación física de vehículos/fotos.
- La garantía de transacción cubre registros de DB; no revierte efectos externos
  de hooks de terceros. No agregar integraciones externas sin evaluar ese riesgo.

## Resultado de verificación

Builds, sintaxis PHP, suites de servicio/REST, HTTP/UI, seguridad y regresión
pública repetidos antes del commit en `gestion-rebuild`. Las pruebas HTTP
se repitieron con éxito en instancias DEMO reiniciadas tras timeouts de las
previews anteriores. No hubo cambios funcionales ni visuales en esta validación.

- Servicio/REST nuevo: 71 comprobaciones.
- HTTP/UI nuevo: 105 comprobaciones, incluido login/email, CSRF, permisos,
  allowlists, guardados inválidos atómicos, publicación, upload, HEIC/HEIF,
  reintento, ordenamiento, sesión vencida, conflictos, navegación sin guardar,
  PHP sin JS, responsive, foco, reflow equivalente al 200 %, vacío y rate limit.
- Seguridad existente: 161 comprobaciones de integración y 18 HTTP.
- Regresión pública: 47 comprobaciones en 1440, 375, 390 y 430 px.
- PHP 8.3: 41 archivos válidos; WordPress local 6.8.11 / PHP 8.3.33.
- Build de plugin y build público existente: correctos; manifests disponibles.
- Audit pnpm de plugin, tema y herramientas: sin vulnerabilidades conocidas.
- Capturas de listado/formulario en cuatro anchos, login y vacío; sin errores JS.
- Verificación final sin JS: login, borrador, upload multipart, publicación y
  vuelta a borrador aprobados. Sintaxis JS válida. Contrastes sobre blanco:
  texto 16,10:1; secundario 6,86:1; rojo de acción 6,42:1; foco azul 5,98:1.
- Diff del tema respecto del checkpoint: vacío. `roles.php` y `media.php` intactos.

Los conteos no son una reproducción de la suite inaccesible de otra PC. La
prueba local usa Edge headless y viewport equivalente al zoom 200 %, no una
validación física de Safari/iOS o del hosting. No se afirma paridad de suites
ni se traslada como evidencia ningún resultado anterior.

Archivos creados: este informe; `inc/gestion/{service,auth,rest,router}.php`;
`templates/gestion/{layout,login,list,form}.php`; `src/main.js`, `src/panel.css`,
`src/modules/{api,form,list,uploads}.js`, fuentes y licencias locales;
`package.json`, `pnpm-lock.yaml`, `vite.config.js` del plugin;
`tests/gestion/{demo-fixture,service}.php` y
`tools/gestion-{preview,tests,http-qa,nojs-qa,captures}.mjs`.

Archivos modificados: `.gitignore`, bootstrap y README del plugin,
`tools/check-php.mjs` y `tools/package-security-plugin.mjs`.
Los assets compilados, ZIP, DB, uploads, credenciales, reportes y capturas son
salidas locales ignoradas; no se incorporan a Git. Los fixtures y generadores
DEMO incluidos son fuentes necesarias para repetir las pruebas, no stock real
ni una base de datos. `access.json`, `accounts.json` y directorios de capturas
temporales también están excluidos explícitamente.
