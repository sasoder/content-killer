from openai import OpenAI
import os
from dotenv import load_dotenv
from api.schema import TimestampTextList, CommentaryOptions

system_prompt = """Generate concise, sharp, and psychologically insightful commentary for a police bodycam video in the style of JCS Criminal Psychology. Each commentary point must:
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
- Avoid commenting on trivial or irrelevant moments. Only provide commentary for moments with significant psychological or behavioral insight."""

intro_prompt = """Also generate an introduction to the commentary that sets the tone for the rest of the video at 00:00. It should be 1-2 sentences but include setting the scene for the video, the key players, and the key events that will be analyzed in the commentary. It should be concise and to the point."""
outro_prompt = """Also generate an outro to the commentary that wraps up the video at the end. It should be 1-2 sentences but include a summary of the video, the key players, and the key events that will be analyzed in the commentary. It should be concise and to the point."""

def generate_commentary_helper(items: TimestampTextList, options: CommentaryOptions) -> TimestampTextList:
    load_dotenv()
    print(f"Generating commentary with {len(items)} items and options {options}")
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    prompt = f"""Based on the following information from a police bodycam video, generate concise, insightful commentary that creates an engaging narrative structure:

    {items}

    Provide the commentary moment in the format:
    {{
        "timestamp": "mm:ss",
        "text": "Your concise commentary here"
    }}

    {options.intro and intro_prompt}
    {options.outro and outro_prompt}

    Remember to structure the commentary to build tension, reveal information strategically, and create an engaging narrative arc throughout the video analysis.
    """
    completion = client.beta.chat.completions.parse(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt},
        ],
        temperature=options.temperature,
        response_format=TimestampTextList,
    )

    commentary_list = completion.choices[0].message.parsed

    data_dir = os.path.join(os.path.dirname(__file__), "./data")
    os.makedirs(data_dir, exist_ok=True)
    commentary_path = os.path.join(data_dir, "commentary.json")
    with open(commentary_path, "w") as f:
        TimestampTextList.model_dump(commentary_list, mode="json")
    print(f"Commentary saved to {commentary_path}")

    return commentary_list