<?php
defined( 'ABSPATH' ) || exit;

function rp_usados_security_media_limits(): array {
	return array( 'bytes' => 12 * MB_IN_BYTES, 'side' => 6000, 'pixels' => 24000000, 'images' => 20, 'pending' => 40 );
}

function rp_usados_security_image_mimes(): array {
	return array( 'jpg|jpeg|jpe' => 'image/jpeg', 'png' => 'image/png', 'webp' => 'image/webp' );
}

function rp_usados_security_validate_image_file( string $path, string $name, bool $decode = true ) {
	$limits = rp_usados_security_media_limits();
	if ( ! is_file( $path ) || ! is_readable( $path ) || filesize( $path ) < 1 || filesize( $path ) > $limits['bytes'] ) {
		return new WP_Error( 'rp_image_size', 'La imagen debe pesar entre 1 byte y 12 MiB.' );
	}
	if ( preg_match( '/\.(?:php[0-9]?|phtml|phar|html?|js|svg)(?:\.|$)/i', $name ) ) { return new WP_Error( 'rp_image_name', 'Nombre de archivo no permitido.' ); }
	$type = wp_check_filetype( $name, rp_usados_security_image_mimes() );
	$actual = wp_get_image_mime( $path );
	if ( ! $type['ext'] || ! $type['type'] || $actual !== $type['type'] ) {
		return new WP_Error( 'rp_image_type', 'Sólo se permiten imágenes JPEG, PNG o WebP con extensión y contenido coincidentes.' );
	}
	$size = wp_getimagesize( $path );
	if ( ! $size || $size[0] < 1 || $size[1] < 1 || $size[0] > $limits['side'] || $size[1] > $limits['side'] || $size[0] * $size[1] > $limits['pixels'] ) {
		return new WP_Error( 'rp_image_dimensions', 'La imagen supera 6000 px por lado o 24 megapíxeles, o está dañada.' );
	}
	if ( $decode && is_wp_error( wp_get_image_editor( $path ) ) ) {
		return new WP_Error( 'rp_image_decode', 'No se pudo decodificar la imagen.' );
	}
	return true;
}

function rp_usados_security_stock_attachment( int $attachment_id ): bool {
	$post = get_post( $attachment_id );
	if ( ! $post || 'attachment' !== $post->post_type || 'trash' === $post->post_status || ! in_array( $post->post_mime_type, array_values( rp_usados_security_image_mimes() ), true ) ) { return false; }
	$file = get_attached_file( $attachment_id );
	return $file && true === rp_usados_security_validate_image_file( $file, wp_basename( $file ), false );
}

function rp_usados_security_vehicle_has_attachment( int $vehicle_id, int $attachment_id ): bool {
	$gallery = get_post_meta( $vehicle_id, 'rp_galeria_ids', true );
	return (int) get_post_thumbnail_id( $vehicle_id ) === $attachment_id || ( is_array( $gallery ) && in_array( $attachment_id, $gallery, true ) );
}

function rp_usados_security_can_read_legacy_attachment( int $user_id, int $attachment_id ): bool {
	$candidates = get_posts( array( 'post_type' => 'vehiculo', 'post_status' => 'any', 'fields' => 'ids', 'numberposts' => -1, 'meta_query' => array(
		'relation' => 'OR',
		array( 'key' => '_thumbnail_id', 'value' => $attachment_id, 'compare' => '=' ),
		array( 'key' => 'rp_galeria_ids', 'value' => 'i:' . $attachment_id . ';', 'compare' => 'LIKE' ),
	) ) );
	foreach ( $candidates as $vehicle_id ) {
		// SQL LIKE only selects candidates; inspect the actual array (not its indices).
		if ( rp_usados_security_vehicle_has_attachment( (int) $vehicle_id, $attachment_id ) && user_can( $user_id, 'edit_post', $vehicle_id ) ) { return true; }
	}
	return false;
}

function rp_usados_security_can_use_attachment( int $user_id, int $attachment_id, int $vehicle_id ): bool {
	if ( 'vehiculo' !== get_post_type( $vehicle_id ) || ! user_can( $user_id, 'edit_post', $vehicle_id ) ) { return false; }
	$attachment = get_post( $attachment_id );
	if ( ! $attachment || 'attachment' !== $attachment->post_type || ! wp_attachment_is_image( $attachment ) ) { return false; }
	if ( rp_usados_security_is_administrator( $user_id ) ) { return true; }
	if ( ! rp_usados_security_is_manager( $user_id ) || ! rp_usados_security_stock_attachment( $attachment_id ) ) { return false; }
	$parent = (int) $attachment->post_parent;
	if ( $parent === $vehicle_id ) { return true; }
	// Preserve previously approved legacy associations without sharing arbitrary IDs.
	if ( rp_usados_security_vehicle_has_attachment( $vehicle_id, $attachment_id ) ) { return true; }
	return 0 === $parent && $user_id === (int) $attachment->post_author;
}

add_filter( 'map_meta_cap', static function ( array $caps, string $cap, int $user_id, array $args ): array {
	if ( ! rp_usados_security_is_manager( $user_id ) || ! in_array( $cap, array( 'read_post', 'edit_post', 'delete_post' ), true ) || empty( $args[0] ) ) { return $caps; }
	$post = get_post( (int) $args[0] );
	if ( ! $post || 'attachment' !== $post->post_type ) { return $caps; }
	$parent = (int) $post->post_parent;
	$in_scope = 0 === $parent || ( 'vehiculo' === get_post_type( $parent ) && user_can( $user_id, 'edit_post', $parent ) );
	$owned = $user_id === (int) $post->post_author;
	$allowed = $in_scope && rp_usados_security_stock_attachment( $post->ID ) && ( $owned || ( 'read_post' === $cap && $parent > 0 ) );
	if ( ! $allowed && 'read_post' === $cap && rp_usados_security_stock_attachment( $post->ID ) ) {
		$allowed = rp_usados_security_can_read_legacy_attachment( $user_id, $post->ID );
	}
	return $allowed ? array( 'read_post' === $cap ? 'read' : 'rp_manage_vehicle_media' ) : array( 'do_not_allow' );
}, 20, 4 );

add_filter( 'upload_mimes', static function ( array $mimes, $user ): array {
	$user_id = $user instanceof WP_User ? $user->ID : get_current_user_id();
	return rp_usados_security_is_manager( $user_id ) ? rp_usados_security_image_mimes() : $mimes;
}, 20, 2 );

function rp_usados_security_upload_prefilter( array $file ): array {
	if ( ! rp_usados_security_is_manager() ) { return $file; }
	if ( isset( $file['error'] ) && ! is_int( $file['error'] ) ) { $file['error'] = 'Formato de archivo inválido.'; return $file; }
	if ( ! empty( $file['error'] ) ) { return $file; }
	if ( ! isset( $file['name'], $file['tmp_name'] ) || ! is_string( $file['name'] ) || ! is_string( $file['tmp_name'] ) ) { $file['error'] = 'Formato de archivo inválido.'; return $file; }
	$target = $GLOBALS['rp_usados_security_upload_vehicle'] ?? ( $_REQUEST['post_id'] ?? 0 );
	if ( ! is_scalar( $target ) || ! preg_match( '/^[0-9]+$/D', (string) $target ) || ( (int) $target > 0 && ( 'vehiculo' !== get_post_type( (int) $target ) || ! current_user_can( 'edit_post', (int) $target ) ) ) ) {
		$file['error'] = 'Destino de imagen no autorizado.'; return $file;
	}
	$limits = rp_usados_security_media_limits();
	$args = array( 'post_type' => 'attachment', 'post_status' => 'inherit', 'post_parent' => (int) $target, 'fields' => 'ids', 'posts_per_page' => $target ? $limits['images'] : $limits['pending'] );
	if ( ! $target ) { $args['author'] = get_current_user_id(); }
	if ( count( get_posts( $args ) ) >= ( $target ? $limits['images'] : $limits['pending'] ) ) { $file['error'] = 'Se alcanzó el límite de imágenes del vehículo o de imágenes pendientes.'; return $file; }
	$valid = rp_usados_security_validate_image_file( (string) ( $file['tmp_name'] ?? '' ), (string) ( $file['name'] ?? '' ) );
	if ( is_wp_error( $valid ) ) { $file['error'] = $valid->get_error_message(); return $file; }
	// Never trust the MIME supplied by the browser.
	$file['type'] = wp_get_image_mime( $file['tmp_name'] );
	$file['size'] = filesize( $file['tmp_name'] );
	return $file;
}
add_filter( 'wp_handle_upload_prefilter', 'rp_usados_security_upload_prefilter' );
add_filter( 'wp_handle_sideload_prefilter', 'rp_usados_security_upload_prefilter' );

function rp_usados_security_guard_vehicle_meta( $check, int $id, string $key, $value ) {
	if ( 'vehiculo' !== get_post_type( $id ) || ! function_exists( 'rp_usados_vehicle_fields' ) || ! isset( rp_usados_vehicle_fields()[ $key ] ) ) { return $check; }
	return null === $value || ! current_user_can( 'edit_post', $id ) ? false : $check;
}
add_filter( 'add_post_metadata', 'rp_usados_security_guard_vehicle_meta', 19, 4 );
add_filter( 'update_post_metadata', 'rp_usados_security_guard_vehicle_meta', 19, 4 );

function rp_usados_security_attachment_ids( $value ) {
	if ( ! is_array( $value ) || ! array_is_list( $value ) || ( ! rp_usados_security_is_administrator( get_current_user_id() ) && count( $value ) > rp_usados_security_media_limits()['images'] ) ) { return false; }
	$ids = array();
	foreach ( $value as $id ) {
		if ( ! is_int( $id ) || $id <= 0 ) { return false; }
		$ids[] = $id;
	}
	return array_values( array_unique( $ids ) );
}

function rp_usados_security_guard_image_meta( $check, int $vehicle_id, string $key, $value ) {
	if ( null !== $check ) { return $check; }
	if ( 'vehiculo' !== get_post_type( $vehicle_id ) || ! in_array( $key, array( '_thumbnail_id', 'rp_galeria_ids' ), true ) ) { return $check; }
	$user_id = get_current_user_id();
	if ( ! user_can( $user_id, 'edit_post', $vehicle_id ) ) { return false; }
	if ( '_thumbnail_id' === $key ) {
		$incoming = $_POST['thumbnail_id'] ?? ( $_POST['_thumbnail_id'] ?? null );
		if ( null !== $incoming && ( ! is_scalar( $incoming ) || ! preg_match( '/^[1-9][0-9]*$/D', (string) $incoming ) ) ) { return false; }
		if ( ! is_scalar( $value ) || ! preg_match( '/^[1-9][0-9]*$/D', (string) $value ) ) { return false; }
		$ids = array( (int) $value );
	} else {
		$ids = rp_usados_security_attachment_ids( $value );
		if ( false === $ids ) { return false; }
	}
	foreach ( $ids as $id ) {
		if ( ! rp_usados_security_can_use_attachment( $user_id, $id, $vehicle_id ) ) { return false; }
	}
	$other = '_thumbnail_id' === $key ? get_post_meta( $vehicle_id, 'rp_galeria_ids', true ) : array_filter( array( (int) get_post_thumbnail_id( $vehicle_id ) ) );
	if ( ! rp_usados_security_is_administrator( $user_id ) && count( array_unique( array_merge( $ids, is_array( $other ) ? $other : array() ) ) ) > rp_usados_security_media_limits()['images'] ) { return false; }
	if ( rp_usados_security_is_manager( $user_id ) ) {
		foreach ( $ids as $id ) {
			if ( 0 === (int) get_post_field( 'post_parent', $id ) && $user_id === (int) get_post_field( 'post_author', $id ) ) {
				$bound = wp_update_post( array( 'ID' => $id, 'post_parent' => $vehicle_id ), true );
				if ( is_wp_error( $bound ) || (int) get_post_field( 'post_parent', $id ) !== $vehicle_id ) { return false; }
			}
		}
	}
	return $check;
}
add_filter( 'add_post_metadata', 'rp_usados_security_guard_image_meta', 20, 4 );
add_filter( 'update_post_metadata', 'rp_usados_security_guard_image_meta', 20, 4 );
add_filter( 'delete_post_metadata', static function ( $check, $id, $key ) {
	if ( 'vehiculo' === get_post_type( $id ) && ( '_thumbnail_id' === $key || ( function_exists( 'rp_usados_vehicle_fields' ) && isset( rp_usados_vehicle_fields()[ $key ] ) ) ) && ! current_user_can( 'edit_post', $id ) ) { return false; }
	if ( '_thumbnail_id' === $key && 'vehiculo' === get_post_type( $id ) ) {
		$incoming = $_POST['thumbnail_id'] ?? ( $_POST['_thumbnail_id'] ?? null );
		if ( null !== $incoming && ( ! is_scalar( $incoming ) || ( ! in_array( (string) $incoming, array( '-1', '0' ), true ) && ! rp_usados_security_can_use_attachment( get_current_user_id(), (int) $incoming, (int) $id ) ) ) ) { return false; }
	}
	return $check;
}, 20, 3 );

// Native REST routes remain native; there are no new panel endpoints.
add_filter( 'rest_pre_dispatch', static function ( $result, WP_REST_Server $server, WP_REST_Request $request ) {
	if ( null !== $result ) { return $result; }
	$route = untrailingslashit( $request->get_route() );
	$writing = in_array( $request->get_method(), array( 'POST', 'PUT', 'PATCH' ), true );
	// Validate before core set_post_thumbnail can delete an existing cover when
	// given a non-image ID. Administrators can still use any valid image.
	if ( $writing && preg_match( '#^/wp/v2/vehiculo/([0-9]+)$#D', $route, $matches ) && $request->has_param( 'featured_media' ) ) {
		$id = $request['featured_media'];
		if ( ! is_scalar( $id ) || ! preg_match( '/^[0-9]+$/D', (string) $id ) || ( (int) $id > 0 && ! rp_usados_security_can_use_attachment( get_current_user_id(), (int) $id, (int) $matches[1] ) ) ) { return new WP_Error( 'rp_media_forbidden', 'No podés usar esa imagen en este vehículo.', array( 'status' => 403 ) ); }
	}
	if ( ! rp_usados_security_is_manager() ) { return $result; }
	if ( 'GET' === $request->get_method() && preg_match( '#^/wp/v2/media/([0-9]+)$#D', $route, $read_match ) && ! current_user_can( 'read_post', (int) $read_match[1] ) ) {
		return new WP_Error( 'rp_media_read', 'Imagen fuera del ámbito de stock.', array( 'status' => 403 ) );
	}
	if ( ! $writing ) { return $result; }
	if ( preg_match( '#^/wp/v2/media(?:/([0-9]+))?$#D', $route, $matches ) ) {
		$old = ! empty( $matches[1] ) ? get_post( (int) $matches[1] ) : null;
		if ( $request->has_param( 'author' ) && (int) $request['author'] !== get_current_user_id() ) { return new WP_Error( 'rp_media_owner', 'No podés cambiar el propietario de una imagen.', array( 'status' => 403 ) ); }
		if ( $request->has_param( 'post' ) ) {
			$parent = $request['post'];
			if ( ! is_scalar( $parent ) || ! preg_match( '/^[0-9]+$/D', (string) $parent ) || ( (int) $parent > 0 && ( 'vehiculo' !== get_post_type( (int) $parent ) || ! current_user_can( 'edit_post', (int) $parent ) ) ) || ( $old && (int) $old->post_parent > 0 && (int) $parent !== (int) $old->post_parent ) ) { return new WP_Error( 'rp_media_parent', 'La imagen sólo puede vincularse a su vehículo autorizado.', array( 'status' => 403 ) ); }
		}
		$GLOBALS['rp_usados_security_upload_vehicle'] = (int) ( $request['post'] ?? 0 );
	}
	return $result;
}, 20, 3 );

add_filter( 'wp_insert_attachment_data', static function ( array $data, array $postarr ): array {
	if ( ! rp_usados_security_is_manager() ) { return $data; }
	$old = ! empty( $postarr['ID'] ) ? get_post( (int) $postarr['ID'] ) : null;
	$parent = (int) $data['post_parent'];
	if ( ( $parent > 0 && ( 'vehiculo' !== get_post_type( $parent ) || ! current_user_can( 'edit_post', $parent ) ) ) || ( $old && (int) $old->post_parent > 0 && $parent !== (int) $old->post_parent ) ) { $data['post_parent'] = $old ? $old->post_parent : 0; }
	$data['post_author'] = $old ? $old->post_author : get_current_user_id();
	return $data;
}, 20, 2 );

function rp_usados_security_media_parents(): array {
	$parents = array( 0 );
	$vehicles = get_posts( array( 'post_type' => 'vehiculo', 'post_status' => array_keys( get_post_stati() ), 'fields' => 'ids', 'numberposts' => -1 ) );
	foreach ( $vehicles as $id ) {
		if ( current_user_can( 'edit_post', $id ) ) { $parents[] = (int) $id; }
	}
	return $parents;
}

add_filter( 'ajax_query_attachments_args', static function ( array $args ): array {
	if ( rp_usados_security_is_manager() ) {
		$args['author'] = get_current_user_id();
		$args['post_mime_type'] = array_values( rp_usados_security_image_mimes() );
		$args['post_parent__in'] = rp_usados_security_media_parents();
	}
	return $args;
} );
add_filter( 'rest_attachment_query', static function ( array $args ): array {
	if ( rp_usados_security_is_manager() ) { $args['author'] = get_current_user_id(); $args['post_mime_type'] = array_values( rp_usados_security_image_mimes() ); $args['post_parent__in'] = rp_usados_security_media_parents(); }
	return $args;
} );
add_action( 'pre_get_posts', static function ( WP_Query $query ): void {
	if ( is_admin() && $query->is_main_query() && 'attachment' === $query->get( 'post_type' ) && rp_usados_security_is_manager() ) {
		$query->set( 'author', get_current_user_id() );
		$query->set( 'post_mime_type', array_values( rp_usados_security_image_mimes() ) );
		$query->set( 'post_parent__in', rp_usados_security_media_parents() );
	}
} );

// The native get-attachment AJAX action checks upload_files, not read_post.
// Apply the same server policy to its response, not just to the library query.
add_filter( 'wp_prepare_attachment_for_js', static function ( $response, WP_Post $attachment ) {
	return rp_usados_security_is_manager() && ! current_user_can( 'read_post', $attachment->ID ) ? null : $response;
}, 20, 2 );
