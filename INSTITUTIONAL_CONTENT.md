# Nosotros / financiación — local review

Only `trajectory.php`, `services.php` and `institutional.css` were edited for the two home sections. Photo supplied by owner: WhatsApp Image 2026-10-02 at 04.58.40.jpeg. It is presented as institutional imagery of the current local, not a historical milestone or available inventory. No photo generation, lighting/crop alteration, hero or backend edits.

## Nosotros copy

La experiencia se nota en el trato.

RP Usados se dedica a la compra y venta de vehículos usados desde 1990. Esa trayectoria sigue presente en algo simple: el trato directo y la atención a cada consulta.

Elegir un auto empieza por una buena conversación. Te invitamos a contarnos qué buscás, conocer las unidades en nuestro local de Ciudadela y conversar sobre las opciones para avanzar.

Vení a conocer el auto. Y a conocernos.

CTA: Conocé dónde estamos. Caption: El local de RP Usados / Chacabuco 399 · Ciudadela.

## Financiación / permutas copy

Busquemos la forma de avanzar.

¿Querés financiar una unidad o entregar tu usado? Escribinos por WhatsApp. Evaluamos cada operación de manera particular y te contamos qué opciones hay disponibles.

Financiación y cuotas: Podés consultar por opciones de financiación o pago en cuotas. Las alternativas disponibles dependen de la unidad y de las condiciones de cada operación, y se confirman directamente con RP Usados.

Tu usado como parte de pago: Podés consultar por una permuta o por entregar tu vehículo como parte de pago. La posibilidad de tomarlo y sus condiciones se definen luego de evaluar el usado y la operación.

Escribinos por WhatsApp con la unidad que te interesa. Si tenés un usado para entregar, contanos cuál es.

CTA: Consultar opciones por WhatsApp.

Las opciones están sujetas a evaluación y confirmación de RP Usados.

## Photo replacement

One existing theme picture slot reads stable `assets/institutional/local-institucional-*` files. Regenerate variants with `node tools/prepare-institutional-photo.mjs "C:/path/to/new-approved-photo.jpeg"`, update the alt/caption if subject changes and refresh asset caches. No new backend fields or WordPress administration were added. If new image ratio differs, the fixed portrait frame uses contain to preserve the whole photo; update intrinsic image dimensions to its actual metadata. No section redesign is required.

Current WebP sizes: 480×640 ~44.8 KB; 720×960 ~81.7 KB; 960×1280 ~126.5 KB. Lazy loading and srcset choose an appropriate variant; JPEG fallback provided. No gallery or vehicle media is repurposed.

## Validation / limitation

Local preview: http://127.0.0.1:9470/#nosotros and /#opciones. Existing DEMO stock remains marked as DEMO. The unconfirmed WhatsApp number still uses the existing pending-contact fallback; no phone was inferred from text inside the photo.

Build/package and PHP 8.3 syntax (25 files) passed. Targeted QA covers widths 1920/1440/1280/768/430/390/375, overflow, responsive photo, copy, keyboard, reduced motion and 200% zoom. Report: artifacts/institutional/qa.json. Isolated section screenshots temporarily hide fixed header/skip overlays only during capture; no production CSS is changed by the screenshot tool. No deploy.
