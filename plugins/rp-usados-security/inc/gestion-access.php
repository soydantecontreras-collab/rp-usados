<?php
/** Native WordPress sessions and access controls for the private stock panel. */
defined( 'ABSPATH' ) || exit;

function rp_usados_gestion_allowed(): bool {
	$id = get_current_user_id();
	return $id > 0 && function_exists( 'rp_usados_validate_vehicle_input' ) && post_type_exists( 'vehiculo' ) && ( rp_usados_security_is_administrator( $id ) || rp_usados_security_is_manager( $id ) ) && current_user_can( 'edit_vehiculos' );
}

function rp_usados_gestion_url( string $path = '' ): string {
	return home_url( '/gestion/' . ltrim( $path, '/' ) );
}

/** Tokens are bound to an HttpOnly browser cookie; anonymous WP nonces alone are not sufficient. */
function rp_usados_gestion_guest_token(): string {
	$cookie = isset( $_COOKIE['rpus_gestion_guest'] ) && is_string( $_COOKIE['rpus_gestion_guest'] ) ? $_COOKIE['rpus_gestion_guest'] : '';
	if ( ! preg_match( '/^[a-f0-9]{64}$/D', $cookie ) ) {
		$cookie = bin2hex( random_bytes( 32 ) );
		$path = wp_parse_url( rp_usados_gestion_url(), PHP_URL_PATH );
		setcookie( 'rpus_gestion_guest', $cookie, array( 'expires' => 0, 'path' => $path ?: '/gestion/', 'secure' => is_ssl(), 'httponly' => true, 'samesite' => 'Lax' ) );
		$_COOKIE['rpus_gestion_guest'] = $cookie;
	}
	$time = time();
	return $time . '.' . hash_hmac( 'sha256', 'gestion-login|' . $cookie . '|' . $time, wp_salt( 'nonce' ) );
}

function rp_usados_gestion_guest_verify( $token ): bool {
	if ( ! is_string( $token ) || ! preg_match( '/^([0-9]{10})\.([a-f0-9]{64})$/D', $token, $parts ) ) { return false; }
	$cookie = $_COOKIE['rpus_gestion_guest'] ?? '';
	if ( ! is_string( $cookie ) || ! preg_match( '/^[a-f0-9]{64}$/D', $cookie ) ) { return false; }
	$time = (int) $parts[1];
	return $time <= time() + 60 && $time >= time() - 1800 && hash_equals( hash_hmac( 'sha256', 'gestion-login|' . $cookie . '|' . $time, wp_salt( 'nonce' ) ), $parts[2] );
}

function rp_usados_gestion_same_origin(): bool {
	if ( empty( $_SERVER['HTTP_ORIGIN'] ) ) { return true; }
	$origin = wp_parse_url( $_SERVER['HTTP_ORIGIN'] );
	$home = wp_parse_url( home_url() );
	return is_array( $origin ) && is_array( $home ) && strtolower( $origin['scheme'] ?? '' ) === strtolower( $home['scheme'] ?? '' ) && strtolower( $origin['host'] ?? '' ) === strtolower( $home['host'] ?? '' ) && ( $origin['port'] ?? ( 'https' === ( $origin['scheme'] ?? '' ) ? 443 : 80 ) ) === ( $home['port'] ?? ( 'https' === ( $home['scheme'] ?? '' ) ? 443 : 80 ) );
}

/** Fixed-window counters use atomic SQL increments rather than a transient read/write race. */
function rp_usados_gestion_auth_attempt( string $account, string $scope ): bool {
	global $wpdb;
	$window = (int) floor( time() / 600 );
	// Do not trust client-controlled forwarding headers for rate-limit identity.
	$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
	$limits = array( 'ip' => array( $ip, 30 ), 'account' => array( strtolower( trim( $account ) ), 10 ) );
	foreach ( $limits as $kind => $entry ) {
		$key = 'rpus_auth_' . $window . '_' . hash_hmac( 'sha256', $scope . '|' . $kind . '|' . $entry[0], wp_salt( 'auth' ) );
		add_option( $key, '0', '', false );
		$updated = $wpdb->query( $wpdb->prepare( "UPDATE {$wpdb->options} SET option_value = CAST(option_value AS UNSIGNED) + 1 WHERE option_name = %s", $key ) );
		$count = (int) $wpdb->get_var( $wpdb->prepare( "SELECT option_value FROM {$wpdb->options} WHERE option_name = %s", $key ) );
		// Stop after the IP gate; blocked clients cannot create unbounded account counters.
		if ( false === $updated || $count < 1 || $count > $entry[1] ) { return false; }
	}
	return true;
}

function rp_usados_gestion_cleanup_auth_counters(): void {
	global $wpdb;
	$before = (int) floor( time() / 600 ) - 2;
	$wpdb->query( $wpdb->prepare( "DELETE FROM {$wpdb->options} WHERE option_name LIKE %s AND CAST(SUBSTRING_INDEX(SUBSTRING(option_name, 11), '_', 1) AS UNSIGNED) < %d", $wpdb->esc_like( 'rpus_auth_' ) . '%', $before ) );
}
add_action( 'rp_usados_gestion_auth_cleanup', 'rp_usados_gestion_cleanup_auth_counters' );
add_action( 'init', static function () {
	if ( ! wp_next_scheduled( 'rp_usados_gestion_auth_cleanup' ) ) { wp_schedule_event( time() + HOUR_IN_SECONDS, 'hourly', 'rp_usados_gestion_auth_cleanup' ); }
}, 30 );

function rp_usados_gestion_auth_post( string $action ) {
	if ( ! rp_usados_gestion_same_origin() || ! rp_usados_gestion_guest_verify( $_POST['csrf'] ?? null ) ) {
		return new WP_Error( 'gestion_csrf', 'La solicitud expiró o no es válida. Volvé a cargar la página.' );
	}
	$username = $_POST['username'] ?? '';
	if ( ! is_string( $username ) || strlen( $username ) > 254 || ! rp_usados_gestion_auth_attempt( $username, $action ) ) {
		return new WP_Error( 'gestion_rate', 'No pudimos completar el acceso. Esperá unos minutos e intentá nuevamente.' );
	}
	$username = trim( wp_unslash( $username ) );
	if ( 'recover' === $action ) {
		$result = retrieve_password( $username );
		if ( is_wp_error( $result ) ) {
			// A mail transport failure must never be presented as a successful delivery.
			if ( in_array( 'retrieve_password_email_failure', $result->get_error_codes(), true ) ) {
				return new WP_Error( 'gestion_mail', 'No se pudo enviar el correo. Contactá al administrador para recuperar el acceso.' );
			}
			return array( 'type' => 'info', 'message' => 'Si los datos corresponden a una cuenta, recibirás instrucciones de recuperación por correo. Si no llegan, contactá al administrador.' );
		}
		return array( 'type' => 'info', 'message' => 'Si los datos corresponden a una cuenta, recibirás instrucciones de recuperación por correo. Si no llegan, contactá al administrador.' );
	}
	$password = $_POST['password'] ?? '';
	if ( ! is_string( $password ) || strlen( $password ) > 4096 ) { return new WP_Error( 'gestion_login', 'No pudimos ingresar con esos datos.' ); }
	$user = wp_signon( array( 'user_login' => $username, 'user_password' => wp_unslash( $password ), 'remember' => isset( $_POST['remember'] ) && '1' === $_POST['remember'] ), is_ssl() );
	if ( is_wp_error( $user ) ) { return new WP_Error( 'gestion_login', 'No pudimos ingresar con esos datos.' ); }
	wp_set_current_user( $user->ID );
	if ( ! rp_usados_gestion_allowed() ) { wp_logout(); return new WP_Error( 'gestion_login', 'No pudimos ingresar con esos datos.' ); }
	return true;
}

/** The redirect is convenience only: capabilities continue to protect every operation. */
add_action( 'admin_init', static function () {
	if ( ! rp_usados_security_is_manager() || wp_doing_ajax() || wp_doing_cron() || ( defined( 'REST_REQUEST' ) && REST_REQUEST ) ) { return; }
	$script = $GLOBALS['pagenow'] ?? '';
	if ( in_array( $script, array( 'async-upload.php', 'admin-ajax.php', 'admin-post.php' ), true ) ) { return; }
	wp_safe_redirect( rp_usados_gestion_url() ); exit;
} );

