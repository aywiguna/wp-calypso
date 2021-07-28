import debugFactory from 'debug';
import { playQueuedActions } from './use-shopping-cart-reducer';
import type { ShoppingCartState, ShoppingCartReducerDispatch, CacheStatus } from './types';

const debug = debugFactory( 'shopping-cart:state-based-actions' );

function fetchInitialCart(
	state: ShoppingCartState,
	dispatch: ShoppingCartReducerDispatch,
	lastCacheStatus: CacheStatus | ''
): void {
	const { cacheStatus } = state;
	if ( cacheStatus === 'fresh' && cacheStatus !== lastCacheStatus ) {
		debug( 'triggering fetch of initial cart' );
		dispatch( { type: 'FETCH_INITIAL_RESPONSE_CART' } );
		dispatch( { type: 'GET_CART_FROM_SERVER' } );
	}
}

function prepareInvalidCartForSync(
	state: ShoppingCartState,
	dispatch: ShoppingCartReducerDispatch,
	lastCacheStatus: CacheStatus | ''
): void {
	const { queuedActions, cacheStatus } = state;
	if (
		queuedActions.length === 0 &&
		cacheStatus === 'invalid' &&
		cacheStatus !== lastCacheStatus
	) {
		debug( 'triggering sync of cart to server' );
		dispatch( { type: 'REQUEST_UPDATED_RESPONSE_CART' } );
		dispatch( { type: 'SYNC_CART_TO_SERVER' } );
	}
}

export function createTakeActionsBasedOnState(
	updateLastValidResponseCart: ( state: ShoppingCartState ) => void,
	resolveActionPromisesIfValid: ( state: ShoppingCartState ) => void
): ( state: ShoppingCartState, dispatch: ShoppingCartReducerDispatch ) => void {
	let lastCacheStatus: CacheStatus | '' = '';

	const takeActionsBasedOnState = (
		state: ShoppingCartState,
		dispatch: ShoppingCartReducerDispatch
	) => {
		const { cacheStatus } = state;
		debug( 'cache status before status check functions is', cacheStatus );
		fetchInitialCart( state, dispatch, lastCacheStatus );
		updateLastValidResponseCart( state );
		resolveActionPromisesIfValid( state );
		prepareInvalidCartForSync( state, dispatch, lastCacheStatus );
		playQueuedActions( state, dispatch );
		lastCacheStatus = cacheStatus;
		debug( 'running status check functions complete' );
	};
	return takeActionsBasedOnState;
}
