<?php
/** Server-rendered private routes and progressive form fallback. */
defined( 'ABSPATH' ) || exit;

function rp_usados_gestion_asset( string $alias ): string {
	$base = dirname( __DIR__ ) . '/assets/gestion/';
	$url = plugins_url( 'assets/gestion/', dirname( __DIR__ ) . '/rp-usados-security.php' );
	if ( in_array( $alias, array( 'manrope.woff2', 'archivo.woff2' ), true ) && is_file( $base . $alias ) ) { return $url . $alias; }
	$manifest = is_file( $base . '.vite/manifest.json' ) ? json_decode( file_get_contents( $base . '.vite/manifest.json' ), true ) : array();
	foreach ( (array) $manifest as $entry ) {
		if ( empty( $entry['isEntry'] ) ) { continue; }
		if ( 'main.js' === $alias && ! empty( $entry['file'] ) ) { return $url . $entry['file']; }
		if ( 'main.css' === $alias && ! empty( $entry['css'][0] ) ) { return $url . $entry['css'][0]; }
	}
	return '';
}

function rp_usados_gestion_post_payload() {
	$fields = $_POST['fields'] ?? array();
	if ( ! is_array( $fields ) ) { return new WP_Error( 'gestion_payload', 'Datos del vehículo inválidos.' ); }
	$fields = wp_unslash( $fields );
	$allowed = array( 'rp_marca', 'rp_modelo', 'rp_version', 'rp_anio', 'rp_kilometraje', 'rp_precio_monto', 'rp_precio_moneda', 'rp_estado_stock' );
	foreach ( $allowed as $key ) {
		if ( array_key_exists( $key, $_POST ) ) { $fields[ $key ] = wp_unslash( $_POST[ $key ] ); }
	}
	// Top-level scalar fields were already unslashed above.
	$payload = array( 'fields' => $fields );
	foreach ( array( 'description', 'featured_media', 'revision', 'publication' ) as $key ) {
		if ( array_key_exists( $key, $_POST ) ) { $payload[ $key ] = wp_unslash( $_POST[ $key ] ); }
	}
	$intent = $_POST['intent'] ?? null;
	if ( in_array( $intent, array( 'draft', 'publish' ), true ) ) { $payload['publication'] = $intent; }
	if ( isset( $_POST['gallery_json'] ) ) {
		if ( ! is_string( $_POST['gallery_json'] ) ) { return new WP_Error( 'gestion_payload', 'Galería inválida.' ); }
		$gallery = json_decode( wp_unslash( $_POST['gallery_json'] ), true );
		if ( ! is_array( $gallery ) || JSON_ERROR_NONE !== json_last_error() ) { return new WP_Error( 'gestion_payload', 'Galería inválida.' ); }
		$payload['gallery'] = $gallery;
	} elseif ( isset( $_POST['gallery'] ) ) { $payload['gallery'] = wp_unslash( $_POST['gallery'] ); }
	return $payload;
}

/** Validate every selected file before any database or upload mutation. */
function rp_usados_gestion_fallback_files() {
	$files = array();
	foreach ( array( 'cover_file', 'gallery_files' ) as $field ) {
		if ( ! isset( $_FILES[ $field ] ) ) { continue; }
		$raw = $_FILES[ $field ];
		if ( ! is_array( $raw ) || ! isset( $raw['error'], $raw['name'], $raw['tmp_name'], $raw['type'], $raw['size'] ) ) { return new WP_Error( 'gestion_upload', 'Archivo de imagen inválido.' ); }
		$batch = array();
		if ( is_array( $raw['name'] ) ) {
			if ( 'cover_file' === $field || ! array_is_list( $raw['name'] ) ) { return new WP_Error( 'gestion_upload', 'Selección de imágenes inválida.' ); }
			foreach ( array_keys( $raw['name'] ) as $i ) {
				$file = array();
				foreach ( array( 'name', 'type', 'tmp_name', 'error', 'size' ) as $key ) {
					if ( ! is_array( $raw[ $key ] ) || ! array_key_exists( $i, $raw[ $key ] ) || ! is_scalar( $raw[ $key ][ $i ] ) ) { return new WP_Error( 'gestion_upload', 'Selección de imágenes inválida.' ); }
					$file[ $key ] = $raw[ $key ][ $i ];
				}
				$batch[] = $file;
			}
		} else { $batch[] = $raw; }
		foreach ( $batch as $file ) {
			foreach ( array( 'name', 'type', 'tmp_name', 'error', 'size' ) as $key ) {
				if ( ! is_scalar( $file[ $key ] ) ) { return new WP_Error( 'gestion_upload', 'Archivo de imagen inválido.' ); }
			}
			if ( UPLOAD_ERR_NO_FILE === (int) $file['error'] ) { continue; }
			if ( preg_match( '/\.(heic|heif)$/i', $file['name'] ) || in_array( strtolower( $file['type'] ), array( 'image/heic', 'image/heif' ), true ) ) {
				return new WP_Error( 'gestion_heic', 'Esta foto está en formato HEIC. Por ahora, subila como JPG, PNG o WebP.' );
			}
			if ( UPLOAD_ERR_OK !== (int) $file['error'] || ! is_uploaded_file( $file['tmp_name'] ) ) { return new WP_Error( 'gestion_upload', 'No se pudo recibir la foto. Volvé a intentarlo.' ); }
			$valid = rp_usados_security_validate_image_file( $file['tmp_name'], $file['name'] );
			if ( is_wp_error( $valid ) ) { return $valid; }
			$files[] = array( 'field' => $field, 'file' => $file );
		}
	}
	return $files;
}

function rp_usados_gestion_fallback_save( int $id, array $payload ) {
	$files = rp_usados_gestion_fallback_files();
	if ( is_wp_error( $files ) ) { return $files; }
	$preflight = $payload;
	$has_cover = count( array_filter( $files, static fn( array $entry ): bool => 'cover_file' === $entry['field'] ) ) > 0;
	if ( $has_cover && 'publish' === ( $payload['publication'] ?? '' ) ) { $preflight['publication'] = 'draft'; }
	$validated = rp_usados_gestion_validate_payload( $id, $preflight );
	if ( is_wp_error( $validated ) ) { return $validated; }
	if ( $has_cover && 'publish' === ( $payload['publication'] ?? '' ) ) {
		$existing_fields = $id ? get_post_meta( $id ) : array();
		foreach ( array( 'rp_marca', 'rp_modelo', 'rp_anio', 'rp_estado_stock' ) as $required ) {
			$value = $payload['fields'][ $required ] ?? ( $existing_fields[ $required ][0] ?? '' );
			if ( ! is_scalar( $value ) || '' === trim( (string) $value ) ) { return new WP_Error( 'gestion_required', 'Completá marca, modelo, año y estado antes de publicar.', array( 'fields' => array( $required => 'Completá este campo para publicar.' ) ) ); }
		}
	}
	if ( empty( $files ) ) { return rp_usados_gestion_save( $id, $payload ); }
	if ( ! current_user_can( 'upload_files' ) ) { return new WP_Error( 'gestion_upload', 'No tenés permiso para subir imágenes.' ); }
	$existing = $id ? rp_usados_gestion_get( $id ) : array();
	$gallery = $payload['gallery'] ?? ( $existing['gallery'] ?? array() );
	$cover = (int) ( $payload['featured_media'] ?? ( $existing['featured_media'] ?? 0 ) );
	$count = count( array_unique( array_filter( array_merge( (array) $gallery, array( $cover ) ) ) ) ) + count( $files );
	if ( $count > 20 ) { return new WP_Error( 'gestion_images', 'Podés asociar hasta 20 imágenes distintas por vehículo.' ); }
	if ( ! $id ) {
		$draft = rp_usados_gestion_save( 0, array( 'publication' => 'draft', 'fields' => array() ) );
		if ( is_wp_error( $draft ) ) { return $draft; }
		$id = (int) $draft['id'];
		$payload['revision'] = $draft['revision'];
	}
	require_once ABSPATH . 'wp-admin/includes/file.php';
	require_once ABSPATH . 'wp-admin/includes/media.php';
	require_once ABSPATH . 'wp-admin/includes/image.php';
	foreach ( $files as $index => $entry ) {
		$key = 'rpus_upload_' . $index;
		$_FILES[ $key ] = $entry['file'];
		$attachment = media_handle_upload( $key, $id );
		unset( $_FILES[ $key ] );
		if ( is_wp_error( $attachment ) ) { return new WP_Error( 'gestion_upload', 'No se pudo subir una foto. Los datos anteriores se conservaron; podés volver a intentarlo.', array( 'vehicle_id' => $id, 'pending_payload' => array_merge( $payload, array( 'featured_media' => $cover, 'gallery' => $gallery ) ) ) ); }
		if ( 'cover_file' === $entry['field'] ) { $cover = $attachment; } else { $gallery[] = $attachment; }
	}
	$payload['featured_media'] = $cover;
	$payload['gallery'] = $gallery;
	$result = rp_usados_gestion_save( $id, $payload );
	if ( is_wp_error( $result ) ) { $result->add_data( array_merge( (array) $result->get_error_data(), array( 'vehicle_id' => $id, 'pending_payload' => $payload ) ) ); }
	return $result;
}

function rp_usados_gestion_render(): void {
	$home_path = rtrim( (string) wp_parse_url( home_url(), PHP_URL_PATH ), '/' );
	$request_path = rawurldecode( (string) wp_parse_url( $_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH ) );
	$path = substr( $request_path, strlen( $home_path ) );
	if ( ! preg_match( '#^/gestion(?:/|$)#', $path ) ) { return; }
	nocache_headers();
	header( 'Cache-Control: no-store, private, max-age=0' );
	header( 'Vary: Cookie', false );
	header( 'X-Robots-Tag: noindex, nofollow, noarchive' );
	header( 'Referrer-Policy: same-origin' );
	header( 'X-Content-Type-Options: nosniff' );
	header( 'X-Frame-Options: SAMEORIGIN' );
	status_header( 200 );
	// A read-only same-origin cookie-authenticated bridge refreshes an expired REST nonce.
	// Native REST cookie auth cannot do this: it rejects the old nonce before callbacks run.
	if ( 'session' === ( $_GET['access'] ?? '' ) && preg_match( '#^/gestion/?$#D', $path ) ) {
		header_remove( 'Access-Control-Allow-Origin' );
		if ( 'GET' !== ( $_SERVER['REQUEST_METHOD'] ?? 'GET' ) || ! rp_usados_gestion_same_origin() || 'cross-site' === ( $_SERVER['HTTP_SEC_FETCH_SITE'] ?? '' ) ) { wp_send_json( array( 'message' => 'Solicitud no permitida.' ), 403 ); }
		if ( ! rp_usados_gestion_allowed() ) { wp_send_json( array( 'message' => 'Volvé a iniciar sesión.' ), 401 ); }
		wp_send_json( array( 'nonce' => wp_create_nonce( 'wp_rest' ), 'csrf' => wp_create_nonce( 'rp_usados_gestion_action' ) ) );
	}
	$view = 'list'; $form = array(); $vehicles = array(); $notice = array(); $errors = array();
	$filter = isset( $_GET['filter'] ) && is_string( $_GET['filter'] ) ? sanitize_key( $_GET['filter'] ) : 'activo';
	$search = isset( $_GET['search'] ) && is_string( $_GET['search'] ) ? sanitize_text_field( wp_unslash( $_GET['search'] ) ) : '';
	$reauth = isset( $_GET['reauth'] ) && '1' === $_GET['reauth'];
	$id = 0;
	if ( preg_match( '#^/gestion/vehiculos/([1-9][0-9]*)/?$#D', $path, $matches ) ) { $id = (int) $matches[1]; $view = 'form'; }
	elseif ( preg_match( '#^/gestion/nuevo/?$#D', $path ) ) { $view = 'form'; }
	elseif ( ! preg_match( '#^/gestion/?$#D', $path ) ) { status_header( 404 ); $view = 'denied'; $notice = array( 'type' => 'error', 'message' => 'No encontramos esa página de gestión.' ); }
	if ( ! is_user_logged_in() || $reauth ) { $view = 'recover' === ( $_GET['access'] ?? ( $_GET['action'] ?? '' ) ) ? 'recover' : 'login'; }
	elseif ( ! rp_usados_gestion_allowed() ) { status_header( 403 ); $view = 'denied'; }
	elseif ( ! function_exists( 'rp_usados_vehicle_fields' ) || ! post_type_exists( 'vehiculo' ) ) { status_header( 503 ); $view = 'denied'; $notice = array( 'type' => 'error', 'message' => 'La gestión no está disponible. Contactá al administrador.' ); }
	if ( 'POST' === ( $_SERVER['REQUEST_METHOD'] ?? 'GET' ) ) {
		$action = isset( $_POST['action'] ) && is_string( $_POST['action'] ) ? $_POST['action'] : '';
		$result = null;
		if ( in_array( $view, array( 'login', 'recover' ), true ) && in_array( $action, array( 'login', 'recover' ), true ) ) {
			$result = rp_usados_gestion_auth_post( $action );
			if ( true === $result ) {
				if ( $reauth ) {
					$message = wp_json_encode( array( 'type' => 'rp-usados-gestion-authenticated', 'nonce' => wp_create_nonce( 'wp_rest' ) ) );
					echo '<!doctype html><html lang="es"><meta charset="utf-8"><title>Sesión iniciada</title><p>Sesión iniciada. Podés volver al formulario.</p><script>if(window.opener){window.opener.postMessage(' . $message . ',window.location.origin);window.close();}</script></html>'; exit;
				}
				wp_safe_redirect( rp_usados_gestion_url() ); exit;
			}
			if ( is_array( $result ) ) { $notice = $result; }
		} elseif ( is_user_logged_in() && 'logout' === $action ) {
			if ( rp_usados_gestion_same_origin() && is_string( $_POST['csrf'] ?? null ) && wp_verify_nonce( $_POST['csrf'], 'rp_usados_gestion_action' ) ) { wp_logout(); wp_safe_redirect( rp_usados_gestion_url() ); exit; }
			$result = new WP_Error( 'gestion_csrf', 'La solicitud expiró o no es válida. Volvé a cargar la página.' );
		} elseif ( rp_usados_gestion_allowed() ) {
			if ( ! rp_usados_gestion_same_origin() || ! is_string( $_POST['csrf'] ?? null ) || ! wp_verify_nonce( $_POST['csrf'], 'rp_usados_gestion_action' ) ) { $result = new WP_Error( 'gestion_csrf', 'La solicitud expiró o no es válida. Volvé a cargar la página.' ); }
			elseif ( 'logout' === $action ) { wp_logout(); wp_safe_redirect( rp_usados_gestion_url() ); exit; }
			elseif ( 'save' === $action && 'form' === $view ) {
				$sent_id = $_POST['vehicle_id'] ?? '';
				if ( ! is_scalar( $sent_id ) || (string) $id !== (string) $sent_id ) { $result = new WP_Error( 'gestion_object', 'El vehículo solicitado no coincide con el formulario.' ); }
				else {
					$payload = rp_usados_gestion_post_payload();
					$new_state = is_array( $payload ) ? ( $payload['fields']['rp_estado_stock'] ?? null ) : null;
					$old_state = $id ? get_post_meta( $id, 'rp_estado_stock', true ) : '';
					if ( 'vendido' === $new_state && 'vendido' !== $old_state && '1' !== ( $_POST['confirm_sold'] ?? '' ) ) {
						$result = rp_usados_gestion_error( array( 'rp_estado_stock' => 'Confirmá que el vehículo dejará de aparecer en el catálogo. No se eliminará.' ) );
					} else { $result = is_wp_error( $payload ) ? $payload : rp_usados_gestion_fallback_save( $id, $payload ); }
					if ( ! is_wp_error( $result ) ) { wp_safe_redirect( add_query_arg( 'saved', '1', rp_usados_gestion_url( 'vehiculos/' . $result['id'] . '/' ) ) ); exit; }
				}
			} elseif ( 'state' === $action && 'list' === $view ) {
				$state_id = $_POST['vehicle_id'] ?? null; $state = $_POST['state'] ?? null; $revision = $_POST['revision'] ?? null;
				if ( ! is_scalar( $state_id ) || ! ctype_digit( (string) $state_id ) || ! is_string( $state ) || ! is_string( $revision ) ) { $result = new WP_Error( 'gestion_state', 'Cambio de estado inválido.' ); }
				elseif ( 'vendido' === $state && '1' !== ( $_POST['confirm_sold'] ?? '' ) ) { $result = new WP_Error( 'gestion_confirm', 'Confirmá que el vehículo dejará de aparecer en el catálogo. No se eliminará.' ); }
				else { $result = rp_usados_gestion_change_state( (int) $state_id, $state, $revision ); }
				if ( ! is_wp_error( $result ) ) { wp_safe_redirect( add_query_arg( array( 'saved' => '1', 'filter' => $filter, 'search' => $search ), rp_usados_gestion_url() ) ); exit; }
			}
		}
		if ( is_wp_error( $result ) ) {
			$notice = array( 'type' => 'error', 'message' => $result->get_error_message() );
			$error_data = $result->get_error_data();
			$status = is_array( $error_data ) ? (int) ( $error_data['status'] ?? 422 ) : 422;
			if ( 'gestion_csrf' === $result->get_error_code() ) { $status = 403; }
			elseif ( 'gestion_rate' === $result->get_error_code() ) { $status = 429; header( 'Retry-After: 600' ); }
			elseif ( 'gestion_login' === $result->get_error_code() ) { $status = 401; }
			status_header( $status >= 400 && $status <= 599 ? $status : 422 );
			$errors = is_array( $error_data ) ? ( $error_data['fields'] ?? ( $error_data['errors'] ?? array() ) ) : array();
			if ( is_array( $error_data ) && ! empty( $error_data['vehicle_id'] ) && isset( $error_data['pending_payload'] ) ) {
				$id = (int) $error_data['vehicle_id'];
				$payload = $error_data['pending_payload'];
			}
		}
	}
	if ( 'form' === $view && rp_usados_gestion_allowed() ) {
		$form = rp_usados_gestion_get( $id );
		if ( is_wp_error( $form ) ) { status_header( 404 ); $notice = array( 'type' => 'error', 'message' => $form->get_error_message() ); $view = 'denied'; $form = array(); }
		elseif ( isset( $payload ) && is_array( $payload ) && ! empty( $notice ) ) {
			// Preserve typed input for correction; never trust it for authorization or escaping.
			foreach ( array( 'description', 'publication' ) as $key ) {
				if ( isset( $payload[ $key ] ) && is_string( $payload[ $key ] ) ) { $form[ $key ] = $payload[ $key ]; }
			}
			foreach ( $payload['fields'] as $key => $value ) {
				if ( array_key_exists( $key, rp_usados_vehicle_fields() ) && is_scalar( $value ) ) { $form['fields'][ $key ] = $value; }
			}
			// A stale form cannot silently acquire the newest revision and overwrite it on retry.
			if ( isset( $payload['revision'] ) && is_string( $payload['revision'] ) ) { $form['revision'] = $payload['revision']; }
			foreach ( array( 'featured_media', 'gallery' ) as $key ) {
				if ( isset( $payload[ $key ] ) ) {
					$ids = 'gallery' === $key ? $payload[ $key ] : array( $payload[ $key ] );
					if ( ! is_array( $ids ) ) { continue; }
					$valid_ids = array();
					foreach ( $ids as $image_id ) {
						if ( ! is_scalar( $image_id ) || ! ctype_digit( (string) $image_id ) ) { continue; }
						$image_id = (int) $image_id;
						if ( ! $image_id && 'featured_media' === $key ) { $valid_ids[] = 0; continue; }
						if ( ! $id || ! rp_usados_security_can_use_attachment( get_current_user_id(), $image_id, $id ) ) { continue; }
						$valid_ids[] = $image_id;
						$src = wp_get_attachment_image_src( $image_id, 'large' ); $thumb = wp_get_attachment_image_src( $image_id, 'thumbnail' );
						if ( $src ) { $form['images'][ $image_id ] = array( 'id' => $image_id, 'url' => $src[0], 'thumb' => $thumb ? $thumb[0] : $src[0], 'width' => $src[1], 'height' => $src[2], 'alt' => (string) get_post_meta( $image_id, '_wp_attachment_image_alt', true ) ); }
					}
					if ( 'gallery' === $key ) { $form['gallery'] = $valid_ids; }
					elseif ( count( $valid_ids ) ) { $form['featured_media'] = $valid_ids[0]; }
				}
			}
		}
	} elseif ( 'list' === $view && rp_usados_gestion_allowed() ) { $vehicles = rp_usados_gestion_list( $filter, $search ); }
	if ( empty( $notice ) && isset( $_GET['saved'] ) && '1' === $_GET['saved'] && rp_usados_gestion_allowed() ) { $notice = array( 'type' => 'success', 'message' => 'Cambios guardados' ); }
	$config = array( 'restRoot' => rest_url( 'rp-usados/v1/gestion/' ), 'nonce' => is_user_logged_in() ? wp_create_nonce( 'wp_rest' ) : '', 'csrf' => in_array( $view, array( 'login', 'recover' ), true ) ? rp_usados_gestion_guest_token() : wp_create_nonce( 'rp_usados_gestion_action' ), 'managementUrl' => rp_usados_gestion_url(), 'formAction' => $id ? rp_usados_gestion_url( 'vehiculos/' . $id . '/' ) : rp_usados_gestion_url( 'nuevo/' ), 'loginUrl' => rp_usados_gestion_url(), 'themeUrl' => get_stylesheet_directory_uri(), 'siteUrl' => home_url( '/' ), 'logoutUrl' => rp_usados_gestion_url(), 'reauth' => $reauth, 'errors' => $errors );
	$config['actionCsrf'] = is_user_logged_in() ? wp_create_nonce( 'rp_usados_gestion_action' ) : '';
	$template = dirname( __DIR__ ) . '/templates/gestion/index.php';
	if ( is_file( $template ) ) { include $template; }
	else { status_header( 503 ); echo '<!doctype html><html lang="es"><meta charset="utf-8"><title>Gestión no disponible</title><p>La gestión no está disponible. Contactá al administrador.</p></html>'; }
	exit;
}
add_action( 'template_redirect', 'rp_usados_gestion_render', -20 );

