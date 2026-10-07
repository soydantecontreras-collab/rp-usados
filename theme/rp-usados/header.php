<?php
defined( 'ABSPATH' ) || exit;
$header_links = array(
    'catalog-title' => __( 'Vehículos', 'rp-usados' ),
    'nosotros'      => __( 'Nosotros', 'rp-usados' ),
    'opciones'      => __( 'Financiación y permutas', 'rp-usados' ),
);
?>
<!doctype html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo( 'charset' ); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#080809">
    <?php if ( is_front_page() ) { get_template_part( 'template-parts/home/hero-layout' ); } ?>
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
    <nav class="header-navigation header-navigation-desktop" aria-label="<?php esc_attr_e( 'Navegación principal', 'rp-usados' ); ?>">
        <?php foreach ( $header_links as $anchor => $label ) : ?>
            <a href="<?php echo esc_url( is_front_page() ? '#' . $anchor : home_url( '/#' . $anchor ) ); ?>"><?php echo esc_html( $label ); ?></a>
        <?php endforeach; ?>
    </nav>
    <?php rp_usados_contact_action( 'WhatsApp', 'action-small' ); ?>
    <button class="header-menu-toggle" type="button" hidden aria-expanded="false" aria-controls="mobile-navigation" aria-label="<?php esc_attr_e( 'Abrir navegación principal', 'rp-usados' ); ?>" data-open-label="<?php esc_attr_e( 'Abrir navegación principal', 'rp-usados' ); ?>" data-close-label="<?php esc_attr_e( 'Cerrar navegación principal', 'rp-usados' ); ?>"><span class="header-hamburger" aria-hidden="true"><span></span><span></span><span></span></span></button>
    <details class="header-menu">
        <summary aria-label="<?php esc_attr_e( 'Navegación principal', 'rp-usados' ); ?>" aria-controls="mobile-navigation"><span class="header-hamburger" aria-hidden="true"><span></span><span></span><span></span></span></summary>
        <nav id="mobile-navigation" class="header-navigation header-navigation-mobile" aria-label="<?php esc_attr_e( 'Navegación principal', 'rp-usados' ); ?>">
            <?php foreach ( $header_links as $anchor => $label ) : ?>
                <a href="<?php echo esc_url( is_front_page() ? '#' . $anchor : home_url( '/#' . $anchor ) ); ?>"><?php echo esc_html( $label ); ?></a>
            <?php endforeach; ?>
        </nav>
    </details>
</header>
