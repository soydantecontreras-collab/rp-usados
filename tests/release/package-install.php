<?php
/** Validate installed ZIPs, not mounted source folders. */
defined( 'ABSPATH' ) || exit;
require_once ABSPATH . 'wp-admin/includes/plugin.php';
$checks = array();
$check = static function ( string $name, bool $passed ) use ( &$checks ) {
	if ( ! $passed ) { throw new RuntimeException( $name ); }
	$checks[] = $name;
};
$check( 'installed theme active', 'rp-usados' === get_stylesheet() );
$check( 'installed plugin active', is_plugin_active( 'rp-usados-security/rp-usados-security.php' ) );
$check( 'vehicle CPT registered', post_type_exists( 'vehiculo' ) );
$check( 'stock role installed', null !== get_role( 'rp_stock_manager' ) );
$check( 'private router available', function_exists( 'rp_usados_gestion_post_form' ) );
$check( 'cache module packaged', function_exists( 'rp_usados_stock_cache_dispatch' ) );
$check( 'clean installation contains no vehicle fixtures', 0 === (int) wp_count_posts( 'vehiculo' )->publish && 0 === (int) wp_count_posts( 'vehiculo' )->draft );
$check( 'no demo stock account installed', false === get_user_by( 'login', 'rp-stock-local' ) );
foreach ( array( get_template_directory() . '/assets/dist/.vite/manifest.json', WP_PLUGIN_DIR . '/rp-usados-security/assets/dist/.vite/manifest.json' ) as $path ) {
	$manifest = json_decode( file_get_contents( $path ), true );
	$check( 'installed manifest readable: ' . basename( dirname( dirname( $path ) ) ), is_array( $manifest ) && count( $manifest ) > 0 );
	$base = dirname( dirname( $path ) );
	foreach ( $manifest as $entry ) {
		foreach ( array_merge( array( $entry['file'] ), $entry['css'] ?? array(), $entry['assets'] ?? array() ) as $file ) {
			$check( 'installed asset exists: ' . $file, is_file( $base . '/' . $file ) );
		}
	}
}
foreach ( array( 'hero-desktop-1080-crf18.mp4', 'hero-mobile-v4-1080-crf18.mp4' ) as $name ) {
	$check( 'approved video installed: ' . $name, is_file( get_template_directory() . '/assets/hero/v2/' . $name ) );
}
wp();
ob_start();
include get_template_directory() . '/front-page.php';
$html = ob_get_clean();
$check( 'installed Home renders', str_contains( $html, 'id="catalogo"' ) && str_contains( $html, 'id="nosotros"' ) );
$check( 'empty-stock Home has no demo vehicles', ! str_contains( $html, 'DEMO' ) && ! str_contains( $html, 'TST' ) );
$text = preg_replace( '/\s+/', ' ', wp_strip_all_tags( preg_replace( '/<br\s*\/?>/i', ' ', $html ) ) );
$check( 'installed Home contains approved services', str_contains( $text, 'Consignaciones' ) && str_contains( $text, 'Busquemos la forma de avanzar.' ) );
$check( 'source tools not shipped with theme', ! is_dir( get_template_directory() . '/src' ) && ! is_dir( get_template_directory() . '/node_modules' ) );
$check( 'source tools not shipped with plugin', ! is_dir( WP_PLUGIN_DIR . '/rp-usados-security/src' ) && ! is_dir( WP_PLUGIN_DIR . '/rp-usados-security/tests' ) );
file_put_contents( '/release-output/install-report.json', wp_json_encode( array( 'passed' => count( $checks ), 'checks' => $checks, 'wp' => get_bloginfo( 'version' ), 'php' => PHP_VERSION ) ) );
