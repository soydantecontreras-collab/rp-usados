<?php defined( 'ABSPATH' ) || exit; ?>
<!doctype html>
<html lang="es-AR">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>RP Usados — Gestión de stock</title>
<?php foreach ( $assets['css'] as $css ) : ?><link rel="stylesheet" href="<?php echo esc_url( $css ); ?>"><?php endforeach; ?>
</head>
<body data-view="<?php echo esc_attr( $view ); ?>" data-config="<?php echo esc_attr( wp_json_encode( $config ) ); ?>">
<a class="skip" href="#contenido">Ir al contenido</a>
<header class="masthead"><div class="shell masthead-inner">
<a class="brand" href="<?php echo esc_url( home_url( '/gestion/' ) ); ?>">RP USADOS<span>Gestión de stock</span></a>
<?php if ( is_user_logged_in() ) : ?>
<a class="button button-dark" href="<?php echo esc_url( home_url( '/' ) ); ?>" target="_blank" rel="noopener">Ver sitio</a>
<form method="post" class="logout"><input type="hidden" name="accion" value="logout"><?php wp_nonce_field( 'rp_gestion_logout', '_rp_nonce', false ); ?><button class="button button-dark" type="submit">Cerrar sesión</button></form>
<?php else : ?><span class="private-label">Acceso privado</span><?php endif; ?>
</div></header>
<main id="contenido" class="shell main" tabindex="-1">
<?php if ( $error ) : ?><div class="feedback is-error" role="alert"><?php echo esc_html( $error->get_error_message() ); ?>
<?php foreach ( $error->get_error_data()['fields'] ?? array() as $message ) : ?><p><?php echo esc_html( $message ); ?></p><?php endforeach; ?></div><?php endif; ?>
<?php if ( 'denied' === $view ) : ?><h1>Acceso denegado</h1><p>Tu usuario no tiene acceso a esta sección o el vehículo no está disponible.</p>
<?php else : include __DIR__ . '/' . $view . '.php'; endif; ?>
</main>
<dialog id="session-dialog" aria-labelledby="session-title">
<form id="session-form"><h2 id="session-title">Volvé a iniciar sesión</h2><p>La sesión venció. Los datos escritos siguen en este formulario.</p>
<label>Usuario o email<input name="usuario" autocomplete="username" required></label>
<label>Contraseña<input name="password" type="password" autocomplete="current-password" required></label>
<button type="button" class="button" data-password>Mostrar contraseña</button>
<p class="feedback" id="session-feedback" role="status"></p>
<div class="actions"><button class="button button-primary" type="submit">Iniciar sesión</button><button class="button" type="button" data-close-dialog>Volver al formulario</button></div></form>
</dialog>
<dialog id="confirm-dialog" aria-labelledby="confirm-title"><h2 id="confirm-title">Confirmar acción</h2><p id="confirm-text"></p><div class="actions"><button class="button" type="button" data-cancel>Cancelar</button><button class="button button-primary" type="button" data-confirm>Continuar</button></div></dialog>
<?php if ( $assets['js'] ) : ?><script type="module" src="<?php echo esc_url( $assets['js'] ); ?>"></script><?php endif; ?>
</body></html>
