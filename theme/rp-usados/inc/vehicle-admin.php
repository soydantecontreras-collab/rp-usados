<?php
/** Native vehicle editor, without builders. @package RP_Usados */
defined( 'ABSPATH' ) || exit;

// Use the native classic editor for the vehicle form and its metaboxes.
add_filter( 'use_block_editor_for_post_type', static function ( $use, $type ) { return 'vehiculo' === $type ? false : $use; }, 10, 2 );

add_action( 'add_meta_boxes_vehiculo', static function () {
	add_meta_box( 'rp-vehicle-data', __( 'Datos de la unidad', 'rp-usados' ), 'rp_usados_vehicle_metabox', 'vehiculo', 'normal', 'high' );
} );

function rp_usados_vehicle_metabox( WP_Post $post ): void {
	wp_nonce_field( 'rp_vehicle_save', 'rp_vehicle_nonce' );
	$invalid = get_transient( 'rp_vehicle_errors_' . get_current_user_id() . '_' . $post->ID );
	if ( $invalid ) {
		echo '<div class="notice notice-error inline"><p>' . esc_html( __( 'Revisá estos campos. Se conservó su valor anterior:', 'rp-usados' ) . ' ' . implode( ', ', $invalid ) ) . '</p></div>';
		delete_transient( 'rp_vehicle_errors_' . get_current_user_id() . '_' . $post->ID );
	}
	echo '<p>' . esc_html__( 'Cargá únicamente datos confirmados. Precio y moneda sólo se muestran en la ficha. El título debe identificar la unidad, sin precio. Un vehículo sin estado confirmado no aparece en el catálogo.', 'rp-usados' ) . '</p>';
	echo '<table class="form-table"><tbody>';
	foreach ( rp_usados_vehicle_fields() as $key => $field ) {
		$value = get_post_meta( $post->ID, $key, true );
		echo '<tr><th scope="row"><label for="' . esc_attr( $key ) . '">' . esc_html( $field['label'] ) . '</label></th><td>';
		if ( 'status' === $field['kind'] ) {
			echo '<select id="' . esc_attr( $key ) . '" name="' . esc_attr( $key ) . '"><option value="">' . esc_html( rp_usados_pending() ) . '</option>';
			foreach ( rp_usados_stock_labels() as $state => $label ) {
				echo '<option value="' . esc_attr( $state ) . '" ' . selected( $value, $state, false ) . '>' . esc_html( $label ) . '</option>';
			}
			echo '</select><p class="description">' . esc_html__( 'Vendidos: se ocultan automáticamente del catálogo y de los destacados. La URL individual conserva su estado.', 'rp-usados' ) . '</p>';
		} elseif ( 'boolean' === $field['kind'] ) {
			echo '<input type="hidden" name="' . esc_attr( $key ) . '" value="0"><input id="' . esc_attr( $key ) . '" name="' . esc_attr( $key ) . '" type="checkbox" value="1" ' . checked( $value, '1', false ) . '>';
		} elseif ( 'gallery' === $field['kind'] ) {
			$ids = is_array( $value ) ? $value : array();
			echo '<input class="widefat" id="rp_galeria_ids" name="rp_galeria_ids" value="' . esc_attr( implode( ',', $ids ) ) . '" aria-describedby="rp-gallery-help">';
			echo '<p id="rp-gallery-help" class="description">' . esc_html__( 'IDs de imágenes separados por comas, en orden. Podés seleccionarlas desde la biblioteca o modificar los IDs manualmente.', 'rp-usados' ) . '</p>';
			echo '<button class="button" type="button" id="rp-select-gallery">' . esc_html__( 'Seleccionar imágenes', 'rp-usados' ) . '</button>';
			echo '<div id="rp-gallery-preview" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px">';
			foreach ( $ids as $image_id ) { echo wp_get_attachment_image( $image_id, array( 80, 80 ) ); }
			echo '</div>';
		} else {
			$numeric = in_array( $field['kind'], array( 'integer', 'year', 'price' ), true );
			echo '<input class="regular-text" id="' . esc_attr( $key ) . '" name="' . esc_attr( $key ) . '" type="text" ' . ( $numeric ? 'inputmode="decimal" ' : '' ) . 'value="' . esc_attr( $value ) . '">';
			if ( 'phone' === $field['kind'] ) {
				echo '<p class="description">' . esc_html__( 'Sólo ingresar un número confirmado, con código de país. Vacío: usa el número global de Apariencia > Personalizar > RP Usados. Si tampoco existe, no se crea un enlace.', 'rp-usados' ) . '</p>';
			}
			if ( 'rp_whatsapp_mensaje' === $key ) {
				echo '<p class="description">' . esc_html__( 'El nombre de la unidad y su URL se agregan siempre al mensaje.', 'rp-usados' ) . '</p>';
			}
		}
		echo '</td></tr>';
	}
	echo '</tbody></table>';
}

function rp_usados_save_vehicle( int $id ): void {
	if ( ! isset( $_POST['rp_vehicle_nonce'] ) || ! is_string( $_POST['rp_vehicle_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['rp_vehicle_nonce'] ) ), 'rp_vehicle_save' ) || ! current_user_can( 'edit_post', $id ) || wp_is_post_revision( $id ) || ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) ) { return; }
	$errors = array();
	foreach ( rp_usados_vehicle_fields() as $key => $field ) {
		if ( ! isset( $_POST[ $key ] ) ) { continue; }
		$raw = wp_unslash( $_POST[ $key ] );
		$value = rp_usados_validate_vehicle_input( $raw, $key, $id );
		if ( is_wp_error( $value ) ) {
			$errors[] = $field['label'];
			continue;
		}
		if ( '' === $value || array() === $value ) { delete_post_meta( $id, $key ); } else {
			$previous = get_post_meta( $id, $key, true );
			if ( false === update_post_meta( $id, $key, $value ) && $previous !== $value ) { $errors[] = $field['label']; }
		}
	}
	if ( $errors ) { set_transient( 'rp_vehicle_errors_' . get_current_user_id() . '_' . $id, $errors, 120 ); }
}
add_action( 'save_post_vehiculo', 'rp_usados_save_vehicle' );

add_action( 'admin_enqueue_scripts', static function () {
	$screen = get_current_screen();
	if ( ! $screen || 'vehiculo' !== $screen->post_type || 'post' !== $screen->base ) { return; }
	wp_enqueue_media();
	$manifest = rp_usados_vite_manifest();
	if ( ! empty( $manifest['src/scripts/admin.js']['file'] ) ) {
		wp_enqueue_script( 'rp-usados-admin', RP_USADOS_URL . '/assets/dist/' . $manifest['src/scripts/admin.js']['file'], array( 'media-views' ), RP_USADOS_VERSION, true );
	}
} );
