import vertexai
from vertexai.generative_models import GenerativeModel, Part
import json

prompt = """
Provide a detailed description of the video. Include important dialogues, actions, and events. The description should be suitable for generating insightful commentary in the style of JCS Criminal Psychology. Format your response in json list format, with objects having the structure {timestamp: "mm:ss", description: "description of what happens on the screen, and what is said"}. Make sure you don't include formatting such as "```json" or "```" in your response.

Guidelines:
- Identify a pivotal moment at least every 30-60 seconds.
- Focus on key interactions between officers and subjects, changes in the situation, or important/bizarre/absurd statements.
- Pay attention to:
 - Initial contact and assessment of the situation
 - Subject's statements or actions that may indicate intoxication, mental state, or cooperation level
 - Officer's commands or questions
 - Any mentions of weapons, injuries, or potential dangers
 - Changes in the subject's behavior or compliance
 - Arrival of additional officers or emergency services
 - Any unexpected or unusual statements by either officers or subjects
- Include both major events (e.g., use of force, arrest) and smaller, but significant moments (e.g., subject admitting to drinking).
- For key phrases or important statements, note them as "Upcoming key phrase" or "Listen closely to what follows".
- When identifying bizarre, absurd, or unexpectedly humorous moments, mark them as "Prepare for an unusual response" or "This next bit defies explanation".
- Highlight instances where the subject is clearly in the wrong or acting particularly foolish or irrational.
- Pay special attention to dialogue that seems out of place, surprisingly casual, or contrasts sharply with the seriousness of the situation.
- For moments of heightened tension or potential conflict, note them as "Watch closely".
- Could be for even just strange or unusual things that happen, like unexpected movements or irrational behavior.

Remember, this is real police body cam footage. Focus on actual events and dialogues that occur during the police encounter, capturing both the serious nature of the situation and any unexpectedly absurd or humorous elements.

Aim for a comprehensive set of pivotal moments that captures the essence of the body cam footage, providing a framework for engaging commentary.
"""

vertexai.init(project="bodycam-437820")

model = GenerativeModel("gemini-1.5-flash-002")

video_file = Part.from_uri(
    uri="https://www.youtube.com/watch?v=iEmDdWZOmo4",
    mime_type="video/mp4",
)

contents = [video_file, prompt]

response = model.generate_content(contents)

# Parse the response text as JSON
try:
    json_data = json.loads(response.text)
except json.JSONDecodeError:
    print("Error: The response is not in valid JSON format.")
    json_data = {"error": "Invalid JSON response", "raw_text": response.text}

# Save the JSON data to a file
output_file = "video_description.json"
with open(output_file, "w") as f:
    json.dump(json_data, f, indent=2)

print(f"Response saved to {output_file}")
