# RP Usados

Sitio WordPress y panel privado de stock de RP Usados. Incluye el frontend público aprobado —Hero V2 prerender desktop/mobile, catálogo y ficha— y `/gestion`, construido sobre usuarios, permisos y datos reales de WordPress. Estado: candidato de entrega `v1.0.0-rc1`; no implica un deploy ni autorización de producción. Los vehículos DEMO pertenecen únicamente a las instancias de revisión y tests.

## Guías actuales de entrega

- [Entrega y mapa del proyecto](PROJECT_HANDOFF.md).
- [Despliegue en WordPress](PRODUCTION_DEPLOY.md).
- [Seguridad de producción](PRODUCTION_SECURITY_CHECKLIST.md).
- [Carga de stock real](STOCK_ONBOARDING.md).
- [Backups y recuperación](BACKUP_RESTORE.md).
- [Caché pública, privacidad e invalidación](CACHE_POLICY.md).

Las exploraciones, V1 y documentos de iteraciones anteriores se conservan como historia. No son otra implementación productiva.

## Stack

- WordPress, tema clásico personalizado en PHP.
- CPT `vehiculo`, sin WooCommerce ni builders.
- Panel privado `/gestion` en plugin propio; autenticación, permisos y Media nativos de WordPress.
- SCSS y JavaScript compilados con Vite.
- pnpm con lockfiles versionados.
- WordPress Playground para la vista local y las comprobaciones PHP.

La separación entre lógica reutilizable y frontend reemplazable está documentada en [`PROJECT_MAP.md`](PROJECT_MAP.md).

## Preparar otra PC

Requisitos: Git y **Node.js 24.x** (`.nvmrc`). La versión de pnpm fijada es **10.34.7** (`packageManager`). Este quickstart funciona en PowerShell y Linux/macOS, sin instalar globalmente pnpm, PHP, WordPress, Edge ni dependencias de Codex:

```bash
git clone https://github.com/soydantecontreras-collab/rp-usados.git
cd rp-usados
npx --yes pnpm@10.34.7 install --frozen-lockfile
npx --yes pnpm@10.34.7 run setup
npx --yes pnpm@10.34.7 browsers:install
npx --yes pnpm@10.34.7 build
npx --yes pnpm@10.34.7 check
```

`pnpm run setup` instala por separado tema, plugin y herramientas mediante sus tres lockfiles. Escribir **`run setup`**: `pnpm setup` sin `run` es otro comando del gestor de paquetes. Si no tenés pnpm instalado, podés ejecutar cada comando mediante `npx --yes pnpm@10.34.7`, por ejemplo `npx --yes pnpm@10.34.7 run setup`.

Playwright está fijado en las herramientas y usa su Chromium instalado. En CI Linux, instalar además sus bibliotecas de sistema con `pnpm --dir tools exec playwright install --with-deps chromium`. `RP_BROWSER_CHANNEL=msedge` o `chrome` permite usar explícitamente esos navegadores para una comprobación adicional; no es un requisito del proyecto.

Para trabajar sobre la preview WordPress, `pnpm --dir theme/rp-usados exec vite build --watch` o `pnpm --dir plugins/rp-usados-security exec vite build --watch` recompilan al guardar; refrescar el navegador para leer el manifest nuevo. El router del panel consume el build, no conecta automáticamente al servidor HMR. El modo `dev` público requiere configurar explícitamente `RP_USADOS_VITE_DEV_SERVER` en el WordPress local; nunca en producción. Vite y Playground escuchan sólo en loopback por defecto. No versionar `wp-config.php` ni credenciales.

## Preview y comprobaciones reproducibles

```bash
pnpm preview:gestion
```

Abre una instancia WordPress desechable en `http://127.0.0.1:9540/gestion/`. Las cuentas aleatorias están en `tools/.preview/gestion/accounts.json`, fuera del webroot y de Git. Ctrl+C detiene el proceso y elimina ese archivo. Los vehículos están identificados como datos DEMO; nunca se importan en producción. Para instalar en WordPress propio, usar los dos ZIP y seguir las guías de producción.

```bash
pnpm test:security
pnpm test:gestion
pnpm test:cache
pnpm test:http
pnpm test:public
pnpm audit:all
pnpm package
```

- `check`: sintaxis JS/PHP, tests de seek/red/paquetes y verificación de ambos manifests.
- Los tests PHP ejecutan WordPress/PHP reales en Playground aislado. No necesitan una base de datos externa.
- `test:http`: inicia su propia instancia en **9542**, comprueba login, permisos, formularios, imágenes y responsive, y la detiene incluso si falla el test.
- `test:public`: inicia su propia instancia en **9543** con stock DEMO aislado; recorre hero, navegación, catálogo, ficha, galería, fallback y reduced motion.
- `audit:all`: audita las dependencias de tema, plugin y herramientas.
- `package`: genera y verifica **`dist/rp-usados.zip`** y **`dist/rp-usados-security.zip`**, con allowlist de runtime, manifests y recursos compilados. Comprueba dos escrituras idénticas, timestamps fijos y contenido completo. `dist/release-manifest.json` registra tamaños, hashes, commit y si el checkout tenía cambios.

El texto de los paquetes se normaliza a LF, igual que el contrato de Git; videos,
imágenes y fuentes conservan sus bytes. Así un checkout antiguo de Windows con
CRLF y un clon nuevo producen el mismo ZIP. Los límites de workspace se definen
explícitamente para no heredar otra instalación pnpm de una carpeta superior.
- `test:install`: instala ambos ZIP en un WordPress limpio, comprueba activación, manifests, assets y Home sin stock DEMO. Ejecutar después de `package`.

`pnpm verify:rc` ejecuta la secuencia completa, incluido build, QA HTTP y pública. No iniciar servidores manuales antes de ese comando. Los puertos ocupados producen un error; nunca se reutiliza una instancia ajena.

Los informes y capturas quedan en `tools/.preview/`, ignorados por Git. Para revisar una limpieza explícita de una única preview detenida:

```bash
pnpm clean:preview --path=tools/.preview/<directorio>
pnpm clean:preview --path=tools/.preview/<directorio> --remove
```

El primer comando es un dry-run. El segundo rechaza procesos activos registrados y rutas externas; no barre temporales del sistema ni borra renders, archivos Blender o documentación.

## CI

`.github/workflows/ci.yml` verifica Windows y Ubuntu con Node 24/pnpm fijado: instalación frozen, build, sintaxis, manifests, tests PHP/JS, caché, audit y ZIP. La regresión de navegador completa puede activarse con `workflow_dispatch` y `browser_tests`; usa Chromium y sus propias instancias WordPress desechables. No hace deploy ni utiliza usuarios o stock reales. Las instalaciones iniciales necesitan acceso a npm, WordPress y la descarga oficial de Playwright.

Los jobs de CI también instalan los ZIP en WordPress limpio y adjuntan ambos
paquetes y su manifest como artifacts descargables durante 30 días. La release
candidate conserva sus entregables aparte; no se versionan ZIPs en Git.

## Seguridad y datos

- No confirmar ni versionar `.env`, `wp-config.php`, bases de datos, uploads, claves, certificados, credenciales o tokens.
- WhatsApp y cualquier contacto real se configuran desde WordPress; no deben quedar escritos en el código.
- El catálogo no muestra precios. El precio se renderiza únicamente en `single-vehiculo.php` mediante la guarda de contexto existente.
- Consultar [`AGENTS.md`](AGENTS.md) antes de modificar el proyecto.

## Documentación

- [`HERO_WEB_INTEGRATION.md`](HERO_WEB_INTEGRATION.md): prueba local opt-in del hero Blender v6.1, métricas, diferencias visuales y verificaciones.
- [`PROJECT_MAP.md`](PROJECT_MAP.md): frontera entre backend/lógica y frontend/diseño.
- [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md): arquitectura, modelo de datos y fases.
- [`VISUAL_REFERENCES.md`](VISUAL_REFERENCES.md): fotos actuales del dueño, Street View y prioridad de referencias del local.
- [`design-qa.md`](design-qa.md): auditoría de la versión visual respaldada.
- [`AGENTS.md`](AGENTS.md): reglas permanentes del proyecto.
