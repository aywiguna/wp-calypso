import debugFactory from 'debug';
import { useContext, useReducer, useEffect, useRef } from 'react';
import ShoppingCartContext from './shopping-cart-context';
import ShoppingCartOptionsContext from './shopping-cart-options-context';
import useRefetchOnFocus from './use-refetch-on-focus';
import type { ShoppingCartManager } from './types';

const debug = debugFactory( 'shopping-cart:use-shopping-cart' );

export default function useShoppingCart( cartKey?: string | undefined ): ShoppingCartManager {
	const managerClient = useContext( ShoppingCartContext );
	if ( ! managerClient ) {
		throw new Error( 'useShoppingCart must be used inside a ShoppingCartProvider' );
	}

	const { defaultCartKey } = useContext( ShoppingCartOptionsContext ) ?? {};
	const finalCartKey = cartKey ?? defaultCartKey;
	debug( `getting cart manager for cartKey ${ finalCartKey }` );
	const manager = managerClient.forCartKey( finalCartKey );

	// Re-render when the cart changes
	const isMounted = useRef< boolean >( true );
	useEffect( () => {
		isMounted.current = true;
		return () => {
			isMounted.current = false;
		};
	}, [] );
	const [ , forceUpdate ] = useReducer( () => [], [] );
	useEffect( () => {
		if ( finalCartKey ) {
			debug( 'subscribing to cartKey', finalCartKey );
			return managerClient.subscribeToCartKey( finalCartKey, () => {
				debug( 'cart manager changed; re-rendering' );
				isMounted.current && forceUpdate();
			} );
		}
	}, [ managerClient, finalCartKey ] );

	useRefetchOnFocus( finalCartKey );

	return manager;
}
