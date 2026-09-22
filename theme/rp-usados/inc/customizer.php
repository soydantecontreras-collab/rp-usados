<?php
/** Optional confirmed contact and real hero media. @package RP_Usados */
defined( 'ABSPATH' ) || exit;

function rp_usados_validate_whatsapp( $validity, $value ) {
	if ( '' !== trim( (string) $value ) && '' === rp_usados_sanitize_vehicle_value( $value, 'rp_whatsapp_numero' ) ) {
		$validity->add( 'phone', __( 'Ingresá el número confirmado en formato internacional, con 8 a 15 dígitos.', 'rp-usados' ) );
	}
	return $validity;
}

add_action( 'customize_register', static function ( WP_Customize_Manager $customizer ) {
	$customizer->add_section( 'rp_usados', array( 'title' => __( 'RP Usados', 'rp-usados' ), 'priority' => 30 ) );
	$customizer->add_setting( 'rp_whatsapp_numero', array(
		'default' => '', 'validate_callback' => 'rp_usados_validate_whatsapp',
		'sanitize_callback' => static function ( $value ) { return rp_usados_sanitize_vehicle_value( $value, 'rp_whatsapp_numero' ); },
	) );
	$customizer->add_control( 'rp_whatsapp_numero', array( 'section' => 'rp_usados', 'label' => __( 'WhatsApp confirmado', 'rp-usados' ), 'description' => __( 'Dejar vacío hasta confirmar con el cliente. Incluí el código de país. Nunca usar un número de prueba.', 'rp-usados' ), 'type' => 'text' ) );
	$customizer->add_setting( 'rp_hero_image', array( 'default' => 0, 'sanitize_callback' => static function ( $id ) { return wp_attachment_is_image( absint( $id ) ) ? absint( $id ) : 0; } ) );
	$customizer->add_control( new WP_Customize_Media_Control( $customizer, 'rp_hero_image', array( 'section' => 'rp_usados', 'label' => __( 'Imagen real o render aprobado para el hero', 'rp-usados' ), 'mime_type' => 'image', 'description' => __( 'Mientras esté vacío se muestra la composición tipográfica. No usar fotografías que se confundan con stock real.', 'rp-usados' ) ) ) );
	$customizer->add_setting( 'rp_hero_video', array( 'default' => 0, 'sanitize_callback' => static function ( $id ) { return 'video/webm' === get_post_mime_type( absint( $id ) ) ? absint( $id ) : 0; } ) );
	$customizer->add_control( new WP_Customize_Media_Control( $customizer, 'rp_hero_video', array( 'section' => 'rp_usados', 'label' => __( 'Video WebM aprobado (opcional)', 'rp-usados' ), 'mime_type' => 'video', 'description' => __( 'Sólo WebM. Requiere una imagen de portada. Se reproduce únicamente por acción del usuario, sin autoplay.', 'rp-usados' ) ) ) );
} );
