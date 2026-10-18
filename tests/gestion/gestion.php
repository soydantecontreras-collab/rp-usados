<?php
/** Real WordPress integration tests. Disposable fixture, never client stock. */
defined( 'ABSPATH' ) || exit;
require_once ABSPATH . 'wp-admin/includes/image.php';
$checks = array();
function rp_gestion_test( string $name, bool $ok ): void {
	global $checks;
	if ( ! $ok ) { throw new RuntimeException( 'FAIL: ' . $name ); }
	$checks[] = $name;
}
function rp_gestion_actor( int $id ): void { wp_set_current_user( $id ); $_POST = array(); $_REQUEST = array(); $_FILES = array(); }
function rp_gestion_fixture_image( int $author, int $parent = 0 ): int {
	$uploads = wp_upload_dir(); $path = $uploads['path'] . '/' . wp_unique_filename( $uploads['path'], 'gestion-test.png' );
	copy( '/gestion-fixtures/square.png', $path );
	$id = wp_insert_attachment( array( 'post_author' => $author, 'post_parent' => $parent, 'post_mime_type' => 'image/png', 'post_status' => 'inherit' ), $path );
	wp_update_attachment_metadata( $id, wp_generate_attachment_metadata( $id, $path ) );
	return $id;
}
function rp_gestion_rest( string $method, string $route, array $payload = array() ): WP_REST_Response {
	$request = new WP_REST_Request( $method, '/rp-usados/v1/gestion' . $route ); $request->set_body_params( $payload );
	return rest_do_request( $request );
}
function rp_gestion_snapshot( int $id ): array { $post = get_post( $id ); return array( $post->post_title, $post->post_content, $post->post_status, $post->post_name, get_post_meta( $id ) ); }
rp_gestion_actor( 1 );
$manager = wp_insert_user( array( 'user_login' => 'gestion-manager', 'user_pass' => wp_generate_password( 32 ), 'role' => 'rp_stock_manager' ) );
$other = wp_insert_user( array( 'user_login' => 'gestion-other-manager', 'user_pass' => wp_generate_password( 32 ), 'role' => 'rp_stock_manager' ) );
$subscriber = wp_insert_user( array( 'user_login' => 'gestion-subscriber', 'user_pass' => wp_generate_password( 32 ), 'role' => 'subscriber' ) );
$wrong = wp_insert_post( array( 'post_type' => 'post', 'post_title' => 'NOT STOCK', 'post_status' => 'publish' ) );
foreach ( array( 0 => 'anonymous', $subscriber => 'subscriber' ) as $actor => $label ) {
	rp_gestion_actor( $actor );
	rp_gestion_test( "$label panel denied", ! rp_usados_gestion_allowed() );
	foreach ( array( array( 'GET', '/vehiculos' ), array( 'POST', '/vehiculos' ), array( 'GET', '/vehiculos/' . $wrong ), array( 'PATCH', '/vehiculos/' . $wrong ), array( 'PATCH', '/vehiculos/' . $wrong . '/estado' ), array( 'POST', '/vehiculos/' . $wrong . '/publicacion' ) ) as $case ) {
		$response = rp_gestion_rest( ...$case ); rp_gestion_test( "$label private REST denied {$case[0]} {$case[1]}", $response->get_status() >= 400 );
	}
	rp_gestion_test( "$label direct service denied", is_wp_error( rp_usados_gestion_save( 0, array( 'publication' => 'draft' ) ) ) );
}
rp_gestion_actor( $manager );
rp_gestion_test( 'manager panel allowed', rp_usados_gestion_allowed() );
foreach ( array( 'edit_posts', 'edit_pages', 'install_plugins', 'manage_options', 'create_users', 'edit_themes' ) as $cap ) { rp_gestion_test( "panel role denied unrelated $cap", ! current_user_can( $cap ) ); }
$_COOKIE['rpus_gestion_guest'] = str_repeat( 'a', 64 );
$guest_token = rp_usados_gestion_guest_token();
rp_gestion_test( 'guest CSRF validates signed browser-bound token', rp_usados_gestion_guest_verify( $guest_token ) );
$_COOKIE['rpus_gestion_guest'] = str_repeat( 'b', 64 );
rp_gestion_test( 'guest CSRF cannot cross browser cookies', ! rp_usados_gestion_guest_verify( $guest_token ) );
rp_gestion_test( 'guest CSRF rejects malformed token arrays', ! rp_usados_gestion_guest_verify( array( $guest_token ) ) );
$old_time = time() - 1900;
$expired = $old_time . '.' . hash_hmac( 'sha256', 'gestion-login|' . $_COOKIE['rpus_gestion_guest'] . '|' . $old_time, wp_salt( 'nonce' ) );
rp_gestion_test( 'guest CSRF rejects expired token', ! rp_usados_gestion_guest_verify( $expired ) );
for ( $attempt = 0; $attempt < 10; $attempt++ ) { rp_gestion_test( "auth limit allows bounded attempt $attempt", rp_usados_gestion_auth_attempt( 'rate-fixture', 'test-login' ) ); }
rp_gestion_test( 'auth account rate limit rejects next attempt', ! rp_usados_gestion_auth_attempt( 'rate-fixture', 'test-login' ) );
$draft = rp_usados_gestion_save( 0, array( 'publication' => 'draft', 'fields' => array() ) );
rp_gestion_test( 'incomplete draft allowed', ! is_wp_error( $draft ) && 'draft' === $draft['publication'] );
$id = $draft['id'];
rp_gestion_test( 'revision provided', ! empty( $draft['revision'] ) );
rp_gestion_test( 'cannot publish incomplete draft', is_wp_error( rp_usados_gestion_save( $id, array( 'revision' => $draft['revision'], 'publication' => 'publish' ) ) ) );
rp_gestion_test( 'incomplete publication leaves draft unchanged', 'draft' === get_post_status( $id ) );
$photo = rp_gestion_fixture_image( $manager ); $second = rp_gestion_fixture_image( $manager ); $third = rp_gestion_fixture_image( $manager );
// Create another actor's fixture as Administrator: manager ownership guards intentionally reject forged authors.
rp_gestion_actor( 1 ); $foreign = rp_gestion_fixture_image( $other ); rp_gestion_actor( $manager );
$fields = array( 'rp_marca' => 'Volkswagen', 'rp_modelo' => 'Vento', 'rp_version' => 'Highline', 'rp_anio' => '2021', 'rp_estado_stock' => 'disponible', 'rp_kilometraje' => '45000', 'rp_precio_monto' => '24500', 'rp_precio_moneda' => 'USD' );
$saved = rp_usados_gestion_save( $id, array( 'revision' => $draft['revision'], 'publication' => 'publish', 'fields' => $fields, 'featured_media' => $photo, 'gallery' => array( $second, $third ), 'description' => '<p>Fixture <strong>seguro</strong></p><script>alert(1)</script>' ) );
rp_gestion_test( 'manager can publish complete vehicle', ! is_wp_error( $saved ) && 'publish' === $saved['publication'] );
$public_ids = get_posts( array( 'post_type' => 'vehiculo', 'post_status' => 'publish', 'numberposts' => -1, 'fields' => 'ids', 'meta_query' => array( rp_usados_stock_clause() ) ) );
rp_gestion_test( 'published available vehicle enters unchanged public stock query', in_array( $id, $public_ids, true ) );
rp_gestion_test( 'auto title uses approved fields', 'Volkswagen Vento Highline 2021' === get_the_title( $id ) );
rp_gestion_test( 'description strips executable tags', ! str_contains( get_post_field( 'post_content', $id ), '<script' ) );
rp_gestion_test( 'images bound to vehicle', (int) get_post( $photo )->post_parent === $id && (int) get_post( $second )->post_parent === $id );
rp_gestion_test( 'gallery ordering saved', array( $second, $third ) === get_post_meta( $id, 'rp_galeria_ids', true ) );
$slug = get_post_field( 'post_name', $id );
update_post_meta( $id, 'rp_whatsapp_numero', '5491125348193' ); update_post_meta( $id, 'rp_whatsapp_mensaje', 'Preserve this confirmed custom copy' ); update_post_meta( $id, 'rp_destacado', '1' );
wp_update_post( array( 'ID' => $id, 'post_excerpt' => 'Preserve native legacy excerpt' ) );
$saved = rp_usados_gestion_get( $id );
$revision = $saved['revision']; $before = rp_gestion_snapshot( $id );
foreach ( array(
	array( 'fields' => array( 'rp_marca' => 'DO NOT SAVE', 'rp_precio_monto' => array( '999' ) ) ),
	array( 'fields' => array( 'rp_marca' => 'DO NOT SAVE', 'rp_anio' => array( '2022' ) ) ),
	array( 'fields' => array( 'rp_marca' => 'DO NOT SAVE', 'rp_kilometraje' => '-1' ) ),
	array( 'fields' => array( 'rp_marca' => 'DO NOT SAVE', 'rp_precio_moneda' => 'EUR' ) ),
	array( 'fields' => array( 'rp_whatsapp_numero' => '11111111' ) ),
	array( 'fields' => array( 'rp_marca' => 'DO NOT SAVE' ), 'gallery' => array( array( $second ) ) ),
	array( 'fields' => array( 'rp_marca' => 'DO NOT SAVE' ), 'featured_media' => $wrong ),
	array( 'fields' => array( 'rp_marca' => 'DO NOT SAVE' ), 'featured_media' => $foreign ),
	array( 'fields' => array( 'rp_marca' => 'DO NOT SAVE' ), 'gallery' => array( $foreign ) ),
	array( 'publication' => 'trash' ),
	array( 'unknown' => 'must reject' ),
) as $index => $bad ) {
	$bad['revision'] = $revision; $result = rp_usados_gestion_save( $id, $bad );
	rp_gestion_test( "malformed payload $index rejected", is_wp_error( $result ) );
	rp_gestion_test( "malformed payload $index preserves all values", $before === rp_gestion_snapshot( $id ) );
}
$edited = rp_usados_gestion_save( $id, array( 'revision' => $revision, 'fields' => array( 'rp_version' => 'Comfortline', 'rp_precio_monto' => '23000' ), 'gallery' => array( $third, $second ) ) );
rp_gestion_test( 'edit valid price/version succeeds', ! is_wp_error( $edited ) && '23000' === get_post_meta( $id, 'rp_precio_monto', true ) );
rp_gestion_test( 'title changes without changing slug', 'Volkswagen Vento Comfortline 2021' === get_the_title( $id ) && $slug === get_post_field( 'post_name', $id ) );
rp_gestion_test( 'gallery reorder succeeds', array( $third, $second ) === get_post_meta( $id, 'rp_galeria_ids', true ) );
rp_gestion_test( 'unexposed legacy fields preserved', '5491125348193' === get_post_meta( $id, 'rp_whatsapp_numero', true ) && 'Preserve this confirmed custom copy' === get_post_meta( $id, 'rp_whatsapp_mensaje', true ) && '1' === get_post_meta( $id, 'rp_destacado', true ) && 'Preserve native legacy excerpt' === get_post_field( 'post_excerpt', $id ) );
rp_gestion_test( 'revision updates after save', $edited['revision'] !== $revision );
$stale = rp_usados_gestion_save( $id, array( 'revision' => $revision, 'fields' => array( 'rp_precio_monto' => '1' ) ) );
rp_gestion_test( 'stale edit returns conflict', is_wp_error( $stale ) && 409 === $stale->get_error_data()['status'] );
rp_gestion_test( 'stale edit cannot overwrite price', '23000' === get_post_meta( $id, 'rp_precio_monto', true ) );
$edited = rp_usados_gestion_save( $id, array( 'revision' => $edited['revision'], 'gallery' => array( $third ), 'fields' => array( 'rp_kilometraje' => '', 'rp_precio_monto' => '' ) ) );
rp_gestion_test( 'explicit allowed empties clear optional fields', ! is_wp_error( $edited ) && '' === get_post_meta( $id, 'rp_kilometraje', true ) && '' === get_post_meta( $id, 'rp_precio_monto', true ) );
rp_gestion_test( 'remove gallery association does not delete file or attachment', get_post( $second ) instanceof WP_Post && is_file( get_attached_file( $second ) ) && array( $third ) === get_post_meta( $id, 'rp_galeria_ids', true ) );
$reserved = rp_usados_gestion_change_state( $id, 'reservado', $edited['revision'] );
rp_gestion_test( 'quick reserve succeeds', ! is_wp_error( $reserved ) && 'reservado' === get_post_meta( $id, 'rp_estado_stock', true ) );
$public_ids = get_posts( array( 'post_type' => 'vehiculo', 'post_status' => 'publish', 'numberposts' => -1, 'fields' => 'ids', 'meta_query' => array( rp_usados_stock_clause() ) ) );
rp_gestion_test( 'reserved stays in unchanged public stock query', in_array( $id, $public_ids, true ) );
$sold = rp_usados_gestion_change_state( $id, 'vendido', $reserved['revision'] );
rp_gestion_test( 'sold keeps published post and permalink', ! is_wp_error( $sold ) && 'publish' === get_post_status( $id ) && $slug === get_post_field( 'post_name', $id ) );
$public_ids = get_posts( array( 'post_type' => 'vehiculo', 'post_status' => 'publish', 'numberposts' => -1, 'fields' => 'ids', 'meta_query' => array( rp_usados_stock_clause() ) ) );
rp_gestion_test( 'sold leaves unchanged public stock query', ! in_array( $id, $public_ids, true ) );
rp_gestion_test( 'sold absent from active manager list', ! in_array( $id, array_column( rp_usados_gestion_list( 'activo' ), 'id' ), true ) );
rp_gestion_test( 'sold present in sold manager list', in_array( $id, array_column( rp_usados_gestion_list( 'vendido' ), 'id' ), true ) );
rp_gestion_test( 'search matches model', in_array( $id, array_column( rp_usados_gestion_list( 'vendido', 'Vento' ), 'id' ), true ) );
rp_gestion_test( 'unmatched search excludes vehicle', ! in_array( $id, array_column( rp_usados_gestion_list( 'vendido', 'NoSuchModel' ), 'id' ), true ) );
rp_gestion_test( 'draft filter includes incomplete draft', in_array( rp_usados_gestion_save( 0, array( 'publication' => 'draft' ) )['id'], array_column( rp_usados_gestion_list( 'borradores' ), 'id' ), true ) );
rp_gestion_test( 'wrong CPT get rejected', is_wp_error( rp_usados_gestion_get( $wrong ) ) );
rp_gestion_test( 'wrong CPT edit rejected', is_wp_error( rp_usados_gestion_save( $wrong, array( 'fields' => array( 'rp_marca' => 'DENIED' ) ) ) ) );
rp_gestion_test( 'missing vehicle get rejected', is_wp_error( rp_usados_gestion_get( 99999999 ) ) );
$legacy = wp_insert_post( array( 'post_type' => 'vehiculo', 'post_status' => 'draft', 'post_title' => 'LEGACY' ) );
update_post_meta( $legacy, 'rp_precio_moneda', 'TST' ); $legacy_data = rp_usados_gestion_get( $legacy );
$legacy_saved = rp_usados_gestion_save( $legacy, array( 'revision' => $legacy_data['revision'], 'fields' => array( 'rp_marca' => 'Legacy', 'rp_precio_moneda' => 'TST' ) ) );
rp_gestion_test( 'existing valid legacy currency preserved', ! is_wp_error( $legacy_saved ) && 'TST' === get_post_meta( $legacy, 'rp_precio_moneda', true ) );
$legacy_revision = $legacy_saved['revision']; update_post_meta( $legacy, 'rp_precio_monto', '99' );
rp_gestion_test( 'external metadata edits invalidate revision', $legacy_revision !== rp_usados_gestion_get( $legacy )['revision'] );
foreach ( array( 'ARS', 'USD' ) as $currency ) { rp_gestion_test( "new currency $currency accepted", ! is_wp_error( rp_usados_gestion_save( 0, array( 'publication' => 'draft', 'fields' => array( 'rp_precio_moneda' => $currency ) ) ) ) ); }
$before_new_invalid = (int) wp_count_posts( 'vehiculo' )->draft;
rp_gestion_test( 'new legacy currency rejected', is_wp_error( rp_usados_gestion_save( 0, array( 'publication' => 'draft', 'fields' => array( 'rp_precio_moneda' => 'TST' ) ) ) ) );
rp_gestion_test( 'invalid creation does not leave a partial draft', $before_new_invalid === (int) wp_count_posts( 'vehiculo' )->draft );
$response = rp_gestion_rest( 'GET', '/vehiculos/' . $id );
rp_gestion_test( 'private REST serializer succeeds', 200 === $response->get_status() && $id === $response->get_data()['id'] );
rp_gestion_test( 'private GET carries no-store policy', str_contains( strtolower( $response->get_headers()['Cache-Control'] ?? '' ), 'no-store' ) );
$response = rp_gestion_rest( 'PATCH', '/vehiculos/' . $id, array( 'revision' => 'stale', 'fields' => array( 'rp_precio_monto' => '1' ) ) );
rp_gestion_test( 'REST conflict status mapped', 409 === $response->get_status() );
$list = rp_gestion_rest( 'GET', '/vehiculos' ); rp_gestion_test( 'REST list contains serialized items', 200 === $list->get_status() && isset( $list->get_data()['items'] ) );
rp_gestion_actor( 1 );
rp_gestion_test( 'admin panel allowed', rp_usados_gestion_allowed() );
$admin_edit = rp_usados_gestion_save( $id, array( 'revision' => rp_usados_gestion_get( $id )['revision'], 'fields' => array( 'rp_precio_monto' => '25000' ), 'featured_media' => $foreign ) );
rp_gestion_test( 'admin full attachment/edit access remains', ! is_wp_error( $admin_edit ) && $foreign === (int) get_post_thumbnail_id( $id ) );
file_put_contents( '/gestion-output/report.json', wp_json_encode( array( 'passed' => count( $checks ), 'checks' => $checks, 'wp' => get_bloginfo( 'version' ), 'php' => PHP_VERSION ) ) );
