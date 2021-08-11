/**
 * External dependencies
 */
import React from 'react';
import { useShoppingCart } from '@automattic/shopping-cart';

/**
 * Internal dependencies
 */
import useCartKey from './use-cart-key';

export default function withCalypsoShoppingCart< P >( Component: React.ComponentType< P > ) {
	return function CalypsoShoppingCartWrapper( props: P ): JSX.Element {
		const cartKey = useCartKey();
		const shoppingCartManager = useShoppingCart( cartKey );
		return (
			<Component
				{ ...props }
				shoppingCartManager={ shoppingCartManager }
				cart={ shoppingCartManager.responseCart }
			/>
		);
	};
}
