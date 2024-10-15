import os
import yt_dlp
import json
import ffmpeg
from api.schema import VideoOptions, VideoMetadata
# Directories
OUTPUT_VIDEO_DIR = os.path.join(os.path.dirname(__file__), "data", "video")
os.makedirs(OUTPUT_VIDEO_DIR, exist_ok=True)
TEMP_DIR = os.path.join(os.path.dirname(__file__), "data", "temp")
os.makedirs(TEMP_DIR, exist_ok=True)
AUDIO_DIR = os.path.join(os.path.dirname(__file__), "data", "audio")
os.makedirs(AUDIO_DIR, exist_ok=True)

def timestamp_to_seconds(timestamp_str):
    parts = timestamp_str.strip().split(':')
    parts = [int(p) for p in parts]
    if len(parts) == 2:
        minutes, seconds = parts
        total_seconds = minutes * 60 + seconds
    elif len(parts) == 3:
        hours, minutes, seconds = parts
        total_seconds = hours * 3600 + minutes * 60 + seconds
    else:
        total_seconds = float(timestamp_str)
    return total_seconds

def timestamp_to_mp3_filename(ts_seconds):
    minutes = int(ts_seconds // 60)
    seconds = int(ts_seconds % 60)
    filename = f'{minutes:02d}{seconds:02d}.mp3'
    return filename

def get_audio_duration(audio_filepath):
    try:
        probe = ffmpeg.probe(audio_filepath)
        duration = float(probe['format']['duration'])
        return duration
    except Exception as e:
        print(f"Error getting duration for {audio_filepath}: {e}")
        return 0.0

def create_freeze_frame_segment(video_input_path, freeze_time, duration, output_path):
    (
        ffmpeg
        .input(video_input_path, ss=freeze_time, vframes=1)
        .filter('loop', loop=int(duration * 25 - 1), size=1)
        .output(output_path, vcodec='libx264', pix_fmt='yuv420p', t=duration)
        .overwrite_output()
        .run()
    )

def extract_video_segment(video_input_path, start_time, end_time, output_path):
    duration = end_time - start_time
    (
        ffmpeg
        .input(video_input_path, ss=start_time, t=duration)
        .output(output_path, vcodec='copy')
        .overwrite_output()
        .run()
    )

def concatenate_videos(segment_files, output_path):
    concat_file = os.path.join(os.path.dirname(output_path), 'concat_list.txt')
    with open(concat_file, 'w') as f:
        for segment_file in segment_files:
            f.write(f"file '{segment_file}'\n")
    (
        ffmpeg
        .input(concat_file, format='concat', safe=0)
        .output(output_path, c='copy')
        .overwrite_output()
        .run()
    )

def extract_audio_segment(audio_input_path, start_time, end_time, output_path):
    duration = end_time - start_time
    (
        ffmpeg
        .input(audio_input_path, ss=start_time, t=duration)
        .output(output_path, acodec='copy')
        .overwrite_output()
        .run()
    )

def concatenate_audios(segment_files, output_path):
    concat_file = os.path.join(os.path.dirname(output_path), 'concat_list_audio.txt')
    with open(concat_file, 'w') as f:
        for segment_file in segment_files:
            f.write(f"file '{segment_file}'\n")
    (
        ffmpeg
        .input(concat_file, format='concat', safe=0)
        .output(output_path, c='copy')
        .overwrite_output()
        .run()
    )

def combine_video_audio(video_path, audio_path, output_path):
    (
        ffmpeg
        .input(video_path)
        .input(audio_path)
        .output(output_path, vcodec='copy', acodec='copy')
        .overwrite_output()
        .run()
    )

def download_video_and_audio(url, temp_dir):
    video_output = os.path.join(temp_dir, 'video.mp4')
    audio_output = os.path.join(temp_dir, 'audio.m4a')
    
    ydl_opts_video = {
        'format': 'bestvideo[ext=mp4]',
        'outtmpl': video_output,
    }
    ydl_opts_audio = {
        'format': 'bestaudio[ext=m4a]',
        'outtmpl': audio_output,
    }
    
    with yt_dlp.YoutubeDL(ydl_opts_video) as ydl:
        ydl.download([url])
    
    with yt_dlp.YoutubeDL(ydl_opts_audio) as ydl:
        ydl.download([url])
    
    return video_output, audio_output

def read_commentary(commentary_file):
    with open(commentary_file, 'r') as f:
        commentary = json.load(f)
    return commentary

def process_video(video_input_path, commentary, audio_dir, temp_dir):
    probe = ffmpeg.probe(video_input_path)
    video_duration = float(probe['format']['duration'])
    
    timestamps = []
    for item in commentary:
        timestamp_str = item['timestamp']
        ts_seconds = timestamp_to_seconds(timestamp_str)
        timestamps.append(ts_seconds)
    
    timestamps = sorted(timestamps)
    
    segments = []
    prev_ts = 0.0
    for ts in timestamps:
        if ts > video_duration:
            print(f"Timestamp {ts} is beyond video duration {video_duration}. Skipping.")
            continue
        segments.append({'start': prev_ts, 'end': ts})
        mp3_filename = timestamp_to_mp3_filename(ts)
        mp3_filepath = os.path.join(audio_dir, mp3_filename)
        if not os.path.exists(mp3_filepath):
            print(f"Audio file {mp3_filepath} does not exist.")
            continue
        mp3_duration = get_audio_duration(mp3_filepath)
        segments.append({'start': ts, 'end': ts, 'pause_duration': mp3_duration, 'mp3_filepath': mp3_filepath})
        prev_ts = ts
    if prev_ts < video_duration:
        segments.append({'start': prev_ts, 'end': video_duration})
    
    segment_files = []
    for idx, segment in enumerate(segments):
        if 'pause_duration' in segment:
            segment_file = os.path.join(temp_dir, f'pause_segment_{idx}.mp4')
            create_freeze_frame_segment(video_input_path, segment['start'], segment['pause_duration'], segment_file)
            segment_files.append(segment_file)
        else:
            segment_file = os.path.join(temp_dir, f'video_segment_{idx}.mp4')
            extract_video_segment(video_input_path, segment['start'], segment['end'], segment_file)
            segment_files.append(segment_file)
    final_video = os.path.join(temp_dir, 'processed_video.mp4')
    concatenate_videos(segment_files, final_video)
    return final_video

def process_audio(audio_input_path, commentary, audio_dir, temp_dir):
    probe = ffmpeg.probe(audio_input_path)
    audio_duration = float(probe['format']['duration'])
    
    timestamps = []
    for item in commentary:
        timestamp_str = item['timestamp']
        ts_seconds = timestamp_to_seconds(timestamp_str)
        timestamps.append(ts_seconds)
    
    timestamps = sorted(timestamps)
    
    segments = []
    prev_ts = 0.0
    for ts in timestamps:
        if ts > audio_duration:
            print(f"Timestamp {ts} is beyond audio duration {audio_duration}. Skipping.")
            continue
        segments.append({'start': prev_ts, 'end': ts})
        mp3_filename = timestamp_to_mp3_filename(ts)
        mp3_filepath = os.path.join(audio_dir, mp3_filename)
        if not os.path.exists(mp3_filepath):
            print(f"Audio file {mp3_filepath} does not exist.")
            continue
        mp3_duration = get_audio_duration(mp3_filepath)
        segments.append({'mp3_filepath': mp3_filepath})
        prev_ts = ts
    if prev_ts < audio_duration:
        segments.append({'start': prev_ts, 'end': audio_duration})
    
    segment_files = []
    for idx, segment in enumerate(segments):
        if 'mp3_filepath' in segment:
            segment_files.append(segment['mp3_filepath'])
        else:
            segment_file = os.path.join(temp_dir, f'audio_segment_{idx}.mp3')
            extract_audio_segment(audio_input_path, segment['start'], segment['end'], segment_file)
            segment_files.append(segment_file)
    final_audio = os.path.join(temp_dir, 'processed_audio.mp3')
    concatenate_audios(segment_files, final_audio)
    return final_audio

def generate_video_helper(url: str, options: VideoOptions):
    with open(os.path.join(os.path.dirname(__file__), "data", "url.txt"), "r") as f:
        url = f.read().strip()
    
    temp_dir = os.path.join(os.path.dirname(__file__), "data", "temp")
    audio_dir = os.path.join(os.path.dirname(__file__), "data", "audio")
    output_video_dir = os.path.join(os.path.dirname(__file__), "data", "video")
    os.makedirs(temp_dir, exist_ok=True)
    os.makedirs(audio_dir, exist_ok=True)
    os.makedirs(output_video_dir, exist_ok=True)
    
    video_input_path, audio_input_path = download_video_and_audio(url, temp_dir)
    commentary_file = os.path.join(os.path.dirname(__file__), "data", "commentary.json")
    commentary = read_commentary(commentary_file)
    processed_video = process_video(video_input_path, commentary, audio_dir, temp_dir)
    processed_audio = process_audio(audio_input_path, commentary, audio_dir, temp_dir)
    final_output_path = os.path.join(output_video_dir, "final.mp4")
    combine_video_audio(processed_video, processed_audio, final_output_path)
    print(f"Final video saved to {final_output_path}")

def generate_video_metadata_helper(url: str) -> VideoMetadata:
    with yt_dlp.YoutubeDL() as ydl:
        info = ydl.extract_info(url, download=False)
    return VideoMetadata(title=info['title'], duration=info['duration_string'])

