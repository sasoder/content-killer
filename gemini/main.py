import json
import os
from typing import List
from pydantic import BaseModel
from generate_description import generate_description
from generate_commentary import generate_commentary, Commentary, CommentaryList
from generate_audio import generate_audio_clips

def main():
    print("Welcome to the commentary generator!")
    
    output_dir = os.path.join(os.getcwd(), 'outputs')
    os.makedirs(output_dir, exist_ok=True)
    
    description_path = os.path.join(output_dir, "description.json")
    commentary_path = os.path.join(output_dir, "commentary.json")
    
    # Handle description
    video_description = handle_file_input(
        description_path,
        "A saved description file exists. Do you want to use it?",
        lambda: generate_new_description()
    )
    
    # Handle commentary
    commentary = handle_file_input(
        commentary_path,
        "A saved commentary file exists. Do you want to use it?",
        lambda: generate_new_commentary(video_description)
    )
    
    # Save the commentary to a file
    with open(commentary_path, "w") as f:
        f.write(commentary.model_dump_json())
    print(f"Commentary saved to {commentary_path}")

    # Prompt user to continue to audio generation
    generate_audio = input("Do you want to generate audio now? (y/n): ").lower()
    if generate_audio == 'y':
        print("Generating audio...")
        generate_audio_clips(commentary)
        print("Audio generation complete!")
    else:
        print("Audio generation skipped.")

def handle_file_input(file_path, prompt, generate_func):
    if os.path.exists(file_path):
        use_existing = input(f"{prompt} (y/n): ").lower()
        if use_existing == 'y':
            with open(file_path, "r") as f:
                return json.load(f)
    return generate_func()

def generate_new_description():
    url = input("Enter the URL of the video: ")
    print("Generating video description... (this may take a while, ~2 minutes for a 7 minute video)")
    video_description = generate_description(url)
    print(f"Description generated, length: {len(video_description)}")
    
    # Save the description to a file
    output_dir = os.path.join(os.getcwd(), 'outputs')
    description_path = os.path.join(output_dir, "description.json")
    with open(description_path, "w") as f:
        json.dump(video_description, f)
    print(f"Description saved to {description_path}")
    
    return video_description

def generate_new_commentary(video_description):
    print("Generating commentary...")
    commentary = generate_commentary(video_description)
    print(f"Commentary generated, amount of comments: {len(commentary.comments)}")
    print("\n-----Comments-----\n")
    i = 0
    for entry in commentary.comments:
        i += 1
        print(f"{i}. {entry.timestamp}: {entry.commentary}\n")
    print("-----End of comments-----")
    
    return commentary

if __name__ == "__main__":
    main()

