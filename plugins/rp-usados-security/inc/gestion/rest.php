<?php
defined( 'ABSPATH' ) || exit;

function rp_usados_gestion_rest_permission( WP_REST_Request $request ) {
	if ( ! is_user_logged_in() ) { return rp_usados_gestion_error( 'rp_session', 'La sesión venció. Volvé a iniciar sesión; tus datos no se perdieron.', 401 ); }
	if ( ! wp_verify_nonce( $request->get_header( 'X-WP-Nonce' ), 'wp_rest' ) ) { return rp_usados_gestion_error( 'rp_nonce', 'La sesión necesita renovarse.', 403 ); }
	if ( ! rp_usados_gestion_access() ) { return rp_usados_gestion_error( 'rp_forbidden', 'Acceso denegado.', 403 ); }
	if ( $request['id'] ) { $object = rp_usados_gestion_object( (int) $request['id'] ); if ( is_wp_error( $object ) ) { return $object; } }
	return true;
}

function rp_usados_gestion_rest_payload( WP_REST_Request $request ) {
	$value = $request->get_json_params();
	// Reject form/query injection: mutations take exactly a JSON object.
	$raw = json_decode( $request->get_body() );
	if ( ! is_object( $raw ) || ! is_array( $value ) || $request->get_query_params() || $request->get_body_params() ) { return rp_usados_gestion_error( 'rp_payload', 'Se requiere un objeto JSON sin parámetros auxiliares.' ); }
	return $value;
}

add_action( 'rest_api_init', static function () {
	$permission = 'rp_usados_gestion_rest_permission';
	register_rest_route( 'rp-usados/v1', '/gestion/vehiculos', array(
		array( 'methods' => 'GET', 'permission_callback' => $permission, 'callback' => static function ( $r ) {
			$input = $r->get_query_params();
			if ( array_diff( array_keys( $input ), array( 'filtro', 'buscar', 'pagina' ) ) ) { return rp_usados_gestion_error( 'rp_unknown_field', 'Filtro no permitido.' ); }
			return rp_usados_gestion_list( $input );
		} ),
		array( 'methods' => 'POST', 'permission_callback' => $permission, 'callback' => static function ( $r ) {
			$payload = rp_usados_gestion_rest_payload( $r );
			$result = is_wp_error( $payload ) ? $payload : rp_usados_gestion_save( $payload );
			return is_wp_error( $result ) ? $result : new WP_REST_Response( $result, 201 );
		} ),
	) );
	register_rest_route( 'rp-usados/v1', '/gestion/vehiculos/(?P<id>[1-9][0-9]*)', array(
		array( 'methods' => 'GET', 'permission_callback' => $permission, 'callback' => static fn( $r ) => rp_usados_gestion_dto( (int) $r['id'] ) ),
		array( 'methods' => 'PATCH', 'permission_callback' => $permission, 'callback' => static function ( $r ) {
			$payload = rp_usados_gestion_rest_payload( $r );
			return is_wp_error( $payload ) ? $payload : rp_usados_gestion_save( $payload, (int) $r['id'] );
		} ),
	) );
	foreach ( array( 'publicacion' => 'POST', 'estado' => 'PATCH' ) as $field => $method ) {
		register_rest_route( 'rp-usados/v1', '/gestion/vehiculos/(?P<id>[1-9][0-9]*)/' . $field, array(
			'methods' => $method, 'permission_callback' => $permission, 'callback' => static function ( $r ) use ( $field ) {
				$payload = rp_usados_gestion_rest_payload( $r );
				if ( is_wp_error( $payload ) ) { return $payload; }
				if ( ! array_key_exists( $field, $payload ) || array_diff( array_keys( $payload ), array( $field, 'revision' ) ) ) { return rp_usados_gestion_error( 'rp_unknown_field', 'Solicitud incompleta o campo no permitido.' ); }
				if ( 'estado' === $field && ! in_array( $payload['estado'], array( 'disponible', 'reservado', 'vendido' ), true ) ) { return rp_usados_gestion_error( 'rp_state', 'Elegí Disponible, Reservado o Vendido.', 422 ); }
				return rp_usados_gestion_save( $payload, (int) $r['id'] );
			},
		) );
	}
	register_rest_route( 'rp-usados/v1', '/gestion/fotos', array( 'methods' => 'POST', 'permission_callback' => $permission, 'callback' => 'rp_usados_gestion_upload' ) );
	register_rest_route( 'rp-usados/v1', '/gestion/fotos/(?P<imagen>[1-9][0-9]*)', array( 'methods' => 'GET', 'permission_callback' => $permission, 'callback' => static function ( $r ) {
		$raw = $r->get_param( 'vehiculo' ) ?? '0';
		if ( array_diff( array_keys( $r->get_query_params() ), array( 'vehiculo' ) ) || ! is_scalar( $raw ) || ! preg_match( '/^(0|[1-9][0-9]*)$/D', (string) $raw ) ) { return rp_usados_gestion_error( 'rp_photo', 'Foto no disponible.', 404 ); }
		if ( ! rp_usados_gestion_attachment_allowed( (int) $r['imagen'], (int) $raw ) ) { return rp_usados_gestion_error( 'rp_photo', 'Foto no disponible.', 404 ); }
		return rp_usados_gestion_image( (int) $r['imagen'] );
	} ) );
} );

function rp_usados_gestion_validate_file( array $file ) {
	if ( ! isset( $file['name'], $file['tmp_name'], $file['error'] ) || ! is_string( $file['name'] ) || ! is_string( $file['tmp_name'] ) || UPLOAD_ERR_OK !== $file['error'] ) { return rp_usados_gestion_error( 'rp_upload_file', 'No se pudo recibir la foto.' ); }
	if ( ! is_file( $file['tmp_name'] ) || ! is_readable( $file['tmp_name'] ) ) { return rp_usados_gestion_error( 'rp_upload_file', 'No se pudo recibir la foto.' ); }
	$head = file_get_contents( $file['tmp_name'], false, null, 0, 32 );
	$claimed = is_string( $file['type'] ?? null ) ? strtolower( $file['type'] ) : '';
	if ( preg_match( '/\.hei[cf]$/i', $file['name'] ) || in_array( $claimed, array( 'image/heic', 'image/heif' ), true ) || ( is_string( $head ) && preg_match( '/ftyp(?:heic|heix|hevc|hevx|mif1|msf1)/', $head ) ) ) { return rp_usados_gestion_error( 'rp_heic', 'Esta foto está en formato HEIC. Por ahora, subila como JPG, PNG o WebP.', 415 ); }
	$valid = rp_usados_security_validate_image_file( $file['tmp_name'], $file['name'] );
	return is_wp_error( $valid ) ? rp_usados_gestion_error( $valid->get_error_code(), $valid->get_error_message(), 422 ) : true;
}

function rp_usados_gestion_upload( WP_REST_Request $request ) {
	if ( ! current_user_can( 'upload_files' ) || ! current_user_can( 'rp_manage_vehicle_media' ) ) { return rp_usados_gestion_error( 'rp_forbidden', 'No tenés permiso para subir fotos.', 403 ); }
	if ( $request->get_query_params() || array_diff( array_keys( $request->get_body_params() ), array( 'vehiculo' ) ) || array_keys( $request->get_file_params() ) !== array( 'foto' ) ) { return rp_usados_gestion_error( 'rp_upload_shape', 'Solicitud de foto inválida.' ); }
	$raw = $request->get_param( 'vehiculo' ) ?? '0';
	if ( ! is_scalar( $raw ) || ! preg_match( '/^(0|[1-9][0-9]*)$/D', (string) $raw ) ) { return rp_usados_gestion_error( 'rp_upload_target', 'Destino no autorizado.' ); }
	$id = (int) $raw;
	if ( $id ) { $object = rp_usados_gestion_object( $id ); if ( is_wp_error( $object ) ) { return $object; } }
	$file = $request->get_file_params()['foto'];
	$valid = rp_usados_gestion_validate_file( $file );
	if ( is_wp_error( $valid ) ) { return $valid; }
	// Keep new uploads pending until a fully validated save associates them. Replacements
	// still work at the 20-image limit and a failed upload cannot change the old cover.
	$pending = get_posts( array( 'post_type' => 'attachment', 'post_status' => 'inherit', 'post_parent' => 0, 'author' => get_current_user_id(), 'fields' => 'ids', 'numberposts' => 40 ) );
	if ( count( $pending ) >= rp_usados_security_media_limits()['pending'] ) { return rp_usados_gestion_error( 'rp_pending_limit', 'Se alcanzó el límite de 40 fotos pendientes. Guardá las asociaciones antes de subir más.', 422 ); }
	require_once ABSPATH . 'wp-admin/includes/file.php';
	require_once ABSPATH . 'wp-admin/includes/media.php';
	require_once ABSPATH . 'wp-admin/includes/image.php';
	$GLOBALS['rp_usados_security_upload_vehicle'] = 0;
	try { $attachment = media_handle_upload( 'foto', 0, array(), array( 'test_form' => false, 'mimes' => rp_usados_security_image_mimes() ) ); }
	finally { unset( $GLOBALS['rp_usados_security_upload_vehicle'] ); }
	if ( is_wp_error( $attachment ) ) { return rp_usados_gestion_error( 'rp_upload', $attachment->get_error_message(), 422 ); }
	return new WP_REST_Response( rp_usados_gestion_image( (int) $attachment ), 201 );
}

add_filter( 'rest_post_dispatch', static function ( $response, $server, $request ) {
	if ( str_starts_with( $request->get_route(), '/rp-usados/v1/gestion' ) ) {
		$response = rest_ensure_response( $response );
		$response->header( 'Cache-Control', 'private, no-store, no-cache, must-revalidate, max-age=0' );
		$response->header( 'X-Robots-Tag', 'noindex, nofollow, noarchive' );
		$response->header( 'Vary', 'Cookie' );
	}
	return $response;
}, 20, 3 );
