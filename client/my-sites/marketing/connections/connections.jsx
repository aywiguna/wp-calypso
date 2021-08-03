/**
 * External dependencies
 */
import React from 'react';
import { localize } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import InlineSupportLink from 'calypso/components/inline-support-link';
import PageViewTracker from 'calypso/lib/analytics/page-view-tracker';
import QueryKeyringConnections from 'calypso/components/data/query-keyring-connections';
import QueryKeyringServices from 'calypso/components/data/query-keyring-services';
import QueryPublicizeConnections from 'calypso/components/data/query-publicize-connections';
import SharingServicesGroup from './services-group';

const SharingConnections = ( { translate } ) => (
	<div className="connections__sharing-settings connections__sharing-connections">
		<PageViewTracker path="/marketing/connections/:site" title="Marketing > Connections" />
		<QueryKeyringConnections />
		<QueryKeyringServices />
		<QueryPublicizeConnections selectedSite />
		<SharingServicesGroup
			type="publicize"
			title={ translate( 'Publicize posts {{learnMoreLink/}}', {
				components: {
					learnMoreLink: <InlineSupportLink supportContext="publicize" showText={ false } />,
				},
			} ) }
		/>
		<SharingServicesGroup type="other" title={ translate( 'Manage connections' ) } />
	</div>
);

export default localize( SharingConnections );
