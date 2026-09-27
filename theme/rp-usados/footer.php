<?php defined( 'ABSPATH' ) || exit; ?>
<footer class="site-footer"><div class="wrap footer-inner">
    <div><a href="<?php echo esc_url( home_url( '/' ) ); ?>">RP Usados</a><p>Desde 1990 · Ciudadela</p></div>
    <address>Chacabuco 399<br>Ciudadela, Buenos Aires, Argentina.</address>
    <nav aria-label="Navegación del pie"><a href="<?php echo esc_url( home_url( '/#catalogo' ) ); ?>">Vehículos</a><a href="<?php echo esc_url( home_url( '/#nosotros' ) ); ?>">Nosotros</a><a href="<?php echo esc_url( home_url( '/#opciones' ) ); ?>">Financiación y permutas</a><a href="<?php echo esc_url( home_url( '/#ubicacion' ) ); ?>">Ubicación</a><a href="<?php echo esc_url( home_url( '/#contacto' ) ); ?>">Contacto</a></nav>
</div></footer>
<section id="contacto-pendiente" class="contact-pending wrap" tabindex="-1" aria-labelledby="contact-pending-title">
    <h2 id="contact-pending-title">WhatsApp</h2><p><?php echo esc_html( rp_usados_pending() ); ?></p><a class="inline-link" href="<?php echo esc_url( home_url( '/#ubicacion' ) ); ?>">Ver ubicación del local <span aria-hidden="true">↗</span></a>
</section>
<?php wp_footer(); ?>
</body></html>
