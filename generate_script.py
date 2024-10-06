import os
import subprocess
import json
import base64
import requests
from dotenv import load_dotenv
from openai import OpenAI
from yt_dlp import YoutubeDL
from pydantic import BaseModel, Field
from typing import List, Dict

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class PivotalMoment(BaseModel):
    timestamp: str
    description: str
    visual_cues: str

class PivotalMoments(BaseModel):
    moments: List[PivotalMoment]

class Commentary(BaseModel):
    timestamp: str
    commentary: str

class CommentaryList(BaseModel):
    comments: List[Commentary]

def download_youtube_video(url, output_path):
    print(f"Downloading video from: {url}")
    ydl_opts = {
        'outtmpl': output_path,
        'format': 'bestvideo[filesize<50M][ext=mp4]+bestaudio[ext=m4a]/best[filesize<50M][ext=mp4]/best[filesize<50M]',
        'max_filesize': 50 * 1024 * 1024,
    }
    with YoutubeDL(ydl_opts) as ydl:
        try:
            ydl.download([url])
            print("Video downloaded successfully")
            return True
        except Exception as e:
            print(f"An error occurred while downloading: {e}")
            return False

def extract_audio(video_path, audio_path):
    print(f"Extracting audio from {video_path} to {audio_path}")
    subprocess.run(["ffmpeg", "-i", video_path, "-q:a", "0", "-map", "a", audio_path])
    print("Audio extraction completed")

def transcribe_audio(audio_path):
    print(f"Transcribing audio from {audio_path}")
    with open(audio_path, "rb") as audio_file:
        transcript = client.audio.transcriptions.create(
            model="whisper-1", 
            file=audio_file,
            response_format="verbose_json"
        )
    print("Transcription completed")
    return transcript

def format_timestamp(seconds):
    minutes, seconds = divmod(int(seconds), 60)
    return f"{minutes:02d}:{seconds:02d}"

def identify_pivotal_moments(dialogue_data):
    print("Identifying pivotal moments")
    prompt = f"""Analyze the following dialogue from police body cam footage and identify pivotal moments:

{json.dumps(dialogue_data, indent=2)}

For each pivotal moment, provide:
1. Timestamp
2. Brief description of why it's pivotal
3. Potential visual cues to look for

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
- For moments of heightened tension or potential conflict, note them as "Watch closely" or "Tension rises here".

Remember, this is real police body cam footage. Focus on actual events and dialogues that occur during the police encounter, capturing both the serious nature of the situation and any unexpectedly absurd or humorous elements.

Aim for a comprehensive set of pivotal moments that captures the essence of the body cam footage, providing a framework for engaging commentary."""
    completion = client.beta.chat.completions.parse(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "Extract a comprehensive set of pivotal moments from police body cam footage dialogue, ensuring they occur at least every 30-60 seconds and capture all significant events and interactions."},
            {"role": "user", "content": prompt},
        ],
        response_format=PivotalMoments,
    )

    initial_moments = completion.choices[0].message.parsed.moments
    print(f"Initially identified {len(initial_moments)} pivotal moments")
    
    # Ensure pivotal moments occur at least every 30-60 seconds
    final_moments = []
    last_timestamp = -60  # Start at -60 to ensure we don't miss any moments at the very beginning
    for moment in initial_moments:
        current_timestamp = int(moment.timestamp.split(":")[0]) * 60 + int(moment.timestamp.split(":")[1])
        time_diff = current_timestamp - last_timestamp
        
        if time_diff >= 30 or not final_moments:
            final_moments.append(moment)
            last_timestamp = current_timestamp
        elif time_diff < 30 and len(final_moments) > 0:
            # If less than 30 seconds have passed, but the moment is significantly different, include it
            last_moment = final_moments[-1]
            if moment.description.lower() not in last_moment.description.lower():
                final_moments.append(moment)
                last_timestamp = current_timestamp
    
    # If there are large gaps (>60 seconds) between moments, request additional moments for those gaps
    gaps = []
    for i in range(len(final_moments) - 1):
        current_timestamp = int(final_moments[i].timestamp.split(":")[0]) * 60 + int(final_moments[i].timestamp.split(":")[1])
        next_timestamp = int(final_moments[i+1].timestamp.split(":")[0]) * 60 + int(final_moments[i+1].timestamp.split(":")[1])
        if next_timestamp - current_timestamp > 60:
            gaps.append((final_moments[i].timestamp, final_moments[i+1].timestamp))
    
    if gaps:
        gap_prompt = f"Please identify additional pivotal moments for the following time ranges:\n\n"
        for start, end in gaps:
            gap_prompt += f"Between {start} and {end}\n"
        gap_prompt += "\nProvide moments in the same format as before."
        
        gap_completion = client.beta.chat.completions.parse(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Identify additional pivotal moments for the specified time ranges."},
                {"role": "user", "content": gap_prompt},
            ],
            response_format=PivotalMoments,
        )
        
        additional_moments = gap_completion.choices[0].message.parsed.moments
        final_moments.extend(additional_moments)
        final_moments.sort(key=lambda x: x.timestamp)
    
    print(f"Final number of pivotal moments: {len(final_moments)}")
    
    # Print pivotal moments and ask for user confirmation
    print("\nIdentified pivotal moments:")
    for i, moment in enumerate(final_moments, 1):
        print(f"{i}. {moment.timestamp} - {moment.description}")
    
    while True:
        user_input = input("\nDo you want to proceed with these pivotal moments? (yes/no): ").lower()
        if user_input in ['yes', 'y']:
            return final_moments
        elif user_input in ['no', 'n']:
            print("Aborting the process. Please run the script again.")
            exit()
        else:
            print("Invalid input. Please enter 'yes' or 'no'.")

def extract_frame(video_path, timestamp, output_path):
    print(f"Extracting frame at {timestamp} to {output_path}")
    result = subprocess.run([
        "ffmpeg", "-ss", timestamp, "-i", video_path,
        "-vframes", "1", "-q:v", "2", output_path
    ], capture_output=True, text=True)
    
    if result.returncode != 0:
        print(f"Error extracting frame at {timestamp}:")
        print(result.stderr)
        return False
    
    if not os.path.exists(output_path):
        print(f"Frame extraction failed: {output_path} not created")
        return False
    
    print(f"Frame extracted successfully: {output_path}")
    return True

def analyze_frame(frame_path, description, visual_cues):
    with open(frame_path, "rb") as image_file:
        base64_image = base64.b64encode(image_file.read()).decode('utf-8')
    
    prompt = f"""Analyze this image from a video:

Description: {description}
Visual cues to look for: {visual_cues}

Describe what you see in the image that relates to the description and visual cues. Be concise and focus on relevant details. It will be a bodycam video of a police officer and possibly a suspect."""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
                ],
            }
        ],
        max_tokens=300
    )
    return response.choices[0].message.content.strip()

def generate_commentary(dialogue_data, pivotal_moments, visual_analyses):
    print("Generating commentary")
    system_prompt = """Create razor-sharp, insightful commentary for a police bodycam video in the style of JCS Criminal Psychology, but with a slightly more critical edge. Your commentary should:
1. Be brief and incisive (1-2 sentences per timestamp)
2. Provide definitive psychological insights and behavioral analysis
3. Use a confident, authoritative tone
4. Address individuals consistently as "the officer" and "the suspect"
5. Reflect the perspective of an expert analyzing bodycam footage
6. Engage the viewer by highlighting subtle but significant details
7. Maintain a serious, professional tone while acknowledging absurd or humorous moments with deadpan delivery
8. Avoid speculation and focus on observable behaviors and their implications
9. Use phrases like "Notice...", "Here we see...", or "This behavior indicates..." to guide the viewer's attention
10. Highlight manipulative tactics, inconsistencies, or telling psychological patterns
11. When the subject is clearly in the wrong or acting foolishly, adopt a slightly mocking or critical tone
12. Use dry humor or sarcasm to emphasize particularly absurd or irrational behavior
13. For key phrases or important statements, build anticipation with comments like "Pay close attention to what's about to be said" or "This next statement is crucial"
14. When bizarre or unexpected moments are coming up, tease them with phrases like "You won't believe what's about to happen" or "This next interaction defies explanation"

The commentary should read like expert analysis, offering viewers unique insights they might otherwise miss, while not shying away from pointing out egregious mistakes or foolish actions."""

    prompt = f"""Based on the following information from a police bodycam video, generate sharp, JCS-style commentary with a critical edge:

    Dialogue: {json.dumps(dialogue_data, indent=2)}

    Pivotal Moments:
    {json.dumps([moment.model_dump() for moment in pivotal_moments], indent=2)}

    Visual Analyses:
    {json.dumps(visual_analyses, indent=2)}

    Provide commentary for EACH pivotal moment. Your response should be a list of commentary entries, where each entry follows this format:
    {{
        "timestamp": "MM:SS",
        "commentary": "Your incisive commentary here"
    }}

Guidelines for each commentary entry:
1. Use the exact timestamp from the corresponding pivotal moment.
2. Keep the commentary concise and impactful (1-2 sentences max).
3. Offer definitive insights about behavior, psychology, and tactics.
4. Use phrases like "Notice...", "Here we see...", or "This behavior indicates..." to guide the viewer when appropriate.
5. Maintain an authoritative tone appropriate for expert analysis of criminal behavior.
6. For absurd or humorous moments, acknowledge them with a deadpan tone, highlighting the contrast with the serious situation.
7. When the subject is clearly in the wrong or acting foolishly, use a slightly mocking or critical tone.
8. Employ dry humor or sarcasm to emphasize particularly irrational or absurd behavior.
9. For key phrases or important statements, build anticipation with brief comments like "Listen closely to what follows" or "This next statement reveals volumes".
10. When bizarre or unexpected moments are coming up, tease them with short phrases like "Brace yourself for what's next" or "This defies all logic and reason".
    Ensure that you provide commentary for every pivotal moment, in the order they appear in the video."""

    completion = client.beta.chat.completions.parse(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt},
        ],
        response_format=CommentaryList,
    )

    commentary = completion.choices[0].message.parsed.comments
    print(f"Commentary generated for {len(commentary)} moments")
    return commentary

def extract_first_frame(video_path, output_path):
    print(f"Extracting first frame to {output_path}")
    result = subprocess.run([
        "ffmpeg", "-i", video_path,
        "-vframes", "1", "-q:v", "2", output_path
    ], capture_output=True, text=True)
    
    if result.returncode != 0 or not os.path.exists(output_path):
        print(f"Error extracting first frame:")
        print(result.stderr)
        return False
    
    print(f"First frame extracted successfully: {output_path}")
    return True

def extract_last_frame(video_path, output_path):
    print(f"Extracting last frame to {output_path}")
    result = subprocess.run([
        "ffmpeg", "-sseof", "-3", "-i", video_path,
        "-update", "1", "-q:v", "2", output_path
    ], capture_output=True, text=True)
    
    if result.returncode != 0 or not os.path.exists(output_path):
        print(f"Error extracting last frame:")
        print(result.stderr)
        return False
    
    print(f"Last frame extracted successfully: {output_path}")
    return True

def main(youtube_url):
    if os.path.exists("commentary.json"):
        print("commentary.json found. Skipping to audio generation.")
        generate_audio_clips()
    else:
        video_path = "temp_video.mp4"
        audio_path = "temp_audio.mp3"
        frames_dir = "frames"
        os.makedirs(frames_dir, exist_ok=True)
        
        if not download_youtube_video(youtube_url, video_path):
            print("Failed to download the video. Exiting.")
            return

        extract_audio(video_path, audio_path)

        # Check if dialogue.json exists
        if os.path.exists("dialogue.json"):
            print("Loading dialogue data from dialogue.json")
            with open("dialogue.json", "r") as f:
                data = json.load(f)
                if isinstance(data, dict) and "dialogue" in data and "duration" in data:
                    dialogue_data = data["dialogue"]
                    video_duration = data["duration"]
                else:
                    print("dialogue.json is not in the expected format. Regenerating transcription.")
                    dialogue_data, video_duration = None, None
        else:
            dialogue_data, video_duration = None, None

        if dialogue_data is None or video_duration is None:
            transcript = transcribe_audio(audio_path)
            dialogue_data = [{"timestamp": format_timestamp(segment.start), "dialogue": segment.text} for segment in transcript.segments]
            video_duration = transcript.segments[-1].end
            
            with open("dialogue.json", "w") as f:
                json.dump({"dialogue": dialogue_data, "duration": video_duration}, f, indent=2)
            print("Dialogue data saved to dialogue.json")

        pivotal_moments = identify_pivotal_moments(dialogue_data)
        
        # Extract and analyze first and last frames
        first_frame_path = os.path.join(frames_dir, "first_frame.jpg")
        last_frame_path = os.path.join(frames_dir, "last_frame.jpg")
        
        if extract_first_frame(video_path, first_frame_path):
            first_frame_analysis = analyze_frame(first_frame_path, "Start of the video", "Initial setting and context")
        else:
            print("Failed to extract first frame. Skipping analysis.")
            first_frame_analysis = "First frame analysis not available due to extraction failure."

        if extract_last_frame(video_path, last_frame_path):
            last_frame_analysis = analyze_frame(last_frame_path, "End of the video", "Final scene and resolution")
        else:
            print("Failed to extract last frame. Skipping analysis.")
            last_frame_analysis = "Last frame analysis not available due to extraction failure."
        
        visual_analyses = []
        for moment in pivotal_moments:
            frame_path = os.path.join(frames_dir, f"frame_{moment.timestamp.replace(':', '_')}.jpg")
            if extract_frame(video_path, moment.timestamp, frame_path):
                analysis = analyze_frame(frame_path, moment.description, moment.visual_cues)
                visual_analyses.append({
                    "timestamp": moment.timestamp,
                    "description": moment.description,
                    "visual_analysis": analysis
                })
            else:
                print(f"Skipping analysis for timestamp {moment.timestamp} due to frame extraction failure")
        
        visual_analyses.insert(0, {"timestamp": "00:00", "description": "Start of video", "visual_analysis": first_frame_analysis})
        visual_analyses.append({"timestamp": format_timestamp(video_duration), "description": "End of video", "visual_analysis": last_frame_analysis})
        
        with open("visual_analyses.json", "w") as f:
            json.dump(visual_analyses, f, indent=2)
        print("Visual analyses saved to visual_analyses.json")
        
        # New code: Checkpoint after visual analyses
        print("\nVisual analyses completed. Here's a summary:")
        for analysis in visual_analyses:
            print(f"{analysis['timestamp']} - {analysis['description']}")
        
        while True:
            user_input = input("\nDo you want to proceed with generating commentary? (yes/no): ").lower()
            if user_input in ['yes', 'y']:
                break
            elif user_input in ['no', 'n']:
                print("Aborting the process. Please run the script again.")
                exit()
            else:
                print("Invalid input. Please enter 'yes' or 'no'.")
        
        commentary = generate_commentary(dialogue_data, pivotal_moments, visual_analyses)
        
        with open("commentary.json", "w") as f:
            json.dump([c.model_dump() for c in commentary], f, indent=2)
        print("Final commentary saved to commentary.json")
        
        # Clean up temporary files
        os.remove(video_path)
        os.remove(audio_path)
        for frame in os.listdir(frames_dir):
            os.remove(os.path.join(frames_dir, frame))
        os.rmdir(frames_dir)
        print("Temporary files cleaned up")

        while True:
            user_input = input("\nDo you want to proceed with generating audio clips? (yes/no): ").lower()
            if user_input in ['yes', 'y']:
                generate_audio_clips()
                break
            elif user_input in ['no', 'n']:
                print("Aborting the process. Please run the script again.")
                exit()
            else:
                print("Invalid input. Please enter 'yes' or 'no'.")

# Define constants
CHUNK_SIZE = 1024
XI_API_KEY = os.getenv("ELEVENLABS_API_KEY")
VOICE_ID = "nPczCjzI2devNBz1zQrb"
OUTPUT_DIR = "audio_clips"

# Ensure the output directory exists
os.makedirs(OUTPUT_DIR, exist_ok=True)

def generate_audio(text, output_path):
    tts_url = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}/stream"
    
    headers = {
        "Accept": "application/json",
        "xi-api-key": XI_API_KEY
    }
    
    data = {
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.8,
            "style": 0.0,
            "use_speaker_boost": True
        }
    }
    
    response = requests.post(tts_url, headers=headers, json=data, stream=True)
    
    if response.ok:
        with open(output_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=CHUNK_SIZE):
                f.write(chunk)
        print(f"Audio saved: {output_path}")
    else:
        print(f"Error generating audio for {output_path}: {response.text}")

def timestamp_to_filename(timestamp):
    # Convert "MM:SS" to "MMSS.mp3"
    return timestamp.replace(":", "") + ".mp3"

def generate_audio_clips():
    # Load commentary data
    with open("commentary.json", "r") as f:
        commentary_data = json.load(f)

    # Generate audio for each commentary entry
    for entry in commentary_data:
        timestamp = entry["timestamp"]
        commentary = entry["commentary"]
        output_filename = timestamp_to_filename(timestamp)
        output_path = os.path.join(OUTPUT_DIR, output_filename)
        generate_audio(commentary, output_path)

    print("Audio generation complete.")

if __name__ == "__main__":
    # youtube_url = input("Enter YouTube URL: ")
    url_temp = "https://www.youtube.com/watch?v=iEmDdWZOmo4"
    main(url_temp)