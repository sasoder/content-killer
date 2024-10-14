import os
import requests
from dotenv import load_dotenv
from typing import List
from api.schema import TimestampTextList, AudioOptions, AudioResponse

load_dotenv()

# Define constants
CHUNK_SIZE = 1024
XI_API_KEY = os.getenv("ELEVENLABS_API_KEY")
VOICE_ID = os.getenv("VOICE_ID")
OUTPUT_DIR = os.getenv("OUTPUT_DIR")

# Ensure the output directory exists
os.makedirs(OUTPUT_DIR, exist_ok=True)

def generate_audio(text, output_path, options: AudioOptions):
    tts_url = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}/stream"
    
    headers = {
        "Accept": "application/json",
        "xi-api-key": XI_API_KEY
    }
    
    data = {
        "text": text,
        "model_id": "eleven_turbo_v2",
        "voice_settings": {
            "stability": options.stability,
            "similarity_boost": 0.8,
            "style": 0.0,
            "use_speaker_boost": True,
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
    # Convert "mm:ss" to "ss.mp3"
    return timestamp.replace(":", "") + ".mp3"

def generate_audio_clips(commentary_data: TimestampTextList, options: AudioOptions) -> AudioResponse:
    generated_files: List[str] = []
    total_comments = len(commentary_data.items)
    for index, entry in enumerate(commentary_data.items, start=1):
        print(f"Processing comment {index}/{total_comments}")
        print(f"Generating audio for {entry.timestamp}")
        timestamp = entry.timestamp
        commentary = entry.text
        output_filename = timestamp_to_filename(timestamp)
        output_path = os.path.join(OUTPUT_DIR, output_filename)
        generate_audio(commentary, output_path, options)
        generated_files.append(output_filename)
    return AudioResponse(items=generated_files)
