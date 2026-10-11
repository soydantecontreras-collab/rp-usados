<?php defined( 'ABSPATH' ) || exit;
$v = $vehicle;
$currency = array( 'ARS', 'USD' );
if ( $v['moneda'] && preg_match( '/^[A-Z]{3}$/D', $v['moneda'] ) && ! in_array( $v['moneda'], $currency, true ) ) { $currency[] = $v['moneda']; }
?>
<a class="back-link" href="<?php echo esc_url( home_url( '/gestion/' ) ); ?>">Volver al stock</a>
<div class="page-heading"><div><h1><?php echo $id ? 'Editar vehículo' : 'Cargar vehículo'; ?></h1><p>El nombre de la unidad se genera con sus datos principales.</p></div><span class="publication-label"><?php echo 'publish' === $v['publicacion'] ? 'Publicado' : 'Borrador'; ?></span></div>
<div id="save-feedback" class="feedback" role="status" aria-live="polite"><?php if ( isset( $_GET['guardado'] ) ) { echo 'Cambios guardados'; } ?></div>
<button type="button" class="button" id="reload-current" hidden>Recargar versión actual</button>
<?php if ( $error && 'rp_conflict' === $error->get_error_code() ) : ?><p><a href="<?php echo esc_url( home_url( '/gestion/vehiculos/' . $id . '/' ) ); ?>">Recargar versión actual (descarta los cambios escritos)</a></p><?php endif; ?>
<form id="vehicle-form" method="post" enctype="multipart/form-data" novalidate>
<input type="hidden" name="accion" value="save"><?php wp_nonce_field( 'rp_gestion_save', '_rp_nonce', false ); ?>
<input type="hidden" name="rp_vehicle[revision]" value="<?php echo esc_attr( $v['revision'] ); ?>">
<input type="hidden" name="rp_vehicle[portada]" value="<?php echo esc_attr( $v['portada'] ); ?>">
<input type="hidden" name="rp_vehicle[galeria]" value="<?php echo esc_attr( implode( ',', $v['galeria'] ) ); ?>">
<div class="form-layout"><div class="form-content">
<fieldset><legend>Datos principales</legend><div class="field-grid">
<?php foreach ( array( 'marca' => 'Marca', 'modelo' => 'Modelo', 'version' => 'Versión', 'anio' => 'Año' ) as $key => $label ) : ?><label for="<?php echo esc_attr( $key ); ?>"><?php echo esc_html( $label ); ?><input id="<?php echo esc_attr( $key ); ?>" name="rp_vehicle[<?php echo esc_attr( $key ); ?>]" value="<?php echo esc_attr( $v[ $key ] ); ?>" <?php echo 'anio' === $key ? 'inputmode="numeric" maxlength="4"' : 'maxlength="160"'; ?> aria-describedby="error-<?php echo esc_attr( $key ); ?>"><span class="field-error" id="error-<?php echo esc_attr( $key ); ?>"></span></label><?php endforeach; ?>
</div></fieldset>
<fieldset><legend>Precio y estado</legend><div class="field-grid">
<label for="precio">Precio <span class="optional">(opcional)</span><input id="precio" name="rp_vehicle[precio]" value="<?php echo esc_attr( $v['precio'] ); ?>" inputmode="decimal" aria-describedby="price-help error-precio"><span class="field-error" id="error-precio"></span></label>
<label for="moneda">Moneda<select id="moneda" name="rp_vehicle[moneda]" aria-describedby="error-moneda"><?php foreach ( $currency as $code ) : ?><option value="<?php echo esc_attr( $code ); ?>" <?php selected( $v['moneda'], $code ); ?>><?php echo esc_html( $code ); ?></option><?php endforeach; ?></select><span class="field-error" id="error-moneda"></span></label>
<label for="estado">Estado comercial<select id="estado" name="rp_vehicle[estado]" aria-describedby="error-estado"><option value="">Seleccionar estado</option><?php foreach ( rp_usados_stock_labels() as $key => $label ) : ?><option value="<?php echo esc_attr( $key ); ?>" <?php selected( $v['estado'], $key ); ?>><?php echo esc_html( $label ); ?></option><?php endforeach; ?></select><span class="field-error" id="error-estado"></span></label>
</div><p class="hint" id="price-help">Ingresá el importe sin separadores de miles. El precio se muestra sólo en la ficha pública.</p>
<label class="checkbox sold-confirm"><input type="checkbox" name="confirmar_vendido" value="1"> Confirmo si pasa a vendido: este vehículo dejará de aparecer en el catálogo. No se eliminará.</label>
</fieldset>
<fieldset><legend>Datos del vehículo</legend><label for="kilometraje">Kilometraje <span class="optional">(opcional)</span><input id="kilometraje" name="rp_vehicle[kilometraje]" inputmode="numeric" value="<?php echo esc_attr( $v['kilometraje'] ); ?>" aria-describedby="error-kilometraje"><span class="field-error" id="error-kilometraje"></span></label></fieldset>
<fieldset><legend>Fotos</legend><p class="hint">JPG, PNG o WebP. Hasta 12 MiB, 6000 px por lado y 24 MP. Máximo 20 imágenes distintas, incluida la portada. No se acepta HEIC.</p>
<section class="photo-section"><h2>Foto principal</h2><div id="cover-preview" class="cover-preview"><?php if ( $v['portada'] ) : ?><img src="<?php echo esc_url( wp_get_attachment_image_url( $v['portada'], 'medium' ) ); ?>" alt="Foto principal actual"><?php else : ?><p>Sin foto principal</p><?php endif; ?></div>
<label class="drop-zone" id="cover-drop">Seleccionar o reemplazar foto principal<input type="file" id="cover-file" name="portada_archivo" accept="image/jpeg,image/png,image/webp,.heic,.heif"></label><p class="hint drop-hint">También podés arrastrar una foto aquí.</p><button type="button" class="button js-only" id="remove-cover">Quitar asociación de portada</button><span class="field-error" id="error-portada"></span></section>
<section class="photo-section"><h2>Galería</h2><label class="drop-zone" id="gallery-drop">Agregar fotos<input id="gallery-files" name="galeria_archivos[]" type="file" multiple accept="image/jpeg,image/png,image/webp,.heic,.heif"></label>
<div id="gallery-preview" class="gallery-preview"><?php foreach ( $v['galeria'] as $photo ) : ?><figure><img src="<?php echo esc_url( wp_get_attachment_image_url( $photo, 'medium' ) ); ?>" alt="Foto de galería"></figure><?php endforeach; ?></div><span class="field-error" id="error-galeria"></span><div id="upload-queue" aria-live="polite"></div><p class="hint">Quitar una foto sólo quita su asociación; no borra el archivo.</p></section>
</fieldset>
<fieldset><legend>Información adicional</legend><label for="descripcion">Descripción <span class="optional">(opcional)</span><textarea id="descripcion" name="rp_vehicle[descripcion]" rows="6" maxlength="50000" aria-describedby="error-descripcion"><?php echo esc_textarea( $v['descripcion'] ); ?></textarea><span class="field-error" id="error-descripcion"></span></label></fieldset>
</div><aside class="save-panel"><h2>Publicación</h2><p id="publication-status"><?php echo 'publish' === $v['publicacion'] ? 'Publicado' : 'Borrador'; ?></p><p class="hint">Para publicar: marca, modelo, año, estado comercial y foto principal. Un borrador puede estar incompleto.</p>
<div class="save-actions"><?php if ( 'publish' === $v['publicacion'] ) : ?><button class="button button-primary" name="guardar" value="changes" type="submit">Guardar cambios</button><button class="button" name="guardar" value="draft" type="submit">Guardar borrador</button><?php else : ?><button class="button button-primary" name="guardar" value="publish" type="submit">Publicar vehículo</button><button class="button" name="guardar" value="draft" type="submit">Guardar borrador</button><?php endif; ?></div><p class="hint">Vendido conserva su ficha y deja de aparecer en el catálogo activo.</p></aside></div>
</form>
