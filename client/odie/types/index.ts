import type { OdieUserTracking } from '../trackLocation/useOdieUserTracking';

export type Context = {
	nudge_id?: string | undefined;
	section_name?: string;
	session_id?: string;
	site_id: number | null;
	user_tracking?: OdieUserTracking[];
	// etc
};

export type Nudge = {
	nudge: string;
	initialMessage: string;
	context?: Record< string, unknown >;
};

export type MessageRole = 'user' | 'bot';

export type MessageType =
	| 'message'
	| 'action'
	| 'meta'
	| 'error'
	| 'placeholder'
	| 'help-link'
	| 'introduction';

export type Message = {
	content: string;
	meta?: Record< string, string >;
	role: MessageRole;
	type: MessageType;
};

export type Chat = {
	chat_id?: string | null;
	messages: Message[];
	context: Context;
};

export type OdieAllowedSectionNames =
	| 'plans'
	| 'add-ons'
	| 'domains'
	| 'email'
	| 'site-purchases'
	| 'checkout'
	| 'help-center';

export type OdieAllowedBots = 'wapuu';
