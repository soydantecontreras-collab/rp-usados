# Requisitos

## Requirement: Home aprobada
La Home SHALL usar V2 desktop/mobile y el orden institucional pedido, independientemente de query parameters.
### Scenario: carga y fallback
Desktop solicita exclusivamente su media; mobile solicita su vertical. Scroll bidireccional/reload conservan pose; reduced motion/sin JS/error mantienen poster correcto y catálogo accesible.

## Requirement: stock y ficha reales
El catálogo SHALL listar todos los publicados disponibles/reservados, excluyendo vendidos, sin filtros/destacados/precios. Cada card es un enlace completo, con sólo datos existentes.
### Scenario: stock con estados
Fixtures aislados disponibles/reservados aparecen; vendido no. Precio nunca está en listados y sí en ficha. Galería tiene controles y fallback sin JS; WhatsApp conserva título y URL por unidad.
### Scenario: vacío
Sin unidades elegibles se muestra estado vacío honesto, no muestras comerciales.

## Requirement: preservación
CPT, administración, metadatos, seguridad y helpers SHALL permanecer intactos. No inventar identidad ni contactos.
### Scenario: distribución
Build/ZIP incluye frontend y assets aprobados; no carga Three.js/GLB/HDR/V1, ni empaqueta fixtures. Logo usa custom_logo cuando existe; contacto pendiente es explícito cuando falta.

## Requirement: accesibilidad y responsive
Contenido y navegación SHALL funcionar en desktop/laptop/tablet/430/390/375, sin depender de hover, movimiento o JavaScript.
### Scenario: teclado y mobile
Foco visible, enlaces completos, galería operable con teclado y touch, sin overflow y con reduced motion. Mapa real mantiene enlaces de ubicación/direcciones.
