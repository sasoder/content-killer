import json
import os
import requests
from dotenv import load_dotenv

load_dotenv()

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

from typing import List
from generate_commentary import Commentary, CommentaryList

def determine_if_good_comment(comment: Commentary):
    print(f"------Current comment------")
    print("\n")
    print(comment.commentary)
    print("\n")
    print(comment.timestamp)
    print(f"-----Should this comment be made into an audio clip? (y/n)------")
    response = input()
    if response == "y":
        return True
    else:
        return False

def generate_audio_clips(commentary_data: CommentaryList):
    # Generate audio for each commentary entry
    total_comments = len(commentary_data.comments)
    for index, entry in enumerate(commentary_data.comments, start=1):
        print(f"Processing comment {index}/{total_comments}")
        if determine_if_good_comment(entry):
            print(f"Generating audio for {entry.timestamp}")
            timestamp = entry.timestamp
            commentary = entry.commentary
            output_filename = timestamp_to_filename(timestamp)
            output_path = os.path.join(OUTPUT_DIR, output_filename)
            generate_audio(commentary, output_path)
        else:
            print(f"Skipping audio generation for {entry.timestamp}")