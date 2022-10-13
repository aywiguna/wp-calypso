import { isEnabled } from '@automattic/calypso-config';
import { Popover } from '@automattic/components';
import { useState } from '@wordpress/element';
import { Icon, starFilled } from '@wordpress/icons';
import { useI18n } from '@wordpress/react-i18n';
import Badge from 'calypso/components/badge';
import { hasTouch } from 'calypso/lib/touch-detect';

import './style.scss';

const GlobalStylesPremiumBadge = () => {
	const { __ } = useI18n();
	const [ popoverAnchor, setPopoverAnchor ] = useState();
	const [ isPopoverVisible, setIsPopoverVisible ] = useState( false );

	if ( ! isEnabled( 'limit-global-styles' ) ) {
		return null;
	}

	const isTouch = hasTouch();

	return (
		<>
			<button
				ref={ setPopoverAnchor }
				className="global-styles-premium-badge"
				onClick={ () => {
					if ( ! isTouch ) {
						return;
					}
					setIsPopoverVisible( ( state ) => ! state );
				} }
				onMouseEnter={ () => {
					if ( isTouch ) {
						return;
					}
					setIsPopoverVisible( true );
				} }
				onMouseLeave={ () => {
					if ( isTouch ) {
						return;
					}
					setIsPopoverVisible( false );
				} }
				type="button"
			>
				<Badge type="info">
					<Icon icon={ starFilled } size={ 18 } />
					<span>{ __( 'Premium' ) }</span>
				</Badge>
			</button>
			<Popover
				className="global-styles-premium-badge__popover"
				context={ popoverAnchor }
				isVisible={ isPopoverVisible }
				onClose={ () => setIsPopoverVisible( false ) }
			>
				{ __(
					'Upgrade to a paid plan for color changes to take effect and to unlock the advanced design customization'
				) }
			</Popover>
		</>
	);
};

export default GlobalStylesPremiumBadge;
