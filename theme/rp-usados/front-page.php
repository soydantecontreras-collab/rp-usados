<?php
/** First visual version of the Home. @package RP_Usados */
defined( 'ABSPATH' ) || exit;
get_header();
?>
<main id="main-content" tabindex="-1">
	<?php get_template_part( 'template-parts/home/hero' ); ?>
	<?php get_template_part( 'template-parts/home/trajectory' ); ?>
	<?php get_template_part( 'template-parts/home/services' ); ?>
	<?php get_template_part( 'template-parts/home/featured' ); ?>
	<?php get_template_part( 'template-parts/home/location' ); ?>
</main>
<?php get_footer(); ?>
