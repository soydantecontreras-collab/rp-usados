"""Reuse approved composition verbatim; no changes to Stage 1 or theme."""
from pathlib import Path
import re

here=Path(__file__).resolve().parent
source=(here.parent/'stage-1/index.html').read_text(encoding='utf-8')
catalog=re.search(r'<section id="catalogo".*?</section>',source).group()
dialog=re.search(r'<dialog id="wa-dialog".*?</dialog>',source).group()
for path,kind in [('', 'fast'),('compact','compact'),('mobile-study','mobile')]:
    depth='../' if path else ''
    stage=depth+'../stage-1/'
    cards=catalog.replace('href="vehiculo.html','href="'+stage+'vehiculo.html')
    modal=dialog.replace('src="media/','src="'+stage+'media/')
    html=f'''<!doctype html>
<html lang="es-AR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#191a1b"><title>RP Usados · Hero V2 / {kind}</title>
<link rel="stylesheet" href="{stage}style.css"><link rel="stylesheet" href="{depth}style.css">
<link rel="preload" href="/hero-v2/media/poster-{kind}.png" as="image" fetchpriority="high">
<script type="module" src="{depth}main.js"></script>
<noscript><style>.hero-track{{height:var(--stage-height)!important}}.catalog{{margin-top:0!important;opacity:1!important;pointer-events:auto!important}}.hero-stage{{position:relative!important}}</style></noscript></head>
<body class="v2" data-encoding="{kind}">
<a class="skip" href="#catalogo">Saltar al catálogo</a>
<header class="site-header v2-header"><a class="logo-slot" href="{depth}./" aria-label="RP Usados — Inicio V2. Logo original pendiente"><span>Logo original</span><small>archivo pendiente</small></a><nav aria-label="Navegación principal"><a href="#catalogo">Vehículos</a></nav><button class="action action-small" data-whatsapp><img class="wa-icon" src="{stage}media/whatsapp.svg" alt="" width="22" height="22"><span>WhatsApp</span><span class="arrow" aria-hidden="true">↗</span></button></header>
<main>
<section class="hero-track" aria-label="RP Usados, recorrido por la concesionaria">
<div class="hero-stage"><div class="hero-visual">
<video class="hero-video" muted playsinline preload="none" aria-hidden="true" disablepictureinpicture data-src="/hero-v2/media/hero-{kind}.mp4"></video>
<img class="hero-poster" src="/hero-v2/media/poster-{kind}.png" alt="Fachada de RP Usados al anochecer, vista desde la esquina" width="1600" height="900" fetchpriority="high">
</div><div class="hero-caption"><div><h1>RP Usados</h1><p>Ciudadela · Desde 1990</p></div><a class="action action-light" href="#catalogo" data-skip><span>Ver vehículos</span><span class="arrow" aria-hidden="true">↗</span></a></div>
<span class="scroll-cue label" aria-hidden="true">Deslizá para entrar <span>↓</span></span>
<p class="media-status" role="status"></p></div></section>
{cards}
</main><footer class="wrap preview-footer"><p>Prueba V2 · Prerender de Blender · Interfaz Iteración 02</p><nav aria-label="Comparar codificaciones"><a href="{depth}./">A · Seeking</a><a href="{depth}compact/">B · Compacta</a><a href="{depth}mobile-study/">Prueba móvil reducida</a></nav></footer>
{modal}</body></html>'''
    target=here/path
    target.mkdir(parents=True,exist_ok=True)
    (target/'index.html').write_text(html,encoding='utf-8')
