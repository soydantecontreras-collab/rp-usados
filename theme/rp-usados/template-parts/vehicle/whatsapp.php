<?php
defined( 'ABSPATH' ) || exit;
$id = isset( $args['id'] ) ? absint( $args['id'] ) : get_the_ID();
rp_usados_contact_action( 'Consultar por WhatsApp', $args['classes'] ?? '', $id );
