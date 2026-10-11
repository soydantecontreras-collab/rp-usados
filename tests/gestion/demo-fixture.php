<?php
/** Disposable local data only. Mounted outside webroot; never install on production. */
wp_set_current_user( 1 );
require_once ABSPATH . 'wp-admin/includes/image.php';
$accounts = array();
foreach ( array( 'manager' => 'rp_stock_manager', 'subscriber' => 'subscriber' ) as $name => $role ) {
	$login = 'demo-' . $name;
	$password = wp_generate_password( 24, false );
	$id = wp_insert_user( array( 'user_login' => $login, 'user_pass' => $password, 'role' => $role, 'user_email' => $name . '@example.invalid' ) );
	if ( is_wp_error( $id ) ) { throw new RuntimeException( $id->get_error_message() ); }
	$accounts[ $name ] = array( 'id' => $id, 'login' => $login, 'password' => $password, 'email' => $name . '@example.invalid' );
}
$admin = get_user_by( 'id', 1 );
$admin_password = wp_generate_password( 24, false );
wp_set_password( $admin_password, 1 );
$accounts['admin'] = array( 'id' => 1, 'login' => $admin->user_login, 'password' => $admin_password );
$vehicles = array();
foreach ( array(
	array( 'Volkswagen', 'Vento DEMO', 'Highline', '2021', 'disponible', 'publish', 'square' ),
	array( 'Toyota', 'Hilux DEMO', 'SRV', '2022', 'reservado', 'publish', 'landscape' ),
	array( 'Ford', 'Ranger DEMO', 'XLT', '2020', 'disponible', 'publish', 'wide' ),
	array( 'Fiat', 'Cronos DEMO', '', '2023', 'vendido', 'publish', 'portrait' ),
	array( '', 'Borrador DEMO', '', '', '', 'draft', 'square' ),
) as $index => $record ) {
	$id = wp_insert_post( array( 'post_type' => 'vehiculo', 'post_status' => $record[5], 'post_name' => 'gestion-demo-' . $index, 'post_title' => 'DEMO — ' . $record[0] . ' ' . $record[1], 'post_content' => 'DATOS DEMO DE DESARROLLO. No representan stock real de RP Usados.' ) );
	foreach ( array( 'rp_marca' => $record[0], 'rp_modelo' => $record[1], 'rp_version' => $record[2], 'rp_anio' => $record[3], 'rp_estado_stock' => $record[4], 'rp_kilometraje' => '62000', 'rp_precio_monto' => '12345.67', 'rp_precio_moneda' => 0 === $index ? 'TST' : 'ARS' ) as $key => $value ) { update_post_meta( $id, $key, $value ); }
	$image_ids = array();
	foreach ( array( $record[6], 'landscape', 'portrait' ) as $j => $image ) {
		$bytes = file_get_contents( '/gestion-fixtures/' . $image . '.png' );
		$upload = wp_upload_bits( 'gestion-demo-' . $index . '-' . $j . '.png', null, $bytes );
		$attachment = wp_insert_attachment( array( 'post_mime_type' => 'image/png', 'post_title' => 'DEMO — patrón de prueba', 'post_status' => 'inherit', 'post_parent' => $id ), $upload['file'] );
		wp_update_attachment_metadata( $attachment, wp_generate_attachment_metadata( $attachment, $upload['file'] ) );
		update_post_meta( $attachment, '_wp_attachment_image_alt', 'Patrón DEMO, no es una foto de stock real' );
		$image_ids[] = $attachment;
	}
	if ( 'publish' === $record[5] ) { set_post_thumbnail( $id, $image_ids[0] ); update_post_meta( $id, 'rp_galeria_ids', array_slice( $image_ids, 1 ) ); }
	$vehicles[] = $id;
}
$page = wp_insert_post( array( 'post_type' => 'page', 'post_title' => 'DEMO unrelated', 'post_status' => 'publish' ) );
$upload = wp_upload_bits( 'unrelated-demo.png', null, file_get_contents( '/gestion-fixtures/square.png' ) );
$unrelated = wp_insert_attachment( array( 'post_mime_type' => 'image/png', 'post_title' => 'DEMO unrelated', 'post_status' => 'inherit', 'post_parent' => $page ), $upload['file'] );
wp_update_attachment_metadata( $unrelated, wp_generate_attachment_metadata( $unrelated, $upload['file'] ) );
flush_rewrite_rules();
file_put_contents( '/gestion-output/accounts.json', wp_json_encode( array( 'accounts' => $accounts, 'vehicles' => $vehicles, 'unrelated' => $unrelated, 'page' => $page ) ) );
echo 'RP_GESTION_DEMO_READY';
