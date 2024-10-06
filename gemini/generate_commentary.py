import json
from openai import OpenAI
import os
from pydantic import BaseModel, Field
from typing import List, Dict
from dotenv import load_dotenv

class Commentary(BaseModel):
    timestamp: str
    commentary: str

class CommentaryList(BaseModel):
    comments: List[Commentary]

def generate_commentary(description): 
    load_dotenv()
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    # Build the system prompt
    base_system_prompt = """Generate concise, razor-sharp, insightful commentary for a police bodycam video in the style of JCS Criminal Psychology. The commentary should:
    - Be brief and direct (1-2 sentences per pause).
    - Don't provide commentary if there is nothing to say, but also don't ignore important moments.
    - Provide definitive psychological insights and behavioral analysis.
    - Use a confident, authoritative tone.
    - Address individuals consistently as "the officer" and "the suspect" or other appropriate roles.
    - Reflect the perspective of an expert concisely analyzing bodycam footage.
    - Engage the viewer by highlighting subtle but significant details.
    - Maintain a serious, professional tone while acknowledging absurd or humorous moments with deadpan delivery.
    - Avoid speculation and focus on observable behaviors and their implications.
    - Use phrases like "Notice..." or "Here we see..." to guide the viewer's attention.
    - Highlight manipulative tactics, inconsistencies, or telling psychological patterns.
    - Build narrative tension through the commentary, tying moments together to show progression.
    - Structure the commentary to create an engaging narrative arc:
        - Introduce key elements early on that will become significant later.
        - For foreshadowing, use phrases like "We'll return to this later" or "This will be important later". Use only where appropriate.
        - Gradually reveal layers of complexity in the situation or suspect's psychology.
        - Highlight turning points or pivotal moments that shift the direction of the encounter.
        - Draw connections between earlier and later events to create a cohesive narrative.
        - Build suspense by noting subtle clues or inconsistencies that may lead to revelations.
    - Occasionally pose rhetorical questions to engage the viewer's critical thinking. Use sparingly.
    """

    humor_guidelines = """
    - When appropriate, use dry humor or sarcasm to emphasize particularly absurd or irrational behavior.
    - Humor should only be present in situations where it serves to emphasize behavioral patterns, irrationality, or absurdity in the suspect's actions.
    - Use deadpan delivery for humorous observations, maintaining the overall serious tone.
    """

    system_prompt = base_system_prompt + humor_guidelines

    # Construct the prompt with combined moments
    prompt = f"""Based on the following information from a police bodycam video, generate concise, insightful commentary that creates an engaging narrative structure:

    {description}

    Provide the commentary moment in the format:
    {{
        "timestamp": "MM:SS",
        "commentary": "Your concise commentary here"
    }}

    Remember to structure the commentary to build tension, reveal information strategically, and create an engaging narrative arc throughout the video analysis.
    """

        # Call the AI model
    completion = client.beta.chat.completions.parse(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt},
        ],
        response_format=CommentaryList,
    )

    # Instead of returning just the comments, return the entire CommentaryList
    return completion.choices[0].message.parsed