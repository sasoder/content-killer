import os
import sys
import json
from vertexai.generative_models import GenerativeModel, Part, GenerationConfig
import vertexai

prompt = f"""Provide a detailed description of the police bodycam video. The description should be comprehensive enough to generate insightful commentary in the style of JCS Criminal Psychology, with a focus on behavioral analysis and psychological insights. 

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

**Format**:
    {{
        timestamp: "MM:SS",
        description: "Description of the event, including exact dialogue and context of behavior"
    }}

Focus on **behavioral analysis** and **key dialogues**, capturing pivotal moments that reveal the psychology of the suspect or the tactics of the officers.
"""

def generate_description(url: str, options: dict) -> list:
    vertexai.init(project=os.getenv("VERTEXAI_PROJECT_ID"))
    
    video_file = Part.from_uri(
        uri=url,
        mime_type="video/mp4"
    )

    schema = {
        "type": "array",
        "items": {
            "type": "object",
            "properties": {
                "timestamp": {"type": "string"},
                "text": {"type": "string"}
            },
            "required": ["timestamp", "text"]
        }
    }

    model = GenerativeModel("gemini-1.5-flash-002")
    response = model.generate_content(
        [video_file, prompt],
        generation_config=GenerationConfig(
            response_mime_type="application/json",
            response_schema=schema
        )
    )

    try:
        result = json.loads(response.text)
        if not isinstance(result, list):
            raise ValueError("Expected array response from model")
        return result
    except Exception as e:
        raise ValueError(f"Error processing model response: {str(e)}")

if __name__ == "__main__":
    try:
        url = sys.argv[1]
        options = json.loads(sys.argv[2])
        result = generate_description(url, options)
        print(json.dumps(result))
    except Exception as e:
        json.dump({"error": str(e)}, sys.stderr)
        sys.exit(1)