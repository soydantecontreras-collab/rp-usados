<?php
/** REST is a private transport over the same server-side form service. */
defined( 'ABSPATH' ) || exit;

function rp_usados_gestion_rest_permission( WP_REST_Request $request ) {
	if ( ! rp_usados_gestion_allowed() ) { return new WP_Error( 'rp_gestion_forbidden', 'No tenés acceso a la gestión de stock.', array( 'status' => is_user_logged_in() ? 403 : 401 ) ); }
	$id = (int) $request->get_param( 'id' );
	if ( $id ) { $data = rp_usados_gestion_get( $id ); if ( is_wp_error( $data ) ) { return $data; } }
	if ( 'POST' === $request->get_method() && ! $id && str_ends_with( $request->get_route(), '/vehiculos' ) && ! current_user_can( 'create_vehiculos' ) ) { return new WP_Error( 'rp_gestion_forbidden', 'No podés crear vehículos.', array( 'status' => 403 ) ); }
	return true;
}

function rp_usados_gestion_rest_response( $data ) {
	if ( is_wp_error( $data ) ) { return $data; }
	$response = rest_ensure_response( $data );
	$response->header( 'Cache-Control', 'private, no-store, max-age=0' );
	$response->header( 'Vary', 'Cookie' );
	return $response;
}

function rp_usados_gestion_rest_payload( WP_REST_Request $request ): array {
	$payload = $request->get_json_params();
	return is_array( $payload ) ? $payload : array( 'invalid' => true );
}

add_action( 'rest_api_init', static function () {
	$ns = 'rp-usados/v1/gestion';
	$permission = 'rp_usados_gestion_rest_permission';
	$schema = array( 'fields' => array( 'type' => 'object', 'properties' => array_fill_keys( rp_usados_gestion_fields(), array( 'type' => 'string' ) ), 'additionalProperties' => false ), 'description' => array( 'type' => 'string' ), 'featured_media' => array( 'type' => 'integer', 'minimum' => 0 ), 'gallery' => array( 'type' => 'array', 'items' => array( 'type' => 'integer', 'minimum' => 1 ) ), 'publication' => array( 'type' => 'string', 'enum' => array( 'draft', 'publish' ) ), 'revision' => array( 'type' => 'string' ) );
	register_rest_route( $ns, '/sesion', array( 'methods' => 'GET', 'permission_callback' => $permission, 'callback' => static function () { return rp_usados_gestion_rest_response( array( 'nonce' => wp_create_nonce( 'wp_rest' ) ) ); } ) );
	register_rest_route( $ns, '/vehiculos', array(
		array( 'methods' => 'GET', 'permission_callback' => $permission, 'args' => array( 'filter' => array( 'type' => 'string', 'enum' => array( 'activo', 'disponible', 'reservado', 'vendido', 'borradores' ), 'default' => 'activo' ), 'search' => array( 'type' => 'string', 'default' => '', 'sanitize_callback' => 'sanitize_text_field' ) ), 'callback' => static function ( $r ) { return rp_usados_gestion_rest_response( array( 'items' => rp_usados_gestion_list( $r['filter'], $r['search'] ) ) ); } ),
		array( 'methods' => 'POST', 'permission_callback' => $permission, 'args' => $schema, 'callback' => static function ( $r ) { return rp_usados_gestion_rest_response( rp_usados_gestion_save( 0, rp_usados_gestion_rest_payload( $r ) ) ); } ),
	) );
	register_rest_route( $ns, '/vehiculos/(?P<id>[1-9][0-9]*)', array(
		array( 'methods' => 'GET', 'permission_callback' => $permission, 'args' => array( 'id' => array( 'type' => 'integer' ) ), 'callback' => static function ( $r ) { return rp_usados_gestion_rest_response( rp_usados_gestion_get( (int) $r['id'] ) ); } ),
		array( 'methods' => 'PATCH', 'permission_callback' => $permission, 'args' => $schema, 'callback' => static function ( $r ) { return rp_usados_gestion_rest_response( rp_usados_gestion_save( (int) $r['id'], rp_usados_gestion_rest_payload( $r ) ) ); } ),
	) );
	register_rest_route( $ns, '/vehiculos/(?P<id>[1-9][0-9]*)/publicacion', array( 'methods' => 'POST', 'permission_callback' => $permission, 'args' => array_intersect_key( $schema, array_flip( array( 'publication', 'revision' ) ) ), 'callback' => static function ( $r ) {
		$payload = rp_usados_gestion_rest_payload( $r );
		if ( array_diff( array_keys( $payload ), array( 'publication', 'revision' ) ) || ! isset( $payload['publication'] ) ) { return rp_usados_gestion_error( array( 'publication' => 'Solicitud de publicación inválida.' ) ); }
		return rp_usados_gestion_rest_response( rp_usados_gestion_save( (int) $r['id'], $payload ) );
	} ) );
	register_rest_route( $ns, '/vehiculos/(?P<id>[1-9][0-9]*)/estado', array( 'methods' => 'PATCH', 'permission_callback' => $permission, 'args' => array( 'state' => array( 'type' => 'string', 'enum' => array( 'disponible', 'reservado', 'vendido' ), 'required' => true ), 'revision' => array( 'type' => 'string', 'required' => true ) ), 'callback' => static function ( $r ) {
		$payload = rp_usados_gestion_rest_payload( $r );
		if ( array_diff( array_keys( $payload ), array( 'state', 'revision' ) ) ) { return rp_usados_gestion_error( array( 'form' => 'Campos no permitidos.' ) ); }
		return rp_usados_gestion_rest_response( rp_usados_gestion_change_state( (int) $r['id'], $r['state'], $r['revision'] ) );
	} ) );
} );

add_filter( 'rest_post_dispatch', static function ( $response, $server, $request ) {
	if ( str_starts_with( $request->get_route(), '/rp-usados/v1/gestion/' ) ) {
		$response->header( 'Cache-Control', 'private, no-store, max-age=0' ); $response->header( 'Vary', 'Cookie' ); $response->header( 'X-Robots-Tag', 'noindex, nofollow' );
	}
	return $response;
}, 10, 3 );
