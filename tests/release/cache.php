<?php
/** Disposable WordPress integration checks; no production data or credentials. */
defined( 'ABSPATH' ) || exit;
$checks = array();
$check = static function ( string $name, bool $passed ) use ( &$checks ) {
	if ( ! $passed ) { throw new RuntimeException( $name ); }
	$checks[] = $name;
};
wp_set_current_user( 1 );
$original_uri = $_SERVER['REQUEST_URI'] ?? '/';
$_GET = array();
foreach ( array( '/gestion', '/gestion/', '/gestion/nuevo/', '/wp-json/rp-usados/v1/gestion/vehiculos' ) as $uri ) {
	$_SERVER['REQUEST_URI'] = $uri;
	$check( 'private path: ' . $uri, rp_usados_security_private_request() );
}
$_SERVER['REQUEST_URI'] = '/';
$_GET['rest_route'] = '/rp-usados/v1/gestion/vehiculos';
$check( 'plain-permalink private REST', rp_usados_security_private_request() );
$_GET['rest_route'] = array( '/rp-usados/v1/gestion' );
$check( 'malformed route safely rejected', ! rp_usados_security_private_request() );
$_GET = array();
foreach ( array( '/', '/vehiculos/', '/gestion-publica/', '/wp-json/wp/v2/posts' ) as $uri ) {
	$_SERVER['REQUEST_URI'] = $uri;
	$check( 'public path not reclassified: ' . $uri, ! rp_usados_security_private_request() );
}
$_SERVER['REQUEST_URI'] = $original_uri;
$vehicle = wp_insert_post( array( 'post_type' => 'vehiculo', 'post_status' => 'publish', 'post_title' => 'CACHE TEST ONLY', 'post_name' => 'cache-test-only' ) );
$other = wp_insert_post( array( 'post_type' => 'post', 'post_status' => 'publish', 'post_title' => 'NOT STOCK' ) );
rp_usados_stock_cache_dispatch();
$events = array();
$listener = static function ( $data ) use ( &$events ) { $events[] = $data; };
add_action( 'rp_usados_stock_cache_invalidated', $listener );
update_post_meta( $other, 'rp_marca', 'NOT VEHICLE' );
rp_usados_stock_cache_dispatch();
$check( 'unrelated content does not invalidate stock', 0 === count( $events ) );
update_post_meta( $vehicle, 'rp_marca', 'CACHE' );
update_post_meta( $vehicle, 'rp_estado_stock', 'reservado' );
update_post_meta( $vehicle, 'rp_precio_monto', '123' );
update_post_meta( $vehicle, '_thumbnail_id', 987654 );
update_post_meta( $vehicle, 'rp_galeria_ids', array() );
$check( 'invalidations queued until writes complete', 0 === count( $events ) );
rp_usados_stock_cache_dispatch();
$check( 'one event per request batch', 1 === count( $events ) );
$event = $events[0];
$check( 'only affected vehicle IDs emitted', array( (int) $vehicle ) === $event['vehicle_ids'] );
$check( 'home invalidation URL included', in_array( home_url( '/' ), $event['urls'], true ) );
$check( 'archive invalidation URL included', in_array( get_post_type_archive_link( 'vehiculo' ), $event['urls'], true ) );
$check( 'single invalidation URL included', in_array( get_permalink( $vehicle ), $event['urls'], true ) );
$check( 'no price or private payload emitted', array( 'vehicle_ids', 'urls', 'reason' ) === array_keys( $event ) );
rp_usados_stock_cache_dispatch();
$check( 'dispatch drains queue', 1 === count( $events ) );
$published_url = get_permalink( $vehicle );
$check( 'fixture exercises a pretty published permalink', str_contains( $published_url, '/cache-test-only/' ) );
wp_update_post( array( 'ID' => $vehicle, 'post_status' => 'draft' ) );
rp_usados_stock_cache_dispatch();
$check( 'publication changes invalidate public content', 2 === count( $events ) );
$check( 'published permalink survives draft transition', in_array( $published_url, $events[1]['urls'], true ) );
wp_update_post( array( 'ID' => $vehicle, 'post_status' => 'publish' ) );
rp_usados_stock_cache_dispatch();
$published_url = get_permalink( $vehicle );
wp_update_post( array( 'ID' => $vehicle, 'post_name' => 'cache-new-slug' ) );
rp_usados_stock_cache_dispatch();
$slug_event = end( $events );
$check( 'previous published slug URL retained', in_array( $published_url, $slug_event['urls'], true ) );
$check( 'new published slug URL included', in_array( get_permalink( $vehicle ), $slug_event['urls'], true ) );
$old_url = get_permalink( $vehicle );
wp_delete_post( $vehicle, true );
rp_usados_stock_cache_dispatch();
$delete_event = end( $events );
$check( 'deletion preserves previous public URL for purge', in_array( $old_url, $delete_event['urls'], true ) );
wp_set_current_user( 0 );
$request = new WP_REST_Request( 'GET', '/rp-usados/v1/gestion/vehiculos' );
$response = apply_filters( 'rest_post_dispatch', new WP_REST_Response( array(), 401 ), rest_get_server(), $request );
$check( 'anonymous private REST error is no-store', str_contains( $response->get_headers()['Cache-Control'], 'no-store' ) );
wp_set_current_user( 1 );
$request = new WP_REST_Request( 'GET', '/wp/v2/posts' );
$response = apply_filters( 'rest_post_dispatch', new WP_REST_Response( array(), 200 ), rest_get_server(), $request );
$check( 'authenticated REST is no-store', str_contains( $response->get_headers()['Cache-Control'], 'no-store' ) );
$check( 'authenticated REST varies by cookie', 'Cookie' === $response->get_headers()['Vary'] );
remove_action( 'rp_usados_stock_cache_invalidated', $listener );
wp_delete_post( $other, true );
file_put_contents( '/release-output/cache-report.json', wp_json_encode( array( 'passed' => count( $checks ), 'checks' => $checks, 'wp' => get_bloginfo( 'version' ), 'php' => PHP_VERSION ) ) );
