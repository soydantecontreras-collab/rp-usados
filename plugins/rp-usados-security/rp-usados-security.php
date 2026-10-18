<?php
/**
 * Plugin Name: RP Usados — Seguridad de stock
 * Description: Panel privado de stock con permisos y política segura de imágenes.
 * Version: 1.1.0
 * Requires at least: 6.8
 * Requires PHP: 8.1
 * Text Domain: rp-usados
 */
defined( 'ABSPATH' ) || exit;

define( 'RP_USADOS_SECURITY_VERSION', '1.1.0' );
require_once __DIR__ . '/inc/roles.php';
require_once __DIR__ . '/inc/media.php';
require_once __DIR__ . '/inc/gestion-access.php';
require_once __DIR__ . '/inc/gestion-service.php';
require_once __DIR__ . '/inc/gestion-rest.php';
require_once __DIR__ . '/inc/gestion-routes.php';

register_activation_hook( __FILE__, 'rp_usados_security_install_roles' );
register_deactivation_hook( __FILE__, 'rp_usados_security_deactivate' );
add_action( 'init', static function () {
	if ( RP_USADOS_SECURITY_VERSION !== get_option( 'rp_usados_security_version' ) ) {
		rp_usados_security_install_roles();
	}
}, 1 );
