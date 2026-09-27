# RP Usados

Tema productivo local de RP Usados: Hero V2 responsive aprobado y frontend Stage 1 / Iteración 02 conectados al CPT existente. Sin deploy ni stock comercial ficticio. Ver [`PRODUCTION_FRONTEND.md`](PRODUCTION_FRONTEND.md) para preview, QA, archivos y datos pendientes. Las exploraciones y V1 se conservan como referencia, fuera de la ejecución productiva.

## Stack

- WordPress, tema clásico personalizado en PHP.
- CPT `vehiculo`, sin WooCommerce ni builders.
- Administración nativa para datos, estados, precio individual, galería y WhatsApp por unidad.
- SCSS y JavaScript compilados con Vite.
- pnpm con lockfiles versionados.
- WordPress Playground para la vista local y las comprobaciones PHP.

La separación entre lógica reutilizable y frontend reemplazable está documentada en [`PROJECT_MAP.md`](PROJECT_MAP.md).

## Preparar otra PC

Requisitos: Git, Node.js 22.12 o posterior, pnpm y una instalación de WordPress; WordPress Playground puede sustituir la instalación local para desarrollo rápido.

```bash
git clone <URL-del-repositorio>
cd rp-usados/theme/rp-usados
pnpm install --frozen-lockfile
pnpm build
```

Copiar o vincular `theme/rp-usados/` a `wp-content/themes/rp-usados/`, activar el tema y guardar una vez **Ajustes > Enlaces permanentes**. La portada usa `front-page.php`.

Para desarrollo de assets:

```bash
cd theme/rp-usados
pnpm dev
```

En el `wp-config.php` local, y nunca en el repositorio:

```php
define( 'RP_USADOS_VITE_DEV_SERVER', 'http://localhost:5173' );
```

## Vista temporal con WordPress Playground

```bash
cd tools
pnpm install --frozen-lockfile
cd ..
./tools/start-preview.ps1
```

La vista queda disponible en `http://127.0.0.1:9400/`. El blueprint crea una instalación temporal, activa el tema y no carga inventario ficticio. En macOS/Linux puede ejecutarse directamente la CLI indicada en `tools/start-preview.ps1`, adaptando las rutas.

## Compilar, comprobar y empaquetar

```bash
cd theme/rp-usados
pnpm build
pnpm package
```

El ZIP instalable se genera en `dist/rp-usados.zip`. Los assets compilados, el ZIP, dependencias y estado local no se versionan porque se regeneran desde las fuentes y lockfiles.

Desde la raíz, con la vista local activa:

```bash
node tools/check-php.mjs
node tools/production-qa.mjs
```

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
