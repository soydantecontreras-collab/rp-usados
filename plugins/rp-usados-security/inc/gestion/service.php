<?php
/** Private stock service. No public template or query filters. */
defined( 'ABSPATH' ) || exit;

function rp_usados_gestion_access(): bool {
	$id = get_current_user_id();
	return $id && function_exists( 'rp_usados_validate_vehicle_input' ) && post_type_exists( 'vehiculo' ) && ( rp_usados_security_is_administrator( $id ) || rp_usados_security_is_manager( $id ) ) && current_user_can( 'edit_vehiculos' );
}

function rp_usados_gestion_error( string $code, string $message, int $status = 400, array $fields = array() ): WP_Error {
	return new WP_Error( $code, $message, array( 'status' => $status, 'fields' => $fields ) );
}

function rp_usados_gestion_object( int $id ) {
	$post = get_post( $id );
	if ( ! rp_usados_gestion_access() ) { return rp_usados_gestion_error( 'rp_forbidden', 'Acceso denegado.', 403 ); }
	if ( ! $post || 'vehiculo' !== $post->post_type || ! in_array( $post->post_status, array( 'draft', 'publish' ), true ) ) { return rp_usados_gestion_error( 'rp_not_found', 'Vehículo no disponible.', 404 ); }
	if ( ! current_user_can( 'edit_post', $id ) ) { return rp_usados_gestion_error( 'rp_forbidden', 'Acceso denegado.', 403 ); }
	return $post;
}

function rp_usados_gestion_fields(): array {
	return array( 'marca' => 'rp_marca', 'modelo' => 'rp_modelo', 'version' => 'rp_version', 'anio' => 'rp_anio', 'kilometraje' => 'rp_kilometraje', 'precio' => 'rp_precio_monto', 'moneda' => 'rp_precio_moneda', 'estado' => 'rp_estado_stock', 'galeria' => 'rp_galeria_ids' );
}

function rp_usados_gestion_values( int $id = 0 ): array {
	$values = array();
	foreach ( rp_usados_gestion_fields() as $name => $key ) {
		$raw = $id ? get_post_meta( $id, $key, true ) : '';
		$values[ $name ] = 'galeria' === $name ? ( is_array( $raw ) ? array_values( $raw ) : array() ) : (string) $raw;
	}
	if ( ! $id ) { $values['moneda'] = 'ARS'; }
	$values['portada'] = $id ? (int) get_post_thumbnail_id( $id ) : 0;
	$values['descripcion'] = $id ? (string) get_post_field( 'post_content', $id ) : '';
	$values['publicacion'] = $id && 'publish' === get_post_status( $id ) ? 'publish' : 'draft';
	return $values;
}

/** Includes native admin edits, timestamps, title and associations; not just panel writes. */
function rp_usados_gestion_revision( int $id ): string {
	clean_post_cache( $id );
	return hash( 'sha256', wp_json_encode( array( rp_usados_gestion_values( $id ), get_post_field( 'post_modified_gmt', $id ), get_post_field( 'post_title', $id ), get_post_meta( $id, '_rp_gestion_revision', true ) ) ) );
}

function rp_usados_gestion_image( int $id ): array {
	return array( 'id' => $id, 'url' => wp_get_attachment_image_url( $id, 'medium' ) ?: '', 'alt' => (string) get_post_meta( $id, '_wp_attachment_image_alt', true ) );
}

function rp_usados_gestion_dto( int $id ): array {
	$data = rp_usados_gestion_values( $id );
	$data['id'] = $id;
	$data['titulo'] = get_the_title( $id );
	$data['revision'] = rp_usados_gestion_revision( $id );
	$data['imagenes'] = array_map( 'rp_usados_gestion_image', array_values( array_unique( array_filter( array_merge( array( $data['portada'] ), $data['galeria'] ) ) ) ) );
	$data['editar_url'] = home_url( '/gestion/vehiculos/' . $id . '/' );
	return $data;
}

function rp_usados_gestion_attachment_allowed( int $id, int $vehicle_id ): bool {
	if ( ! rp_usados_security_stock_attachment( $id ) ) { return false; }
	if ( $vehicle_id ) { return rp_usados_security_can_use_attachment( get_current_user_id(), $id, $vehicle_id ); }
	$post = get_post( $id );
	return $post && 0 === (int) $post->post_parent && get_current_user_id() === (int) $post->post_author;
}

/** Strict allowlist + merged validation BEFORE any post/meta/image write. */
function rp_usados_gestion_validate( array $payload, int $id = 0 ) {
	if ( ! function_exists( 'rp_usados_validate_vehicle_input' ) ) { return rp_usados_gestion_error( 'rp_theme_required', 'Se requiere el tema RP Usados activo.', 503 ); }
	$allowed = array_merge( array_keys( rp_usados_gestion_fields() ), array( 'portada', 'descripcion', 'publicacion', 'revision' ) );
	foreach ( $payload as $key => $value ) {
		if ( ! in_array( $key, $allowed, true ) ) { return rp_usados_gestion_error( 'rp_unknown_field', 'La solicitud contiene un campo no permitido.' ); }
	}
	$values = rp_usados_gestion_values( $id );
	$errors = array();
	foreach ( rp_usados_gestion_fields() as $name => $key ) {
		if ( ! array_key_exists( $name, $payload ) ) { continue; }
		$clean = rp_usados_validate_vehicle_input( $payload[ $name ], $key, $id );
		if ( is_wp_error( $clean ) ) { $errors[ $name ] = $clean->get_error_message(); }
		else { $values[ $name ] = $clean; }
	}
	if ( isset( $payload['descripcion'] ) ) {
		if ( ! is_string( $payload['descripcion'] ) || strlen( $payload['descripcion'] ) > 50000 ) { $errors['descripcion'] = 'Descripción inválida o demasiado extensa.'; }
		else { $values['descripcion'] = wp_kses_post( $payload['descripcion'] ); }
	}
	if ( array_key_exists( 'portada', $payload ) ) {
		$raw = $payload['portada'];
		if ( ( ! is_int( $raw ) && ! is_string( $raw ) ) || ! preg_match( '/^(0|[1-9][0-9]*)$/D', (string) $raw ) ) { $errors['portada'] = 'Foto principal inválida.'; }
		else { $values['portada'] = (int) $raw; }
	}
	if ( array_key_exists( 'publicacion', $payload ) ) {
		if ( ! in_array( $payload['publicacion'], array( 'draft', 'publish' ), true ) ) { $errors['publicacion'] = 'Publicación inválida.'; }
		else { $values['publicacion'] = $payload['publicacion']; }
	}
	$legacy = $id ? (string) get_post_meta( $id, 'rp_precio_moneda', true ) : '';
	$currencies = array( '', 'ARS', 'USD' );
	if ( $id && preg_match( '/^[A-Z]{3}$/D', $legacy ) ) { $currencies[] = $legacy; }
	if ( ! in_array( $values['moneda'], $currencies, true ) ) { $errors['moneda'] = 'Elegí ARS o USD.'; }
	if ( '' !== $values['precio'] && '' === $values['moneda'] ) { $errors['moneda'] = 'Elegí una moneda para el precio.'; }
	foreach ( array( 'marca', 'modelo', 'version' ) as $name ) {
		if ( strlen( $values[ $name ] ) > 160 ) { $errors[ $name ] = 'Máximo 160 caracteres.'; }
	}
	$images = array_values( array_unique( array_filter( array_merge( array( $values['portada'] ), $values['galeria'] ) ) ) );
	if ( count( $images ) > rp_usados_security_media_limits()['images'] ) { $errors['galeria'] = 'Máximo 20 imágenes distintas por vehículo, incluida la portada.'; }
	foreach ( $images as $image ) {
		if ( ! rp_usados_gestion_attachment_allowed( (int) $image, $id ) ) { $errors['galeria'] = 'Una de las imágenes no está autorizada o no cumple la política de fotos.'; }
	}
	if ( 'publish' === $values['publicacion'] ) {
		if ( ! current_user_can( 'publish_vehiculos' ) ) { return rp_usados_gestion_error( 'rp_forbidden', 'No tenés permiso para publicar.', 403 ); }
		foreach ( array( 'marca' => 'Marca', 'modelo' => 'Modelo', 'anio' => 'Año', 'estado' => 'Estado comercial', 'portada' => 'Foto principal' ) as $name => $label ) {
			if ( '' === $values[ $name ] || 0 === $values[ $name ] ) { $errors[ $name ] = $label . ': obligatorio para publicar.'; }
		}
	}
	if ( $errors ) { return rp_usados_gestion_error( 'rp_validation', 'Revisá los campos indicados. No se guardó ningún cambio.', 422, $errors ); }
	return $values;
}

/** Atomic per-vehicle mutex, distinct from the optimistic revision checked while holding it. */
function rp_usados_gestion_lock( string $key ) {
	$token = wp_generate_uuid4();
	if ( ! add_option( $key, array( 'token' => $token, 'time' => time() ), '', false ) ) {
		// No unsafe lock stealing; abandoned locks need manual removal after investigating.
		return rp_usados_gestion_error( 'rp_busy', 'Hay otro guardado en curso. Reintentá en unos segundos.', 409 );
	}
	return $token;
}

function rp_usados_gestion_save( array $payload, int $id = 0 ) {
	if ( ! rp_usados_gestion_access() || ( ! $id && ! current_user_can( 'create_vehiculos' ) ) ) { return rp_usados_gestion_error( 'rp_forbidden', 'Acceso denegado.', 403 ); }
	if ( $id ) { $object = rp_usados_gestion_object( $id ); if ( is_wp_error( $object ) ) { return $object; } }
	$key = 'rp_gestion_lock_' . ( $id ?: 'new_' . get_current_user_id() );
	$locked = rp_usados_gestion_lock( $key );
	if ( is_wp_error( $locked ) ) { return $locked; }
	global $wpdb;
	$affected = array();
	try {
		if ( $id && ( ! isset( $payload['revision'] ) || ! is_string( $payload['revision'] ) || ! hash_equals( rp_usados_gestion_revision( $id ), $payload['revision'] ) ) ) {
			return rp_usados_gestion_error( 'rp_conflict', 'Otro usuario modificó este vehículo. Tus datos siguen en el formulario; recargá la versión actual antes de volver a guardar.', 409 );
		}
		$values = rp_usados_gestion_validate( $payload, $id );
		if ( is_wp_error( $values ) ) { return $values; }
		$title = trim( implode( ' ', array_filter( array( $values['marca'], $values['modelo'], $values['version'], $values['anio'] ), static fn( $v ) => '' !== $v ) ) );
		$post = array( 'post_type' => 'vehiculo', 'post_title' => $title ?: 'Vehículo en borrador', 'post_content' => $values['descripcion'], 'post_status' => 'draft' );
		if ( $id ) { $post['ID'] = $id; $post['post_name'] = get_post_field( 'post_name', $id ); }
		// Validate first; transaction protects against storage failure after validation.
		if ( false === $wpdb->query( 'START TRANSACTION' ) ) { throw new RuntimeException( 'transaction' ); }
		$saved = $id ? wp_update_post( wp_slash( $post ), true ) : wp_insert_post( wp_slash( $post ), true );
		if ( is_wp_error( $saved ) ) { throw new RuntimeException( 'post' ); }
		$id = (int) $saved;
		$affected[] = $id;
		$affected = array_merge( $affected, $values['galeria'], array( $values['portada'] ) );
		// Clear associations before swapping at the limit; never delete attachments.
		delete_post_thumbnail( $id );
		update_post_meta( $id, 'rp_galeria_ids', array() );
		foreach ( rp_usados_gestion_fields() as $name => $meta ) {
			update_post_meta( $id, $meta, wp_slash( $values[ $name ] ) );
			if ( get_post_meta( $id, $meta, true ) !== $values[ $name ] ) { throw new RuntimeException( 'meta' ); }
		}
		if ( $values['portada'] ) { set_post_thumbnail( $id, $values['portada'] ); }
		if ( (int) get_post_thumbnail_id( $id ) !== $values['portada'] ) { throw new RuntimeException( 'cover' ); }
		$result = wp_update_post( array( 'ID' => $id, 'post_status' => $values['publicacion'], 'post_name' => $post['post_name'] ?? get_post_field( 'post_name', $id ) ), true );
		if ( is_wp_error( $result ) ) { throw new RuntimeException( 'publication' ); }
		if ( ! update_post_meta( $id, '_rp_gestion_revision', wp_generate_uuid4() ) ) { throw new RuntimeException( 'revision' ); }
		if ( false === $wpdb->query( 'COMMIT' ) ) { throw new RuntimeException( 'commit' ); }
		return rp_usados_gestion_dto( $id );
	} catch ( Throwable $e ) {
		$wpdb->query( 'ROLLBACK' );
		foreach ( array_filter( $affected ) as $post_id ) { clean_post_cache( $post_id ); }
		return rp_usados_gestion_error( 'rp_storage', 'No se pudieron guardar los cambios. Reintentá.', 500 );
	} finally {
		delete_option( $key );
	}
}

function rp_usados_gestion_list( array $input = array() ) {
	if ( ! rp_usados_gestion_access() ) { return rp_usados_gestion_error( 'rp_forbidden', 'Acceso denegado.', 403 ); }
	$filter = $input['filtro'] ?? 'activo';
	$search = $input['buscar'] ?? '';
	$page = $input['pagina'] ?? 1;
	if ( ! is_string( $filter ) || ! in_array( $filter, array( 'activo', 'disponible', 'reservado', 'vendido', 'borradores' ), true ) || ! is_string( $search ) || strlen( $search ) > 160 || ! is_scalar( $page ) || ! preg_match( '/^[1-9][0-9]*$/D', (string) $page ) ) { return rp_usados_gestion_error( 'rp_filters', 'Filtros inválidos.' ); }
	$args = array( 'post_type' => 'vehiculo', 'post_status' => 'borradores' === $filter ? 'draft' : 'publish', 'posts_per_page' => 20, 'paged' => (int) $page, 'orderby' => 'modified', 'order' => 'DESC' );
	$meta = array( 'relation' => 'AND' );
	if ( 'borradores' !== $filter ) { $meta[] = array( 'key' => 'rp_estado_stock', 'value' => 'activo' === $filter ? array( 'disponible', 'reservado' ) : array( $filter ), 'compare' => 'IN' ); }
	if ( '' !== trim( $search ) ) {
		$terms = preg_split( '/\s+/u', trim( sanitize_text_field( $search ) ) );
		foreach ( $terms as $term ) {
			$clause = array( 'relation' => 'OR' );
			foreach ( array( 'rp_marca', 'rp_modelo', 'rp_version' ) as $key ) { $clause[] = array( 'key' => $key, 'value' => $term, 'compare' => 'LIKE' ); }
			$meta[] = $clause;
		}
	}
	$args['meta_query'] = $meta;
	$query = new WP_Query( $args );
	$items = array();
	foreach ( $query->posts as $post ) { if ( current_user_can( 'edit_post', $post->ID ) ) { $items[] = rp_usados_gestion_dto( $post->ID ); } }
	return array( 'items' => $items, 'total' => (int) $query->found_posts, 'paginas' => (int) $query->max_num_pages, 'pagina' => (int) $page );
}
