<?php
/** Global accessible navigation. @package RP_Usados */
defined( 'ABSPATH' ) || exit;
?>
<!doctype html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<meta name="theme-color" content="#0B0B0D">
	<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<a class="skip-link screen-reader-text" href="#main-content"><?php esc_html_e( 'Saltar al contenido', 'rp-usados' ); ?></a>
<header class="site-header">
	<div class="container header-inner">
		<?php if ( has_custom_logo() ) : ?>
			<?php the_custom_logo(); ?>
		<?php else : ?>
			<a class="wordmark" href="<?php echo esc_url( home_url( '/' ) ); ?>" aria-label="<?php esc_attr_e( 'RP Usados — Inicio', 'rp-usados' ); ?>"><span class="wordmark__rp">RP<span aria-hidden="true">.</span></span><span class="wordmark__name">Usados</span></a>
		<?php endif; ?>
		<nav class="primary-navigation" aria-label="<?php esc_attr_e( 'Navegación principal', 'rp-usados' ); ?>">
			<ul>
				<li><a href="<?php echo esc_url( rp_usados_catalog_url() ); ?>" <?php if ( is_post_type_archive( 'vehiculo' ) ) { echo 'aria-current="page"'; } ?>><?php esc_html_e( 'Vehículos', 'rp-usados' ); ?></a></li>
				<li><a href="<?php echo esc_url( home_url( '/#servicios' ) ); ?>"><?php esc_html_e( 'Servicios', 'rp-usados' ); ?></a></li>
				<li><a href="<?php echo esc_url( home_url( '/#ubicacion' ) ); ?>"><?php esc_html_e( 'Dónde estamos', 'rp-usados' ); ?></a></li>
			</ul>
		</nav>
	</div>
</header>
