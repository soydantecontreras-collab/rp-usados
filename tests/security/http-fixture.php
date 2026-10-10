<?php
/** Disposable HTTP fixture only; credentials stay outside the web root. */
defined( 'ABSPATH' ) || exit;
wp_set_current_user( 1 );
require_once ABSPATH . 'wp-admin/includes/image.php';
// Load the native REST client only in this disposable test site's admin.
// It emits WordPress' normal cookie-session nonce, not a custom auth endpoint.
wp_mkdir_p( WP_CONTENT_DIR . '/mu-plugins' );
file_put_contents( WP_CONTENT_DIR . '/mu-plugins/rp-http-test.php', '<?php add_action("admin_enqueue_scripts", static function () { wp_enqueue_script("wp-api"); });' );
$accounts = array();
foreach ( array( 'manager' => 'rp_stock_manager', 'subscriber' => 'subscriber' ) as $name => $role ) {
	$password = wp_generate_password( 32 );
	$id = wp_insert_user( array( 'user_login' => 'http-' . $name, 'user_pass' => $password, 'role' => $role ) );
	$accounts[ $name ] = array( 'id' => $id, 'login' => 'http-' . $name, 'password' => $password );
}
$vehicle = wp_insert_post( array( 'post_type' => 'vehiculo', 'post_status' => 'publish', 'post_title' => 'HTTP SECURITY FIXTURE', 'post_name' => 'http-security-fixture' ) );
update_post_meta( $vehicle, 'rp_estado_stock', 'disponible' );
update_post_meta( $vehicle, 'rp_precio_monto', '12345.67' );
$outside = wp_insert_post( array( 'post_type' => 'page', 'post_title' => 'OUTSIDE STOCK', 'post_status' => 'publish' ) );
$dir = wp_upload_dir(); $file = $dir['path'] . '/foreign.png';
copy( '/security-fixtures/square.png', $file );
$foreign = wp_insert_attachment( array( 'post_author' => 1, 'post_parent' => $outside, 'post_mime_type' => 'image/png', 'post_status' => 'inherit' ), $file );
wp_update_attachment_metadata( $foreign, wp_generate_attachment_metadata( $foreign, $file ) );
flush_rewrite_rules();
file_put_contents( '/security-output/accounts.json', wp_json_encode( array( 'accounts' => $accounts, 'vehicle' => $vehicle, 'outside' => $outside, 'foreign' => $foreign ) ) );
