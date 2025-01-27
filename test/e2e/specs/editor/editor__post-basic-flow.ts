/**
 * @group gutenberg
 * @group jetpack-wpcom-integration
 */

import {
	DataHelper,
	EditorPage,
	PublishedPostPage,
	TestAccount,
	envVariables,
	getTestAccountByFeature,
	envToFeatureKey,
} from '@automattic/calypso-e2e';
import { Page, Browser } from 'playwright';
import { skipItIf } from '../../jest-helpers';

const quote =
	'The problem with quotes on the Internet is that it is hard to verify their authenticity.\n- Abraham Lincoln';
const title = DataHelper.getRandomPhrase();
const category = 'Uncategorized';
const tag = 'test-tag';
const seoTitle = 'SEO example title';
const seoDescription = 'SEO example description';

declare const browser: Browser;

describe( DataHelper.createSuiteTitle( 'Editor: Basic Post Flow' ), function () {
	const features = envToFeatureKey( envVariables );
	const accountName = getTestAccountByFeature( features, [
		{ gutenberg: 'stable', siteType: 'simple', accountName: 'simpleSitePersonalPlanUser' },
	] );

	let page: Page;
	let editorPage: EditorPage;
	let publishedPostPage: PublishedPostPage;

	beforeAll( async () => {
		page = await browser.newPage();
		editorPage = new EditorPage( page );

		const testAccount = new TestAccount( accountName );
		await testAccount.authenticate( page );
	} );

	it( 'Go to the new post page', async function () {
		await editorPage.visit( 'post' );
	} );

	describe( 'Blocks', function () {
		it( 'Enter post title', async function () {
			await editorPage.enterTitle( title );
		} );

		it( 'Enter post text', async function () {
			await editorPage.enterText( quote );
		} );
	} );

	describe( 'Patterns', function () {
		const patternName = 'About Me';

		it( `Add ${ patternName } pattern`, async function () {
			await editorPage.addPatternFromSidebar( patternName );
		} );
	} );

	describe( 'Categories and Tags', function () {
		it( 'Open post settings', async function () {
			await editorPage.openSettings( 'Settings' );
		} );

		it( 'Add post category', async function () {
			await editorPage.selectCategory( category );
		} );

		it( 'Add post tag', async function () {
			await editorPage.addTag( tag );
		} );

		afterAll( async function () {
			// For mobile, but doesn't hurt to do this for Desktop either.
			await editorPage.closeSettings();
		} );
	} );

	describe( 'Jetpack features', function () {
		it( 'Open Jetpack settings', async function () {
			await editorPage.openSettings( 'Jetpack' );
		} );

		skipItIf( envVariables.TEST_ON_ATOMIC !== true )(
			'Enter SEO title and preview',
			async function () {
				await editorPage.enterSEODetails( {
					title: seoTitle,
					description: seoDescription,
				} );
			}
		);

		it( 'Open social preview', async function () {
			await editorPage.expandSection( 'Social Previews' );
			await editorPage.clickSidebarButton( 'Open Social Previews' );
		} );

		it( 'Show social preview for Tumblr', async function () {
			// Action implemented as "raw" calls for now (2023-09).
			const editorParent = await editorPage.getEditorParent();
			const dialog = editorParent.getByRole( 'dialog' );

			await dialog.getByRole( 'tab', { name: 'Tumblr' } ).click();
			await dialog.getByRole( 'tabpanel', { name: 'Tumblr' } ).waitFor();
			await dialog
				.filter( {
					// Look for either the SEO title, or the post title,
					// depending on whether the platform had SEO options
					// two steps previously.
					hasText: new RegExp( `${ seoTitle }|${ title }` ),
				} )
				.waitFor();
		} );

		it( 'Dismiss social preview', async function () {
			await page.keyboard.press( 'Escape' );
		} );

		afterAll( async function () {
			// For mobile, but doesn't hurt to do this for Desktop either.
			await editorPage.closeSettings();
		} );
	} );

	describe( 'Preview', function () {
		let previewPage: Page;

		it( 'Launch preview', async function () {
			if ( envVariables.VIEWPORT_NAME === 'mobile' ) {
				previewPage = await editorPage.previewAsMobile();
			} else {
				await editorPage.previewAsDesktop( 'Mobile' );
			}
		} );

		it( 'Close preview', async function () {
			if ( previewPage ) {
				// Mobile path - close the new page.
				await previewPage.close();
			} else {
				// Desktop path - restore the Desktop view.
				await editorPage.closePreview();
			}
		} );

		// Step skipped for mobile, since previewing naturally saves the post, rendering this step unnecessary.
		skipItIf( envVariables.VIEWPORT_NAME === 'mobile' )( 'Save draft', async function () {
			await editorPage.saveDraft();
		} );
	} );

	describe( 'Publish', function () {
		it( 'Publish and visit post', async function () {
			const publishedURL: URL = await editorPage.publish( { visit: true } );
			expect( publishedURL.href ).toStrictEqual( page.url() );
		} );

		it( 'Post content is found in published post', async function () {
			publishedPostPage = new PublishedPostPage( page );
			await publishedPostPage.validateTitle( title );
			await publishedPostPage.validateTextInPost( quote );
		} );

		it( 'Post metadata is found in published post', async function () {
			await publishedPostPage.validateCategory( category );
			await publishedPostPage.validateTags( tag );
		} );

		// Not checking the `Press This` button as it is not available on AT.
		// @see: paYJgx-1lp-p2
		// Skip test on Private user because social sharing only works on public sites.
		skipItIf( accountName === 'jetpackAtomicPrivateUser' ).each( [
			{ name: 'Twitter' },
			{ name: 'Facebook' },
		] )( 'Social sharing button for $name can be clicked', async function ( { name } ) {
			publishedPostPage = new PublishedPostPage( page );
			await publishedPostPage.validateSocialButton( name, { click: true } );
		} );
	} );
} );
