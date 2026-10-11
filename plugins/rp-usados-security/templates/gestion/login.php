<?php defined( 'ABSPATH' ) || exit; ?>
<section class="login-panel"><h1>Gestión de stock</h1><p>Ingresá con tu usuario de RP Usados.</p>
<form method="post" class="login-form"><input type="hidden" name="accion" value="login"><input type="hidden" name="csrf" value="<?php echo esc_attr( $login_token ); ?>">
<label>Usuario o email<input name="usuario" autocomplete="username" required maxlength="254" autofocus></label>
<label>Contraseña<input name="password" type="password" autocomplete="current-password" required></label>
<button type="button" class="button password-toggle" data-password>Mostrar contraseña</button>
<button type="submit" class="button button-primary">Iniciar sesión</button>
</form></section>
