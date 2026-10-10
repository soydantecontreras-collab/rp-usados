<?php
defined( 'ABSPATH' ) || exit;
$institutional_media = RP_USADOS_URL . '/assets/institutional/local-institucional-';
?>
<section id="nosotros" class="heritage section" aria-labelledby="heritage-title">
    <div class="wrap heritage-grid">
        <header class="heritage-heading">
            <h2 id="heritage-title">La experiencia<br>se nota en el trato.</h2>
        </header>
        <div class="heritage-visual">
            <?php // Institutional photo, not a historical claim or current stock. Replace media variants at the same paths. ?>
            <figure class="heritage-media">
                <picture>
                    <source type="image/webp" srcset="<?php echo esc_url( $institutional_media . '480.webp' ); ?> 480w, <?php echo esc_url( $institutional_media . '720.webp' ); ?> 720w, <?php echo esc_url( $institutional_media . '960.webp' ); ?> 960w" sizes="(max-width: 760px) calc(100vw - 40px), (max-width: 1440px) 47vw, 650px">
                    <img src="<?php echo esc_url( $institutional_media . '960.jpg' ); ?>" srcset="<?php echo esc_url( $institutional_media . '480.jpg' ); ?> 480w, <?php echo esc_url( $institutional_media . '960.jpg' ); ?> 960w" sizes="(max-width: 760px) calc(100vw - 40px), (max-width: 1440px) 47vw, 650px" alt="Interior de RP Usados, con vehículos y la identidad de la marca en el local" width="960" height="1280" loading="lazy" decoding="async">
                </picture>
                <figcaption>El local de RP Usados <span>Chacabuco 399 · Ciudadela</span></figcaption>
            </figure>
        </div>
        <div class="heritage-copy">
            <p class="heritage-lead">RP Usados se dedica a la compra y venta de vehículos usados desde 1990. Esa trayectoria sigue presente en algo simple: el trato directo y la atención a cada consulta.</p>
            <p>Elegir un auto empieza por una buena conversación. Te invitamos a contarnos qué buscás, conocer las unidades en nuestro local de Ciudadela y conversar sobre las opciones para avanzar.</p>
            <div class="heritage-invitation"><p>Vení a conocer el auto.<br>Y a conocernos.</p><a href="#ubicacion" class="action action-outline"><span>Conocé dónde estamos</span></a></div>
        </div>
    </div>
</section>
