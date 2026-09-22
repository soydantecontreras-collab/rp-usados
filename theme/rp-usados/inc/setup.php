<?php
/**
 * Theme setup.
 *
 * @package RP_Usados
 */

defined( 'ABSPATH' ) || exit;

/**
 * Registers theme supports and navigation locations.
 */
function rp_usados_setup(): void {
	load_theme_textdomain( 'rp-usados', RP_USADOS_PATH . '/languages' );

	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'responsive-embeds' );
	add_theme_support( 'custom-logo' );
	add_theme_support(
		'html5',
		array(
			'comment-list',
			'comment-form',
			'search-form',
			'gallery',
			'caption',
			'script',
			'style',
		)
	);

	register_nav_menus(
		array(
			'primary' => esc_html__( 'Navegación principal', 'rp-usados' ),
		)
	);

	add_image_size( 'rp-vehicle-card', 960, 640, true );
	add_image_size( 'rp-vehicle-gallery', 1600, 1067, false );
}
add_action( 'after_setup_theme', 'rp_usados_setup' );

/**
 * Sets a readable default content width for embeds and media.
 */
function rp_usados_content_width(): void {
	$GLOBALS['content_width'] = apply_filters( 'rp_usados_content_width', 1200 );
}
add_action( 'after_setup_theme', 'rp_usados_content_width', 0 );

