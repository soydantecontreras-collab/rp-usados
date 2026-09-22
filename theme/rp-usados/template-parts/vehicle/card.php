<?php
/** No price or free editorial text is loaded in cards. @package RP_Usados */
defined( 'ABSPATH' ) || exit;
$id = get_the_ID();
$state = get_post_meta( $id, 'rp_estado_stock', true );
$labels = rp_usados_stock_labels();
if ( 'publish' !== get_post_status( $id ) || ! in_array( $state, array( 'disponible', 'reservado' ), true ) ) { return; }
?>
<article class="vehicle-card">
	<div class="vehicle-card__media">
		<?php if ( has_post_thumbnail() ) : ?>
			<?php the_post_thumbnail( 'rp-vehicle-card', array( 'loading' => 'lazy', 'sizes' => '(max-width: 700px) 100vw, (max-width: 1000px) 50vw, 33vw' ) ); ?>
		<?php else : ?>
			<p class="media-pending"><?php esc_html_e( 'Fotografía', 'rp-usados' ); ?><span><?php echo esc_html( rp_usados_pending() ); ?></span></p>
		<?php endif; ?>
	</div>
	<div class="vehicle-card__body"><span class="stock-status"><?php echo esc_html( $labels[ $state ] ); ?></span><h3><a href="<?php the_permalink(); ?>"><?php echo esc_html( get_the_title() ); ?></a></h3><dl class="vehicle-facts"><?php foreach ( rp_usados_vehicle_facts( $id ) as $label => $value ) : ?><div><dt><?php echo esc_html( $label ); ?></dt><dd><?php echo esc_html( $value ); ?></dd></div><?php endforeach; ?></dl><a class="text-link" href="<?php the_permalink(); ?>" aria-label="<?php echo esc_attr( sprintf( __( 'Ver ficha: %s', 'rp-usados' ), get_the_title() ) ); ?>"><?php esc_html_e( 'Ver ficha', 'rp-usados' ); ?><span aria-hidden="true">↗</span></a></div>
</article>
