<?php
defined( 'ABSPATH' ) || exit;

function rp_usados_gestion_headers(): void {
	if ( ! defined( 'DONOTCACHEPAGE' ) ) { define( 'DONOTCACHEPAGE', true ); }
	nocache_headers();
	header( 'Cache-Control: private, no-store, no-cache, must-revalidate, max-age=0' );
	header( 'X-Robots-Tag: noindex, nofollow, noarchive', true );
	header( 'X-Frame-Options: DENY' );
	header( 'Referrer-Policy: same-origin' );
	header( 'X-Content-Type-Options: nosniff' );
}

/** Signed double-submit challenge, unique per browser even before WordPress login. */
function rp_usados_gestion_login_token(): string {
	$existing = $_COOKIE['rp_gestion_csrf'] ?? '';
	if ( is_string( $existing ) && rp_usados_gestion_valid_challenge( $existing ) ) { return $existing; }
	$body = wp_generate_password( 40, false, false ) . '.' . ( time() + 30 * MINUTE_IN_SECONDS );
	$token = $body . '.' . hash_hmac( 'sha256', $body, wp_salt( 'nonce' ) );
	$path = wp_parse_url( home_url( '/gestion/' ), PHP_URL_PATH ) ?: '/gestion/';
	setcookie( 'rp_gestion_csrf', $token, array( 'expires' => time() + 30 * MINUTE_IN_SECONDS, 'path' => $path, 'secure' => is_ssl(), 'httponly' => true, 'samesite' => 'Strict' ) );
	$_COOKIE['rp_gestion_csrf'] = $token;
	return $token;
}

function rp_usados_gestion_valid_challenge( string $token ): bool {
	$parts = explode( '.', $token );
	return 3 === count( $parts ) && ctype_digit( $parts[1] ) && (int) $parts[1] >= time() && hash_equals( hash_hmac( 'sha256', $parts[0] . '.' . $parts[1], wp_salt( 'nonce' ) ), $parts[2] );
}

/** Hashed, fixed-window counters; SQL increments cannot lose concurrent attempts. */
function rp_usados_gestion_auth_rate_keys( string $login, ?int $window = null ): array {
	$window = $window ?? (int) floor( time() / ( 15 * MINUTE_IN_SECONDS ) );
	$prefix = 'rp_gestion_attempt_' . sprintf( '%010d', $window ) . '_';
	$ip = (string) ( $_SERVER['REMOTE_ADDR'] ?? 'local' );
	return array(
		$prefix . hash_hmac( 'sha256', 'ip|' . $ip, wp_salt( 'auth' ) ) => 32,
		$prefix . hash_hmac( 'sha256', 'user|' . strtolower( trim( $login ) ), wp_salt( 'auth' ) ) => 8,
	);
}

function rp_usados_gestion_auth_attempt( string $login ): bool {
	global $wpdb;
	foreach ( rp_usados_gestion_auth_rate_keys( $login ) as $key => $limit ) {
		add_option( $key, '0', '', false );
		$updated = $wpdb->query( $wpdb->prepare( "UPDATE {$wpdb->options} SET option_value = CAST(option_value AS UNSIGNED) + 1 WHERE option_name = %s", $key ) );
		$count = (int) $wpdb->get_var( $wpdb->prepare( "SELECT option_value FROM {$wpdb->options} WHERE option_name = %s", $key ) );
		// A blocked IP must not be able to allocate unlimited per-account counters.
		if ( false === $updated || $count < 1 || $count > $limit ) { return false; }
	}
	return true;
}

function rp_usados_gestion_auth_cleanup(): void {
	global $wpdb;
	$before = (int) floor( time() / ( 15 * MINUTE_IN_SECONDS ) ) - 1;
	$prefix = 'rp_gestion_attempt_';
	$wpdb->query( $wpdb->prepare( "DELETE FROM {$wpdb->options} WHERE option_name LIKE %s AND option_name < %s", $wpdb->esc_like( $prefix ) . '%', $prefix . sprintf( '%010d', $before ) . '_' ) );
}
add_action( 'rp_usados_gestion_auth_cleanup', 'rp_usados_gestion_auth_cleanup' );
add_action( 'init', static function () {
	if ( ! wp_next_scheduled( 'rp_usados_gestion_auth_cleanup' ) ) { wp_schedule_event( time() + HOUR_IN_SECONDS, 'hourly', 'rp_usados_gestion_auth_cleanup' ); }
}, 30 );
register_deactivation_hook( dirname( __DIR__, 2 ) . '/rp-usados-security.php', static function () { wp_clear_scheduled_hook( 'rp_usados_gestion_auth_cleanup' ); } );

function rp_usados_gestion_should_redirect_admin( string $script ): bool {
	return rp_usados_security_is_manager() && ! wp_doing_ajax() && ! wp_doing_cron() && ! ( defined( 'REST_REQUEST' ) && REST_REQUEST ) && ! in_array( $script, array( 'async-upload.php', 'admin-ajax.php', 'admin-post.php' ), true );
}
function rp_usados_gestion_redirect_admin(): void {
	if ( rp_usados_gestion_should_redirect_admin( (string) ( $GLOBALS['pagenow'] ?? '' ) ) ) { wp_safe_redirect( home_url( '/gestion/' ) ); exit; }
}
add_action( 'admin_init', 'rp_usados_gestion_redirect_admin' );

function rp_usados_gestion_login( array $input ) {
	$token = $input['csrf'] ?? '';
	$cookie = $_COOKIE['rp_gestion_csrf'] ?? '';
	if ( ! is_string( $token ) || ! is_string( $cookie ) || ! rp_usados_gestion_valid_challenge( $token ) || ! hash_equals( $cookie, $token ) ) { return rp_usados_gestion_error( 'rp_csrf', 'La solicitud venció. Recargá e intentá nuevamente.', 403 ); }
	$login = $input['usuario'] ?? '';
	$password = $input['password'] ?? '';
	if ( ! is_string( $login ) || ! is_string( $password ) || strlen( $login ) > 254 || strlen( $password ) > 4096 ) { return rp_usados_gestion_error( 'rp_login', 'No pudimos iniciar sesión. Revisá los datos e intentá nuevamente.', 401 ); }
	if ( ! rp_usados_gestion_auth_attempt( $login ) ) { return rp_usados_gestion_error( 'rp_rate_limit', 'Demasiados intentos. Esperá hasta 15 minutos antes de volver a intentar.', 429 ); }
	// wp_signon sends cookies but PHP's request cookie array otherwise keeps the old
	// token. Bind the returned REST nonce to the newly created native session.
	$capture = static function ( $cookie ) { $_COOKIE[ LOGGED_IN_COOKIE ] = $cookie; };
	add_action( 'set_logged_in_cookie', $capture );
	try { $user = wp_signon( array( 'user_login' => trim( $login ), 'user_password' => $password, 'remember' => false ), is_ssl() ); }
	finally { remove_action( 'set_logged_in_cookie', $capture ); }
	if ( is_wp_error( $user ) ) {
		return rp_usados_gestion_error( 'rp_login', 'No pudimos iniciar sesión. Revisá los datos e intentá nuevamente.', 401 );
	}
	wp_set_current_user( $user->ID );
	if ( ! rp_usados_gestion_access() ) { return rp_usados_gestion_error( 'rp_forbidden', 'Acceso denegado.', 403 ); }
	return array( 'nonce' => wp_create_nonce( 'wp_rest' ), 'usuario' => $user->ID );
}
