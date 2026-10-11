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

function rp_usados_gestion_login( array $input ) {
	$token = $input['csrf'] ?? '';
	$cookie = $_COOKIE['rp_gestion_csrf'] ?? '';
	if ( ! is_string( $token ) || ! is_string( $cookie ) || ! rp_usados_gestion_valid_challenge( $token ) || ! hash_equals( $cookie, $token ) ) { return rp_usados_gestion_error( 'rp_csrf', 'La solicitud venció. Recargá e intentá nuevamente.', 403 ); }
	$login = $input['usuario'] ?? '';
	$password = $input['password'] ?? '';
	if ( ! is_string( $login ) || ! is_string( $password ) || strlen( $login ) > 254 || strlen( $password ) > 4096 ) { return rp_usados_gestion_error( 'rp_login', 'No pudimos iniciar sesión. Revisá los datos e intentá nuevamente.', 401 ); }
	$ip = (string) ( $_SERVER['REMOTE_ADDR'] ?? 'local' );
	$keys = array( 'rp_login_ip_' . hash_hmac( 'sha256', $ip, wp_salt() ), 'rp_login_user_' . hash_hmac( 'sha256', strtolower( trim( $login ) ), wp_salt() ) );
	foreach ( $keys as $key ) { if ( (int) get_transient( $key ) >= 8 ) { return rp_usados_gestion_error( 'rp_rate_limit', 'Demasiados intentos. Esperá 15 minutos antes de volver a intentar.', 429 ); } }
	// wp_signon sends cookies but PHP's request cookie array otherwise keeps the old
	// token. Bind the returned REST nonce to the newly created native session.
	$capture = static function ( $cookie ) { $_COOKIE[ LOGGED_IN_COOKIE ] = $cookie; };
	add_action( 'set_logged_in_cookie', $capture );
	try { $user = wp_signon( array( 'user_login' => trim( $login ), 'user_password' => $password, 'remember' => false ), is_ssl() ); }
	finally { remove_action( 'set_logged_in_cookie', $capture ); }
	if ( is_wp_error( $user ) ) {
		foreach ( $keys as $key ) { set_transient( $key, (int) get_transient( $key ) + 1, 15 * MINUTE_IN_SECONDS ); }
		return rp_usados_gestion_error( 'rp_login', 'No pudimos iniciar sesión. Revisá los datos e intentá nuevamente.', 401 );
	}
	wp_set_current_user( $user->ID );
	foreach ( $keys as $key ) { delete_transient( $key ); }
	if ( ! rp_usados_gestion_access() ) { return rp_usados_gestion_error( 'rp_forbidden', 'Acceso denegado.', 403 ); }
	return array( 'nonce' => wp_create_nonce( 'wp_rest' ), 'usuario' => $user->ID );
}
