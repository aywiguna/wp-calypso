/**
 * External dependencies
 */

import React from 'react';
import PropTypes from 'prop-types';
import { last, isEqual } from 'lodash';

/**
 * Internal dependencies
 */
import { deleteP2KeyringConnection } from 'calypso/state/sharing/keyring/actions';
import { SharingService, connectFor } from 'calypso/my-sites/marketing/connections/service';
import { getSelectedSiteId } from 'calypso/state/ui/selectors';

export class Slack extends SharingService {
	static propTypes = {
		// This foreign propTypes access should be safe because we expect all of them to be removed
		// eslint-disable-next-line react/forbid-foreign-prop-types
		...SharingService.propTypes,
		deleteStoredKeyringConnection: PropTypes.func,
	};

	static defaultProps = {
		...SharingService.defaultProps,
		deleteStoredKeyringConnection: () => {},
	};

	createOrUpdateConnection = () => {};

	/**
	 * Deletes the passed connections.
	 */
	removeConnection = () => {
		this.setState( { isDisconnecting: true } );
		this.props.deleteStoredKeyringConnection(
			last( this.props.keyringConnections ),
			this.props.siteId
		);
	};

	UNSAFE_componentWillReceiveProps( { availableExternalAccounts } ) {
		if ( ! isEqual( this.props.availableExternalAccounts, availableExternalAccounts ) ) {
			this.setState( {
				isConnecting: false,
				isDisconnecting: false,
			} );
		}

		if ( ! this.state.isAwaitingConnections ) {
			return;
		}

		this.setState( {
			isAwaitingConnections: false,
			isRefreshing: false,
		} );

		if ( this.didKeyringConnectionSucceed( availableExternalAccounts ) ) {
			this.setState( { isConnecting: false } );
			this.props.successNotice(
				this.props.translate( 'The %(service)s account was successfully connected.', {
					args: { service: this.props.service.label },
					context: 'Sharing: Publicize connection confirmation',
				} ),
				{ id: 'publicize' }
			);
		}
	}

	/*
	 * We render a custom logo here instead of using SocialLogos as we need a full colour logo and SocialLogos currently strips all colour
	 * When SocialLogos supports colour logos then we can remove this and use the default renderLogo() in SharingService
	 */
	renderLogo() {
		return (
			/* eslint-disable wpcalypso/jsx-classname-namespace */
			<img
				className="sharing-service__logo"
				src="/calypso/images/sharing/slack-logo.svg"
				width="48"
				height="48"
				alt=""
			/>
		);
	}
}

export default connectFor(
	Slack,
	( state, props ) => {
		return {
			...props,
			siteId: getSelectedSiteId( state ),
			removableConnections: props.keyringConnections,
			fetchConnection: props.requestKeyringConnections,
			siteUserConnections: props.keyringConnections.map( ( connection ) => ( {
				...connection,
				keyring_connection_ID: connection.ID,
			} ) ),
		};
	},
	{
		deleteStoredKeyringConnection: deleteP2KeyringConnection,
	}
);
