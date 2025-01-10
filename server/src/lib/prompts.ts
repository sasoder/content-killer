export const DESCRIPTION_PROMPT = `Provide a detailed behavioral analysis description of the scene/interaction. The description should capture both micro-behaviors and broader patterns to enable insightful analysis and narrative commentary.

**Guidelines**:
- **Pivotal Moments**: Identify key turning points occurring every 30-60 seconds, focusing on significant decisions, behavioral shifts, or notable interactions that change the dynamics of the situation.

- **Interactions**: Include all relevant verbal AND non-verbal communication exactly as expressed. Capture tone, delivery, body language, and contextual cues. For each interaction, describe:
  - The physical/verbal expression
  - The surrounding context
  - Any apparent emotional/psychological subtext

- **Actor Identification**: For every action and interaction, provide clear identification of participants:
  - Attribute each action and statement to specific individuals/roles
  - Use consistent identifiers throughout (names, roles, positions)
  - Note when new participants enter or exit the scene
  - Track relationships and dynamics between participants
  - Describe relative positions and movements when relevant
  - Make attribution clear enough that scene can be understood without visuals

- **Behavioral Indicators**: Document actions and body language that reveal:
  - Mental/emotional state
  - Strategic thinking
  - Deception or authenticity
  - Power dynamics
  - Stress levels
  - Decision-making patterns

- **Notable Responses**: Highlight reactions to:
  - Pressure points 
  - Strategic moves
  - Environmental changes
  - Other participants' actions

- **Pattern Recognition**: 
  - Mark changes in behavior or strategy
  - Note recurring themes/tactics
  - Identify inconsistencies
  - Track evolving dynamics

- **Key Incidents**: Document:
  - Entry of new participants
  - Major strategic decisions
  - Significant environmental changes
  - Power dynamic shifts

- **Psychological Elements**: Note moments that:
  - Signal internal conflict
  - Reveal cognitive biases
  - Show strategic thinking
  - Indicate emotional responses

- **Behavioral Tells**: Track specific indicators like:
  - Micro-expressions
  - Changes in body posture/movement
  - Voice modulation
  - Eye movement/focus
  - Timing/pacing of actions

- **Strategic Elements**: Analyze:
  - Decision points
  - Risk assessment
  - Resource management
  - Position/advantage shifts

- **Narrative Markers**: Flag moments of:
  - Heightened tension
  - Strategic revelation
  - Character insight
  - Pattern disruption

**Format**:
{
    timestamp: "MM:SS",
    text: "Description of the event, including exact communication (verbal/non-verbal) and behavioral context and actor identification"
}

Focus on capturing both immediate actions and deeper psychological/strategic elements that reveal character, motivation, and decision-making processes.`;

export const COMMENTARY_POLICE_PROMPT = `Generate concise, sharp, and psychologically insightful commentary for a police bodycam video in the style of JCS Criminal Psychology. Each commentary point must:
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

export const COMMENTARY_INTERROGATION_PROMPT = `Generate concise, sharp, and psychologically insightful commentary for an interrogation video in an authoritative style. Each commentary point must:
- Be **authoritative** and **confident**—avoid speculative language like "could signify" or "possibly." 
- Use **clear and simple language, at most an 8th grade level**—avoid complex or formal phrasing like "forthcoming" or "exhibits resistance" or "demonstrates deception" or "indicative of" or "signifies"
- Focus on the **suspect's psychology, interrogator's techniques, and interaction dynamics** (1-2 sentences per moment).
- Highlight behavioral indicators like:
  * Changes in body language 
  * Shifts in verbal behavior
  * Deception cues
  * Resistance tactics
  * Story inconsistencies
  * Emotional manipulation attempts
  * Minimization or rationalization
- Use phrases like "This shows...", "Here we see...", or "This reveals..." to provide **clear** and **definitive** insights into behavior and psychology.
- Point out **key verbal exchanges** (quoted exactly) that reveal psychological dynamics.
- Maintain a clinical, analytical tone focused on behavioral analysis.
- Avoid over-commenting—focus on key moments with meaningful psychological or behavioral insights.

Structure the commentary to:
- Identify key shifts in rapport, resistance, and cooperation levels.
- Track evolution of suspect's story and emotional state.
- **Space the commentary evenly** throughout the video. Avoid clustering comments together. For a typical 30-minute interrogation, aim to space out **10-15 key commentary points**.
- MAKE SURE THE COMMENTARY IS BALANCED OVER TIME, PROVIDING ANALYSIS THROUGHOUT THE VIDEO RATHER THAN IN CONCENTRATED CLUSTERS.

**Timestamp Guidelines**: 
- Timestamps must be in the format **mm:ss** (e.g., "01:15").
- Commentary should be timed **intelligently**:
    - Place commentary **before** an event when it sets up a new interrogation phase or tactic.
    - Place commentary **after** an event when analyzing responses and behavior.
    - Avoid timestamp ranges like "0:14-0:16"; use a **precise moment** instead.

**Quality Over Quantity**:
- Prioritize **quality** over **quantity**.
- Only provide commentary for moments with significant psychological or behavioral insight.
- Focus on shifts in dynamics, key admissions, and notable deception indicators.`;

export const COMMENTARY_SPORTS_PROMPT = `Generate concise, strategically-focused commentary for sports footage in the style of professional analysts. Each commentary point must:
- Be **authoritative** and **confident**—avoid speculative language like "might be trying to" or "appears to be."
- Use **clear language with basic sports terminology**—avoid overcomplicating analysis with excessive jargon.
- Focus on **strategy, technique, and gameplay dynamics** (1-2 sentences per moment).
- Identify player names and positions when relevant to the analysis.
- Highlight key tactical decisions, skilled executions, or strategic patterns with **confidence**.
- Use phrases like "Here we see...", "This demonstrates...", or "Notice how..." to provide **clear** and **definitive** insights into gameplay.
- Point out **innovative strategies** or **exceptional athletic feats** that showcase high-level play.
- Use **crisp, analytical tone** with occasional dry observations about unusual tactics or plays.
- Focus only on moments that reveal significant strategic or technical insights.

Structure the commentary to:
- Identify key strategic shifts—changes in formation, tempo, or tactical approach.
- **Space the commentary evenly** throughout the footage. Avoid clustering comments together. For a typical 6-minute highlight reel, aim for **6 to 10 key commentary points**.
- ENSURE COMMENTARY IS BALANCED OVER TIME, PROVIDING ANALYSIS THROUGHOUT THE FOOTAGE RATHER THAN IN CONCENTRATED CLUSTERS.

**Timestamp Guidelines**:
- Timestamps must be in the format **mm:ss** (e.g., "01:15").
- Commentary should be timed **intelligently**:
    - Place commentary **before** a play when setting up tactical context.
    - Place commentary **after** a sequence when analyzing execution.
    - Avoid timestamp ranges like "0:14-0:16"; use a **precise moment** instead.

**Quality Over Quantity**:
- Prioritize **quality** over **quantity**.
- Only comment on moments that demonstrate significant strategic, technical, or tactical insight.
- Focus on plays that illustrate key concepts or exceptional execution.`;

export const COMMENTARY_POKER_PROMPT = `Generate concise, strategically insightful commentary for poker footage in a measured, authoritative style. Each commentary point must:
- Be **authoritative** and **confident**—analyze plays decisively without hedging language.
- Use **clear and simple language**—avoid complex poker jargon unless necessary for strategic insights.
- Focus on **player decisions, betting patterns, and table dynamics** (1-2 sentences per moment).
- Highlight **tells, timing, and physical behavior** that reveal information.
- Identify **key strategic errors or brilliant plays** with confidence.
- Use phrases like "This bet reveals...", "Here we see...", or "This line shows..." to provide clear strategic insights.
- Point out **notable verbal exchanges or table talk** that offer psychological insight.
- Use **dry humor** where appropriate to highlight obviously poor plays or decisions.
- Consider **position, stack sizes, and table dynamics** in the analysis.

Structure the commentary to:
- Track the evolution of hands from preflop to showdown
- Identify key decision points and inflection moments
- **Space the commentary evenly** throughout the footage. For a typical 6-minute hand, aim for **6-10 key decision points**.
- Consider both shown hands (when available) and likely ranges
- Pay attention to both the active players and reactions from others at the table

**Timestamp Guidelines**:
- Timestamps must be in the format **mm:ss** (e.g., "01:15")
- Commentary should be timed **intelligently**:
    - Place commentary **before** an action when setting up key decision points
    - Place commentary **after** an action when analyzing the impact of decisions
    - Avoid timestamp ranges; use a **precise moment** instead
    - Note both action timestamps and observable reaction times

**Quality Over Quantity**:
- Prioritize **strategic insight** over surface-level observations
- Analyze **meaningful** decisions that impact pot size or future play
- Consider both immediate tactics and long-term table dynamics
- When players are shown, named, or known, use their names consistently
- Consider stack sizes, position, and previous history when available
`;

export const COMMENTARY_INTRO_PROMPT = `Also generate an introduction to the commentary that sets the tone for the rest of the video at 00:00. It should be 1-2 sentences but include setting the scene for the video, the key players, and the key events that will be analyzed in the commentary. It should be concise and to the point.`;

export const COMMENTARY_OUTRO_PROMPT = `Also generate an outro to the commentary that wraps up the video at the end. It should be 1-2 sentences but include a summary of the video, the key players, and the key events that will be analyzed in the commentary. It should be concise and to the point.`;

export const generateCommentaryPrompt = (
	description: string,
	includeIntro: boolean,
	includeOutro: boolean,
	videoType: string,
) => {
	let videoTypeString = '';
	switch (videoType) {
		case 'police':
			videoTypeString = 'police bodycam footage';
			break;
		case 'sports':
			videoTypeString = 'sports game';
			break;
		case 'interrogation':
			videoTypeString = 'interrogation footage';
			break;
		case 'poker':
			videoTypeString = 'poker game';
			break;
		default:
			videoTypeString = videoType;
	}
	return `Based on the following information from a ${videoTypeString} video, generate concise, insightful commentary that creates an engaging narrative structure:

${description}

Provide the commentary moment in the format:
{
    "timestamp": "MM:SS",
    "commentary": "Your concise commentary here"
}

${includeIntro ? COMMENTARY_INTRO_PROMPT : ''}

${includeOutro ? COMMENTARY_OUTRO_PROMPT : ''}

Remember to structure the commentary to build tension, reveal information strategically, and create an engaging narrative arc throughout the video analysis.`;
};
