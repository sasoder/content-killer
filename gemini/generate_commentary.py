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
    base_system_prompt = """Generate concise, razor-sharp, and psychologically insightful commentary for a police bodycam video in the style of JCS Criminal Psychology. Each commentary point must:
- Be **authoritative** and **confident**—avoid speculative language such as "could signify" or "possibly."
- Focus on the **suspect’s and officer’s behavior, intentions, and psychology** (1-2 sentences per moment).
- Avoid unnecessary descriptions of the scene unless they reveal psychological insight or telltale behavior.
- Highlight manipulative tactics, inconsistencies, or psychological patterns with **confidence**. 
- Use phrases like "This reveals...", "This shows...", or "Here we see..." to state **definitive** conclusions about behavior or actions.
- Engage the viewer by drawing attention to **significant behavioral details**.
- Focus on **observable behavior** and its psychological implications—eliminate any speculation.
- Avoid over-commenting—choose only key moments that deserve analysis.

Structure the commentary to:
- Identify pivotal behavioral shifts—such as changes in tone, cooperation, or physical actions.
- **Prioritize bizarre, absurd, or humorous lines** from the dialogue (quoted exactly) that reveal important psychological insights. For example, "His comment 'whatever y’all got going on here is pretty damn good' shows complete disconnect from reality, likely a defense mechanism to deflect accountability."
- Use dry humor or sarcasm in a **deadpan manner** to highlight irrational or absurd behavior in the suspect's actions or statements.
- Gradually reveal the layers of complexity in the suspect’s psychology or tactics.
- Occasionally use rhetorical questions to provoke the viewer’s critical thinking, but do so sparingly and only when it fits the situation.

**Timestamp Guidelines**:
- Timestamps must be in the format **MM:SS** (e.g., "01:15").
- Commentary should be timed **intelligently** based on the event’s significance:
    - If the commentary describes a **prelude** to an event, place the timestamp **just before** the event occurs.
    - If the commentary analyzes an action **that has already occurred**, place the timestamp **just after** the event.
    - Avoid timestamp ranges like "0:14-0:16"; select a precise moment instead.

**Quality Over Quantity**:
- Prioritize **quality** over **quantity**. 
- For a typical 6-minute video, aim for **6 to 10 key commentary points** that offer significant psychological or behavioral insights.
- Only provide commentary when there’s something **substantial** to observe or analyze; avoid commenting on mundane or irrelevant moments.
"""

    system_prompt = base_system_prompt

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