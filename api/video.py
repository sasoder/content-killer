import os
import yt_dlp
from api.schema import VideoOptions, TimestampTextList
import whisper

OUTPUT_VIDEO_DIR = os.path.join(os.path.dirname(__file__), "output")
os.makedirs(OUTPUT_VIDEO_DIR, exist_ok=True)

def generate_video_helper(options: VideoOptions) -> str:
    # Get url from ./data/url.txt
    with open(os.path.join(os.path.dirname(__file__), "data", "url.txt"), "r") as f:
        url = f.read()
      
    # Download the video from the url and save it to ./temp/video.mp4 using yt-dlp
    yt_dlp.YoutubeDL().download([url], os.path.join(os.path.dirname(__file__), "temp", "video.mp4"))

    # Load commentary from ./data/commentary.json
    with open(os.path.join(os.path.dirname(__file__), "data", "commentary.json"), "r") as f:
        commentary = f.read()

    # Generate the video
    generate_video(commentary, options, os.path.join(os.path.dirname(__file__), "temp", "video.mp4"))

    # Implement the video generation logic here
    # This is a placeholder implementation

    video = os.path.join(OUTPUT_VIDEO_DIR, "output_video.mp4")
    # Example: Apply black & white and subtitles based on options
    # You would use libraries like moviepy or ffmpeg-python for actual implementation

    # For demonstration, we'll just return the options
    return video

def generate_video(items: TimestampTextList, options: VideoOptions, file_path: str) -> str:
    
    pass

def transcribe_audio(file_path: str) -> str:
    pass