<?php defined( 'ABSPATH' ) || exit; ?>
<section class="gestion-access single"><form method="post" action="<?php echo esc_url( $management_url ); ?>" class="gestion-access-form">
<h1>Recuperar acceso</h1><p>Indicá tu usuario o email. La recuperación utiliza el correo configurado en tu cuenta.</p>
<input type="hidden" name="action" value="recover"><input type="hidden" name="csrf" value="<?php echo esc_attr( $config['csrf'] ?? '' ); ?>">
<label for="recover-login">Usuario o email</label><input id="recover-login" name="username" autocomplete="username" required>
<button class="gestion-button primary" type="submit">Solicitar recuperación</button><a href="<?php echo esc_url( $management_url ); ?>" class="gestion-text-link">Volver a ingresar</a>
</form></section>
