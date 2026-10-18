<?php
/** Integration assertions against real WP, SQLite, role mapping and REST dispatcher. */
$checks = array();
function rp_gestion_check( string $label, bool $result ): void {
	global $checks;
	if ( ! $result ) { throw new RuntimeException( $label ); }
	$checks[] = $label;
}
require '/gestion-tests/demo-fixture.php';
$fixture = json_decode( file_get_contents( '/gestion-output/accounts.json' ), true );
$id = $fixture['vehicles'][0];
$manager = $fixture['accounts']['manager']['id'];
wp_set_current_user( $manager );
rp_gestion_check( 'manager access', rp_usados_gestion_access() );
$v = rp_usados_gestion_dto( $id );
$slug = get_post_field( 'post_name', $id );
$before = $v;
foreach ( array( 'marca' => array(), 'modelo' => false, 'version' => new stdClass(), 'anio' => '1800', 'kilometraje' => '-1', 'precio' => '1e4', 'moneda' => 'EUR', 'estado' => 'invalid', 'portada' => array(), 'galeria' => array( $fixture['unrelated'] ), 'descripcion' => array(), 'publicacion' => 'private', 'post_title' => 'forbidden', 'rp_destacado' => '1', 'rp_whatsapp_numero' => '111111111' ) as $field => $invalid ) {
	$payload = array( 'marca' => 'SHOULD NOT WRITE', 'revision' => $v['revision'], $field => $invalid );
	$result = rp_usados_gestion_save( $payload, $id );
	rp_gestion_check( 'invalid ' . $field . ' rejected', is_wp_error( $result ) );
	rp_gestion_check( 'invalid ' . $field . ' atomic', rp_usados_gestion_dto( $id ) === $before );
}
$updated = rp_usados_gestion_save( array( 'marca' => 'Volkswagen', 'modelo' => 'Vento DEMO', 'version' => 'Highline', 'anio' => '2021', 'revision' => $v['revision'] ), $id );
rp_gestion_check( 'valid save', ! is_wp_error( $updated ) );
if ( is_wp_error( $updated ) ) { throw new RuntimeException( $updated->get_error_message() ); }
rp_gestion_check( 'automatic title', 'Volkswagen Vento DEMO Highline 2021' === get_the_title( $id ) );
rp_gestion_check( 'existing permalink preserved', $slug === get_post_field( 'post_name', $id ) );
rp_gestion_check( 'legacy currency preserved', 'TST' === $updated['moneda'] );
rp_gestion_check( 'revision changed', $updated['revision'] !== $v['revision'] );
rp_gestion_check( 'concurrent edit rejected', 'rp_conflict' === rp_usados_gestion_save( array( 'modelo' => 'LOST', 'revision' => $v['revision'] ), $id )->get_error_code() );
rp_gestion_check( 'conflict preserves newer value', 'Vento DEMO' === get_post_meta( $id, 'rp_modelo', true ) );
rp_gestion_check( 'missing revision rejected', is_wp_error( rp_usados_gestion_save( array( 'modelo' => 'LOST' ), $id ) ) );
$draft = rp_usados_gestion_save( array( 'publicacion' => 'draft' ) );
rp_gestion_check( 'incomplete draft accepted', ! is_wp_error( $draft ) && 'draft' === get_post_status( $draft['id'] ) );
$incomplete = rp_usados_gestion_save( array( 'publicacion' => 'publish', 'revision' => $draft['revision'] ), $draft['id'] );
rp_gestion_check( 'incomplete publishing blocked', is_wp_error( $incomplete ) && 5 === count( $incomplete->get_error_data()['fields'] ) );
rp_gestion_check( 'failed publish retains draft', 'draft' === get_post_status( $draft['id'] ) );
rp_gestion_check( 'new legacy currency rejected', is_wp_error( rp_usados_gestion_save( array( 'moneda' => 'TST' ) ) ) );
foreach ( array( 'ARS', 'USD' ) as $currency ) { rp_gestion_check( 'new currency ' . $currency, ! is_wp_error( rp_usados_gestion_save( array( 'moneda' => $currency ) ) ) ); }
$sold = rp_usados_gestion_save( array( 'estado' => 'vendido', 'revision' => $updated['revision'] ), $id );
rp_gestion_check( 'sold update accepted', ! is_wp_error( $sold ) );
rp_gestion_check( 'sold retained published detail', 'publish' === get_post_status( $id ) );
rp_gestion_check( 'sold excluded from active stock', ! in_array( $id, array_column( rp_usados_gestion_list()['items'], 'id' ), true ) );
rp_gestion_check( 'sold appears in sold filter', in_array( $id, array_column( rp_usados_gestion_list( array( 'filtro' => 'vendido' ) )['items'], 'id' ), true ) );
rp_gestion_check( 'search across brand model', 1 === rp_usados_gestion_list( array( 'filtro' => 'vendido', 'buscar' => 'Volkswagen Vento' ) )['total'] );
rp_gestion_check( 'invalid filter rejected', is_wp_error( rp_usados_gestion_list( array( 'filtro' => array() ) ) ) );
$images = $sold['galeria'];
$remove = rp_usados_gestion_save( array( 'galeria' => array(), 'revision' => $sold['revision'] ), $id );
rp_gestion_check( 'gallery association removable', ! is_wp_error( $remove ) && array() === $remove['galeria'] );
foreach ( $images as $image ) { rp_gestion_check( 'physical attachment ' . $image . ' retained', 'attachment' === get_post_type( $image ) ); }
rp_gestion_check( 'cannot edit unrelated page', is_wp_error( rp_usados_gestion_save( array( 'revision' => '' ), $fixture['page'] ) ) );
// Native admin writes are also detected, even in the same second.
$rev = $remove['revision']; update_post_meta( $id, 'rp_version', 'Native DEMO edit' );
rp_gestion_check( 'native concurrent modification detected', 'rp_conflict' === rp_usados_gestion_save( array( 'revision' => $rev ), $id )->get_error_code() );
do_action( 'rest_api_init' );
foreach ( array( 'manager', 'admin', 'subscriber', 'anonymous' ) as $role ) {
	wp_set_current_user( 'anonymous' === $role ? 0 : $fixture['accounts'][ $role ]['id'] );
	$request = new WP_REST_Request( 'GET', '/rp-usados/v1/gestion/vehiculos' );
	$request->set_header( 'X-WP-Nonce', wp_create_nonce( 'wp_rest' ) );
	$response = rest_do_request( $request );
	rp_gestion_check( $role . ' REST access', in_array( $role, array( 'manager', 'admin' ), true ) ? 200 === $response->get_status() : $response->get_status() >= 400 );
	rp_gestion_check( $role . ' direct service access', in_array( $role, array( 'manager', 'admin' ), true ) ? rp_usados_gestion_access() : ! rp_usados_gestion_access() );
}
wp_set_current_user( $manager );
foreach ( array( array( 'GET', '/vehiculos' ), array( 'GET', '/vehiculos/' . $id ), array( 'POST', '/vehiculos' ), array( 'PATCH', '/vehiculos/' . $id ), array( 'POST', '/vehiculos/' . $id . '/publicacion' ), array( 'PATCH', '/vehiculos/' . $id . '/estado' ), array( 'POST', '/fotos' ) ) as $route ) {
	$request = new WP_REST_Request( $route[0], '/rp-usados/v1/gestion' . $route[1] );
	$request->set_header( 'X-WP-Nonce', 'bad' );
	rp_gestion_check( $route[0] . ' ' . $route[1] . ' nonce rejected', rest_do_request( $request )->get_status() >= 400 );
}
require __DIR__ . '/release-auth.php';
file_put_contents( '/gestion-output/service-report.json', wp_json_encode( array( 'passed' => count( $checks ), 'checks' => $checks, 'wp' => get_bloginfo( 'version' ), 'php' => PHP_VERSION ) ) );
echo 'GESTION_SERVICE_PASSED=' . count( $checks );
