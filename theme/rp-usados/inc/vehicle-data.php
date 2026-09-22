<?php
/** Vehicle data and public presentation rules. @package RP_Usados */
defined( 'ABSPATH' ) || exit;

function rp_usados_pending(): string {
	return __( '[dato pendiente — confirmar con el cliente]', 'rp-usados' );
}

/** One schema for native admin fields and registered metadata. */
function rp_usados_vehicle_fields(): array {
	return array(
		'rp_marca'            => array( 'label' => 'Marca', 'kind' => 'text' ),
		'rp_modelo'           => array( 'label' => 'Modelo', 'kind' => 'text' ),
		'rp_version'          => array( 'label' => 'Versión', 'kind' => 'text' ),
		'rp_anio'             => array( 'label' => 'Año', 'kind' => 'year' ),
		'rp_kilometraje'      => array( 'label' => 'Kilometraje', 'kind' => 'integer' ),
		'rp_precio_monto'     => array( 'label' => 'Precio (sin separadores de miles)', 'kind' => 'price' ),
		'rp_precio_moneda'    => array( 'label' => 'Moneda confirmada (código de 3 letras)', 'kind' => 'currency' ),
		'rp_estado_stock'     => array( 'label' => 'Estado del stock', 'kind' => 'status' ),
		'rp_destacado'        => array( 'label' => 'Destacar en la Home', 'kind' => 'boolean' ),
		'rp_whatsapp_numero'  => array( 'label' => 'WhatsApp confirmado para esta unidad (opcional)', 'kind' => 'phone' ),
		'rp_whatsapp_mensaje' => array( 'label' => 'Mensaje para esta unidad (opcional)', 'kind' => 'text' ),
		'rp_galeria_ids'      => array( 'label' => 'Galería', 'kind' => 'gallery' ),
	);
}

function rp_usados_stock_labels(): array {
	return array( 'disponible' => __( 'Disponible', 'rp-usados' ), 'reservado' => __( 'Reservado', 'rp-usados' ), 'vendido' => __( 'Vendido', 'rp-usados' ) );
}

/** Never turn a missing or invalid datum into a plausible commercial value. */
function rp_usados_sanitize_vehicle_value( $value, string $key ) {
	$fields = rp_usados_vehicle_fields();
	$kind = $fields[ $key ]['kind'] ?? 'text';
	if ( 'gallery' === $kind ) {
		$ids = is_array( $value ) ? $value : explode( ',', (string) $value );
		return array_values( array_filter( array_unique( array_map( 'absint', $ids ) ), 'wp_attachment_is_image' ) );
	}
	if ( ! is_scalar( $value ) ) {
		return '';
	}
	$value = trim( (string) $value );
	if ( 'boolean' === $kind ) {
		return '1' === $value ? '1' : '0';
	}
	if ( 'status' === $kind ) {
		return array_key_exists( $value, rp_usados_stock_labels() ) ? $value : '';
	}
	if ( 'phone' === $kind ) {
		$value = preg_replace( '/[\s()+-]/', '', $value );
		return preg_match( '/^[1-9][0-9]{7,14}$/D', $value ) ? $value : '';
	}
	if ( 'currency' === $kind ) {
		$value = strtoupper( $value );
		return preg_match( '/^[A-Z]{3}$/D', $value ) ? $value : '';
	}
	if ( 'price' === $kind ) {
		$value = str_replace( ',', '.', $value );
		return preg_match( '/^[0-9]{1,12}(\.[0-9]{1,2})?$/D', $value ) && (float) $value > 0 ? $value : '';
	}
	if ( 'integer' === $kind || 'year' === $kind ) {
		if ( ! preg_match( '/^[0-9]{1,9}$/D', $value ) ) {
			return '';
		}
		if ( 'year' === $kind && ( (int) $value < 1886 || (int) $value > (int) gmdate( 'Y' ) + 1 ) ) {
			return '';
		}
		return (string) (int) $value;
	}
	return sanitize_text_field( $value );
}

function rp_usados_register_vehicle_meta(): void {
	foreach ( rp_usados_vehicle_fields() as $key => $field ) {
		register_post_meta( 'vehiculo', $key, array(
			'type' => 'gallery' === $field['kind'] ? 'array' : 'string',
			'single' => true,
			'show_in_rest' => false,
			'sanitize_callback' => 'rp_usados_sanitize_vehicle_value',
			'auth_callback' => static function ( $allowed, $meta_key, $post_id ) { return current_user_can( 'edit_post', $post_id ); },
		) );
	}
}
add_action( 'init', 'rp_usados_register_vehicle_meta' );

function rp_usados_catalog_url(): string {
	return get_post_type_archive_link( 'vehiculo' ) ?: home_url( '/vehiculos/' );
}

function rp_usados_stock_clause( bool $available_only = false ): array {
	return array( 'key' => 'rp_estado_stock', 'value' => $available_only ? array( 'disponible' ) : array( 'disponible', 'reservado' ), 'compare' => 'IN' );
}

function rp_usados_featured_vehicles(): WP_Query {
	return new WP_Query( array(
		'post_type' => 'vehiculo', 'post_status' => 'publish', 'posts_per_page' => 3,
		'no_found_rows' => true, 'ignore_sticky_posts' => true,
		'meta_query' => array( 'relation' => 'AND', rp_usados_stock_clause( true ), array( 'key' => 'rp_destacado', 'value' => '1' ) ),
	) );
}

function rp_usados_filter_catalog( WP_Query $query ): void {
	if ( is_admin() || ! $query->is_main_query() || ! $query->is_post_type_archive( 'vehiculo' ) ) {
		return;
	}
	$query->set( 'post_status', 'publish' );
	$query->set( 'posts_per_page', 12 );
	$query->set( 'meta_query', array( 'relation' => 'AND', (array) $query->get( 'meta_query' ), rp_usados_stock_clause() ) );
}
add_action( 'pre_get_posts', 'rp_usados_filter_catalog' );

/** Safe to call from a card; price is intentionally absent. */
function rp_usados_vehicle_facts( int $id ): array {
	$result = array();
	$year = get_post_meta( $id, 'rp_anio', true );
	$km = get_post_meta( $id, 'rp_kilometraje', true );
	if ( '' !== $year ) { $result[ __( 'Año', 'rp-usados' ) ] = $year; }
	if ( '' !== $km ) { $result[ __( 'Kilometraje', 'rp-usados' ) ] = number_format_i18n( (int) $km ) . ' km'; }
	return $result;
}

/** Price has a defensive single-unit context gate, never used by list views. */
function rp_usados_vehicle_price( int $id ): string {
	if ( ! is_singular( 'vehiculo' ) || get_queried_object_id() !== $id ) { return ''; }
	$amount = get_post_meta( $id, 'rp_precio_monto', true );
	$currency = get_post_meta( $id, 'rp_precio_moneda', true );
	if ( '' === $amount || '' === $currency ) { return rp_usados_pending(); }
	return $currency . ' ' . number_format_i18n( (float) $amount, (float) $amount === floor( (float) $amount ) ? 0 : 2 );
}

/** Recipient can vary by unit; title and canonical URL always identify the unit. */
function rp_usados_vehicle_whatsapp_url( int $id ): string {
	$number = get_post_meta( $id, 'rp_whatsapp_numero', true ) ?: get_theme_mod( 'rp_whatsapp_numero', '' );
	$number = rp_usados_sanitize_vehicle_value( $number, 'rp_whatsapp_numero' );
	if ( '' === $number ) { return ''; }
	$message = get_post_meta( $id, 'rp_whatsapp_mensaje', true ) ?: __( 'Hola, quiero consultar por esta unidad.', 'rp-usados' );
	$message .= "\n" . wp_strip_all_tags( get_the_title( $id ) ) . "\n" . get_permalink( $id );
	return 'https://wa.me/' . $number . '?text=' . rawurlencode( $message );
}

// Vehicle descriptions and excerpts may contain editorial prices. Never expose
// their free text through public listings, feeds, search or anonymous REST.
function rp_usados_protect_vehicle_text( string $text ): string {
	if ( 'vehiculo' === get_post_type() && ( ! is_singular( 'vehiculo' ) || is_feed() || ( defined( 'REST_REQUEST' ) && REST_REQUEST ) ) ) { return ''; }
	return $text;
}
add_filter( 'the_excerpt', 'rp_usados_protect_vehicle_text', 99 );
add_filter( 'the_content', 'rp_usados_protect_vehicle_text', 99 );
add_filter( 'the_content_feed', 'rp_usados_protect_vehicle_text', 99 );
add_filter( 'the_excerpt_rss', 'rp_usados_protect_vehicle_text', 99 );
add_filter( 'rest_prepare_vehiculo', static function ( $response, $post ) {
	if ( ! current_user_can( 'edit_post', $post->ID ) ) {
		$data = $response->get_data();
		unset( $data['content'], $data['excerpt'] );
		$response->set_data( $data );
	}
	return $response;
}, 10, 2 );
