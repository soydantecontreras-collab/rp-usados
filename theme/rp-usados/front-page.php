<?php defined( 'ABSPATH' ) || exit; get_header(); ?>
<main id="main-content" tabindex="-1">
    <?php get_template_part( 'template-parts/home/hero' ); ?>
    <div class="transition-bridge" aria-hidden="true"></div>
    <?php get_template_part( 'template-parts/home/catalog' ); ?>
    <?php get_template_part( 'template-parts/home/trajectory' ); ?>
    <?php get_template_part( 'template-parts/home/services' ); ?>
    <?php get_template_part( 'template-parts/home/location' ); ?>
    <?php get_template_part( 'template-parts/home/contact' ); ?>
</main>
<?php get_footer(); ?>
