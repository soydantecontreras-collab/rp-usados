<?php
/** Media slot remains intentional until approved assets exist. @package RP_Usados */
defined( 'ABSPATH' ) || exit;
$image = absint( get_theme_mod( 'rp_hero_image', 0 ) );
$video = absint( get_theme_mod( 'rp_hero_video', 0 ) );
$has_image = $image && wp_attachment_is_image( $image );
?>
<section class="hero<?php echo $has_image ? ' hero--with-media' : ''; ?>" aria-labelledby="hero-title" data-motion="hero">
	<div class="hero-media" data-hero-media>
		<?php if ( $has_image ) : ?>
			<?php echo wp_get_attachment_image( $image, 'full', false, array( 'class' => 'hero-media__image', 'fetchpriority' => 'high', 'loading' => 'eager', 'alt' => '' ) ); ?>
		<?php endif; ?>
	</div>
	<div class="hero-contour" aria-hidden="true" data-motion="contour">
		<svg viewBox="0 0 1440 700" fill="none" preserveAspectRatio="xMidYMid slice"><path d="M-100 590H460C590 590 621 571 708 467L911 222C952 175 994 158 1067 158H1520"/><path class="hero-contour__echo" d="M-100 604H460C597 604 631 585 719 476L922 231C960 188 996 172 1067 172H1520"/></svg>
	</div>
	<div class="container hero-content">
		<p class="hero-intro">RP Usados <span>Ciudadela, Buenos Aires</span></p>
		<h1 id="hero-title" class="hero-title" data-motion="hero-title"><span>Desde</span>1990<span class="hero-title__dot">.</span></h1>
		<div class="hero-actions" data-motion="hero-actions">
			<a class="button button--primary" href="<?php echo esc_url( rp_usados_catalog_url() ); ?>"><?php esc_html_e( 'Ver vehículos', 'rp-usados' ); ?></a>
			<span class="hero-caption"><?php esc_html_e( 'Autos usados.', 'rp-usados' ); ?><br><?php esc_html_e( 'Ciudadela.', 'rp-usados' ); ?></span>
		</div>
		<div class="hero-bottom"><span><?php esc_html_e( '36 años de trayectoria', 'rp-usados' ); ?></span><a href="#trayectoria"><?php esc_html_e( 'Conocé RP Usados', 'rp-usados' ); ?></a></div>
	</div>
</section>
<?php if ( $has_image && 'video/webm' === get_post_mime_type( $video ) ) : ?>
<div class="container hero-video"><video controls playsinline preload="none" poster="<?php echo esc_url( wp_get_attachment_image_url( $image, 'full' ) ); ?>" aria-label="<?php esc_attr_e( 'Video de RP Usados', 'rp-usados' ); ?>"><source src="<?php echo esc_url( wp_get_attachment_url( $video ) ); ?>" type="video/webm"></video></div>
<?php endif; ?>
