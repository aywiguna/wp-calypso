import { useLocale } from '@automattic/i18n-utils';
import { useEffect } from '@wordpress/element';
import { getLocaleFromPathname } from 'calypso/boot/locale';
import { recordSubmitStep } from 'calypso/landing/stepper/declarative-flow/internals/analytics/record-submit-step';
import { redirect } from 'calypso/landing/stepper/declarative-flow/internals/steps-repository/import/util';
import {
	AssertConditionResult,
	AssertConditionState,
	Flow,
	ProvidedDependencies,
} from 'calypso/landing/stepper/declarative-flow/internals/types';
import { useDomainParams } from 'calypso/landing/stepper/hooks/use-domain-params';
import { useSelector } from 'calypso/state';
import { isUserLoggedIn } from 'calypso/state/current-user/selectors';
import DomainContactInfo from './internals/steps-repository/domain-contact-info';

const domainUserTransfer: Flow = {
	name: 'domain-user-transfer',
	useSteps() {
		return [ { slug: 'domain-contact-info', component: DomainContactInfo } ];
	},

	useStepNavigation( currentStep, navigate ) {
		const flowName = this.name;

		function submit( providedDependencies: ProvidedDependencies = {} ) {
			recordSubmitStep( providedDependencies, '', flowName, currentStep );

			return providedDependencies;
		}

		const goBack = () => {
			return;
		};

		const goNext = () => {
			switch ( currentStep ) {
				case 'contact-info':
					return navigate( '/manage/domains' );
			}
		};

		const goToStep = ( step: string ) => {
			navigate( step );
		};

		return { goNext, goBack, goToStep, submit };
	},

	useAssertConditions(): AssertConditionResult {
		const flowName = this.name;
		const isLoggedIn = useSelector( isUserLoggedIn );

		// There is a race condition where useLocale is reporting english,
		// despite there being a locale in the URL so we need to look it up manually.
		const useLocaleSlug = useLocale();
		const pathLocaleSlug = getLocaleFromPathname();
		const locale = pathLocaleSlug || useLocaleSlug;

		const { domain } = useDomainParams();

		const logInUrl =
			locale && locale !== 'en'
				? `/start/account/user/${ locale }?variationName=${ flowName }&pageTitle=Receive%20domain&redirect_to=/setup/${ flowName }?domain=${ domain }`
				: `/start/account/user?variationName=${ flowName }&pageTitle=Receive%20domain&redirect_to=/setup/${ flowName }?domain=${ domain }`;

		useEffect( () => {
			if ( ! isLoggedIn ) {
				redirect( logInUrl );
			}
		}, [] );

		let result: AssertConditionResult = { state: AssertConditionState.SUCCESS };

		if ( ! isLoggedIn ) {
			result = {
				state: AssertConditionState.CHECKING,
				message: `${ flowName } requires a logged in user`,
			};
		}

		return result;
	},
};

export default domainUserTransfer;
