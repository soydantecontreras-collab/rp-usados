<?php
/** Runs only inside an ephemeral WordPress fixture, never the existing local site. */
defined( 'ABSPATH' ) || exit;
require_once ABSPATH . 'wp-admin/includes/image.php';
require_once ABSPATH . 'wp-admin/includes/media.php';
require_once ABSPATH . 'wp-admin/includes/file.php';
require_once ABSPATH . 'wp-admin/includes/plugin.php';
require_once ABSPATH . 'wp-admin/includes/class-wp-screen.php';
$checks = array();
function rp_security_test( string $name, bool $result ): void {
	global $checks;
	if ( ! $result ) { throw new RuntimeException( 'FAIL: ' . $name ); }
	$checks[] = $name;
}
function rp_security_request( string $method, string $route, array $params = array() ): WP_REST_Response {
	$request = new WP_REST_Request( $method, $route );
	$request->set_body_params( $params );
	return rest_do_request( $request );
}
function rp_security_actor( int $id ): void {
	wp_set_current_user( $id ); $_POST = array(); $_REQUEST = array(); $_FILES = array();
	unset( $GLOBALS['rp_usados_security_upload_vehicle'] );
}
function rp_security_save( int $id, array $values, bool $nonce = true ): void {
	$_POST = array_merge( array( 'rp_vehicle_nonce' => $nonce ? wp_create_nonce( 'rp_vehicle_save' ) : 'invalid' ), $values );
	rp_usados_save_vehicle( $id ); $_POST = array();
}
function rp_security_image( int $author, int $parent = 0, string $name = 'test.png' ): int {
	$uploads = wp_upload_dir();
	$file = $uploads['path'] . '/' . wp_unique_filename( $uploads['path'], $name );
	copy( '/security-fixtures/square.png', $file );
	$id = wp_insert_attachment( array( 'post_title' => 'SECURITY FIXTURE', 'post_mime_type' => 'image/png', 'post_author' => $author, 'post_parent' => $parent, 'post_status' => 'inherit' ), $file );
	wp_update_attachment_metadata( $id, wp_generate_attachment_metadata( $id, $file ) );
	return $id;
}

rp_security_actor( 1 );
$admin = 1;
$subscriber = wp_insert_user( array( 'user_login' => 'security-subscriber', 'user_pass' => wp_generate_password( 32 ), 'role' => 'subscriber' ) );
$manager = wp_insert_user( array( 'user_login' => 'security-manager', 'user_pass' => wp_generate_password( 32 ), 'role' => 'rp_stock_manager' ) );
$other_manager = wp_insert_user( array( 'user_login' => 'security-other-manager', 'user_pass' => wp_generate_password( 32 ), 'role' => 'rp_stock_manager' ) );
$vehicle = wp_insert_post( array( 'post_type' => 'vehiculo', 'post_status' => 'publish', 'post_title' => 'SECURITY FIXTURE A', 'post_author' => $admin ) );
$other_vehicle = wp_insert_post( array( 'post_type' => 'vehiculo', 'post_status' => 'publish', 'post_title' => 'SECURITY FIXTURE B', 'post_author' => $other_manager ) );
$normal_post = wp_insert_post( array( 'post_type' => 'post', 'post_status' => 'publish', 'post_title' => 'NOT STOCK', 'post_author' => $manager ) );
$page = wp_insert_post( array( 'post_type' => 'page', 'post_status' => 'publish', 'post_title' => 'NOT STOCK', 'post_author' => $manager ) );
$own = rp_security_image( $manager );
$foreign = rp_security_image( $other_manager );
$outside = rp_security_image( $admin, $page );
$legacy = rp_security_image( $admin );
set_post_thumbnail( $vehicle, $legacy );
update_post_meta( $vehicle, 'rp_galeria_ids', array( $legacy ) );
update_post_meta( $vehicle, 'rp_precio_monto', '12345.67' );
update_post_meta( $vehicle, 'rp_precio_moneda', 'ARS' );
update_post_meta( $vehicle, 'rp_estado_stock', 'disponible' );
update_post_meta( $other_vehicle, 'rp_estado_stock', 'reservado' );

rp_security_test( 'CPT create cap is independent', 'create_vehiculos' === get_post_type_object( 'vehiculo' )->cap->create_posts );
foreach ( array( 0 => 'anonymous', $subscriber => 'subscriber' ) as $actor => $name ) {
	rp_security_actor( $actor );
	foreach ( array( 'create_vehiculos', 'publish_vehiculos', 'upload_files' ) as $cap ) { rp_security_test( "$name denied $cap", ! current_user_can( $cap ) ); }
	rp_security_test( "$name denied edit object", ! current_user_can( 'edit_post', $vehicle ) );
	rp_security_test( "$name denied delete object", ! current_user_can( 'delete_post', $vehicle ) );
	foreach ( array( array( 'POST', '/wp/v2/vehiculo', array( 'title' => 'DENIED' ) ), array( 'POST', '/wp/v2/vehiculo/' . $vehicle, array( 'title' => 'DENIED' ) ), array( 'DELETE', '/wp/v2/vehiculo/' . $vehicle, array() ), array( 'POST', '/wp/v2/media', array() ) ) as $case ) {
		$response = rp_security_request( ...$case ); rp_security_test( "$name REST denied {$case[0]} {$case[1]}", $response->get_status() >= 400 );
	}
	rp_security_save( $vehicle, array( 'rp_precio_monto' => '999' ) );
	rp_security_test( "$name meta write denied even with actor nonce", '12345.67' === get_post_meta( $vehicle, 'rp_precio_monto', true ) );
}

rp_security_actor( $manager );
foreach ( rp_usados_security_vehicle_caps() as $cap ) { rp_security_test( "manager granted $cap", current_user_can( $cap ) ); }
foreach ( array( 'edit_posts', 'publish_posts', 'edit_pages', 'manage_options', 'create_users', 'edit_users', 'install_plugins', 'activate_plugins', 'edit_plugins', 'edit_themes', 'switch_themes', 'edit_theme_options', 'unfiltered_html', 'unfiltered_upload' ) as $cap ) { rp_security_test( "manager denied $cap", ! current_user_can( $cap ) ); }
rp_security_test( 'manager edits existing admin vehicle', current_user_can( 'edit_post', $vehicle ) );
rp_security_test( 'manager cannot edit own normal post', ! current_user_can( 'edit_post', $normal_post ) );
rp_security_test( 'manager cannot edit own normal page', ! current_user_can( 'edit_post', $page ) );
wp_get_current_user()->add_cap( 'manage_options' );
rp_security_test( 'per-user grants do not broaden stock role', ! current_user_can( 'manage_options' ) );
wp_get_current_user()->remove_cap( 'manage_options' );
wp_get_current_user()->add_role( 'editor' );
rp_security_test( 'additional editor role does not broaden stock role', ! current_user_can( 'edit_posts' ) && ! current_user_can( 'edit_pages' ) );
wp_get_current_user()->remove_role( 'editor' );
$response = rp_security_request( 'POST', '/wp/v2/vehiculo', array( 'title' => 'MANAGER FIXTURE', 'status' => 'publish' ) );
rp_security_test( 'manager REST creates and publishes vehicle', 201 === $response->get_status() );
$created = $response->get_data()['id'];
$response = rp_security_request( 'POST', '/wp/v2/vehiculo/' . $created, array( 'title' => 'UPDATED FIXTURE' ) );
rp_security_test( 'manager REST edits vehicle', 200 === $response->get_status() );
rp_security_test( 'manager REST cannot create posts', rp_security_request( 'POST', '/wp/v2/posts', array( 'title' => 'DENIED' ) )->get_status() >= 400 );
rp_security_test( 'manager REST cannot create pages', rp_security_request( 'POST', '/wp/v2/pages', array( 'title' => 'DENIED' ) )->get_status() >= 400 );
rp_security_test( 'manager REST cannot create users', rp_security_request( 'POST', '/wp/v2/users', array( 'username' => 'DENIED' ) )->get_status() >= 400 );
rp_security_test( 'manager REST cannot edit settings', rp_security_request( 'POST', '/wp/v2/settings', array( 'title' => 'DENIED' ) )->get_status() >= 400 );

rp_security_save( $vehicle, array( 'rp_precio_monto' => '54321.00', 'rp_estado_stock' => 'reservado', 'rp_anio' => '2021', 'rp_kilometraje' => '48000' ) );
rp_security_test( 'manager saves valid price/year/km/state', '54321.00' === get_post_meta( $vehicle, 'rp_precio_monto', true ) && 'reservado' === get_post_meta( $vehicle, 'rp_estado_stock', true ) );
foreach ( array( array( 'rp_precio_monto' => array( '999' ) ), array( 'rp_anio' => array( '2020' ) ), array( 'rp_precio_monto' => '-1' ), array( 'rp_precio_monto' => null ) ) as $bad ) {
	rp_security_save( $vehicle, $bad );
	rp_security_test( 'malformed metabox preserves price/year ' . count( $checks ), '54321.00' === get_post_meta( $vehicle, 'rp_precio_monto', true ) && '2021' === get_post_meta( $vehicle, 'rp_anio', true ) );
}
rp_security_save( $vehicle, array( 'rp_precio_monto' => '9' ), false );
rp_security_test( 'invalid nonce preserves price', '54321.00' === get_post_meta( $vehicle, 'rp_precio_monto', true ) );
rp_security_test( 'direct malformed metadata rejected', false === update_post_meta( $vehicle, 'rp_precio_monto', array( 'bad' ) ) && '54321.00' === get_post_meta( $vehicle, 'rp_precio_monto', true ) );
rp_security_save( $vehicle, array( 'rp_version' => 'test' ) );
rp_security_save( $vehicle, array( 'rp_version' => '' ) );
rp_security_test( 'intentional empty scalar clears', ! metadata_exists( 'post', $vehicle, 'rp_version' ) );
$_REQUEST = array( '_wpnonce' => 'invalid' ); $GLOBALS['wp_rest_auth_cookie'] = true;
$csrf = rest_cookie_check_errors( null );
rp_security_test( 'native REST cookie CSRF rejects invalid nonce', is_wp_error( $csrf ) && 'rest_cookie_invalid_nonce' === $csrf->get_error_code() );
$_REQUEST = array();
$_REQUEST['_wpnonce'] = wp_create_nonce( 'wp_rest' );
rp_security_test( 'native REST cookie accepts valid nonce', true === rest_cookie_check_errors( null ) );
$_REQUEST = array();
rest_cookie_check_errors( null );
rp_security_test( 'missing REST cookie nonce becomes anonymous', 0 === get_current_user_id() );
rp_security_actor( $manager );

rp_security_test( 'manager can use legacy image in same vehicle', rp_usados_security_can_use_attachment( $manager, $legacy, $vehicle ) );
rp_security_test( 'manager cannot use foreign unbound image', ! rp_usados_security_can_use_attachment( $manager, $foreign, $vehicle ) );
rp_security_test( 'manager cannot use unrelated page image', ! rp_usados_security_can_use_attachment( $manager, $outside, $vehicle ) );
rp_security_test( 'manager cannot use normal post as image', ! rp_usados_security_can_use_attachment( $manager, $normal_post, $vehicle ) );
rp_security_test( 'manager can edit own stock image without edit_posts', current_user_can( 'edit_post', $own ) );
rp_security_test( 'manager cannot edit foreign image', ! current_user_can( 'edit_post', $foreign ) );
rp_security_test( 'manager cannot delete admin legacy image', ! current_user_can( 'delete_post', $legacy ) );
rp_security_test( 'native AJAX media preparation denies foreign IDs', null === wp_prepare_attachment_for_js( $foreign ) );
rp_security_test( 'native AJAX media preparation retains legacy cover', is_array( wp_prepare_attachment_for_js( $legacy ) ) );
rp_security_test( 'REST foreign media ID read denied', 403 === rp_security_request( 'GET', '/wp/v2/media/' . $foreign )->get_status() );
rp_security_test( 'REST foreign media ID deletion denied', rp_security_request( 'DELETE', '/wp/v2/media/' . $foreign )->get_status() >= 400 );
$library = rp_security_request( 'GET', '/wp/v2/media' )->get_data();
rp_security_test( 'REST library excludes foreign images', ! in_array( $foreign, wp_list_pluck( $library, 'id' ), true ) );
$ajax_args = apply_filters( 'ajax_query_attachments_args', array( 'author' => $other_manager, 'post_mime_type' => 'application/pdf' ) );
rp_security_test( 'forged AJAX library query cannot escape uploader', $manager === $ajax_args['author'] && array_values( rp_usados_security_image_mimes() ) === $ajax_args['post_mime_type'] );
rp_security_test( 'library excludes unrelated parent content', ! in_array( $page, $ajax_args['post_parent__in'], true ) && in_array( $vehicle, $ajax_args['post_parent__in'], true ) );
$GLOBALS['current_screen'] = WP_Screen::get( 'upload' );
$list_query = new WP_Query(); $list_query->set( 'post_type', 'attachment' );
$original_main = $GLOBALS['wp_the_query']; $GLOBALS['wp_the_query'] = $list_query;
do_action_ref_array( 'pre_get_posts', array( &$list_query ) );
rp_security_test( 'native Media Library list mode is scoped too', $manager === $list_query->get( 'author' ) );
$GLOBALS['wp_the_query'] = $original_main;
unset( $GLOBALS['current_screen'] );
rp_security_test( 'forged cover rejected', false === set_post_thumbnail( $vehicle, $foreign ) && $legacy === (int) get_post_thumbnail_id( $vehicle ) );
rp_security_test( 'allowed cover accepted', (bool) set_post_thumbnail( $vehicle, $own ) );
rp_security_test( 'first association binds image', $vehicle === (int) get_post_field( 'post_parent', $own ) );
$failed_binding = rp_security_image( $manager );
$prevent_binding = static function ( $data, $postarr ) use ( $failed_binding ) {
	if ( (int) ( $postarr['ID'] ?? 0 ) === $failed_binding ) { $data['post_parent'] = 0; }
	return $data;
};
add_filter( 'wp_insert_attachment_data', $prevent_binding, 30, 2 );
rp_security_test( 'unsuccessful image binding cannot overwrite cover', false === set_post_thumbnail( $vehicle, $failed_binding ) && $own === (int) get_post_thumbnail_id( $vehicle ) );
remove_filter( 'wp_insert_attachment_data', $prevent_binding, 30 );
rp_security_test( 'bound image cannot be reused in different vehicle', ! rp_usados_security_can_use_attachment( $manager, $own, $other_vehicle ) );
$_POST['_thumbnail_id'] = array( $legacy );
rp_security_test( 'malformed original thumbnail payload cannot overwrite cover', false === set_post_thumbnail( $vehicle, $legacy ) && $own === (int) get_post_thumbnail_id( $vehicle ) );
$_POST = array( 'thumbnail_id' => $normal_post );
rp_security_test( 'non-image thumbnail payload cannot clear cover', false === set_post_thumbnail( $vehicle, $normal_post ) && $own === (int) get_post_thumbnail_id( $vehicle ) );
$_POST = array();
rp_security_save( $vehicle, array( 'rp_galeria_ids' => array( $own, $legacy ) ) );
rp_security_test( 'valid gallery saves', array( $own, $legacy ) === get_post_meta( $vehicle, 'rp_galeria_ids', true ) );
foreach ( array( array( array( $own ) ), array( 'key' => $own ), array( $own, $foreign ), array( $normal_post ), array_fill( 0, 21, $own ), array( $own, 'invalid' ) ) as $bad ) {
	rp_security_save( $vehicle, array( 'rp_galeria_ids' => $bad ) );
	rp_security_test( 'invalid gallery preserved ' . count( $checks ), array( $own, $legacy ) === get_post_meta( $vehicle, 'rp_galeria_ids', true ) );
}
rp_security_test( 'direct nested gallery cannot erase metadata', false === update_post_meta( $vehicle, 'rp_galeria_ids', array( array( $own ) ) ) && array( $own, $legacy ) === get_post_meta( $vehicle, 'rp_galeria_ids', true ) );
rp_security_save( $vehicle, array( 'rp_galeria_ids' => '' ) );
rp_security_test( 'intentional empty gallery clears', ! metadata_exists( 'post', $vehicle, 'rp_galeria_ids' ) );
rp_security_save( $vehicle, array( 'rp_galeria_ids' => array( $own, $legacy ) ) );
$response = rp_security_request( 'POST', '/wp/v2/vehiculo/' . $vehicle, array( 'featured_media' => $foreign ) );
rp_security_test( 'REST forged cover denied', 403 === $response->get_status() && $own === (int) get_post_thumbnail_id( $vehicle ) );
$response = rp_security_request( 'POST', '/wp/v2/media/' . $own, array( 'post' => $other_vehicle ) );
rp_security_test( 'REST reparent denied', 403 === $response->get_status() );
$response = rp_security_request( 'POST', '/wp/v2/media/' . $own, array( 'author' => $other_manager ) );
rp_security_test( 'REST owner change denied', 403 === $response->get_status() );
$response = rp_security_request( 'POST', '/wp/v2/media', array( 'post' => $page ) );
rp_security_test( 'REST upload to unrelated object denied', 403 === $response->get_status() );

rp_security_actor( $manager );
rp_security_test( 'manager upload MIME allowlist excludes SVG/PDF', array_values( rp_usados_security_image_mimes() ) === array_values( get_allowed_mime_types() ) );
$tmp = wp_tempnam( 'test.png' ); copy( '/security-fixtures/square.png', $tmp );
$valid_file = array( 'name' => 'test.png', 'tmp_name' => $tmp, 'type' => 'image/png', 'size' => filesize( $tmp ), 'error' => 0 );
rp_security_test( 'valid image passes upload prefilter', empty( apply_filters( 'wp_handle_upload_prefilter', $valid_file )['error'] ) );
rp_security_test( 'valid image passes sideload prefilter', empty( apply_filters( 'wp_handle_sideload_prefilter', $valid_file )['error'] ) );
foreach ( array( 'name', 'tmp_name', 'error' ) as $key ) {
	$malformed = $valid_file; $malformed[ $key ] = array( $valid_file[ $key ] );
	rp_security_test( 'nested file payload rejected for ' . $key, ! empty( apply_filters( 'wp_handle_upload_prefilter', $malformed )['error'] ) );
}
foreach ( array( 'image/jpeg' => 'jpg', 'image/webp' => 'webp' ) as $mime => $extension ) {
	$editor = wp_get_image_editor( $tmp );
	$converted = $editor->save( wp_tempnam( 'test.' . $extension ), $mime );
	rp_security_test( 'fixture encoder supports ' . $mime, ! is_wp_error( $converted ) );
	rp_security_test( 'valid ' . $mime . ' bytes accepted', true === rp_usados_security_validate_image_file( $converted['path'], 'test.' . $extension ) );
}
foreach ( array( 'test.svg', 'test.php', 'test.jpg', 'test.php.png' ) as $name ) {
	$file = $valid_file; $file['name'] = $name;
	rp_security_test( 'invalid extension or bytes rejected ' . $name, ! empty( apply_filters( 'wp_handle_upload_prefilter', $file )['error'] ) );
}
$bad_tmp = wp_tempnam( 'fake.png' ); file_put_contents( $bad_tmp, '<script>not an image</script>' );
$bad_file = $valid_file; $bad_file['tmp_name'] = $bad_tmp;
rp_security_test( 'forged MIME and non-image bytes rejected', ! empty( apply_filters( 'wp_handle_upload_prefilter', $bad_file )['error'] ) );
$big = wp_tempnam( 'large.png' ); $stream = fopen( $big, 'w' ); ftruncate( $stream, 12 * MB_IN_BYTES + 1 ); fclose( $stream );
$bad_file['tmp_name'] = $big;
rp_security_test( 'oversized bytes rejected', ! empty( apply_filters( 'wp_handle_upload_prefilter', $bad_file )['error'] ) );
$corrupt = wp_tempnam( 'corrupt.png' ); file_put_contents( $corrupt, substr( file_get_contents( $tmp ), 0, 33 ) );
rp_security_test( 'corrupt PNG with image header fails decoding', is_wp_error( rp_usados_security_validate_image_file( $corrupt, 'corrupt.png' ) ) );
// Change only the PNG dimensions in a temporary test file: rejected before decoding.
$huge = wp_tempnam( 'dimensions.png' );
$bytes = file_get_contents( $tmp );
file_put_contents( $huge, substr_replace( $bytes, pack( 'NN', 6001, 100 ), 16, 8 ) );
rp_security_test( 'maximum side length enforced', 'rp_image_dimensions' === rp_usados_security_validate_image_file( $huge, 'test.png' )->get_error_code() );
file_put_contents( $huge, substr_replace( $bytes, pack( 'NN', 5000, 5000 ), 16, 8 ) );
rp_security_test( 'maximum total pixels enforced', 'rp_image_dimensions' === rp_usados_security_validate_image_file( $huge, 'test.png' )->get_error_code() );
$_REQUEST['post_id'] = $page;
rp_security_test( 'native upload invalid target rejected', ! empty( apply_filters( 'wp_handle_upload_prefilter', $valid_file )['error'] ) );
$_REQUEST = array();
// Real core sideload moves the temporary file and creates attachment metadata.
$upload = media_handle_sideload( $valid_file, $vehicle );
rp_security_test( 'real WordPress raster upload succeeds', is_int( $upload ) && $upload > 0 );
rp_security_test( 'real uploaded image is manager owned', $manager === (int) get_post_field( 'post_author', $upload ) );
rp_security_test( 'real uploaded image is vehicle scoped', $vehicle === (int) get_post_field( 'post_parent', $upload ) );
$bad_file['tmp_name'] = $bad_tmp;
rp_security_test( 'real WordPress non-image upload denied', is_wp_error( media_handle_sideload( $bad_file, $vehicle ) ) );
$full = wp_insert_post( array( 'post_type' => 'vehiculo', 'post_status' => 'draft', 'post_title' => 'UPLOAD LIMIT FIXTURE' ) );
$twenty = array();
for ( $i = 0; $i < 20; $i++ ) { $twenty[] = rp_security_image( $manager, $full, 'limit.png' ); }
$_REQUEST['post_id'] = $full;
$limit_file = $valid_file; $limit_file['tmp_name'] = get_attached_file( $upload );
rp_security_test( 'native upload per-vehicle count limit enforced', ! empty( apply_filters( 'wp_handle_upload_prefilter', $limit_file )['error'] ) );
$_REQUEST = array();
rp_security_test( 'twenty-image gallery accepted', (bool) update_post_meta( $full, 'rp_galeria_ids', $twenty ) );
$extra = rp_security_image( $manager );
rp_security_test( 'cover plus gallery unique count cannot exceed twenty', false === set_post_thumbnail( $full, $extra ) && ! get_post_thumbnail_id( $full ) );
rp_security_test( 'manager REST deletes own draft vehicle', rp_security_request( 'DELETE', '/wp/v2/vehiculo/' . $created )->get_status() === 200 );

rp_security_actor( $admin );
foreach ( array_merge( rp_usados_security_vehicle_caps(), array( 'edit_posts', 'edit_pages', 'manage_options', 'activate_plugins', 'create_users' ) ) as $cap ) { rp_security_test( "administrator retains $cap", current_user_can( $cap ) ); }
rp_security_test( 'administrator can use any existing image', rp_usados_security_can_use_attachment( $admin, $foreign, $vehicle ) );
rp_security_test( 'administrator cover update retained', (bool) set_post_thumbnail( $vehicle, $foreign ) );
rp_security_test( 'administrator invalid REST image ID preserves cover', 403 === rp_security_request( 'POST', '/wp/v2/vehiculo/' . $vehicle, array( 'featured_media' => $normal_post ) )->get_status() && $foreign === (int) get_post_thumbnail_id( $vehicle ) );
rp_security_test( 'administrator upload policy unchanged', isset( get_allowed_mime_types()['pdf'] ) );
rp_security_test( 'administrator Media Library access unchanged', is_array( wp_prepare_attachment_for_js( $foreign ) ) );
rp_security_test( 'administrator retains gallery count override', (bool) update_post_meta( $full, 'rp_galeria_ids', array_merge( $twenty, array( $extra ) ) ) );
$sold = wp_insert_post( array( 'post_type' => 'vehiculo', 'post_status' => 'publish', 'post_title' => 'SOLD SECURITY FIXTURE' ) );
update_post_meta( $sold, 'rp_estado_stock', 'vendido' );
$ids = wp_list_pluck( rp_usados_stock_query()->posts, 'ID' );
rp_security_test( 'catalog includes available/reserved and excludes sold', in_array( $vehicle, $ids, true ) && in_array( $other_vehicle, $ids, true ) && ! in_array( $sold, $ids, true ) );
rp_security_actor( 0 );
$rest = rp_security_request( 'GET', '/wp/v2/vehiculo' );
$data = $rest->get_data();
rp_security_test( 'public REST does not expose price metadata or content', ! isset( $data[0]['meta'] ) && ! isset( $data[0]['content'] ) );
rp_security_test( 'price unavailable outside single', '' === rp_usados_vehicle_price( $vehicle ) );

rp_security_actor( $admin );
rp_usados_security_deactivate();
rp_security_test( 'deactivation keeps manager user and read', get_userdata( $manager ) && user_can( $manager, 'read' ) );
rp_security_test( 'deactivation revokes manager writes/uploads', ! user_can( $manager, 'edit_post', $vehicle ) && ! user_can( $manager, 'upload_files' ) );
rp_security_test( 'deactivation retains administrator vehicle access', current_user_can( 'edit_post', $vehicle ) );
rp_usados_security_install_roles(); rp_usados_security_install_roles();
rp_security_test( 'reactivation/idempotent migration restores manager', user_can( $manager, 'edit_post', $vehicle ) && user_can( $manager, 'upload_files' ) );
rp_security_test( 'data survive plugin lifecycle', '54321.00' === get_post_meta( $vehicle, 'rp_precio_monto', true ) );
$report = array( 'passed' => count( $checks ), 'checks' => $checks, 'wp' => get_bloginfo( 'version' ), 'php' => PHP_VERSION );
file_put_contents( '/security-output/report.json', wp_json_encode( $report ) );
echo 'RP_SECURITY_RESULTS=' . wp_json_encode( $report ) . "\n";
