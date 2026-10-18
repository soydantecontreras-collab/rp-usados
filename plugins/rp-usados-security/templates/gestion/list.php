<?php
defined( 'ABSPATH' ) || exit;
$filters = array( 'activo' => 'Stock activo', 'disponible' => 'Disponibles', 'reservado' => 'Reservados', 'vendido' => 'Vendidos', 'borradores' => 'Borradores' );
$filter = isset( $filter ) && isset( $filters[ $filter ] ) ? $filter : 'activo';
$vehicles = isset( $vehicles ) && is_array( $vehicles ) ? $vehicles : array();
?>
<div class="gestion-page-heading"><div><h1>Gestión de stock</h1><p>Vehículos, precios y fotos en un solo lugar.</p></div><a class="gestion-button primary" href="<?php echo esc_url( $management_url . 'nuevo/' ); ?>"><span aria-hidden="true">+</span> Cargar vehículo</a></div>
<nav class="gestion-filters" aria-label="Filtrar vehículos">
<?php foreach ( $filters as $key => $label ) : ?><a href="<?php echo esc_url( add_query_arg( array( 'filter' => $key, 'search' => $search ?? '' ), $management_url ) ); ?>" <?php echo $filter === $key ? 'aria-current="page"' : ''; ?>><?php echo esc_html( $label ); ?></a><?php endforeach; ?>
</nav>
<form method="get" class="gestion-search" action="<?php echo esc_url( $management_url ); ?>"><input type="hidden" name="filter" value="<?php echo esc_attr( $filter ); ?>"><label class="gestion-sr" for="stock-search">Buscar por marca, modelo o versión</label><input id="stock-search" name="search" type="search" placeholder="Buscar por marca, modelo o versión" value="<?php echo esc_attr( $search ?? '' ); ?>"><button type="submit" class="gestion-button secondary">Buscar</button></form>
<p class="gestion-count"><?php echo esc_html( count( $vehicles ) . ( count( $vehicles ) === 1 ? ' vehículo' : ' vehículos' ) ); ?></p>
<div class="gestion-stock">
<div class="gestion-row-head" aria-hidden="true"><span>Vehículo</span><span>Año / km</span><span>Precio</span><span>Estado</span><span>Acciones</span></div>
<?php foreach ( $vehicles as $vehicle ) :
$fields = $vehicle['fields'];
$cover = $vehicle['images'][ $vehicle['featured_media'] ] ?? null;
$state = $fields['rp_estado_stock'] ?? '';
$price = $fields['rp_precio_monto'] ?? '';
$currency = $fields['rp_precio_moneda'] ?? '';
?>
<article class="gestion-stock-row" data-vehicle-id="<?php echo esc_attr( $vehicle['id'] ); ?>" data-revision="<?php echo esc_attr( $vehicle['revision'] ); ?>" data-state="<?php echo esc_attr( $state ); ?>">
<div class="gestion-vehicle-name"><?php if ( $cover ) : ?><img src="<?php echo esc_url( $cover['thumb'] ?? $cover['url'] ); ?>" width="144" height="108" alt="<?php echo esc_attr( $cover['alt'] ?? $vehicle['title'] ); ?>" loading="lazy"><?php else : ?><div class="gestion-no-photo">Sin portada</div><?php endif; ?><div><h2><?php echo esc_html( trim( ( $fields['rp_marca'] ?? '' ) . ' ' . ( $fields['rp_modelo'] ?? '' ) ) ?: 'Vehículo sin completar' ); ?></h2><?php if ( ! empty( $fields['rp_version'] ) ) : ?><p><?php echo esc_html( $fields['rp_version'] ); ?></p><?php endif; ?><?php if ( $vehicle['publication'] === 'draft' ) : ?><span class="gestion-draft-label">Borrador</span><?php endif; ?></div></div>
<div class="gestion-row-spec"><span><?php echo esc_html( $fields['rp_anio'] ?: 'Año sin completar' ); ?></span><span><?php echo esc_html( ( $fields['rp_kilometraje'] ?? '' ) !== '' ? number_format_i18n( (float) $fields['rp_kilometraje'] ) . ' km' : 'Kilometraje sin completar' ); ?></span></div>
<div class="gestion-row-price"><?php echo esc_html( $price !== '' ? $currency . ' ' . number_format_i18n( (float) $price ) : 'Sin precio' ); ?></div>
<div><span class="gestion-state state-<?php echo esc_attr( $state ); ?>"><?php echo esc_html( $state ? ucfirst( $state ) : 'Sin estado' ); ?></span></div>
<div class="gestion-row-actions"><a class="gestion-button secondary" href="<?php echo esc_url( $management_url . 'vehiculos/' . $vehicle['id'] . '/' ); ?>">Editar</a><button type="button" class="gestion-quiet" data-change-state hidden>Cambiar estado</button></div>
</article>
<?php endforeach; ?>
</div>
<?php if ( empty( $vehicles ) ) : ?><section class="gestion-empty"><h2>No hay vehículos en esta vista.</h2><p>Probá otro filtro o cargá una nueva unidad.</p></section><?php endif; ?>
<dialog class="gestion-dialog" id="state-dialog"><form method="dialog"><h2>Cambiar estado</h2><label for="quick-state">Estado comercial</label><select id="quick-state"><option value="disponible">Disponible</option><option value="reservado">Reservado</option><option value="vendido">Vendido</option></select><p data-state-warning hidden>Este vehículo dejará de aparecer en el catálogo. No se eliminará.</p><div class="gestion-dialog-actions"><button class="gestion-button secondary" value="cancel">Cancelar</button><button class="gestion-button primary" value="confirm">Guardar estado</button></div></form></dialog>
