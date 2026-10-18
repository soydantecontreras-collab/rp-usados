<?php
/** Isolated panel HTTP fixture. Random credentials only outside web root. */
defined( 'ABSPATH' ) || exit;
wp_set_current_user( 1 );
require_once ABSPATH . 'wp-admin/includes/image.php';
$accounts = array();
foreach ( array( 'manager' => 'rp_stock_manager', 'subscriber' => 'subscriber', 'admin' => 'administrator' ) as $name => $role ) {
	$password = wp_generate_password( 32 ); $login = 'gestion-http-' . $name;
	$id = wp_insert_user( array( 'user_login' => $login, 'user_pass' => $password, 'role' => $role ) );
	$accounts[ $name ] = array( 'id' => $id, 'login' => $login, 'password' => $password );
}
function rp_gestion_http_image( int $parent, int $author, string $source = 'square.png' ): int {
	$uploads = wp_upload_dir(); $file = $uploads['path'] . '/' . wp_unique_filename( $uploads['path'], $source );
	copy( '/gestion-fixtures/' . $source, $file );
	$id = wp_insert_attachment( array( 'post_title' => 'TEST IMAGE', 'post_author' => $author, 'post_parent' => $parent, 'post_mime_type' => 'image/png', 'post_status' => 'inherit' ), $file );
	wp_update_attachment_metadata( $id, wp_generate_attachment_metadata( $id, $file ) ); return $id;
}
$vehicles = array();
foreach ( array( 'disponible', 'reservado', 'vendido', 'borrador' ) as $index => $state ) {
	$id = wp_insert_post( array( 'post_type' => 'vehiculo', 'post_status' => 'borrador' === $state ? 'draft' : 'publish', 'post_title' => 'QA Volkswagen Vento ' . $state, 'post_name' => 'qa-gestion-' . $state, 'post_author' => $accounts['manager']['id'] ) );
	foreach ( array( 'rp_marca' => 'Volkswagen', 'rp_modelo' => 'Vento', 'rp_version' => 'Highline', 'rp_anio' => '2021', 'rp_kilometraje' => '45000', 'rp_precio_monto' => '24500', 'rp_precio_moneda' => 'USD', 'rp_estado_stock' => 'borrador' === $state ? '' : $state ) as $key => $value ) { update_post_meta( $id, $key, $value ); }
	$images = array(); for ( $i = 0; $i < 4; $i++ ) { $images[] = rp_gestion_http_image( $id, $accounts['manager']['id'] ); }
	set_post_thumbnail( $id, $images[0] ); update_post_meta( $id, 'rp_galeria_ids', array_slice( $images, 1 ) );
	$vehicles[ $state ] = array( 'id' => $id, 'images' => $images );
}
$outside = wp_insert_post( array( 'post_type' => 'page', 'post_title' => 'NOT STOCK', 'post_status' => 'publish' ) );
$foreign = rp_gestion_http_image( $outside, 1 );
update_option( 'rp_usados_whatsapp', '5491125348193' );
flush_rewrite_rules();
file_put_contents( '/gestion-output/accounts.json', wp_json_encode( array( 'accounts' => $accounts, 'vehicles' => $vehicles, 'outside' => $outside, 'foreign' => $foreign ) ) );
