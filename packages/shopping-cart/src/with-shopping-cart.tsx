import React, { useContext, useState } from 'react';
import ShoppingCartContext from './shopping-cart-context';
import useShoppingCart from './use-shopping-cart';

export default function withShoppingCart< P >( Component: React.ComponentType< P > ) {
	return function ShoppingCartWrapper( props: P ): JSX.Element {
		// Even though managerClient isn't used here this guard will provide a
		// better error message than waiting for the one in useShoppingCart.
		const managerClient = useContext( ShoppingCartContext );
		if ( ! managerClient ) {
			throw new Error( 'withShoppingCart must be used inside a ShoppingCartProvider' );
		}

		const [ cartKey, setCartKey ] = useState< string | undefined >();

		const shoppingCartManager = useShoppingCart( cartKey );
		return (
			<Component
				{ ...props }
				shoppingCartManager={ shoppingCartManager }
				setCartKey={ setCartKey }
				cart={ shoppingCartManager.responseCart }
			/>
		);
	};
}
