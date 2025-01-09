export const DESCRIPTION_PROMPT = `Provide a detailed description of the police bodycam video. The description should be comprehensive enough to generate insightful commentary in the style of JCS Criminal Psychology, with a focus on behavioral analysis and psychological insights. 

**Guidelines**:
- **Pivotal Moments**: Identify a pivotal moment at least every 30-60 seconds, focusing on key interactions between the officers and subjects, changes in the situation, or important/bizarre/absurd statements.
- **Dialogues**: Include **all relevant dialogues** exactly as spoken. Pay attention to tone, delivery, and emotional cues when describing what is said. When including dialogue, also include a description of the context of the dialogue.
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

**Format**:
    {
        timestamp: "MM:SS",
        text: "Description of the event, including exact dialogue and context of behavior"
    }

Focus on **behavioral analysis** and **key dialogues**, capturing pivotal moments that reveal the psychology of the suspect or the tactics of the officers.`;

export const COMMENTARY_BASE_PROMPT = `Generate concise, sharp, and psychologically insightful commentary for a police bodycam video in the style of JCS Criminal Psychology. Each commentary point must:
- Be **authoritative** and **confident**—avoid speculative language like "could signify" or "possibly."
- Use **clear and simple language, at most an 8th grade level**—avoid complex or formal phrasing like "forthcoming" or "infused with an odd joviality" or "invites scrutiny" or "stark" or "signifies a blatant defiance" or "jovial act"
- Focus on the **suspect's and officer's behavior, intentions, and psychology** (1-2 sentences per moment).
- Avoid unnecessary descriptions of the scene unless they reveal important behavior or psychology.
- Highlight manipulative tactics, inconsistencies, or psychological patterns with **confidence**.
- Use phrases like "This shows...", "Here we see...", or "This reveals..." to provide **clear** and **definitive** insights into actions or behavior.
- Point out **bizarre, absurd, or humorous lines** from the dialogue (quoted exactly) that offer psychological insight.
- Use **dry humor** or sarcasm where appropriate, delivered in a serious tone to highlight irrational behavior.
- Avoid over-commenting—focus on key moments with meaningful psychological or behavioral insights.

Structure the commentary to:
- Identify key behavioral shifts—such as changes in tone, cooperation, or actions.
- **Space the commentary evenly** throughout the video. Avoid clustering comments together. For a typical 6-minute video, aim to space out **6 to 10 key commentary points**.
- MAKE SURE THE COMMENTARY IS BALANCED OVER TIME, PROVIDING ANALYSIS THROUGHOUT THE VIDEO RATHER THAN IN CONCENTRATED CLUSTERS.

**Timestamp Guidelines**:
- Timestamps must be in the format **mm:ss** (e.g., "01:15").
- Commentary should be timed **intelligently**:
    - Place commentary **before** an event when it sets up the action (prelude).
    - Place commentary **after** an action when analyzing behavior that has already occurred.
    - Avoid timestamp ranges like "0:14-0:16"; use a **precise moment** instead.

**Quality Over Quantity**:
- Prioritize **quality** over **quantity**.
- Avoid commenting on trivial or irrelevant moments. Only provide commentary for moments with significant psychological or behavioral insight.`;

export const COMMENTARY_INTRO_PROMPT = `Also generate an introduction to the commentary that sets the tone for the rest of the video at 00:00. It should be 1-2 sentences but include setting the scene for the video, the key players, and the key events that will be analyzed in the commentary. It should be concise and to the point.`;

export const COMMENTARY_OUTRO_PROMPT = `Also generate an outro to the commentary that wraps up the video at the end. It should be 1-2 sentences but include a summary of the video, the key players, and the key events that will be analyzed in the commentary. It should be concise and to the point.`;

export const generateCommentaryPrompt = (
	description: string,
	includeIntro: boolean,
	includeOutro: boolean,
) => `Based on the following information from a police bodycam video, generate concise, insightful commentary that creates an engaging narrative structure:

${description}

Provide the commentary moment in the format:
{
    "timestamp": "MM:SS",
    "commentary": "Your concise commentary here"
}

${includeIntro ? COMMENTARY_INTRO_PROMPT : ''}

${includeOutro ? COMMENTARY_OUTRO_PROMPT : ''}

Remember to structure the commentary to build tension, reveal information strategically, and create an engaging narrative arc throughout the video analysis.`;
