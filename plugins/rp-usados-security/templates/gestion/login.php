<?php defined( 'ABSPATH' ) || exit; ?>
<section class="gestion-access" aria-labelledby="access-title">
<div class="gestion-access-intro"><span class="gestion-access-rule" aria-hidden="true"></span><h1 id="access-title">Tu stock,<br>a mano.</h1><p>Ingresá para cargar vehículos, actualizar sus datos y mantener el catálogo al día.</p></div>
<form method="post" action="<?php echo esc_url( ! empty( $config['reauth'] ) ? add_query_arg( 'reauth', '1', $management_url ) : $management_url ); ?>" class="gestion-access-form">
<h2>Ingresar a gestión</h2><input type="hidden" name="action" value="login"><input type="hidden" name="csrf" value="<?php echo esc_attr( $config['csrf'] ?? '' ); ?>">
<label for="login">Usuario o email</label><input id="login" name="username" autocomplete="username" required autofocus>
<label for="password">Contraseña</label><div class="gestion-password"><input id="password" name="password" type="password" autocomplete="current-password" required><button type="button" data-password-toggle aria-controls="password" aria-pressed="false" hidden>Mostrar</button></div>
<button class="gestion-button primary" type="submit">Ingresar</button>
<a class="gestion-text-link" href="<?php echo esc_url( add_query_arg( 'action', 'recover', $management_url ) ); ?>">Olvidé mi contraseña</a>
</form></section>
