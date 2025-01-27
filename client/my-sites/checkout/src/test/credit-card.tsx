/**
 * @jest-environment jsdom
 */
import { StripeHookProvider } from '@automattic/calypso-stripe';
import {
	CheckoutProvider,
	CheckoutStepGroup,
	PaymentMethodStep,
	makeSuccessResponse,
	CheckoutFormSubmit,
} from '@automattic/composite-checkout';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useDispatch } from '@wordpress/data';
import { useEffect } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import GlobalNotices from 'calypso/components/global-notices';
import {
	createCreditCardPaymentMethodStore,
	createCreditCardMethod,
} from 'calypso/my-sites/checkout/src/payment-methods/credit-card';
import { actions } from 'calypso/my-sites/checkout/src/payment-methods/credit-card/store';
import { errorNotice } from 'calypso/state/notices/actions';
import { createTestReduxStore, fetchStripeConfiguration, stripeConfiguration } from './util';
import type { CardStoreType } from 'calypso/my-sites/checkout/src/payment-methods/credit-card/types';

function TestWrapper( { paymentMethods, paymentProcessors = undefined } ) {
	const store = createTestReduxStore();
	const queryClient = new QueryClient();
	return (
		<ReduxProvider store={ store }>
			<QueryClientProvider client={ queryClient }>
				<GlobalNotices />
				<StripeHookProvider fetchStripeConfiguration={ fetchStripeConfiguration }>
					<CheckoutProvider
						paymentMethods={ paymentMethods }
						selectFirstAvailablePaymentMethod
						paymentProcessors={ paymentProcessors ?? {} }
					>
						<CheckoutStepGroup>
							<PaymentMethodStep />
							<CheckoutFormSubmit />
						</CheckoutStepGroup>
					</CheckoutProvider>
				</StripeHookProvider>
			</QueryClientProvider>
		</ReduxProvider>
	);
}

const customerName = 'Human Person';
const cardNumber = '4242424242424242';
const cardExpiry = '05/99';
const cardCvv = '123';
const activePayButtonText = 'Complete Checkout';
function getPaymentMethod( store: CardStoreType, additionalArgs = {} ) {
	return createCreditCardMethod( {
		store,
		...additionalArgs,
	} );
}

function ResetCreditCardStoreFields() {
	const { resetFields } = useDispatch( 'wpcom-credit-card' );
	useEffect( () => {
		resetFields();
	} );
}

jest.mock( 'calypso/state/notices/actions' );

describe( 'Credit card payment method', () => {
	beforeEach( () => {
		( errorNotice as jest.Mock ).mockImplementation( ( value ) => {
			return {
				type: 'errorNotice',
				value,
			};
		} );
	} );

	it( 'renders a credit card option', async () => {
		const store = createCreditCardPaymentMethodStore( {} );
		const paymentMethod = getPaymentMethod( store );
		render( <TestWrapper paymentMethods={ [ paymentMethod ] }></TestWrapper> );
		await waitFor( () => {
			expect( screen.queryByText( 'Credit or debit card' ) ).toBeInTheDocument();
		} );
	} );

	it( 'renders submit button when credit card is selected', async () => {
		const store = createCreditCardPaymentMethodStore( {} );
		const paymentMethod = getPaymentMethod( store );
		render( <TestWrapper paymentMethods={ [ paymentMethod ] }></TestWrapper> );
		await waitFor( () => {
			expect( screen.queryByText( activePayButtonText ) ).toBeInTheDocument();
		} );
	} );

	it( 'submits the data to the processor when the submit button is pressed', async () => {
		const user = userEvent.setup();
		const store = createCreditCardPaymentMethodStore( {} );
		const paymentMethod = getPaymentMethod( store );
		const processorFunction = jest.fn( () => Promise.resolve( makeSuccessResponse( {} ) ) );
		render(
			<TestWrapper
				paymentMethods={ [ paymentMethod ] }
				paymentProcessors={ { card: processorFunction } }
			></TestWrapper>
		);
		await waitFor( () => expect( screen.getByText( activePayButtonText ) ).not.toBeDisabled() );

		await user.type( screen.getAllByLabelText( /Cardholder name/i )[ 1 ], customerName );
		await user.type( screen.getByLabelText( /Card number/i ), cardNumber );
		await user.type( screen.getByLabelText( /Expiry date/i ), cardExpiry );
		await user.type( screen.getAllByLabelText( /Security code/i )[ 0 ], cardCvv );

		// Stripe fields will not actually operate in this test so we have to pretend they are complete.
		store.dispatch( actions.setCardDataComplete( 'cardNumber', true ) );
		store.dispatch( actions.setCardDataComplete( 'cardExpiry', true ) );
		store.dispatch( actions.setCardDataComplete( 'cardCvc', true ) );

		await user.click( await screen.findByText( activePayButtonText ) );
		await waitFor( () => {
			expect( processorFunction ).toHaveBeenCalledWith( {
				name: customerName,
				eventSource: 'checkout',
				paymentPartner: 'stripe',
				countryCode: '',
				postalCode: '',
				stripe: null,
				cardNumberElement: undefined,
				stripeConfiguration,
				useForAllSubscriptions: false,
			} );
		} );

		// Manually reset the `wpcom-credit-card` store fields.
		render( <ResetCreditCardStoreFields /> );
	} );

	it( 'does not submit the data to the processor when the submit button is pressed if fields are missing', async () => {
		const store = createCreditCardPaymentMethodStore( {} );
		const paymentMethod = getPaymentMethod( store );
		const processorFunction = jest.fn( () => Promise.resolve( makeSuccessResponse( {} ) ) );
		render(
			<TestWrapper
				paymentMethods={ [ paymentMethod ] }
				paymentProcessors={ { card: processorFunction } }
			></TestWrapper>
		);
		await waitFor( () => expect( screen.getByText( activePayButtonText ) ).not.toBeDisabled() );
		await userEvent.click( await screen.findByText( activePayButtonText ) );
		await waitFor( () => {
			expect( processorFunction ).not.toHaveBeenCalled();
		} );
	} );

	it( 'displays error message overlay when a credit card field is empty and submit is clicked', async () => {
		const user = userEvent.setup();
		const store = createCreditCardPaymentMethodStore( {} );
		const paymentMethod = getPaymentMethod( store );
		const processorFunction = jest.fn( () => Promise.resolve( makeSuccessResponse( {} ) ) );
		render(
			<TestWrapper
				paymentMethods={ [ paymentMethod ] }
				paymentProcessors={ { card: processorFunction } }
			></TestWrapper>
		);

		await waitFor( () => expect( screen.getByText( activePayButtonText ) ).not.toBeDisabled() );

		// Partially fill the form, leaving security code field empty
		await user.type( screen.getAllByLabelText( /Cardholder name/i )[ 1 ], customerName );
		await user.type( screen.getByLabelText( /Card number/i ), cardNumber );
		await user.type( screen.getByLabelText( /Expiry date/i ), cardExpiry );
		//await user.type( screen.getAllByLabelText( /Security code/i )[ 0 ], '' );

		// Try to submit the form
		await user.click( await screen.findByText( activePayButtonText ) );

		// Verify the error message overlay appears
		expect( errorNotice ).toHaveBeenCalledWith(
			expect.stringMatching( /Something seems to be missing/ )
		);
	} );
} );
