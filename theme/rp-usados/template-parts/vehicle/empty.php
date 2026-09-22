<?php
defined( 'ABSPATH' ) || exit;
$featured = ! empty( $args['featured'] );
?>
<div class="stock-empty">
	<div><h3><?php echo esc_html( $featured ? __( 'Todavía no hay unidades destacadas.', 'rp-usados' ) : __( 'Por el momento no hay unidades publicadas en el catálogo.', 'rp-usados' ) ); ?></h3><p><?php esc_html_e( 'Podés acercarte a Chacabuco 399, Ciudadela, para consultar.', 'rp-usados' ); ?></p><a class="text-link" href="<?php echo esc_url( home_url( '/#ubicacion' ) ); ?>"><?php esc_html_e( 'Ver ubicación', 'rp-usados' ); ?></a></div>
</div>
