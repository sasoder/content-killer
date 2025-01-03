import { DescriptionOptions } from '@shared/types/options';
import { TimestampText } from '@shared/types/api/schema';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) {
	throw new Error('GOOGLE_API_KEY is not set in environment variables');
}

const genAI = new GoogleGenerativeAI(apiKey);

const generationConfig = {
	temperature: 1,
	topP: 0.95,
	topK: 40,
	maxOutputTokens: 8192,
	responseMimeType: 'application/json',
};

const safetySettings = [
	{
		category: HarmCategory.HARM_CATEGORY_HARASSMENT,
		threshold: HarmBlockThreshold.BLOCK_NONE,
	},
	{
		category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
		threshold: HarmBlockThreshold.BLOCK_NONE,
	},
	{
		category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
		threshold: HarmBlockThreshold.BLOCK_NONE,
	},
	{
		category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
		threshold: HarmBlockThreshold.BLOCK_NONE,
	},
];

const TimestampTextSchema = z.array(
	z.object({
		timestamp: z.string(),
		text: z.string(),
	}),
);

const DESCRIPTION_PROMPT = `Provide a detailed description of the police bodycam video. The description should be comprehensive enough to generate insightful commentary in the style of JCS Criminal Psychology, with a focus on behavioral analysis and psychological insights. 

**Guidelines**:
- **Pivotal Moments**: Identify a pivotal moment at least every 30-60 seconds, focusing on key interactions between the officers and subjects, changes in the situation, or important/bizarre/absurd statements.
- **Dialogues**: Include **all relevant dialogues** exactly as spoken. Pay attention to tone, delivery, and emotional cues when describing what is said.
- **Actions & Behavior**: Emphasize subjects' actions or body language that may indicate intoxication, mental state, cooperation level, evasion tactics, or non-verbal cues suggesting psychological distress or manipulation.
- **Officer Interaction**: Document officer commands or questions, especially when they elicit unusual responses or resistance. Include any mentions of weapons, injuries, or potential dangers.
- **Behavioral Shifts**: Highlight changes in the subject's behavior or compliance. Pay close attention to moments where the subject becomes evasive, dishonest, or defensive.
- **Significant Events**: Note the arrival of additional officers, use of force, or any major changes in the situation. 
- **Absurd or Irrational Moments**: When the subject says or does something absurd, mark them as "Prepare for an unusual response" or "This next bit defies explanation" to signal potentially deadpan commentary moments.
- **Heightened Tension**: For moments of heightened tension or potential conflict, mark them as "Watch closely" to indicate the need for closer behavioral scrutiny.
- **Psychological Inconsistencies**: Include moments when the subject's behavior, actions, or statements contradict earlier statements or indicate irrational thinking.
- **Behavioral Tells**: Note specific body language, micro-expressions, and speech patterns that reveal stress, dishonesty, or manipulation.
- **Officer Tactics**: When officers employ de-escalation tactics or pressure the subject psychologically, make note of how these actions impact the subject's behavior.
- **Key Phrases**: Include any quotes that are unusually casual, strangely delivered, or stand out as inconsistent with the severity of the situation.
- **Unexpected Humor**: Pay attention to dialogue or actions that seem out of place, absurd, or provide accidental humor in contrast to the situation.
- **Connections to Future Moments**: Note any behavior or statement that could play a significant role later in the video, tying present actions to future consequences.
- **Never provide timestamps that are not in the video.**

Return the response as a JSON array of objects with this structure:
[{
	"timestamp": "MM:SS",
	"text": "Description of the event, including exact dialogue and context of behavior"
}]`;

export const generateDescription = async (url: string, options: DescriptionOptions): Promise<TimestampText[]> => {
	try {
		const model = genAI.getGenerativeModel({
			model: process.env.GOOGLE_GENAI_MODEL || 'gemini-2.0-flash-exp',
			generationConfig: {
				...generationConfig,
				temperature: options.temperature,
			},
			safetySettings,
		});

		const result = await model.generateContent([
			{
				inlineData: {
					mimeType: 'video/mp4',
					data: url,
				},
			},
			DESCRIPTION_PROMPT,
		]);

		const response = result.response;
		const text = response.text();

		// Parse the response as JSON and validate with Zod schema
		const parsedData = TimestampTextSchema.parse(JSON.parse(text));
		return parsedData;
	} catch (error) {
		console.error('Failed to generate description:', error);
		throw error;
	}
};
