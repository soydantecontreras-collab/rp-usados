<?php
/** Fallback: vehicle content always uses the price-free card. @package RP_Usados */
defined( 'ABSPATH' ) || exit;
get_header();
?>
<main id="main-content" class="container section-space" tabindex="-1">
	<?php if ( is_search() ) : ?><h1><?php esc_html_e( 'Resultados de búsqueda', 'rp-usados' ); ?></h1><?php endif; ?>
	<?php if ( have_posts() ) : while ( have_posts() ) : the_post(); ?>
		<?php if ( 'vehiculo' === get_post_type() ) : get_template_part( 'template-parts/vehicle/card' ); else : ?>
			<article class="prose"><h2><a href="<?php the_permalink(); ?>"><?php echo esc_html( get_the_title() ); ?></a></h2><?php the_excerpt(); ?></article>
		<?php endif; ?>
	<?php endwhile; the_posts_pagination(); else : ?><h2><?php esc_html_e( 'No hay resultados.', 'rp-usados' ); ?></h2><a class="text-link" href="<?php echo esc_url( rp_usados_catalog_url() ); ?>"><?php esc_html_e( 'Ver vehículos', 'rp-usados' ); ?></a><?php endif; ?>
</main>
<?php get_footer(); ?>
