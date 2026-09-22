<?php
/**
 * Vehicle content type.
 *
 * @package RP_Usados
 */

defined( 'ABSPATH' ) || exit;

/**
 * Registers the dynamic vehicle inventory content type.
 */
function rp_usados_register_vehicle_post_type(): void {
	$labels = array(
		'name'                  => esc_html__( 'Vehículos', 'rp-usados' ),
		'singular_name'         => esc_html__( 'Vehículo', 'rp-usados' ),
		'menu_name'             => esc_html__( 'Vehículos', 'rp-usados' ),
		'name_admin_bar'        => esc_html__( 'Vehículo', 'rp-usados' ),
		'add_new'               => esc_html__( 'Añadir vehículo', 'rp-usados' ),
		'add_new_item'          => esc_html__( 'Añadir vehículo', 'rp-usados' ),
		'new_item'              => esc_html__( 'Nuevo vehículo', 'rp-usados' ),
		'edit_item'             => esc_html__( 'Editar vehículo', 'rp-usados' ),
		'view_item'             => esc_html__( 'Ver vehículo', 'rp-usados' ),
		'all_items'             => esc_html__( 'Todos los vehículos', 'rp-usados' ),
		'search_items'          => esc_html__( 'Buscar vehículos', 'rp-usados' ),
		'not_found'             => esc_html__( 'No se encontraron vehículos.', 'rp-usados' ),
		'not_found_in_trash'    => esc_html__( 'No hay vehículos en la papelera.', 'rp-usados' ),
		'featured_image'        => esc_html__( 'Imagen principal', 'rp-usados' ),
		'set_featured_image'    => esc_html__( 'Definir imagen principal', 'rp-usados' ),
		'remove_featured_image' => esc_html__( 'Quitar imagen principal', 'rp-usados' ),
		'use_featured_image'    => esc_html__( 'Usar como imagen principal', 'rp-usados' ),
		'archives'              => esc_html__( 'Catálogo de vehículos', 'rp-usados' ),
	);

	register_post_type(
		'vehiculo',
		array(
			'labels'             => $labels,
			'public'             => true,
			'show_in_rest'       => true,
			'has_archive'        => 'vehiculos',
			'rewrite'            => array(
				'slug'       => 'vehiculos',
				'with_front' => false,
			),
			'menu_icon'          => 'dashicons-car',
			'menu_position'      => 20,
			'supports'           => array( 'title', 'editor', 'excerpt', 'thumbnail', 'revisions' ),
			'publicly_queryable' => true,
			'show_ui'            => true,
			'show_in_menu'       => true,
			'query_var'          => true,
			'capability_type'    => 'post',
			'map_meta_cap'       => true,
		)
	);
}
add_action( 'init', 'rp_usados_register_vehicle_post_type' );

