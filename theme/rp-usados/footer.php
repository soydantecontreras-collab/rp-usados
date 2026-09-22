<?php
/** Confirmed information only. @package RP_Usados */
defined( 'ABSPATH' ) || exit;
?>
<footer class="site-footer">
	<div class="container footer-inner">
		<a class="footer-name" href="<?php echo esc_url( home_url( '/' ) ); ?>">RP Usados<span><?php esc_html_e( 'Desde 1990', 'rp-usados' ); ?></span></a>
		<address>Chacabuco 399<br>Ciudadela, Buenos Aires, Argentina.</address>
		<a class="text-link" href="<?php echo esc_url( rp_usados_catalog_url() ); ?>"><?php esc_html_e( 'Ver vehículos', 'rp-usados' ); ?></a>
	</div>
</footer>
<?php wp_footer(); ?>
</body>
</html>
