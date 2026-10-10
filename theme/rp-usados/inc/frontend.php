<?php
/** Presentation adapters; data/admin contracts stay unchanged. */
defined( 'ABSPATH' ) || exit;

function rp_usados_stock_query(): WP_Query {
    return new WP_Query( array( 'post_type' => 'vehiculo', 'post_status' => 'publish', 'posts_per_page' => -1, 'no_found_rows' => true, 'ignore_sticky_posts' => true, 'meta_query' => array( rp_usados_stock_clause() ) ) );
}
add_action( 'pre_get_posts', static function ( WP_Query $query ) {
    if ( ! is_admin() && $query->is_main_query() && $query->is_post_type_archive( 'vehiculo' ) ) { $query->set( 'posts_per_page', -1 ); }
}, 20 );

function rp_usados_contact_url(): string {
    $number = rp_usados_sanitize_vehicle_value( get_theme_mod( 'rp_whatsapp_numero', '' ), 'rp_whatsapp_numero' );
    return $number ? 'https://wa.me/' . $number . '?text=' . rawurlencode( __( 'Hola, quiero consultar con RP Usados.', 'rp-usados' ) ) : '';
}
function rp_usados_contact_action( string $label = 'Consultar por WhatsApp', string $classes = '', int $id = 0 ): void {
    $url = $id ? rp_usados_vehicle_whatsapp_url( $id ) : rp_usados_contact_url();
    $aria = $id ? sprintf( __( 'Consultar por WhatsApp: %s', 'rp-usados' ), get_the_title( $id ) ) : $label;
    printf( '<a class="action action-whatsapp %s" href="%s" aria-label="%s"%s><img class="wa-icon" src="%s" alt="" width="22" height="22"><span>%s</span></a>', esc_attr( $classes ), esc_url( $url ?: '#contacto-pendiente' ), esc_attr( $aria ), $url ? '' : ' data-contact-pending', esc_url( RP_USADOS_URL . '/assets/brand/whatsapp.svg' ), esc_html( $label ) );
}
add_filter( 'body_class', static function ( array $classes ): array {
    $classes[] = 'transition';
    if ( is_front_page() ) { $classes[] = 'v2'; }
    if ( is_singular( 'vehiculo' ) ) { $classes[] = 'vehicle-page'; }
    return $classes;
} );
add_action( 'wp_head', static function () {
    if ( ! is_front_page() ) { return; }
    $root = RP_USADOS_URL . '/assets/hero/v2/';
    printf( '<link rel="preload" as="image" fetchpriority="high" href="%s" media="(min-width: 900px) and (hover: hover), (min-width: 900px) and (pointer: fine)">', esc_url( $root . 'hero-desktop-1080-crf18-poster.png' ) );
    printf( '<link rel="preload" as="image" fetchpriority="high" href="%s" media="(max-width: 899px), (hover: none) and (pointer: coarse)">', esc_url( $root . 'hero-mobile-v4-1080-crf18-poster.png' ) );
}, 2 );
