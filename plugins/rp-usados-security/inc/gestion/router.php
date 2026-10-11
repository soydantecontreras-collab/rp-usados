<?php
defined( 'ABSPATH' ) || exit;

// Private paths do not participate in public WordPress query-var parsing.
// In particular, nested POST fields must never be treated as a CPT slug.
add_filter( 'request', static function ( array $vars ): array {
	$path = rawurldecode( wp_parse_url( $_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH ) ?: '/' );
	$base = rtrim( wp_parse_url( home_url( '/' ), PHP_URL_PATH ) ?: '', '/' );
	return preg_match( '#^' . preg_quote( $base, '#' ) . '/gestion(?:/|$)#', $path ) ? array( 'error' => '404' ) : $vars;
} );

function rp_usados_gestion_assets(): array {
	$path = dirname( __DIR__, 2 ) . '/assets/dist/.vite/manifest.json';
	$manifest = is_readable( $path ) ? json_decode( file_get_contents( $path ), true ) : array();
	$entry = $manifest['src/main.js'] ?? array();
	$base = plugins_url( 'assets/dist/', dirname( __DIR__, 2 ) . '/rp-usados-security.php' );
	return array( 'js' => isset( $entry['file'] ) ? $base . $entry['file'] : '', 'css' => array_map( static fn( $file ) => $base . $file, $entry['css'] ?? array() ) );
}

function rp_usados_gestion_format_price( array $v ): string {
	return '' !== $v['precio'] ? $v['moneda'] . ' ' . number_format( (float) $v['precio'], str_contains( $v['precio'], '.' ) ? 2 : 0, ',', '.' ) : 'Sin precio cargado';
}

function rp_usados_gestion_post_form( int $id ) {
	if ( ! wp_verify_nonce( is_string( $_POST['_rp_nonce'] ?? null ) ? $_POST['_rp_nonce'] : '', 'rp_gestion_save' ) ) { return rp_usados_gestion_error( 'rp_csrf', 'La solicitud venció. Recargá el formulario.', 403 ); }
	$values = wp_unslash( $_POST['rp_vehicle'] ?? array() );
	if ( ! is_array( $values ) ) { return rp_usados_gestion_error( 'rp_payload', 'Solicitud inválida.' ); }
	if ( isset( $values['galeria'] ) && is_string( $values['galeria'] ) ) { $values['galeria'] = '' === $values['galeria'] ? array() : explode( ',', $values['galeria'] ); }
	$action = $_POST['guardar'] ?? '';
	if ( ! in_array( $action, array( 'draft', 'publish', 'changes' ), true ) ) { return rp_usados_gestion_error( 'rp_payload', 'Acción inválida.' ); }
	$values['publicacion'] = 'changes' === $action ? ( $id ? get_post_status( $id ) : 'draft' ) : $action;
	if ( 'vendido' === ( $values['estado'] ?? '' ) && ( ! $id || 'vendido' !== get_post_meta( $id, 'rp_estado_stock', true ) ) && empty( $_POST['confirmar_vendido'] ) ) { return rp_usados_gestion_error( 'rp_confirm_sold', 'Este vehículo dejará de aparecer en el catálogo. No se eliminará. Confirmá el cambio a vendido.' ); }
	if ( $id && ( ! is_string( $values['revision'] ?? null ) || ! hash_equals( rp_usados_gestion_revision( $id ), $values['revision'] ) ) ) { return rp_usados_gestion_error( 'rp_conflict', 'Otro usuario modificó este vehículo. No se guardó ningún cambio. Recargá la versión actual para continuar.', 409 ); }
	$pre_payload = $values;
	$pre_payload['publicacion'] = 'draft'; // A selected file has not been uploaded yet.
	$pre = rp_usados_gestion_validate( $pre_payload, $id );
	if ( is_wp_error( $pre ) ) { return $pre; }
	if ( 'publish' === $values['publicacion'] ) {
		if ( ! current_user_can( 'publish_vehiculos' ) ) { return rp_usados_gestion_error( 'rp_forbidden', 'No tenés permiso para publicar.', 403 ); }
		$missing = array();
		foreach ( array( 'marca' => 'Marca', 'modelo' => 'Modelo', 'anio' => 'Año', 'estado' => 'Estado comercial' ) as $key => $label ) { if ( '' === $pre[ $key ] ) { $missing[ $key ] = $label . ': obligatorio para publicar.'; } }
		if ( ! $pre['portada'] && empty( $_FILES['portada_archivo']['name'] ) ) { $missing['portada'] = 'Foto principal: obligatoria para publicar.'; }
		if ( $missing ) { return rp_usados_gestion_error( 'rp_validation', 'Revisá los campos indicados. No se guardó ningún cambio.', 422, $missing ); }
	}
	$batch = array();
	foreach ( array( 'portada_archivo', 'galeria_archivos' ) as $name ) {
		$files = $_FILES[ $name ] ?? array();
		if ( ! isset( $files['name'] ) ) { continue; }
		foreach ( is_array( $files['name'] ) ? $files['name'] : array( $files['name'] ) as $index => $filename ) {
			if ( '' === $filename ) { continue; }
			$file = array();
			foreach ( array( 'name', 'type', 'tmp_name', 'error', 'size' ) as $key ) { $file[ $key ] = is_array( $files[ $key ] ?? null ) ? ( $files[ $key ][ $index ] ?? null ) : ( $files[ $key ] ?? null ); }
			$valid = rp_usados_gestion_validate_file( $file );
			if ( is_wp_error( $valid ) ) { return $valid; }
			$batch[] = array( 'name' => $name, 'file' => $file );
		}
	}
	$new_cover = count( array_filter( $batch, static fn( $entry ) => 'portada_archivo' === $entry['name'] ) );
	$existing = array_unique( array_filter( array_merge( $pre['galeria'], $new_cover ? array() : array( $pre['portada'] ) ) ) );
	if ( $new_cover > 1 || count( $existing ) + count( $batch ) > 20 ) { return rp_usados_gestion_error( 'rp_gallery_limit', 'Máximo 20 imágenes distintas, incluida una sola portada.', 422 ); }
	// File inputs work without JS. Uploads stay pending on validation/save failure.
	foreach ( $batch as $entry ) {
			$name = $entry['name'];
			$file = $entry['file'];
			$_FILES['foto'] = $file;
			$request = new WP_REST_Request( 'POST' );
			$request->set_body_params( array( 'vehiculo' => (string) $id ) );
			$request->set_file_params( array( 'foto' => $file ) );
			$result = rp_usados_gestion_upload( $request );
			if ( is_wp_error( $result ) ) { return $result; }
			$image = $result->get_data();
			if ( 'portada_archivo' === $name ) { $values['portada'] = $image['id']; }
			else { $values['galeria'][] = $image['id']; }
	}
	return rp_usados_gestion_save( $values, $id );
}

add_action( 'template_redirect', static function () {
	$path = rawurldecode( wp_parse_url( $_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH ) ?: '/' );
	$base = rtrim( wp_parse_url( home_url( '/' ), PHP_URL_PATH ) ?: '', '/' );
	$path = substr( $path, strlen( $base ) );
	if ( ! preg_match( '#^/gestion(?:/|$)#', $path ) ) { return; }
	rp_usados_gestion_headers();
	header( "Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' blob: data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" );
	if ( '/gestion/sesion/' === $path || '/gestion/sesion' === $path ) {
		if ( 'GET' === $_SERVER['REQUEST_METHOD'] ) { wp_send_json( array( 'csrf' => rp_usados_gestion_login_token() ), 200 ); }
		if ( 'POST' !== $_SERVER['REQUEST_METHOD'] ) { wp_send_json( array( 'message' => 'Método no permitido.' ), 405 ); }
		$result = rp_usados_gestion_login( wp_unslash( $_POST ) );
		if ( is_wp_error( $result ) ) { wp_send_json( array( 'code' => $result->get_error_code(), 'message' => $result->get_error_message() ), $result->get_error_data()['status'] ); }
		wp_send_json( $result, 200 );
	}
	$error = null;
	if ( 'POST' === $_SERVER['REQUEST_METHOD'] && 'logout' === ( $_POST['accion'] ?? '' ) ) {
		if ( ! wp_verify_nonce( is_string( $_POST['_rp_nonce'] ?? null ) ? $_POST['_rp_nonce'] : '', 'rp_gestion_logout' ) ) { $error = rp_usados_gestion_error( 'rp_csrf', 'La solicitud venció.', 403 ); }
		else { wp_logout(); wp_safe_redirect( home_url( '/gestion/' ) ); exit; }
	}
	if ( ! is_user_logged_in() ) {
		if ( 'POST' === $_SERVER['REQUEST_METHOD'] && 'login' === ( $_POST['accion'] ?? '' ) ) {
			$result = rp_usados_gestion_login( wp_unslash( $_POST ) );
			if ( is_wp_error( $result ) ) { $error = $result; }
			else { wp_safe_redirect( home_url( '/gestion/' ) ); exit; }
		}
		if ( ! is_user_logged_in() ) { $view = 'login'; }
	}
	if ( is_user_logged_in() ) {
		if ( ! rp_usados_gestion_access() ) { $view = 'denied'; status_header( 403 ); }
		elseif ( '/gestion/' === $path || '/gestion' === $path ) { $view = 'list'; }
		elseif ( preg_match( '#^/gestion/(nuevo|vehiculos/([1-9][0-9]*))/?$#D', $path, $match ) ) {
			$id = isset( $match[2] ) ? (int) $match[2] : 0;
			$object = $id ? rp_usados_gestion_object( $id ) : true;
			if ( is_wp_error( $object ) ) { $error = $object; $view = 'denied'; status_header( $error->get_error_data()['status'] ); }
			else {
				$view = 'form';
				if ( 'POST' === $_SERVER['REQUEST_METHOD'] && 'save' === ( $_POST['accion'] ?? '' ) ) {
					$result = rp_usados_gestion_post_form( $id );
					if ( is_wp_error( $result ) ) { $error = $result; }
					else { wp_safe_redirect( add_query_arg( 'guardado', '1', $result['editar_url'] ) ); exit; }
				}
				$vehicle = $id ? rp_usados_gestion_dto( $id ) : array_merge( rp_usados_gestion_values(), array( 'id' => 0, 'revision' => '', 'imagenes' => array() ) );
				if ( $error && isset( $_POST['rp_vehicle'] ) && is_array( $_POST['rp_vehicle'] ) ) {
					$submitted_revision = $_POST['rp_vehicle']['revision'] ?? '';
					if ( is_string( $submitted_revision ) && preg_match( '/^[a-f0-9]{64}$/D', $submitted_revision ) ) { $vehicle['revision'] = $submitted_revision; }
					// Preserve scalar text only; image IDs/revision remain authoritative.
					foreach ( wp_unslash( $_POST['rp_vehicle'] ) as $key => $value ) { if ( isset( $vehicle[ $key ] ) && is_scalar( $value ) && ! in_array( $key, array( 'portada', 'galeria', 'revision', 'id', 'publicacion' ), true ) ) { $vehicle[ $key ] = (string) $value; } }
				}
			}
		} else { $view = 'denied'; $error = rp_usados_gestion_error( 'rp_route', 'Página no encontrada.', 404 ); status_header( 404 ); }
	}
	if ( ! isset( $view ) ) { $view = 'login'; }
	if ( $error ) { status_header( $error->get_error_data()['status'] ?? 400 ); }
	elseif ( 'denied' !== $view ) { status_header( 200 ); }
	$assets = rp_usados_gestion_assets();
	$login_token = ! is_user_logged_in() ? rp_usados_gestion_login_token() : '';
	$config = array( 'api' => rest_url( 'rp-usados/v1/gestion/' ), 'nonce' => is_user_logged_in() ? wp_create_nonce( 'wp_rest' ) : '', 'session' => home_url( '/gestion/sesion/' ), 'usuario' => get_current_user_id(), 'home' => home_url( '/gestion/' ) );
	if ( isset( $vehicle ) ) { $config['vehiculo'] = $vehicle; }
	include dirname( __DIR__, 2 ) . '/templates/gestion/layout.php';
	exit;
}, 0 );
