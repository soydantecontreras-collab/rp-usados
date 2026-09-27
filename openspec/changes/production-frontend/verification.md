# Verificación manual del cambio

| Requisito | Código | Evidencia |
|---|---|---|
| Home aprobada y fallback | front-page.php, home/hero.php, src/scripts/hero-v2, styles/hero-v2.css | 7 viewports, scroll/reversa/reload/orientación/fallos en artifacts/production/report.json; media comparada byte por byte |
| Stock completo y precio individual | inc/frontend.php, archive, single, card | 15 elegibles, reservado, vendido/draft/ausente excluidos, precio sólo ficha, WhatsApp título/URL |
| Vacío honesto | vehicle/empty.php | Home real 9400 sin fixtures; capturas home-full |
| Preservación | bootstrap añade adaptador; módulos backend intactos | git diff c84025a de datos/admin/CPT/customizer/setup/admin.js vacío; ZIP sin V1/tooling/fixtures |
| Accesibilidad/responsive | header/footer/gallery/styles | teclado, foco, zoom, reduced motion, sin JS y 375/390/430/tablet/laptop/desktop; final-checks para barra WP |
| Mapa real | home/location.php | tiles Google y pin R.P. Usados revisados en map-loaded-desktop/mobile.png |

180 checks de navegador pasaron. PHP 8.3: 25 archivos válidos. Vite build/package correcto. Manifest y ZIP de 8.983.087 bytes verificados: 54 entradas, media aprobada idéntica. Las comprobaciones finales adicionales verifican query antigua irrelevante, offset de barra admin (layout simulado) y contraste del aviso de contacto pendiente.

Documentación sincronizada: PRODUCTION_FRONTEND.md, README, PROJECT_MAP, AGENTS. Backend y datos comerciales no modificados. No se requiere instalación de CLI OpenSpec para este repositorio; checklist manual conforme openspec/AGENTS.md.

Límites explícitos: Safari/iPhone físico no disponible. Logo original separado, número confirmado y stock real aún faltan; se usan soporte nativo, estados pendientes y QA aislado, nunca datos de prueba en la Home normal o ZIP. No se declara aprobación visual final del usuario ni se hizo deploy.
