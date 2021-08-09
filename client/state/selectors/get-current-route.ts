/**
 * Internal dependencies
 */
import 'calypso/state/route/init';

/**
 * Type dependencies
 */
import type { AppState, __TodoAny__ } from 'calypso/types';

/**
 * Gets the last route set by a ROUTE_SET action
 *
 * Note: __TodoAny__ used for return type as we do not yet have a state type for `route`
 * and other typed selectors depend on this.
 *
 * @param {object} state - global redux state
 * @returns {string} current route value
 */
export declare const getCurrentRoute: ( state: AppState ) => __TodoAny__;

export default getCurrentRoute;
