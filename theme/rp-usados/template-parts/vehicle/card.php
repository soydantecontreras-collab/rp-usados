<?php
/** Price-free entire-card link. No editorial descriptions in listings. */
defined( 'ABSPATH' ) || exit;
$id = get_the_ID();
$state = get_post_meta( $id, 'rp_estado_stock', true );
if ( 'publish' !== get_post_status( $id ) || ! in_array( $state, array( 'disponible', 'reservado' ), true ) ) { return; }
$name = trim( get_post_meta( $id, 'rp_marca', true ) . ' ' . get_post_meta( $id, 'rp_modelo', true ) ) ?: get_the_title();
$version = get_post_meta( $id, 'rp_version', true );
?>
<article class="vehicle" data-state="<?php echo esc_attr( $state ); ?>">
    <a class="vehicle-link" href="<?php the_permalink(); ?>" aria-label="<?php echo esc_attr( sprintf( __( 'Ver ficha: %s', 'rp-usados' ), $name ) ); ?>">
        <div class="vehicle-media">
            <span class="stock-state <?php echo 'reservado' === $state ? 'reserved' : ''; ?>"><?php echo esc_html( rp_usados_stock_labels()[ $state ] ); ?></span>
            <?php if ( has_post_thumbnail() ) : the_post_thumbnail( 'rp-vehicle-card', array( 'class' => 'vehicle-photo', 'loading' => 'lazy', 'alt' => $name, 'sizes' => '(max-width: 540px) 100vw, (max-width: 1100px) 50vw, 33vw' ) ); else : ?>
                <div class="photo-field"><span>Fotografía</span><small><?php echo esc_html( rp_usados_pending() ); ?></small></div>
            <?php endif; ?>
        </div>
        <div class="vehicle-info"><div class="vehicle-title"><h3><?php echo esc_html( $name ); ?></h3><span class="vehicle-arrow" aria-hidden="true">↗</span></div>
            <?php if ( $version ) : ?><p><?php echo esc_html( $version ); ?></p><?php endif; ?>
            <?php $facts = rp_usados_vehicle_facts( $id ); if ( $facts ) : ?><dl><?php foreach ( $facts as $label => $value ) : ?><div><dt><?php echo esc_html( $label ); ?></dt><dd><?php echo esc_html( $value ); ?></dd></div><?php endforeach; ?></dl><?php endif; ?>
        </div>
    </a>
</article>
