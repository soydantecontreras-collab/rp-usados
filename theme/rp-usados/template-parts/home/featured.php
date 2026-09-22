<?php
defined( 'ABSPATH' ) || exit;
$vehicles = rp_usados_featured_vehicles();
?>
<section id="destacados" class="featured section-space" aria-labelledby="featured-title">
	<div class="container">
		<div class="section-heading section-heading--split"><h2 id="featured-title"><?php esc_html_e( 'Vehículos', 'rp-usados' ); ?><br><?php esc_html_e( 'destacados', 'rp-usados' ); ?></h2><a class="text-link" href="<?php echo esc_url( rp_usados_catalog_url() ); ?>"><?php esc_html_e( 'Ver catálogo completo', 'rp-usados' ); ?></a></div>
		<?php if ( $vehicles->have_posts() ) : ?>
			<div class="vehicle-grid">
				<?php while ( $vehicles->have_posts() ) : $vehicles->the_post(); get_template_part( 'template-parts/vehicle/card' ); endwhile; ?>
			</div>
		<?php else : ?>
			<?php get_template_part( 'template-parts/vehicle/empty', null, array( 'featured' => true ) ); ?>
		<?php endif; wp_reset_postdata(); ?>
	</div>
</section>
