export const DESCRIPTION_PROMPT = `Provide a detailed behavioral analysis and descriptive narrative of the scene, breaking down observations into atomic, timestamped events. Capture all dialogue verbatim with clear speaker attribution, and describe actions in sufficient detail that the scene can be understood without visuals.

**Core Requirements**:
- Transcribe ALL dialogue exactly as spoken
- Identify speakers by name when known/visible (e.g., "John Smith: "), otherwise by clear role/position/descriptor (e.g., "Tall man in blue:", "Officer 1:", "Interviewer:")
- Describe positioning and movement of all participants ALONG with the dialogue
- Note entries, exits, and position changes ALONG WITH THE DIALOGUE
- Capture environmental sounds and notable silence ALONG WITH ANY DIALOGUE
- Describe relevant visual elements clearly
- There can be NO DUPLICATE TIMESTAMPS - if two events happen at the same time, they should be in a single timestamp text entry

**Timestamp Guidelines**:
- Create a new timestamp for each:
  - Line of dialogue
  - Physical action or movement
  - Position change
  - Notable reaction
  - Strategic decision
  - Environmental change
- Keep descriptions atomic and focused
- Include both speaker identification and behavioral context
- Break longer sequences into separate timestamped moments

**Analysis Components**:

1. **Dialogue & Communication**:
- Exact words spoken with speaker identification
- Tone and delivery style
- Pauses and timing
- Non-verbal sounds (sighs, laughs, etc.)
- Volume and emphasis changes

2. **Physical Description**:
- Participant positions and movements
- Gestures and actions
- Spatial relationships
- Physical interactions
- Environmental engagement

3. **Behavioral Indicators**:
- Confidence/uncertainty signals
- Stress responses
- Focus/attention shifts
- Energy changes
- Comfort/discomfort displays

4. **Pattern Recognition**:
- Recurring behaviors
- Tactical patterns
- Breaking patterns
- Behavioral tells
- Strategic adjustments

**Format**:
{
    timestamp: "MM:SS",
    text: "Clear description including WHO + WHAT + HOW. For dialogue: 'Speaker Name: Exact words spoken (tone/delivery note)'"
}

For continuous actions:
{
    timestamp: "00:10",
    text: "Initial action begins"
}
{
    timestamp: "00:11",
    text: "Action develops or changes"
}
{
    timestamp: "00:12",
    text: "Action concludes with clear result"
}

**Essential Elements**:
- WHO: Clear identification of all participants
- WHAT: Exact dialogue or specific action
- WHERE: Spatial relationships and positioning
- HOW: Manner of delivery or execution
- CONTEXT: Relevant environmental or situational details

**Quality Checks**:
- Is every speaker clearly identified?
- Is all dialogue captured verbatim?
- Could someone follow the scene without visuals?
- Are positions and movements clear?
- Are behavioral patterns identifiable?
- Is the sequence of events coherent?

Remember: Provide enough detail that someone could reconstruct the scene from the description alone. Every action, word, and behavioral shift should be documented with clear attribution and context.

Focus on capturing both immediate actions and deeper psychological/strategic elements that reveal character, motivation, and decision-making processes.`;

export const COMMENTARY_POLICE_PROMPT = `Generate concise, sharp, and psychologically insightful commentary for a police bodycam video in the style of JCS Criminal Psychology. Each commentary point must:
- Be **authoritative** and **confident**—avoid speculative language like "could signify" or "possibly."
- Use **clear and simple language, at most an 8th grade level**—avoid complex or formal phrasing!!!
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
    - Place commentary **after** an action ALWAYS, analyzing behavior that has already occurred, ALWAYS 5 seconds after the action.
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
    - Place commentary **after** an event ALWAYS, analyzing behavior that has already occurred, ALWAYS 5 seconds after the event.
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
    - Place commentary **after** an action when analyzing the impact of decisions, ALWAYS 5 seconds after the action.
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
	maxDuration: string | undefined,
) => {
	let videoTypeString = '';
	switch (videoType) {
		case 'police bodycam':
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
    "timestamp": "MM:SS", ${maxDuration ? `// Must not exceed ${maxDuration}` : ''}
    "commentary": "Your concise commentary here"
}

${includeIntro ? COMMENTARY_INTRO_PROMPT : ''}

${includeOutro ? COMMENTARY_OUTRO_PROMPT : ''}

${maxDuration ? `Important: All timestamps must be in MM:SS format and must not exceed ${maxDuration}.` : ''}

Remember to structure the commentary to build tension, reveal information strategically, and create an engaging narrative arc throughout the video analysis.`;
};
