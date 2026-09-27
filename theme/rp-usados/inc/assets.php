<?php
/**
 * Vite development and production asset loading.
 *
 * @package RP_Usados
 */

defined( 'ABSPATH' ) || exit;

/**
 * Returns a configured Vite development server URL, when available.
 */
function rp_usados_vite_dev_server(): string {
	if ( ! defined( 'RP_USADOS_VITE_DEV_SERVER' ) ) {
		return '';
	}

	return untrailingslashit( esc_url_raw( (string) RP_USADOS_VITE_DEV_SERVER ) );
}

/**
 * Finds and decodes Vite's production manifest.
 *
 * @return array<string, mixed>
 */
function rp_usados_vite_manifest(): array {
	$paths = array(
		RP_USADOS_PATH . '/assets/dist/.vite/manifest.json',
		RP_USADOS_PATH . '/assets/dist/manifest.json',
	);

	foreach ( $paths as $path ) {
		if ( ! is_readable( $path ) ) {
			continue;
		}

		$manifest = json_decode( (string) file_get_contents( $path ), true );

		if ( is_array( $manifest ) ) {
			return $manifest;
		}
	}

	return array();
}

/**
 * Enqueues the base stylesheet and either Vite development or production assets.
 */
function rp_usados_enqueue_assets(): void {
	wp_enqueue_style(
		'rp-usados-base',
		get_stylesheet_uri(),
		array(),
		RP_USADOS_VERSION
	);

	$dev_server = rp_usados_vite_dev_server();

	if ( '' !== $dev_server ) {
		wp_enqueue_script( 'rp-usados-vite-client', $dev_server . '/@vite/client', array(), null, false );
		wp_enqueue_script( 'rp-usados-app', $dev_server . '/src/scripts/main.js', array(), null, true );
		return;
	}

	$manifest = rp_usados_vite_manifest();
	$entry    = $manifest['src/scripts/main.js'] ?? null;

	if ( ! is_array( $entry ) || empty( $entry['file'] ) ) {
		return;
	}

	foreach ( (array) ( $entry['css'] ?? array() ) as $index => $css_file ) {
		wp_enqueue_style(
			'rp-usados-app-' . (int) $index,
			RP_USADOS_URL . '/assets/dist/' . ltrim( (string) $css_file, '/' ),
			array( 'rp-usados-base' ),
			RP_USADOS_VERSION
		);
	}

	wp_enqueue_script(
		'rp-usados-app',
		RP_USADOS_URL . '/assets/dist/' . ltrim( (string) $entry['file'], '/' ),
		array(),
		// Vite filenames already contain a content hash. A ?ver= query makes
		// imports back into this entry a second ES module with duplicate side effects.
		null,
		true
	);
}
add_action( 'wp_enqueue_scripts', 'rp_usados_enqueue_assets' );

/**
 * Marks Vite entry points as JavaScript modules.
 */
function rp_usados_module_script_tag( string $tag, string $handle, string $src ): string {
	$module_handles = array( 'rp-usados-vite-client', 'rp-usados-app' );

	if ( ! in_array( $handle, $module_handles, true ) ) {
		return $tag;
	}

	return sprintf(
		'<script type="module" src="%s"></script>' . "\n",
		esc_url( $src )
	);
}
add_filter( 'script_loader_tag', 'rp_usados_module_script_tag', 10, 3 );
