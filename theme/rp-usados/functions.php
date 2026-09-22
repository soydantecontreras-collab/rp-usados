<?php
/**
 * RP Usados theme bootstrap.
 *
 * @package RP_Usados
 */

defined( 'ABSPATH' ) || exit;

define( 'RP_USADOS_VERSION', wp_get_theme()->get( 'Version' ) );
define( 'RP_USADOS_PATH', get_template_directory() );
define( 'RP_USADOS_URL', get_template_directory_uri() );

require_once RP_USADOS_PATH . '/inc/setup.php';
require_once RP_USADOS_PATH . '/inc/assets.php';
require_once RP_USADOS_PATH . '/inc/post-types/vehiculo.php';
require_once RP_USADOS_PATH . '/inc/vehicle-data.php';
require_once RP_USADOS_PATH . '/inc/vehicle-admin.php';
require_once RP_USADOS_PATH . '/inc/customizer.php';
