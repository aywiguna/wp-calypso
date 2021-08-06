import debugFactory from 'debug';
import { cartKeysThatDoNotAllowFetch } from './cart-keys';
import { getEmptyResponseCart } from './empty-carts';
import {
	createManager,
	createSubscriptionManager,
	createLastValidResponseCartManager,
	createActionPromisesManager,
	noopManager,
} from './managers';
import { createActionCreators } from './shopping-cart-actions';
import { createTakeActionsBasedOnState } from './state-based-actions';
import { createCartSyncMiddleware, createCartInitMiddleware } from './sync';
import { getInitialShoppingCartState, shoppingCartReducer } from './use-shopping-cart-reducer';
import type {
	GetCartFunction,
	SetCartFunction,
	ShoppingCartManagerClient,
	ShoppingCartManagerWrapper,
	ShoppingCartManager,
	RequestCart,
	ShoppingCartAction,
	ResponseCart,
	ShoppingCartReducerDispatch,
	DispatchAndWaitForValid,
	AddActionPromise,
	SubscribeCallback,
} from './types';

const debug = debugFactory( 'shopping-cart:shopping-cart-manager' );
const emptyCart = getEmptyResponseCart();
const getEmptyCart = () => Promise.resolve( emptyCart );

function createDispatchAndWaitForValid(
	dispatch: ShoppingCartReducerDispatch,
	addActionPromise: AddActionPromise
): DispatchAndWaitForValid {
	const dispatchAndWaitForValid: DispatchAndWaitForValid = ( action ) => {
		return new Promise< ResponseCart >( ( resolve ) => {
			dispatch( action );
			addActionPromise( resolve );
		} );
	};

	return dispatchAndWaitForValid;
}

// A ShoppingCartManager contains state which changes and must be regenerated
// over time; the ShoppingCartManagerWrapper is the stable container that holds
// that state and generates each instance of the ShoppingCartManager. By
// itself, it is invisible to the consumer and is therefore a private API.
function createManagerWrapper(
	cartKey: string,
	getCart: GetCartFunction,
	setCart: SetCartFunction
): ShoppingCartManagerWrapper {
	let state = getInitialShoppingCartState();

	const shouldNotFetchRealCart = cartKeysThatDoNotAllowFetch.includes( cartKey );

	const setServerCart = ( cartParam: RequestCart ) => setCart( cartKey, cartParam );
	const getServerCart = () => {
		if ( shouldNotFetchRealCart ) {
			return getEmptyCart();
		}
		return getCart( cartKey );
	};

	const syncCartToServer = createCartSyncMiddleware( setServerCart );
	const initializeCartFromServer = createCartInitMiddleware( getServerCart );
	const middleware = [ initializeCartFromServer, syncCartToServer ];

	const { subscribe, notifySubscribers } = createSubscriptionManager( cartKey );

	// When an action is dispatched that modifies the cart (eg:
	// addProductsToCart), the reducer modifies the `responseCart` stored in
	// state. That (incomplete) data is then sent off to the server to be
	// validated and filled-in with additional properties before being returned
	// to the ShoppingCartManager. Because of this, optimistic updating of the
	// cart is not possible (it may change significantly in that round trip) so
	// we don't want to return the raw `responseCart` to the consumer. Instead,
	// we keep a copy of the `responseCart` the last time the state had a `valid`
	// CacheStatus and pass that to our consumers. The consumers can use
	// `isPendingUpdate` to know when the cart data is updating.
	const {
		getLastValidResponseCart,
		updateLastValidResponseCart,
	} = createLastValidResponseCartManager( state );

	const { resolveActionPromisesIfValid, addActionPromise } = createActionPromisesManager();
	const takeActionsBasedOnState = createTakeActionsBasedOnState(
		updateLastValidResponseCart,
		resolveActionPromisesIfValid
	);

	// This is the main dispatcher for shopping cart actions. Dispatched actions
	// are async and non-blocking. Most consumers can use the `subscribe`
	// callback to know when changes have been made but if a consumer needs to
	// know when actions are complete, they can use
	// `dispatchAndWaitForValid`which is the dispatcher exported with the
	// ShoppingCartManager's action creators.
	const dispatch = ( action: ShoppingCartAction ) => {
		debug( `heard action request for cartKey ${ cartKey }`, action.type );
		// setTimeout here defers the dispatch process until the next free cycle of
		// the JS event loop so that dispatching actions is asnyc and will not
		// block any code that triggers it.
		setTimeout( () => {
			debug( `dispatching middleware action for cartKey ${ cartKey }`, action.type );
			middleware.forEach( ( middlewareFn ) => {
				middlewareFn( action, state, dispatch );
			} );
			debug( `dispatching action for cartKey ${ cartKey }`, action.type );
			state = shoppingCartReducer( state, action );
			takeActionsBasedOnState( state, dispatch );
			notifySubscribers();
		} );
	};

	// `dispatchAndWaitForValid` enhances the action dispatcher to return a
	// Promise that will resolve when the cart next reaches a `valid`
	// CacheStatus. This is the dispatcher used for all actions in the
	// ShoppingCartManager's public API.
	const dispatchAndWaitForValid = createDispatchAndWaitForValid( dispatch, addActionPromise );
	const actionCreators = createActionCreators( dispatchAndWaitForValid );

	// Create an initial ShoppingCartManager.
	let cachedManager = createManager( state, getLastValidResponseCart(), actionCreators, subscribe );
	let lastState = state;

	// A ShoppingCartManager contains state (eg: the cart) and actions (eg:
	// addProductsToCart). The actions do not change over time, but the state
	// does, so we need to regenerate the ShoppingCartManager every time the
	// state changes. `getCurrentManager` performs this action.
	const getCurrentManager = (): ShoppingCartManager => {
		if ( lastState !== state ) {
			cachedManager = createManager( state, getLastValidResponseCart(), actionCreators, subscribe );
			lastState = state;
		}
		return cachedManager;
	};

	// Kick off initial actions to load the cart.
	takeActionsBasedOnState( state, dispatch );

	return {
		getCurrentManager,
	};
}

// The ShoppingCartManagerClient allows returning a ShoppingCartManager for
// each cart key and subscribing to changes on that manager.
export function createShoppingCartManagerClient( {
	getCart,
	setCart,
}: {
	getCart: GetCartFunction;
	setCart: SetCartFunction;
} ): ShoppingCartManagerClient {
	const managerWrappersByCartKey: Record< string, ShoppingCartManagerWrapper > = {};

	function forCartKey( cartKey: string | undefined ): ShoppingCartManager {
		if ( ! cartKey ) {
			return noopManager;
		}

		if ( ! managerWrappersByCartKey[ cartKey ] ) {
			debug( `creating cart manager for "${ cartKey }"` );
			managerWrappersByCartKey[ cartKey ] = createManagerWrapper( cartKey, getCart, setCart );
		}

		return managerWrappersByCartKey[ cartKey ].getCurrentManager();
	}

	return {
		forCartKey,
		subscribeToCartKey: ( cartKey: string, callback: SubscribeCallback ) =>
			forCartKey( cartKey ).subscribe( callback ),
	};
}
