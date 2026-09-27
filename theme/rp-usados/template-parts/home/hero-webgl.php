<?php
/** Isolated, progressively enhanced Blender integration trial. @package RP_Usados */
defined( 'ABSPATH' ) || exit;
$hero_assets = RP_USADOS_URL . '/assets/hero/v6-1/';
?>
<section class="hero-webgl" aria-labelledby="hero-webgl-title" data-hero-3d data-assets="<?php echo esc_url( $hero_assets ); ?>">
	<div class="hero-webgl__stage">
		<div class="hero-webgl__visual" aria-hidden="true">
			<img class="hero-webgl__poster" src="<?php echo esc_url( $hero_assets . 'poster.webp' ); ?>" width="1600" height="900" alt="" fetchpriority="high" loading="eager">
			<div class="hero-webgl__canvas"></div>
		</div>
		<div class="hero-webgl__actions">
			<div><h1 id="hero-webgl-title">RP Usados</h1><p>Desde 1990 · Ciudadela</p></div>
			<a class="hero-webgl__skip" href="<?php echo esc_url( rp_usados_catalog_url() ); ?>">Ver vehículos <span aria-hidden="true">↗</span></a>
		</div>
		<p class="hero-webgl__hint" hidden>Deslizá para entrar <span aria-hidden="true">↓</span></p>
		<p class="screen-reader-text" role="status" data-hero-status></p>
	</div>
</section>
