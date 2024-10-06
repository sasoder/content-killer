import json
import os
from typing import List
from pydantic import BaseModel
from generate_description import generate_description
from generate_commentary import generate_commentary, Commentary, CommentaryList
from generate_audio import generate_audio_clips

def main():
    print("Welcome to the commentary generator!")
    
    # Check if a saved commentary file exists
    if os.path.exists("saved_commentary.json"):
        use_existing = input("A saved commentary file exists. Do you want to use it? (y/n): ").lower()
        if use_existing == 'y':
            with open("saved_commentary.json", "r") as f:
                commentary = CommentaryList.model_validate_json(f.read())
            print(f"Loaded existing commentary with {len(commentary.comments)} comments.")
        else:
            commentary = generate_new_commentary()
    else:
        commentary = generate_new_commentary()
    
    # Save the commentary to a file
    with open("saved_commentary.json", "w") as f:
        f.write(commentary.model_dump_json())
    print("Commentary saved to saved_commentary.json")

    # Prompt user to continue to audio generation
    generate_audio = input("Do you want to generate audio now? (y/n): ").lower()
    if generate_audio == 'y':
        print("Generating audio...")
        generate_audio_clips(commentary)
        print("Audio generation complete!")
    else:
        print("Audio generation skipped.")

def generate_new_commentary():
    url = input("Enter the URL of the video: ")
    print("Generating video description... (this may take a while, ~2 minutes for a 7 minute video)")
    video_description = generate_description(url)
    print(f"Description generated, length: {len(video_description)}")
    print("Generating commentary...")
    commentary = generate_commentary(video_description)
    print(f"Commentary generated, amount of comments: {len(commentary.comments)}")
    print("\n-----Comments-----\n")
    for entry in commentary.comments:
        print(f"Timestamp: {entry.timestamp}, Commentary: {entry.commentary}\n")
    print("-----End of comments-----")
    
    return commentary

if __name__ == "__main__":
    main()

