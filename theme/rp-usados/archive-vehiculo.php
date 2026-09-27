<?php defined( 'ABSPATH' ) || exit; get_header(); ?>
<main id="main-content" class="catalog section" tabindex="-1"><div class="wrap">
    <div class="section-heading"><div><p class="label">El stock completo</p><h1>Vehículos</h1></div><p>Disponibles y reservados.<br>Conocé cada unidad en detalle.</p></div>
    <?php if ( have_posts() ) : ?><div class="vehicle-grid"><?php while ( have_posts() ) : the_post(); get_template_part( 'template-parts/vehicle/card' ); endwhile; ?></div><?php else : get_template_part( 'template-parts/vehicle/empty' ); endif; ?>
</div></main>
<?php get_footer(); ?>
