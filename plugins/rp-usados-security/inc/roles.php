<?php
defined( 'ABSPATH' ) || exit;

function rp_usados_security_vehicle_caps(): array {
	return array( 'create_vehiculos', 'edit_vehiculos', 'edit_others_vehiculos', 'edit_private_vehiculos', 'edit_published_vehiculos', 'publish_vehiculos', 'read_private_vehiculos', 'delete_vehiculos', 'delete_others_vehiculos', 'delete_private_vehiculos', 'delete_published_vehiculos' );
}

function rp_usados_security_manager_caps(): array {
	return array_fill_keys( array_merge( array( 'read', 'upload_files', 'rp_manage_vehicle_media' ), rp_usados_security_vehicle_caps() ), true );
}

function rp_usados_security_is_administrator( int $user_id ): bool {
	$user = get_userdata( $user_id );
	return $user && ( in_array( 'administrator', $user->roles, true ) || ( is_multisite() && is_super_admin( $user_id ) ) );
}

function rp_usados_security_is_manager( int $user_id = 0 ): bool {
	$user_id = $user_id ?: get_current_user_id();
	$user = get_userdata( $user_id );
	return $user && in_array( 'rp_stock_manager', $user->roles, true ) && ! rp_usados_security_is_administrator( $user_id );
}

function rp_usados_security_install_roles(): void {
	$allowed = rp_usados_security_manager_caps();
	add_role( 'rp_stock_manager', 'RP Usados - Gestor de stock', $allowed );
	$role = get_role( 'rp_stock_manager' );
	foreach ( array_keys( $role->capabilities ) as $cap ) {
		if ( ! isset( $allowed[ $cap ] ) ) { $role->remove_cap( $cap ); }
	}
	foreach ( $allowed as $cap => $grant ) { $role->add_cap( $cap, $grant ); }
	$admin = get_role( 'administrator' );
	if ( $admin ) {
		foreach ( array_keys( $allowed ) as $cap ) { $admin->add_cap( $cap ); }
	}
	update_option( 'rp_usados_security_version', RP_USADOS_SECURITY_VERSION, false );
}

function rp_usados_security_deactivate(): void {
	$role = get_role( 'rp_stock_manager' );
	if ( $role ) {
		foreach ( array_keys( $role->capabilities ) as $cap ) {
			if ( 'read' !== $cap ) { $role->remove_cap( $cap ); }
		}
	}
}

// Additional roles or per-user grants must not silently broaden a stock account.
add_filter( 'user_has_cap', static function ( array $allcaps, array $caps, array $args, WP_User $user ): array {
	if ( rp_usados_security_is_manager( $user->ID ) ) {
		return array_intersect_key( $allcaps, rp_usados_security_manager_caps() );
	}
	return $allcaps;
}, 20, 4 );
