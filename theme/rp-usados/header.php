<?php
defined( 'ABSPATH' ) || exit;
$catalog = is_front_page() ? '#catalogo' : home_url( '/#catalogo' );
?>
<!doctype html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo( 'charset' ); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#080809">
    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?> data-curve="subtle">
<?php wp_body_open(); ?>
<a class="skip" href="<?php echo esc_url( is_front_page() ? '#catalogo' : '#main-content' ); ?>"><?php esc_html_e( 'Saltar al contenido', 'rp-usados' ); ?></a>
<header class="site-header v2-header">
    <div class="brand-signature">
        <?php if ( has_custom_logo() ) : the_custom_logo(); else : ?>
            <a class="brand-name" href="<?php echo esc_url( home_url( '/' ) ); ?>" aria-label="RP Usados — Inicio">RP <span>Usados</span></a>
        <?php endif; ?>
        <img class="brand-contour" src="<?php echo esc_url( RP_USADOS_URL . '/assets/brand/silhouette.svg' ); ?>" width="126" height="30" alt="" aria-hidden="true">
    </div>
    <nav aria-label="<?php esc_attr_e( 'Navegación principal', 'rp-usados' ); ?>"><a href="<?php echo esc_url( $catalog ); ?>"><?php esc_html_e( 'Ver vehículos', 'rp-usados' ); ?></a></nav>
    <?php rp_usados_contact_action( 'WhatsApp', 'action-small' ); ?>
</header>
