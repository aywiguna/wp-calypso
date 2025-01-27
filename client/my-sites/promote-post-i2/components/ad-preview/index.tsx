import './style.scss';
import classNames from 'classnames';
import { useEffect } from 'react';

interface Props {
	htmlCode: string;
	templateFormat: string;
	isLoading?: boolean;
}

export default function AdPreview( { htmlCode, isLoading, templateFormat }: Props ) {
	useEffect( () => {
		if ( ! isLoading && templateFormat === 'html5_v2' ) {
			// we only need this listener to resize the iframe for html5_v2 templates
			window.addEventListener( 'message', function ( msg ) {
				if ( typeof msg.data !== 'object' ) {
					return;
				}

				if ( msg.data.type !== 'wa-inline-frame' ) {
					return;
				}

				const iframes = document.getElementsByTagName( 'iframe' );

				for ( let i = 0; i < iframes.length; i++ ) {
					if ( iframes[ i ].contentWindow === msg.source ) {
						// Set the frame height. Use next highest int to fix rounding issues with Firefox.
						iframes[ i ].style.height = Math.ceil( msg.data.height ) + 'px';

						// Exit loop.
						break;
					}
				}
			} );
		}
	}, [ isLoading, templateFormat ] );

	if ( isLoading ) {
		return (
			<div className="campaign-item-details__preview-content">
				<div className="promote-post-ad-preview__loading" />
			</div>
		);
	}

	const classes = classNames( 'campaign-item-details__preview-content', {
		v02: templateFormat === 'html5_v2',
	} );

	return (
		<div className={ classes }>
			<iframe srcDoc={ htmlCode } title="adPreview" />
		</div>
	);
}
