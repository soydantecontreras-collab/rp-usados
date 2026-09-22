<?php
defined( 'ABSPATH' ) || exit;
$id = isset( $args['id'] ) ? absint( $args['id'] ) : get_the_ID();
$url = rp_usados_vehicle_whatsapp_url( $id );
?>
<div class="unit-contact">
	<?php if ( $url ) : ?>
		<a class="button button--primary" href="<?php echo esc_url( $url ); ?>" aria-label="<?php echo esc_attr( sprintf( __( 'Consultar por WhatsApp: %s', 'rp-usados' ), get_the_title( $id ) ) ); ?>"><?php esc_html_e( 'Consultar por WhatsApp', 'rp-usados' ); ?><span aria-hidden="true">↗</span></a>
	<?php else : ?>
		<button class="button button--pending" type="button" disabled aria-describedby="whatsapp-pending-<?php echo (int) $id; ?>"><?php esc_html_e( 'Consultar por WhatsApp', 'rp-usados' ); ?></button><p id="whatsapp-pending-<?php echo (int) $id; ?>" class="pending-note">WhatsApp: <?php echo esc_html( rp_usados_pending() ); ?></p>
	<?php endif; ?>
</div>
