"""Generate only the two transition studies from V2 A. Preserve Stage 1 and earlier V2."""
from pathlib import Path
import re

HERE=Path(__file__).resolve().parent
mobile='(max-width: 899px), (hover: none) and (pointer: coarse)'
desktop='(min-width: 900px) and (hover: hover), (min-width: 900px) and (pointer: fine)'
mobile_video='/hero-v2/media/hero-mobile-portrait-crf18.mp4'
mobile_poster='/hero-v2/media/hero-mobile-portrait-crf18-poster.png'
source=(HERE.parent/'index.html').read_text(encoding='utf-8')
for variant,folder in [('subtle',''),('pronounced','pronounced')]:
    prefix='../' if folder else ''
    html=source.replace('../stage-1/',prefix+'../../stage-1/')
    html=html.replace('href="style.css"',f'href="{prefix}../style.css"><link rel="stylesheet" href="{prefix}style.css"')
    html=html.replace('src="main.js"',f'src="{prefix}main.js"')
    html=html.replace('Hero V2 / fast',f'V2 A · Transición / {variant}')
    html=html.replace('#191a1b','#080809')
    html=html.replace('class="v2" data-encoding="fast"',f'class="v2 transition" data-encoding="fast" data-curve="{variant}"')
    html=html.replace('hero-fast.mp4','hero-fast-dark-doors.mp4').replace('poster-fast.png','poster-fast-dark-doors.png')
    html=html.replace('as="image" fetchpriority="high">',f'as="image" fetchpriority="high" media="{desktop}"><link rel="preload" as="image" href="{mobile_poster}" media="{mobile}" fetchpriority="high">')
    html=html.replace('data-src="/hero-v2/media/hero-fast-dark-doors.mp4"',f'data-src="/hero-v2/media/hero-fast-dark-doors.mp4" data-desktop-src="/hero-v2/media/hero-fast-dark-doors.mp4" data-mobile-src="{mobile_video}"')
    html=re.sub(r'(<img class="hero-poster"[^>]+>)',lambda m:f'<picture><source media="{mobile}" srcset="{mobile_poster}" width="720" height="1280">'+m.group(1)+'</picture>',html)
    brand=f'<a class="brand-signature" href="{prefix}./" aria-label="RP Usados — Inicio"><span class="brand-name">RP <span>Usados</span></span><img class="brand-contour" src="{prefix}silhouette.svg" width="126" height="30" alt="" aria-hidden="true"></a>'
    html=re.sub(r'<a class="logo-slot".*?</a>',lambda _:brand,html,count=1)
    html=html.replace('<a href="#catalogo">Vehículos</a>','<a href="#catalogo">Ver vehículos</a>')
    html=html.replace('class="action action-small" data-whatsapp','class="action action-small" data-whatsapp aria-label="WhatsApp"')
    curve='<svg class="catalog-cap" viewBox="0 0 1440 184" preserveAspectRatio="none" aria-hidden="true"><path d="M0 14 C360 142 810 164 1440 22 L1440 184 L0 184Z"/></svg>'
    html=html.replace('<section id="catalogo"','<div class="transition-bridge" aria-hidden="true"></div>\n<section id="catalogo"')
    html=html.replace('aria-labelledby="catalog-title"><div class="wrap">',f'aria-labelledby="catalog-title">{curve}<div class="catalog-content"><div class="wrap">')
    html=html.replace('</div></div></section>','</div></div></div></section>')
    footer=f'<footer class="wrap preview-footer"><p>V2 A · Estudio de transición · {"Curva sutil" if variant=="subtle" else "Curva marcada"}</p><nav aria-label="Comparar curvas"><a href="{prefix}./">Curva sutil</a><a href="{prefix}pronounced/">Curva marcada</a><a href="{prefix}../">V2 A anterior</a></nav></footer>'
    html=re.sub(r'<footer.*?</footer>',lambda _:footer,html)
    target=HERE/folder; target.mkdir(exist_ok=True)
    (target/'index.html').write_text(html,encoding='utf-8')
