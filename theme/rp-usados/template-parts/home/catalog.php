<?php defined( 'ABSPATH' ) || exit; $stock = rp_usados_stock_query(); ?>
<section id="catalogo" class="catalog section" tabindex="-1" aria-labelledby="catalog-title">
    <svg class="catalog-cap" viewBox="0 0 1440 184" preserveAspectRatio="none" aria-hidden="true"><path d="M0 14 C360 142 810 164 1440 22 L1440 184 L0 184Z"/></svg>
    <div class="catalog-content"><div class="wrap">
        <div class="section-heading"><div><p class="label">01 / El stock completo</p><h2 id="catalog-title">Elegí por lo que ves.<br><span>Conocelo en detalle.</span></h2></div><p>Todos los vehículos, en un solo recorrido.<br>Disponibles y reservados.</p></div>
        <?php if ( $stock->have_posts() ) : ?>
            <div class="vehicle-grid"><?php while ( $stock->have_posts() ) : $stock->the_post(); get_template_part( 'template-parts/vehicle/card' ); endwhile; ?></div>
        <?php else : get_template_part( 'template-parts/vehicle/empty' ); endif; wp_reset_postdata(); ?>
    </div></div>
</section>
