<?php defined( 'ABSPATH' ) || exit; $media = RP_USADOS_URL . '/assets/hero/v2/'; ?>
<section class="hero-track" aria-label="<?php esc_attr_e( 'RP Usados, recorrido por la concesionaria', 'rp-usados' ); ?>">
    <div class="hero-stage"><div class="hero-scene"><div class="hero-visual">
        <video class="hero-video" muted playsinline preload="none" aria-hidden="true" disablepictureinpicture data-desktop-src="<?php echo esc_url( $media . 'hero-fast-dark-doors.mp4' ); ?>" data-mobile-src="<?php echo esc_url( $media . 'hero-mobile-v4-1080-crf18.mp4' ); ?>"></video>
        <picture><source media="(max-width: 899px), (hover: none) and (pointer: coarse)" srcset="<?php echo esc_url( $media . 'hero-mobile-v4-1080-crf18-poster.png' ); ?>" width="1080" height="1920"><img class="hero-poster" src="<?php echo esc_url( $media . 'poster-fast-dark-doors.png' ); ?>" alt="<?php esc_attr_e( 'Fachada de RP Usados al anochecer, vista desde la esquina', 'rp-usados' ); ?>" width="1600" height="900" fetchpriority="high"></picture>
    </div><div class="hero-overlay"><div class="hero-caption"><div><h1>RP Usados</h1><p>Ciudadela · Desde 1990</p></div><a class="action action-light" href="#catalogo" data-skip><span>Ver vehículos</span><span class="arrow" aria-hidden="true">↗</span></a></div>
    <span class="scroll-cue label" aria-hidden="true">Deslizá para entrar <span>↓</span></span>
    <p class="media-status" role="status"></p></div></div></div>
</section>
