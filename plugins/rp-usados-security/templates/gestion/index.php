<?php
defined( 'ABSPATH' ) || exit;
$notice = isset( $notice ) && is_array( $notice ) ? $notice : array();
$config = isset( $config ) && is_array( $config ) ? $config : array();
$management_url = $config['managementUrl'] ?? home_url( '/gestion/' );
$allowed_views = array( 'login', 'list', 'form', 'denied', 'recover' );
$view = in_array( $view ?? '', $allowed_views, true ) ? $view : 'denied';
?>
<!doctype html>
<html lang="es-AR">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow, noarchive">
<title><?php echo esc_html( 'RP Usados — Gestión de stock' ); ?></title>
<link rel="stylesheet" href="<?php echo esc_url( rp_usados_gestion_asset( 'main.css' ) ); ?>">
</head>
<body class="gestion-body gestion-view-<?php echo esc_attr( $view ); ?>">
<a class="gestion-skip" href="#gestion-main">Ir al contenido</a>
<header class="gestion-header">
  <a href="<?php echo esc_url( $management_url ); ?>" class="gestion-brand"><?php $logo_id = get_theme_mod( 'custom_logo' ); if ( $logo_id ) : echo wp_get_attachment_image( $logo_id, 'full', false, array( 'class' => 'gestion-logo', 'alt' => 'RP Usados' ) ); else : ?><strong>RP <span>Usados</span></strong><?php endif; ?><span class="gestion-brand-caption">Gestión de stock</span></a>
  <?php if ( is_user_logged_in() ) : ?>
  <nav aria-label="Cuenta" class="gestion-account"><a href="<?php echo esc_url( home_url( '/' ) ); ?>" target="_blank" rel="noopener">Ver sitio</a>
  <form method="post" action="<?php echo esc_url( $management_url ); ?>"><input type="hidden" name="action" value="logout"><input type="hidden" name="csrf" value="<?php echo esc_attr( $config['actionCsrf'] ?? $config['csrf'] ?? '' ); ?>"><button type="submit" class="gestion-quiet">Cerrar sesión</button></form></nav>
  <?php endif; ?>
</header>
<main id="gestion-main" class="gestion-main" tabindex="-1">
<div id="gestion-notice" class="gestion-notice <?php echo esc_attr( $notice['type'] ?? '' ); ?>" role="status" aria-live="polite" <?php echo empty( $notice['message'] ) ? 'hidden' : ''; ?>><?php echo esc_html( $notice['message'] ?? '' ); ?></div>
<?php require __DIR__ . '/' . $view . '.php'; ?>
</main>
<script id="gestion-config" type="application/json"><?php echo wp_json_encode( $config, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT ); ?></script>
<script type="module" src="<?php echo esc_url( rp_usados_gestion_asset( 'main.js' ) ); ?>"></script>
</body></html>
