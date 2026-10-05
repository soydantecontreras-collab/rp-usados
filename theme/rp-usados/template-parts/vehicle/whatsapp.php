<?php
defined( 'ABSPATH' ) || exit;
$id = isset( $args['id'] ) ? absint( $args['id'] ) : get_the_ID();
$model = trim( (string) get_post_meta( $id, 'rp_modelo', true ) );
$label = $model ? sprintf( __( 'Consultar por este %s', 'rp-usados' ), $model ) : __( 'Consultar por este vehículo', 'rp-usados' );
rp_usados_contact_action( $label, trim( 'action-whatsapp ' . ( $args['classes'] ?? '' ) ), $id );
