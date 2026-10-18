<?php
/** Provider-neutral cache boundary. Page caches/CDNs still require explicit exclusions. */
defined( 'ABSPATH' ) || exit;

function rp_usados_security_private_request(): bool {
	$path = rawurldecode( wp_parse_url( $_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH ) ?: '/' );
	$base = rtrim( wp_parse_url( home_url( '/' ), PHP_URL_PATH ) ?: '', '/' );
	$prefix = preg_quote( $base, '#' );
	if ( preg_match( '#^' . $prefix . '/gestion(?:/|$)#', $path ) ) { return true; }
	$rest = '/' . rest_get_url_prefix() . '/rp-usados/v1/gestion';
	if ( preg_match( '#^' . $prefix . preg_quote( $rest, '#' ) . '(?:/|$)#', $path ) ) { return true; }
	$route = $_GET['rest_route'] ?? '';
	return is_string( $route ) && ( '/rp-usados/v1/gestion' === $route || str_starts_with( $route, '/rp-usados/v1/gestion/' ) );
}

function rp_usados_security_private_cache_headers(): void {
	if ( ! is_user_logged_in() && ! rp_usados_security_private_request() ) { return; }
	if ( ! defined( 'DONOTCACHEPAGE' ) ) { define( 'DONOTCACHEPAGE', true ); }
	if ( headers_sent() ) { return; }
	nocache_headers();
	header( 'Cache-Control: private, no-store, no-cache, must-revalidate, max-age=0' );
	header( 'Vary: Cookie', false );
}
add_action( 'init', 'rp_usados_security_private_cache_headers', 0 );
add_action( 'send_headers', 'rp_usados_security_private_cache_headers', 0 );

add_filter( 'rest_post_dispatch', static function ( $response, $server, $request ) {
	$route = $request->get_route();
	if ( is_user_logged_in() || '/rp-usados/v1/gestion' === $route || str_starts_with( $route, '/rp-usados/v1/gestion/' ) ) {
		$response = rest_ensure_response( $response );
		$response->header( 'Cache-Control', 'private, no-store, no-cache, must-revalidate, max-age=0' );
		$response->header( 'Vary', 'Cookie' );
	}
	return $response;
}, 30, 3 );

/** Queue during writes; dispatch at shutdown after the panel transaction has completed. */
function rp_usados_stock_cache_queue( int $id ): void {
	if ( 'vehiculo' !== get_post_type( $id ) || wp_is_post_revision( $id ) ) { return; }
	$previous = $GLOBALS['rp_usados_stock_cache_queue'][ $id ] ?? array();
	$GLOBALS['rp_usados_stock_cache_queue'][ $id ] = array_values( array_unique( array_merge( $previous, array( get_permalink( $id ) ) ) ) );
}
// Capture the published permalink BEFORE draft/status/slug updates can replace it.
add_action( 'pre_post_update', static function ( $id ) { rp_usados_stock_cache_queue( (int) $id ); }, 20 );
add_action( 'save_post_vehiculo', static function ( $id ) { rp_usados_stock_cache_queue( (int) $id ); }, 20 );
add_action( 'before_delete_post', static function ( $id ) { rp_usados_stock_cache_queue( (int) $id ); }, 20 );

function rp_usados_stock_cache_meta_changed( $meta_id, $object_id, $meta_key ): void {
	if ( '_thumbnail_id' === $meta_key || ( is_string( $meta_key ) && str_starts_with( $meta_key, 'rp_' ) ) ) {
		rp_usados_stock_cache_queue( (int) $object_id );
	}
}
foreach ( array( 'added_post_meta', 'updated_post_meta', 'deleted_post_meta' ) as $hook ) {
	add_action( $hook, 'rp_usados_stock_cache_meta_changed', 20, 3 );
}

function rp_usados_stock_cache_dispatch(): void {
	$queued = $GLOBALS['rp_usados_stock_cache_queue'] ?? array();
	$GLOBALS['rp_usados_stock_cache_queue'] = array();
	if ( ! $queued ) { return; }
	$urls = array( home_url( '/' ), get_post_type_archive_link( 'vehiculo' ) );
	foreach ( $queued as $id => $previous_urls ) {
		clean_post_cache( $id );
		$urls = array_merge( $urls, $previous_urls );
		if ( 'vehiculo' === get_post_type( $id ) ) { $urls[] = get_permalink( $id ); }
	}
	wp_cache_set_posts_last_changed();
	$urls = array_values( array_unique( array_filter( $urls, static fn( $url ) => is_string( $url ) && '' !== $url ) ) );
	/**
	 * Adapter contract: purge only these public URLs from the configured host/CDN.
	 * An invalidation may also follow a rolled-back write; extra eviction is safe.
	 * No provider requests, global flush, credentials or private payload are emitted.
	 */
	do_action( 'rp_usados_stock_cache_invalidated', array( 'vehicle_ids' => array_map( 'intval', array_keys( $queued ) ), 'urls' => $urls, 'reason' => 'stock_changed' ) );
}
add_action( 'shutdown', 'rp_usados_stock_cache_dispatch', 20 );
