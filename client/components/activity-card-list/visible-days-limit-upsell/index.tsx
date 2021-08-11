/**
 * External dependencies
 */
import { Button } from '@automattic/components';
import { useTranslate } from 'i18n-calypso';
import React from 'react';
import { useSelector } from 'react-redux';
import ActivityCard from 'calypso/components/activity-card';
import { preventWidows } from 'calypso/lib/formatting/prevent-widows';
import isJetpackCloud from 'calypso/lib/jetpack/is-jetpack-cloud';
import getActivityLogVisibleDays from 'calypso/state/selectors/get-activity-log-visible-days';
import { getSelectedSiteId, getSelectedSiteSlug } from 'calypso/state/ui/selectors';
import { useTrackUpsellView, useTrackUpgradeClick } from './hooks';

/**
 * Style dependencies
 */
import './style.scss';

const PLACEHOLDER_ACTIVITY = {
	actorName: 'Jetpack',
	actorRemoteId: 0,
	actorWpcomId: 0,
	actorRole: '',
	actorType: 'Application',
	activityDate: '2021-01-01T00:00:00.000+00:00',
	activityTs: 1609459200000,
	activityGroup: 'rewind',
	activityIcon: 'cloud',
	activityType: 'Backup',
	activityTitle: '',
	activityDescription: [],
};

type OwnProps = {
	cardClassName?: string;
};

const VisibleDaysLimitUpsell: React.FC< OwnProps > = ( { cardClassName } ) => {
	const translate = useTranslate();

	const siteId = useSelector( getSelectedSiteId ) as number;
	const visibleDays = useSelector( ( state ) => getActivityLogVisibleDays( state, siteId ) );
	const trackUpgradeClick = useTrackUpgradeClick( siteId );
	const siteSlug = useSelector( getSelectedSiteSlug );

	const upsellRef = useTrackUpsellView( siteId );

	if ( ! Number.isInteger( visibleDays ) ) {
		return null;
	}

	return (
		<div className="visible-days-limit-upsell">
			<div className="visible-days-limit-upsell__next-activity">
				<ActivityCard className={ cardClassName } activity={ PLACEHOLDER_ACTIVITY } />
			</div>
			<div className="visible-days-limit-upsell__call-to-action">
				<h3 className="visible-days-limit-upsell__call-to-action-header">
					{ preventWidows(
						translate(
							'Restore backups older than %(visibleDays)d day',
							'Restore backups older than %(visibleDays)d days',
							{
								count: visibleDays as number,
								args: { visibleDays },
							}
						)
					) }
				</h3>
				<p className="visible-days-limit-upsell__call-to-action-copy">
					{ preventWidows(
						translate(
							'Your activity log spans more than %(visibleDays)d day. Upgrade your backup storage to access activity older than %(visibleDays)d day.',
							'Your activity log spans more than %(visibleDays)d days. Upgrade your backup storage to access activity older than %(visibleDays)d days.',
							{
								count: visibleDays as number,
								args: { visibleDays },
							}
						)
					) }
				</p>
				<Button
					primary
					ref={ upsellRef }
					className="visible-days-limit-upsell__call-to-action-button"
					onClick={ trackUpgradeClick }
					href={ isJetpackCloud() ? `/pricing/${ siteSlug }` : `/plans/${ siteSlug }` }
				>
					{ translate( 'Upgrade storage' ) }
				</Button>
			</div>
		</div>
	);
};

export default VisibleDaysLimitUpsell;
