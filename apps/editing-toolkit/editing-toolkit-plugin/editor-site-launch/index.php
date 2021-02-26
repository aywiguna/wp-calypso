<?php
/**
 * File for various functionality which needs to be added to Simple and Atomic
 * sites. The code in this file is always loaded in the block editor.
 *
 * Currently, this module may not be the best place if you need to load
 * front-end assets, but you could always add a separate action for that.
 *
 * @package A8C\FSE
 */

namespace A8C\FSE\EditorSiteLaunch;

/**
 * Enqueue launch button assets
 *
 * @param array $site_launch_options Site launch options.
 */
function enqueue_launch_button_script_and_style( $site_launch_options ) {
	$asset = \A8C\FSE\use_webpack_assets( 'launch-button' );
	// Prepare site launch options.
	$options = array(
		'siteSlug'   => $site_launch_options['site_slug'],
		'launchUrl'  => $site_launch_options['launch_url'],
		'launchFlow' => $site_launch_options['launch_flow'],
		'locale'     => determine_locale(),
	);

	$is_gutenboarding = $site_launch_options['is_gutenboarding'];
	if ( $is_gutenboarding ) {
		// The isGutenboarding prop either exists with the value '1' or does not exist at all.
		// The value `true` gets typecasted to '1' by `wp_localize_script` anyway.
		$options['isGutenboarding'] = '1';
	}

	$anchor_podcast = $site_launch_options['anchor_podcast'];
	if ( ! empty( $anchor_podcast ) ) {
		$options['anchorFmPodcastId'] = $anchor_podcast;
	}

	// Pass site launch options to client side here.
	// This is accessible via window.wpcomEditorSiteLaunch.
	wp_localize_script(
		$asset['asset_handle'],
		'wpcomEditorSiteLaunch',
		$options
	);
}

/**
 * Enqueue launch flow assets
 *
 * @param array $site_launch_options Site launch options.
 */
function enqueue_launch_flow_script_and_style( $site_launch_options ) {

	$launch_flow = $site_launch_options['launch_flow'];

	// Determine script name by launch flow.
	// We are avoiding string concatenation for security reasons.
	switch ( $launch_flow ) {
		case 'gutenboarding-launch':
			$script_name = 'gutenboarding-launch';
			break;
		case 'focused-launch':
			$script_name = 'focused-launch';
			break;
		case 'launch-site':
			// @TODO: this is just temporary for testing via feature flag. Remove it once focused-launch is live
			$script_name = 'focused-launch';
			break;
		default:
			// For redirect or invalid flows, skip & exit early.
			return;
	}
	\A8C\FSE\use_webpack_assets( $script_name );
}

/**
 * Enqueue assets
 */
function enqueue_script_and_style() {
	// Get site launch options.
	$site_launch_options = apply_filters( 'a8c_enable_editor_site_launch', false );

	// If no site launch options, skip.
	// This could mean site is already launched or editing toolkit plugin is running on non-wpcom sites.
	if ( false === $site_launch_options ) {
		return;
	}

	enqueue_launch_button_script_and_style( $site_launch_options );
	enqueue_launch_flow_script_and_style( $site_launch_options );
}
add_action( 'enqueue_block_editor_assets', __NAMESPACE__ . '\enqueue_script_and_style' );
