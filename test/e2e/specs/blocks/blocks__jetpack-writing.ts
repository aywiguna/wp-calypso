/**
 * @group gutenberg
 * @group jetpack-wpcom-integration
 */
import { BlockFlow, AIAssistantFlow, MarkdownFlow } from '@automattic/calypso-e2e';
import { createBlockTests } from './shared/block-smoke-testing';

const blockFlows: BlockFlow[] = [
	new AIAssistantFlow(
		{
			query: 'In two short sentences, tell me about Vancouver, Canada.',
			tone: 'Passionate',
			improve: 'Make shorter',
		},
		{ keywords: [ 'Vancouver' ] }
	),
	new MarkdownFlow(
		{
			text: '### Test',
		},
		{
			expectedText: 'Test',
			expectedRole: 'heading',
		}
	),
];

createBlockTests( 'Blocks: Jetpack Writing', blockFlows );
8;
