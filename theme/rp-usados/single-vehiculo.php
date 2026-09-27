<?php defined( 'ABSPATH' ) || exit; get_header(); ?>
<main id="main-content" tabindex="-1">
<?php while ( have_posts() ) : the_post();
    $id = get_the_ID();
    $state = get_post_meta( $id, 'rp_estado_stock', true );
    $version = get_post_meta( $id, 'rp_version', true );
    $gallery = get_post_meta( $id, 'rp_galeria_ids', true );
    $images = array_values( array_filter( array_unique( array_merge( array( get_post_thumbnail_id( $id ) ), is_array( $gallery ) ? $gallery : array() ) ), 'wp_attachment_is_image' ) );
    $facts = rp_usados_vehicle_facts( $id );
?>
<section class="vehicle-stage" aria-labelledby="unit-title">
    <div class="wrap unit-back"><a class="inline-link" href="<?php echo esc_url( home_url( '/#catalogo' ) ); ?>"><span class="back-arrow" aria-hidden="true">←</span>Volver al stock</a></div>
    <div class="unit-title"><span class="stock-state <?php echo 'reservado' === $state ? 'reserved' : ''; ?>"><?php echo esc_html( rp_usados_stock_labels()[ $state ] ?? rp_usados_pending() ); ?></span><h1 id="unit-title"><?php echo esc_html( get_the_title() ); ?></h1><?php if ( $version ) : ?><p><?php echo esc_html( $version ); ?></p><?php endif; ?></div>
    <div class="gallery" aria-label="Galería de la unidad">
        <?php if ( $images ) : ?>
            <div class="gallery-viewport" tabindex="0" aria-label="Fotografías. Deslizá o usá las flechas para recorrerlas.">
            <?php foreach ( $images as $index => $image_id ) : ?>
                <figure class="gallery-slide" id="foto-<?php echo (int) $index + 1; ?>">
                    <a href="<?php echo esc_url( wp_get_attachment_url( $image_id ) ); ?>" aria-label="<?php echo esc_attr( sprintf( 'Abrir fotografía %d de %s en tamaño completo', $index + 1, get_the_title() ) ); ?>">
                    <?php echo wp_get_attachment_image( $image_id, 'rp-vehicle-gallery', false, array( 'loading' => 0 === $index ? 'eager' : 'lazy', 'fetchpriority' => 0 === $index ? 'high' : 'auto', 'alt' => get_post_meta( $image_id, '_wp_attachment_image_alt', true ) ?: get_the_title() . ' — fotografía ' . ( $index + 1 ), 'sizes' => '100vw' ) ); ?>
                    </a>
                </figure>
            <?php endforeach; ?>
            </div>
            <?php if ( count( $images ) > 1 ) : ?>
                <div class="gallery-navigation" hidden><button class="icon-button" data-previous aria-label="Imagen anterior">←</button><p class="technical" data-position role="status" aria-live="polite">1 / <?php echo count( $images ); ?></p><button class="icon-button" data-next aria-label="Imagen siguiente">→</button></div>
                <div class="gallery-choices" aria-label="Elegir fotografía"><?php foreach ( $images as $index => $image_id ) : ?><a href="#foto-<?php echo (int) $index + 1; ?>" data-image="<?php echo (int) $index; ?>" aria-label="<?php echo esc_attr( sprintf( 'Ver fotografía %d', $index + 1 ) ); ?>"><?php echo (int) $index + 1; ?></a><?php endforeach; ?></div>
            <?php endif; ?>
        <?php else : ?><div class="gallery-field"><p>Fotografías de la unidad</p><span class="gallery-pending"><?php echo esc_html( rp_usados_pending() ); ?></span></div><?php endif; ?>
    </div>
    <div class="unit-strip"><dl><?php foreach ( $facts as $label => $value ) : ?><div><dt><?php echo esc_html( $label ); ?></dt><dd><?php echo esc_html( $value ); ?></dd></div><?php endforeach; ?></dl><a class="inline-link" href="#unit-info"><span>Datos de la unidad</span><span class="arrow" aria-hidden="true">↓</span></a></div>
</section>
<section id="unit-info" class="unit-information section wrap" tabindex="-1"><div class="unit-description"><p class="label">La unidad / en detalle</p><h2>Todo lo que<br>necesitás saber.</h2>
    <?php if ( trim( get_the_content() ) ) : ?><div class="prose"><?php the_content(); ?></div><?php endif; ?>
    <dl class="full-specs">
        <?php foreach ( array( 'rp_marca' => 'Marca', 'rp_modelo' => 'Modelo', 'rp_version' => 'Versión' ) as $key => $label ) : $value = get_post_meta( $id, $key, true ); if ( '' === $value ) { continue; } ?><div><dt><?php echo esc_html( $label ); ?></dt><dd><?php echo esc_html( $value ); ?></dd></div><?php endforeach; ?>
        <?php foreach ( $facts as $label => $value ) : ?><div><dt><?php echo esc_html( $label ); ?></dt><dd><?php echo esc_html( $value ); ?></dd></div><?php endforeach; ?>
    </dl>
</div><aside class="unit-enquiry"><p class="label">Precio de esta unidad</p><p class="price-pending vehicle-price"><?php echo esc_html( rp_usados_vehicle_price( $id ) ); ?></p><p>Consultá por este vehículo.</p>
    <?php get_template_part( 'template-parts/vehicle/whatsapp', null, array( 'id' => $id ) ); ?>
    <?php if ( ! rp_usados_vehicle_whatsapp_url( $id ) ) : ?><p class="pending">WhatsApp: <?php echo esc_html( rp_usados_pending() ); ?></p><?php endif; ?>
    <p>Tomamos usados como parte de pago. Consultanos por financiación y venta en cuotas.</p>
    <a class="inline-link" href="<?php echo esc_url( home_url( '/#ubicacion' ) ); ?>"><span>Ver ubicación del local</span><span class="arrow" aria-hidden="true">↗</span></a>
</aside></section>
<div class="unit-contact-bar"><span>¿Te interesa esta unidad?</span><a class="unit-price-link" href="#unit-info">Consultar precio</a><?php get_template_part( 'template-parts/vehicle/whatsapp', null, array( 'id' => $id, 'classes' => 'action-small' ) ); ?></div>
<?php endwhile; ?>
</main>
<?php get_footer(); ?>
