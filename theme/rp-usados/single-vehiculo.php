<?php defined( 'ABSPATH' ) || exit; get_header(); ?>
<main id="main-content" tabindex="-1">
<?php while ( have_posts() ) : the_post();
    $id = get_the_ID();
    $state = get_post_meta( $id, 'rp_estado_stock', true );
    $version = get_post_meta( $id, 'rp_version', true );
    $display_name = trim( (string) get_post_meta( $id, 'rp_marca', true ) . ' ' . (string) get_post_meta( $id, 'rp_modelo', true ) ) ?: get_the_title();
    $gallery = get_post_meta( $id, 'rp_galeria_ids', true );
    $images = array_values( array_filter( array_unique( array_merge( array( get_post_thumbnail_id( $id ) ), is_array( $gallery ) ? $gallery : array() ) ), 'wp_attachment_is_image' ) );
    $facts = rp_usados_vehicle_facts( $id );
?>
<section class="vehicle-stage" aria-labelledby="unit-title">
    <div class="wrap unit-back"><a class="inline-link" href="<?php echo esc_url( home_url( '/#catalogo' ) ); ?>"><span class="back-arrow" aria-hidden="true">←</span>Volver al stock</a></div>
    <div class="wrap unit-spotlight">
        <div class="gallery" aria-label="Galería de la unidad">
            <?php if ( $images ) : ?>
                <div class="gallery-viewport" tabindex="0" aria-label="Fotografías. Deslizá o usá las teclas de flecha para recorrerlas.">
                    <?php foreach ( $images as $index => $image_id ) : ?>
                        <figure class="gallery-slide" id="foto-<?php echo (int) $index + 1; ?>">
                            <a class="gallery-open" href="<?php echo esc_url( wp_get_attachment_url( $image_id ) ); ?>" aria-label="<?php echo esc_attr( sprintf( 'Ampliar fotografía %d de %s', $index + 1, get_the_title() ) ); ?>">
                                <?php if ( 0 === $index ) : echo wp_get_attachment_image( $image_id, 'rp-vehicle-gallery', false, array(
                                    'class' => 'gallery-photo',
                                    'loading' => 'eager',
                                    'fetchpriority' => 'high',
                                    'decoding' => 'async',
                                    'alt' => get_post_meta( $image_id, '_wp_attachment_image_alt', true ) ?: get_the_title() . ' — fotografía ' . ( $index + 1 ),
                                    'sizes' => '(max-width: 800px) 100vw, 64vw',
                                ) ); else :
                                    $display = wp_get_attachment_image_src( $image_id, 'rp-vehicle-gallery' );
                                    $display_url = $display ? $display[0] : wp_get_attachment_url( $image_id );
                                    $placeholder_url = wp_get_attachment_image_url( $image_id, 'thumbnail' ) ?: $display_url;
                                    $srcset = wp_get_attachment_image_srcset( $image_id, 'rp-vehicle-gallery' );
                                ?>
                                    <img class="gallery-photo" src="<?php echo esc_url( $placeholder_url ); ?>" data-gallery-src="<?php echo esc_url( $display_url ); ?>"<?php if ( $srcset ) : ?> data-gallery-srcset="<?php echo esc_attr( $srcset ); ?>"<?php endif; ?> width="<?php echo (int) ( $display[1] ?? 1600 ); ?>" height="<?php echo (int) ( $display[2] ?? 1067 ); ?>" loading="lazy" fetchpriority="low" decoding="async" sizes="(max-width: 800px) 100vw, 64vw" alt="<?php echo esc_attr( get_post_meta( $image_id, '_wp_attachment_image_alt', true ) ?: get_the_title() . ' — fotografía ' . ( $index + 1 ) ); ?>">
                                <?php endif; ?>
                            </a>
                        </figure>
                    <?php endforeach; ?>
                </div>
                <div class="gallery-toolbar">
                    <p class="gallery-position technical" data-position role="status" aria-live="polite"><?php echo esc_html( sprintf( '%02d / %02d', 1, count( $images ) ) ); ?></p>
                    <?php if ( count( $images ) > 1 ) : ?>
                        <div class="gallery-navigation" hidden>
                            <button class="icon-button" type="button" data-previous aria-label="Fotografía anterior">←</button>
                            <button class="icon-button" type="button" data-next aria-label="Fotografía siguiente">→</button>
                        </div>
                    <?php endif; ?>
                </div>
                <?php if ( count( $images ) > 1 ) : ?>
                    <nav class="gallery-choices" aria-label="Elegir fotografía">
                        <?php foreach ( $images as $index => $image_id ) : ?>
                            <a href="#foto-<?php echo (int) $index + 1; ?>" data-image="<?php echo (int) $index; ?>" aria-label="<?php echo esc_attr( sprintf( 'Ver fotografía %d', $index + 1 ) ); ?>"<?php echo 0 === $index ? ' aria-current="true"' : ''; ?>>
                                <?php echo wp_get_attachment_image( $image_id, 'thumbnail', false, array(
                                    'class' => 'gallery-thumb',
                                    'loading' => 'lazy',
                                    'fetchpriority' => 'low',
                                    'decoding' => 'async',
                                    'alt' => '',
                                    'sizes' => '(max-width: 760px) 72px, 96px',
                                ) ); ?>
                            </a>
                        <?php endforeach; ?>
                    </nav>
                <?php endif; ?>
                <dialog class="gallery-lightbox" aria-label="Fotografía ampliada de la unidad">
                    <button class="lightbox-close" type="button" data-lightbox-close aria-label="Cerrar fotografía">Cerrar <span aria-hidden="true">×</span></button>
                    <img class="lightbox-image" alt="">
                    <div class="lightbox-controls">
                        <button type="button" data-lightbox-previous aria-label="Fotografía anterior">← <span>Anterior</span></button>
                        <p class="technical" data-lightbox-position aria-live="polite"></p>
                        <button type="button" data-lightbox-next aria-label="Fotografía siguiente"><span>Siguiente</span> →</button>
                    </div>
                </dialog>
            <?php else : ?>
                <div class="gallery-field"><p>Fotografías de la unidad</p><span class="gallery-pending"><?php echo esc_html( rp_usados_pending() ); ?></span></div>
            <?php endif; ?>
        </div>
        <div class="unit-panel">
            <div class="unit-heading">
                <span class="stock-state <?php echo 'reservado' === $state ? 'reserved' : ''; ?>"><?php echo esc_html( rp_usados_stock_labels()[ $state ] ?? rp_usados_pending() ); ?></span>
                <h1 id="unit-title"><?php echo esc_html( $display_name ); ?></h1>
                <?php if ( $version ) : ?><p class="unit-version"><?php echo esc_html( $version ); ?></p><?php endif; ?>
            </div>
            <div class="unit-panel-bottom">
                <div class="unit-price"><p class="label">Precio de esta unidad</p><p class="vehicle-price"><?php echo esc_html( rp_usados_vehicle_price( $id ) ); ?></p></div>
                <?php if ( $facts ) : ?><dl class="unit-facts"><?php foreach ( $facts as $label => $value ) : ?><div><dt><?php echo esc_html( $label ); ?></dt><dd><?php echo esc_html( $value ); ?></dd></div><?php endforeach; ?></dl><?php endif; ?>
                <?php get_template_part( 'template-parts/vehicle/whatsapp', null, array( 'id' => $id ) ); ?>
                <?php if ( ! rp_usados_vehicle_whatsapp_url( $id ) ) : ?><p class="pending">WhatsApp: <?php echo esc_html( rp_usados_pending() ); ?></p><?php endif; ?>
            </div>
        </div>
    </div>
</section>
<section id="unit-info" class="unit-information section" tabindex="-1" aria-labelledby="unit-info-title">
    <div class="wrap unit-information-grid">
        <div class="unit-description">
            <p class="label">La unidad / en detalle</p>
            <h2 id="unit-info-title">Conocé cada<br>detalle.</h2>
            <?php if ( trim( get_the_content() ) ) : ?><div class="prose"><?php the_content(); ?></div><?php endif; ?>
            <a class="inline-link" href="<?php echo esc_url( home_url( '/#ubicacion' ) ); ?>">Ver ubicación del local</a>
        </div>
        <div class="unit-technical">
            <p class="label">Ficha técnica</p>
            <dl class="full-specs">
                <?php foreach ( array( 'rp_marca' => 'Marca', 'rp_modelo' => 'Modelo', 'rp_version' => 'Versión' ) as $key => $label ) :
                    $value = get_post_meta( $id, $key, true );
                    if ( '' === $value ) { continue; } ?>
                    <div><dt><?php echo esc_html( $label ); ?></dt><dd><?php echo esc_html( $value ); ?></dd></div>
                <?php endforeach; ?>
                <?php foreach ( $facts as $label => $value ) : ?><div><dt><?php echo esc_html( $label ); ?></dt><dd><?php echo esc_html( $value ); ?></dd></div><?php endforeach; ?>
            </dl>
            <p class="unit-technical-note">Tomamos usados como parte de pago. Consultanos por financiación y venta en cuotas.</p>
        </div>
    </div>
</section>
<?php endwhile; ?>
</main>
<?php get_footer(); ?>
