<?php
defined( 'ABSPATH' ) || exit;
get_header();
?>
<main id="main-content" class="container catalog section-space" tabindex="-1">
	<header class="page-heading"><a class="text-link" href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php esc_html_e( 'Volver al inicio', 'rp-usados' ); ?></a><h1><?php esc_html_e( 'Vehículos', 'rp-usados' ); ?></h1><p><?php esc_html_e( 'Conocé cada unidad y consultanos desde su ficha.', 'rp-usados' ); ?></p></header>
	<?php if ( have_posts() ) : ?>
		<div class="vehicle-grid"><?php while ( have_posts() ) : the_post(); get_template_part( 'template-parts/vehicle/card' ); endwhile; ?></div>
		<?php the_posts_pagination( array( 'prev_text' => __( 'Anterior', 'rp-usados' ), 'next_text' => __( 'Siguiente', 'rp-usados' ) ) ); ?>
	<?php else : get_template_part( 'template-parts/vehicle/empty' ); endif; ?>
</main>
<?php get_footer(); ?>
