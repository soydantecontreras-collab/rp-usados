<?php
/** RC regression checks; included by the isolated real-WordPress service suite. */
wp_set_current_user( $manager );
$original_server = $_SERVER;
$original_cookies = $_COOKIE;
$original_type = $GLOBALS['wp_post_types']['vehiculo'];
unset( $GLOBALS['wp_post_types']['vehiculo'] );
rp_gestion_check( 'release access fails closed without vehicle CPT', ! rp_usados_gestion_access() );
$GLOBALS['wp_post_types']['vehiculo'] = $original_type;

$_SERVER['REMOTE_ADDR'] = '192.0.2.210';
$rate_user = 'release-rate-' . wp_generate_uuid4();
for ( $attempt = 1; $attempt <= 8; $attempt++ ) { rp_gestion_check( 'release atomic account gate attempt ' . $attempt, rp_usados_gestion_auth_attempt( $rate_user ) ); }
rp_gestion_check( 'release account ninth attempt blocked', ! rp_usados_gestion_auth_attempt( $rate_user ) );
global $wpdb;
$keys = array_keys( rp_usados_gestion_auth_rate_keys( $rate_user ) );
$stored_count = (int) $wpdb->get_var( $wpdb->prepare( "SELECT option_value FROM {$wpdb->options} WHERE option_name = %s", $keys[1] ) );
rp_gestion_check( 'release SQL preserves all account increments', 9 === $stored_count );

$_SERVER['REMOTE_ADDR'] = '192.0.2.211';
for ( $attempt = 1; $attempt <= 32; $attempt++ ) { rp_gestion_check( 'release IP gate attempt ' . $attempt, rp_usados_gestion_auth_attempt( 'release-distinct-' . $attempt ) ); }
$blocked_keys = array_keys( rp_usados_gestion_auth_rate_keys( 'release-never-allocated' ) );
rp_gestion_check( 'release IP thirty-third attempt blocked', ! rp_usados_gestion_auth_attempt( 'release-never-allocated' ) );
rp_gestion_check( 'release blocked IP cannot allocate more account rows', false === get_option( $blocked_keys[1], false ) );
$old_keys = array_keys( rp_usados_gestion_auth_rate_keys( 'release-expired', (int) floor( time() / 900 ) - 10 ) );
foreach ( $old_keys as $key ) { add_option( $key, '5', '', false ); }
rp_usados_gestion_auth_cleanup();
foreach ( $old_keys as $key ) {
	$exists = (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM {$wpdb->options} WHERE option_name = %s", $key ) );
	rp_gestion_check( 'release expired counter removed ' . substr( $key, -8 ), 0 === $exists );
}
rp_gestion_check( 'release cleanup preserves current counters', (int) $wpdb->get_var( $wpdb->prepare( "SELECT option_value FROM {$wpdb->options} WHERE option_name = %s", $keys[1] ) ) === 9 );

$_SERVER['REMOTE_ADDR'] = '192.0.2.212';
$challenge = rp_usados_gestion_login_token();
rp_gestion_check( 'release guest challenge signed', rp_usados_gestion_valid_challenge( $challenge ) );
rp_gestion_check( 'release guest challenge tampering rejected', ! rp_usados_gestion_valid_challenge( $challenge . 'x' ) );
$login_result = rp_usados_gestion_login( array( 'csrf' => $challenge, 'usuario' => $fixture['accounts']['manager']['login'], 'password' => $fixture['accounts']['manager']['password'] ) );
rp_gestion_check( 'release native login accepted', ! is_wp_error( $login_result ) );
rp_gestion_check( 'release returned nonce belongs to new native session', ! is_wp_error( $login_result ) && wp_verify_nonce( $login_result['nonce'], 'wp_rest' ) );
$login_keys = array_keys( rp_usados_gestion_auth_rate_keys( $fixture['accounts']['manager']['login'] ) );
rp_gestion_check( 'release successful login does not erase IP limit', 1 === (int) $wpdb->get_var( $wpdb->prepare( "SELECT option_value FROM {$wpdb->options} WHERE option_name = %s", $login_keys[0] ) ) );

rp_gestion_check( 'release manager admin navigation redirects', rp_usados_gestion_should_redirect_admin( 'index.php' ) );
foreach ( array( 'async-upload.php', 'admin-ajax.php', 'admin-post.php' ) as $technical ) { rp_gestion_check( 'release technical route remains available ' . $technical, ! rp_usados_gestion_should_redirect_admin( $technical ) ); }
wp_set_current_user( $fixture['accounts']['admin']['id'] );
rp_gestion_check( 'release administrator retains wp-admin', ! rp_usados_gestion_should_redirect_admin( 'index.php' ) );
wp_set_current_user( $manager );

$html = '<p>Descripción <strong>real</strong> de la unidad.</p>';
$current = rp_usados_gestion_dto( $id );
$html_saved = rp_usados_gestion_save( array( 'descripcion' => $html, 'revision' => $current['revision'] ), $id );
rp_gestion_check( 'release compatible HTML description preserved', ! is_wp_error( $html_saved ) && $html === get_post_field( 'post_content', $id ) );
$clean = rp_usados_gestion_validate( array( 'descripcion' => '<p>Texto</p><script>alert(1)</script><img src=x onerror=alert(1)>' ), $id );
rp_gestion_check( 'release description HTML still sanitized', ! is_wp_error( $clean ) && ! str_contains( $clean['descripcion'], '<script' ) && ! str_contains( $clean['descripcion'], 'onerror' ) );

$own_image = (int) get_post_thumbnail_id( $id );
$pending_error = rp_usados_gestion_pending_error( rp_usados_gestion_error( 'rp_upload', 'Fallo de prueba', 422 ), array( 'portada' => $own_image, 'galeria' => array( $own_image, $fixture['unrelated'] ) ), $id );
$pending_images = $pending_error->get_error_data()['pending_images'];
rp_gestion_check( 'release retry retains authorized photo IDs', $own_image === $pending_images['portada'] && in_array( $own_image, $pending_images['galeria'], true ) );
rp_gestion_check( 'release retry excludes foreign photo IDs', ! in_array( $fixture['unrelated'], $pending_images['galeria'], true ) );
rp_gestion_check( 'release retry never deletes attachment', 'attachment' === get_post_type( $own_image ) );
$retry = rp_usados_gestion_save( array( 'portada' => $pending_images['portada'], 'galeria' => $pending_images['galeria'], 'revision' => rp_usados_gestion_revision( $id ) ), $id );
rp_gestion_check( 'release explicit retry saves retained photo associations', ! is_wp_error( $retry ) && $retry['portada'] === $own_image && in_array( $own_image, $retry['galeria'], true ) );
$_SERVER = $original_server;
$_COOKIE = $original_cookies;
