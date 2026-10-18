<?php
/** Private stock use cases. Public presentation helpers remain unchanged. */
defined( 'ABSPATH' ) || exit;

function rp_usados_gestion_fields(): array {
	return array( 'rp_marca', 'rp_modelo', 'rp_version', 'rp_anio', 'rp_kilometraje', 'rp_precio_monto', 'rp_precio_moneda', 'rp_estado_stock' );
}

function rp_usados_gestion_error( array $errors ): WP_Error {
	return new WP_Error( 'rp_gestion_validation', 'Revisá los campos indicados. No se guardaron los cambios.', array( 'status' => 422, 'errors' => $errors ) );
}

function rp_usados_gestion_snapshot( int $id ): array {
	$post = get_post( $id );
	$fields = array();
	foreach ( rp_usados_gestion_fields() as $key ) { $fields[ $key ] = (string) get_post_meta( $id, $key, true ); }
	$gallery = get_post_meta( $id, 'rp_galeria_ids', true );
	return array( 'id' => $id, 'title' => $post->post_title, 'slug' => $post->post_name, 'publication' => $post->post_status,
		'description' => $post->post_content, 'fields' => $fields, 'featured_media' => (int) get_post_thumbnail_id( $id ),
		'gallery' => is_array( $gallery ) ? $gallery : array(), 'modified' => $post->post_modified_gmt );
}

function rp_usados_gestion_revision( int $id ): string {
	return hash_hmac( 'sha256', wp_json_encode( rp_usados_gestion_snapshot( $id ) ), wp_salt( 'nonce' ) );
}

function rp_usados_gestion_get( int $id = 0 ) {
	if ( ! rp_usados_gestion_allowed() ) { return new WP_Error( 'rp_gestion_forbidden', 'No tenés acceso a la gestión de stock.', array( 'status' => 403 ) ); }
	if ( ! $id ) {
		return array( 'id' => 0, 'title' => '', 'slug' => '', 'publication' => 'draft', 'fields' => array_fill_keys( rp_usados_gestion_fields(), '' ), 'description' => '', 'featured_media' => 0, 'gallery' => array(), 'images' => array(), 'revision' => '', 'url' => '', 'editUrl' => home_url( '/gestion/nuevo/' ) );
	}
	$post = get_post( $id );
	if ( ! $post || 'vehiculo' !== $post->post_type || 'trash' === $post->post_status ) { return new WP_Error( 'rp_gestion_not_found', 'No se encontró ese vehículo.', array( 'status' => 404 ) ); }
	if ( ! current_user_can( 'edit_post', $id ) ) { return new WP_Error( 'rp_gestion_forbidden', 'No podés editar este vehículo.', array( 'status' => 403 ) ); }
	$data = rp_usados_gestion_snapshot( $id );
	unset( $data['modified'] );
	$data['revision'] = rp_usados_gestion_revision( $id );
	$data['url'] = 'publish' === $post->post_status ? get_permalink( $id ) : '';
	$data['editUrl'] = home_url( '/gestion/vehiculos/' . $id . '/' );
	$data['images'] = array();
	foreach ( array_unique( array_merge( array( $data['featured_media'] ), $data['gallery'] ) ) as $image_id ) {
		$image_id = (int) $image_id;
		if ( ! $image_id || ! rp_usados_security_can_use_attachment( get_current_user_id(), $image_id, $id ) ) { continue; }
		$src = wp_get_attachment_image_src( $image_id, 'large' );
		$thumb = wp_get_attachment_image_src( $image_id, 'thumbnail' );
		if ( $src ) { $data['images'][ $image_id ] = array( 'id' => $image_id, 'url' => $src[0], 'thumb' => $thumb ? $thumb[0] : $src[0], 'width' => $src[1], 'height' => $src[2], 'alt' => (string) get_post_meta( $image_id, '_wp_attachment_image_alt', true ) ); }
	}
	return $data;
}

function rp_usados_gestion_list( string $filter = 'activo', string $search = '' ): array {
	if ( ! rp_usados_gestion_allowed() ) { return array(); }
	if ( ! in_array( $filter, array( 'activo', 'disponible', 'reservado', 'vendido', 'borradores' ), true ) ) { $filter = 'activo'; }
	$meta = array( 'relation' => 'AND' );
	if ( 'borradores' !== $filter ) {
		$meta[] = array( 'key' => 'rp_estado_stock', 'value' => 'activo' === $filter ? array( 'disponible', 'reservado' ) : array( $filter ), 'compare' => 'IN' );
	}
	$search = sanitize_text_field( $search );
	if ( '' !== $search ) {
		$search_meta = array( 'relation' => 'OR' );
		foreach ( array( 'rp_marca', 'rp_modelo', 'rp_version' ) as $key ) { $search_meta[] = array( 'key' => $key, 'value' => $search, 'compare' => 'LIKE' ); }
		$meta[] = $search_meta;
	}
	$query = new WP_Query( array( 'post_type' => 'vehiculo', 'post_status' => 'borradores' === $filter ? array( 'draft', 'pending', 'private' ) : 'publish', 'posts_per_page' => 100, 'orderby' => 'date', 'order' => 'DESC', 'no_found_rows' => true, 'meta_query' => $meta ) );
	$result = array();
	foreach ( $query->posts as $post ) { $data = rp_usados_gestion_get( $post->ID ); if ( ! is_wp_error( $data ) ) { $result[] = $data; } }
	return $result;
}

function rp_usados_gestion_validate_payload( int $id, $payload ) {
	if ( ! rp_usados_gestion_allowed() || ( ! $id && ! current_user_can( 'create_vehiculos' ) ) ) { return new WP_Error( 'rp_gestion_forbidden', 'No podés gestionar este vehículo.', array( 'status' => 403 ) ); }
	$base = rp_usados_gestion_get( $id );
	if ( is_wp_error( $base ) ) { return $base; }
	$errors = array();
	if ( ! is_array( $payload ) || ( $payload && array_is_list( $payload ) ) ) { return rp_usados_gestion_error( array( 'form' => 'La solicitud tiene un formato inválido.' ) ); }
	$allow = array( 'fields', 'description', 'featured_media', 'gallery', 'publication', 'revision' );
	if ( array_diff( array_keys( $payload ), $allow ) ) { $errors['form'] = 'La solicitud incluye campos no permitidos.'; }
	if ( $id && ( ! isset( $payload['revision'] ) || ! is_string( $payload['revision'] ) || ! hash_equals( $base['revision'], $payload['revision'] ) ) ) {
		return new WP_Error( 'rp_gestion_conflict', 'Este vehículo cambió desde que lo abriste. Revisá la versión actual antes de volver a guardar.', array( 'status' => 409 ) );
	}
	$data = $base;
	if ( array_key_exists( 'fields', $payload ) ) {
		if ( ! is_array( $payload['fields'] ) || ( $payload['fields'] && array_is_list( $payload['fields'] ) ) ) { $errors['fields'] = 'Los datos del vehículo tienen un formato inválido.'; }
		else {
			foreach ( $payload['fields'] as $key => $value ) {
				if ( ! in_array( $key, rp_usados_gestion_fields(), true ) ) { $errors['fields'] = 'Se intentó modificar un campo no permitido.'; continue; }
				if ( '' === $value ) { $clean = ''; } else { $clean = rp_usados_validate_vehicle_input( $value, $key, $id ); }
				if ( is_wp_error( $clean ) ) { $errors[ $key ] = 'Ingresá un valor válido para este campo.'; }
				elseif ( strlen( $clean ) > 300 ) { $errors[ $key ] = 'El texto es demasiado largo.'; }
				else { $data['fields'][ $key ] = $clean; }
			}
		}
	}
	$currency = $data['fields']['rp_precio_moneda'];
	if ( '' !== $currency && ! in_array( $currency, array( 'ARS', 'USD' ), true ) && ( ! $id || $currency !== $base['fields']['rp_precio_moneda'] || ! preg_match( '/^[A-Z]{3}$/D', $currency ) ) ) { $errors['rp_precio_moneda'] = 'Elegí ARS o USD.'; }
	if ( '' !== $data['fields']['rp_precio_monto'] && '' === $currency ) { $errors['rp_precio_moneda'] = 'Elegí la moneda del precio.'; }
	if ( array_key_exists( 'description', $payload ) ) {
		if ( ! is_string( $payload['description'] ) || strlen( $payload['description'] ) > 30000 ) { $errors['description'] = 'La descripción debe ser un texto de hasta 30.000 caracteres.'; }
		else { $data['description'] = wp_kses_post( $payload['description'] ); }
	}
	if ( array_key_exists( 'publication', $payload ) ) {
		if ( ! is_string( $payload['publication'] ) || ! in_array( $payload['publication'], array( 'draft', 'publish' ), true ) ) { $errors['publication'] = 'Elegí Borrador o Publicado.'; }
		else { $data['publication'] = $payload['publication']; }
	}
	if ( array_key_exists( 'featured_media', $payload ) ) {
		$value = $payload['featured_media'];
		if ( ( ! is_int( $value ) && ! is_string( $value ) ) || ! preg_match( '/^[0-9]+$/D', (string) $value ) ) { $errors['featured_media'] = 'La foto principal es inválida.'; }
		else { $data['featured_media'] = (int) $value; }
	}
	if ( array_key_exists( 'gallery', $payload ) ) {
		if ( ! is_array( $payload['gallery'] ) || ! array_is_list( $payload['gallery'] ) ) { $errors['gallery'] = 'La galería tiene un formato inválido.'; }
		else {
			$ids = array();
			foreach ( $payload['gallery'] as $image_id ) {
				if ( ( ! is_int( $image_id ) && ! is_string( $image_id ) ) || ! preg_match( '/^[1-9][0-9]*$/D', (string) $image_id ) ) { $errors['gallery'] = 'La galería contiene una imagen inválida.'; break; }
				$ids[] = (int) $image_id;
			}
			$data['gallery'] = array_values( array_unique( $ids ) );
		}
	}
	$all_images = array_filter( array_unique( array_merge( array( $data['featured_media'] ), $data['gallery'] ) ) );
	if ( ! rp_usados_security_is_administrator( get_current_user_id() ) && count( $all_images ) > rp_usados_security_media_limits()['images'] ) { $errors['gallery'] = 'Podés asociar hasta 20 fotos distintas por vehículo.'; }
	foreach ( $all_images as $image_id ) {
		if ( $id ) { $permitted = rp_usados_security_can_use_attachment( get_current_user_id(), $image_id, $id ); }
		else {
			$image = get_post( $image_id );
			$permitted = $image && 'attachment' === $image->post_type && wp_attachment_is_image( $image_id ) && ( rp_usados_security_is_administrator( get_current_user_id() ) || ( rp_usados_security_stock_attachment( $image_id ) && ! $image->post_parent && (int) $image->post_author === get_current_user_id() ) );
		}
		if ( ! $permitted ) { $errors[ $image_id === $data['featured_media'] ? 'featured_media' : 'gallery' ] = 'Esta imagen no está autorizada para este vehículo.'; }
	}
	if ( 'publish' === $data['publication'] ) {
		if ( ! current_user_can( 'publish_vehiculos' ) ) { return new WP_Error( 'rp_gestion_forbidden', 'No podés publicar vehículos.', array( 'status' => 403 ) ); }
		foreach ( array( 'rp_marca' => 'Marca', 'rp_modelo' => 'Modelo', 'rp_anio' => 'Año', 'rp_estado_stock' => 'Estado comercial' ) as $key => $label ) { if ( '' === $data['fields'][ $key ] ) { $errors[ $key ] = $label . ' es obligatorio para publicar.'; } }
		if ( ! $data['featured_media'] ) { $errors['featured_media'] = 'Agregá una foto principal para publicar.'; }
	}
	return $errors ? rp_usados_gestion_error( $errors ) : $data;
}

/** Atomic option claim serializes panel writers; content revision catches other editors. */
function rp_usados_gestion_lock( int $id ) {
	global $wpdb;
	$key = 'rp_gestion_lock_' . $id;
	$old = get_option( $key );
	if ( is_array( $old ) && (int) ( $old['expires'] ?? 0 ) < time() ) {
		$wpdb->query( $wpdb->prepare( "DELETE FROM {$wpdb->options} WHERE option_name=%s AND option_value=%s", $key, maybe_serialize( $old ) ) );
		wp_cache_delete( $key, 'options' );
	}
	$claim = array( 'token' => wp_generate_uuid4(), 'expires' => time() + 90 );
	return add_option( $key, $claim, '', false ) ? array( $key, $claim ) : new WP_Error( 'rp_gestion_conflict', 'Hay otro guardado en curso. Esperá a que termine y volvé a intentar.', array( 'status' => 409 ) );
}

function rp_usados_gestion_unlock( array $lock ): void {
	global $wpdb;
	$wpdb->query( $wpdb->prepare( "DELETE FROM {$wpdb->options} WHERE option_name=%s AND option_value=%s", $lock[0], maybe_serialize( $lock[1] ) ) );
	wp_cache_delete( $lock[0], 'options' );
}

function rp_usados_gestion_write_meta( int $id, string $key, $value ): void {
	if ( '' === $value || array() === $value || ( '_thumbnail_id' === $key && 0 === $value ) ) {
		delete_post_meta( $id, $key );
		if ( metadata_exists( 'post', $id, $key ) ) { throw new RuntimeException( 'No se pudo quitar un dato.' ); }
	} else {
		update_post_meta( $id, $key, $value );
		if ( get_post_meta( $id, $key, true ) != $value ) { throw new RuntimeException( 'No se pudo guardar un dato.' ); }
	}
}

function rp_usados_gestion_save( int $id, $payload ) {
	$lock = rp_usados_gestion_lock( $id ?: -get_current_user_id() );
	if ( is_wp_error( $lock ) ) { return $lock; }
	$previous = null;
	$created = false;
	$parents = array();
	try {
		$data = rp_usados_gestion_validate_payload( $id, $payload );
		if ( is_wp_error( $data ) ) { return $data; }
		if ( $id ) { $previous = rp_usados_gestion_snapshot( $id ); }
		else {
			$new = wp_insert_post( array( 'post_type' => 'vehiculo', 'post_status' => 'draft', 'post_title' => 'Vehículo sin completar', 'post_author' => get_current_user_id() ), true );
			if ( is_wp_error( $new ) ) { return $new; }
			$id = (int) $new;
			$created = true;
		}
		foreach ( array_filter( array_unique( array_merge( array( $data['featured_media'] ), $data['gallery'] ) ) ) as $image_id ) { $parents[ $image_id ] = (int) get_post_field( 'post_parent', $image_id ); }
		foreach ( $data['fields'] as $key => $value ) { rp_usados_gestion_write_meta( $id, $key, $value ); }
		// Remove outgoing associations before adding final ones (20-image union guard).
		$current_gallery = get_post_meta( $id, 'rp_galeria_ids', true );
		$retained = is_array( $current_gallery ) ? array_values( array_intersect( $current_gallery, $data['gallery'] ) ) : array();
		rp_usados_gestion_write_meta( $id, 'rp_galeria_ids', $retained );
		if ( (int) get_post_thumbnail_id( $id ) !== $data['featured_media'] ) { rp_usados_gestion_write_meta( $id, '_thumbnail_id', 0 ); }
		rp_usados_gestion_write_meta( $id, '_thumbnail_id', $data['featured_media'] );
		rp_usados_gestion_write_meta( $id, 'rp_galeria_ids', $data['gallery'] );
		$title = implode( ' ', array_filter( array_map( 'trim', array( $data['fields']['rp_marca'], $data['fields']['rp_modelo'], $data['fields']['rp_version'], $data['fields']['rp_anio'] ) ), static function ( $value ) { return '' !== $value; } ) );
		$post_data = array( 'ID' => $id, 'post_title' => $title ?: 'Vehículo sin completar', 'post_content' => $data['description'], 'post_status' => $data['publication'] );
		if ( $previous ) { $post_data['post_name'] = $previous['slug']; }
		$saved = wp_update_post( wp_slash( $post_data ), true );
		if ( is_wp_error( $saved ) ) { throw new RuntimeException( 'No se pudo guardar el vehículo.' ); }
		return rp_usados_gestion_get( $id );
	} catch ( Throwable $error ) {
		global $wpdb;
		if ( $created ) { wp_delete_post( $id, true ); }
		elseif ( $previous ) {
			delete_post_meta( $id, '_thumbnail_id' ); delete_post_meta( $id, 'rp_galeria_ids' );
			foreach ( $previous['fields'] as $key => $value ) { '' === $value ? delete_post_meta( $id, $key ) : update_post_meta( $id, $key, $value ); }
			if ( $previous['featured_media'] ) { update_post_meta( $id, '_thumbnail_id', $previous['featured_media'] ); }
			update_post_meta( $id, 'rp_galeria_ids', $previous['gallery'] );
			wp_update_post( wp_slash( array( 'ID' => $id, 'post_title' => $previous['title'], 'post_name' => $previous['slug'], 'post_status' => $previous['publication'], 'post_content' => $previous['description'] ) ) );
		}
		foreach ( $parents as $image_id => $parent ) { $wpdb->update( $wpdb->posts, array( 'post_parent' => $parent ), array( 'ID' => $image_id ) ); clean_post_cache( $image_id ); }
		return new WP_Error( 'rp_gestion_save_failed', 'No se pudieron guardar los cambios. Se conservó la versión anterior; volvé a intentar.', array( 'status' => 500 ) );
	} finally { rp_usados_gestion_unlock( $lock ); }
}

function rp_usados_gestion_change_state( int $id, $state, $revision ) {
	return rp_usados_gestion_save( $id, array( 'fields' => array( 'rp_estado_stock' => $state ), 'revision' => $revision ) );
}
