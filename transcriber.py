import os
import json
import torch
import whisper
from tqdm import tqdm

def format_timestamp(seconds):
    minutes, seconds = divmod(int(seconds), 60)
    return f"{minutes:02d}:{seconds:02d}"

def transcribe_audio_files(folder_path, model_name="base"):
    # Check if CUDA is available and set the device
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Using device: {device}")

    # Load the Whisper model
    model = whisper.load_model(model_name).to(device)

    # Get all audio files in the folder
    audio_files = [f for f in os.listdir(folder_path) if f.endswith(('.mp3', '.wav', '.m4a', '.flac'))]

    for audio_file in tqdm(audio_files, desc="Processing audio files"):
        audio_path = os.path.join(folder_path, audio_file)
        try:
            # Transcribe the audio
            result = model.transcribe(audio_path)
            
            # Process the transcript
            dialogue_data = []
            for segment in result["segments"]:
                dialogue_data.append({
                    "timestamp": format_timestamp(segment["start"]),
                    "dialogue": segment["text"],
                    "speaker": "Unknown"  # Default speaker, can be updated later
                })
            
            # Generate the output file name
            output_file = os.path.splitext(audio_file)[0] + ".json"
            output_path = os.path.join(folder_path, output_file)
            
            # Save the transcription as JSON
            with open(output_path, "w", encoding="utf-8") as f:
                json.dump({
                    "dialogue": dialogue_data,
                    "duration": result["segments"][-1]["end"]
                }, f, indent=2, ensure_ascii=False)
            
            print(f"Transcription saved: {output_path}")
        except Exception as e:
            print(f"Error processing {audio_file}: {str(e)}")

    print(f"Transcription complete. {len(audio_files)} files processed.")

if __name__ == "__main__":
    fine_tuning_folder = "./fine-tuning"
    transcribe_audio_files(fine_tuning_folder)