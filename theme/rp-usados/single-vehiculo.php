<?php
defined( 'ABSPATH' ) || exit;
get_header();
?>
<main id="main-content" class="container vehicle-detail section-space" tabindex="-1">
	<?php while ( have_posts() ) : the_post(); $id = get_the_ID();
		$state = get_post_meta( $id, 'rp_estado_stock', true );
		$gallery = get_post_meta( $id, 'rp_galeria_ids', true );
		$gallery = is_array( $gallery ) ? $gallery : array();
		$images = array_values( array_filter( array_unique( array_merge( array( get_post_thumbnail_id( $id ) ), $gallery ) ), 'wp_attachment_is_image' ) );
	?>
		<a class="text-link back-link" href="<?php echo esc_url( rp_usados_catalog_url() ); ?>"><?php esc_html_e( 'Volver a vehículos', 'rp-usados' ); ?></a>
		<div class="detail-layout">
			<div class="vehicle-gallery" aria-label="<?php esc_attr_e( 'Fotografías de la unidad', 'rp-usados' ); ?>">
				<?php if ( $images ) : foreach ( $images as $index => $image_id ) : ?>
					<a href="<?php echo esc_url( wp_get_attachment_url( $image_id ) ); ?>" aria-label="<?php esc_attr_e( 'Abrir fotografía en tamaño completo', 'rp-usados' ); ?>"><?php echo wp_get_attachment_image( $image_id, 'rp-vehicle-gallery', false, array( 'loading' => 0 === $index ? 'eager' : 'lazy' ) ); ?></a>
				<?php endforeach; else : ?><div class="detail-media-empty media-pending"><?php esc_html_e( 'Fotografía', 'rp-usados' ); ?><span><?php echo esc_html( rp_usados_pending() ); ?></span></div><?php endif; ?>
			</div>
			<div class="detail-summary"><span class="stock-status"><?php echo esc_html( rp_usados_stock_labels()[ $state ] ?? rp_usados_pending() ); ?></span><h1><?php echo esc_html( get_the_title() ); ?></h1>
				<dl class="detail-facts"><?php foreach ( array( 'rp_marca' => __( 'Marca', 'rp-usados' ), 'rp_modelo' => __( 'Modelo', 'rp-usados' ), 'rp_version' => __( 'Versión', 'rp-usados' ) ) as $key => $label ) : ?><div><dt><?php echo esc_html( $label ); ?></dt><dd><?php echo esc_html( get_post_meta( $id, $key, true ) ?: rp_usados_pending() ); ?></dd></div><?php endforeach; ?><?php foreach ( array_merge( array( __( 'Año', 'rp-usados' ) => rp_usados_pending(), __( 'Kilometraje', 'rp-usados' ) => rp_usados_pending() ), rp_usados_vehicle_facts( $id ) ) as $label => $value ) : ?><div><dt><?php echo esc_html( $label ); ?></dt><dd><?php echo esc_html( $value ); ?></dd></div><?php endforeach; ?></dl>
				<div class="vehicle-price"><p><?php esc_html_e( 'Precio', 'rp-usados' ); ?></p><strong><?php echo esc_html( rp_usados_vehicle_price( $id ) ); ?></strong></div>
				<?php get_template_part( 'template-parts/vehicle/whatsapp', null, array( 'id' => $id ) ); ?>
				<p class="detail-service-note"><?php esc_html_e( 'Tomamos tu usado como parte de pago. Consultá las opciones de financiación / venta en cuotas.', 'rp-usados' ); ?></p>
			</div>
		</div>
		<?php if ( trim( get_the_content() ) ) : ?><section class="vehicle-description"><h2><?php esc_html_e( 'Sobre esta unidad', 'rp-usados' ); ?></h2><div class="prose"><?php the_content(); ?></div></section><?php endif; ?>
	<?php endwhile; ?>
</main>
<?php get_footer(); ?>
