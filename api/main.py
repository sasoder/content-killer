from fastapi import FastAPI, HTTPException
from api.commentary import generate_commentary_helper
from api.description import generate_description_helper
from api.schema import (
    GenerateDescriptionInput,
    TimestampTextList,
    GenerateCommentaryInput,
    AudioResponse,
    AudioOptions,
)
from api.audio import generate_audio_clips, OUTPUT_DIR
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import os
from typing import Dict, Any

app = FastAPI()

origins = [
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/generate_description", response_model=TimestampTextList)
async def generate_description(input: GenerateDescriptionInput) -> TimestampTextList:
    print(f"Generating description for {input.url} with options: {input.options}")
    description = generate_description_helper(input.url, input.options)
    print(f"Description: {description}")
    return description

@app.post("/api/generate_commentary", response_model=TimestampTextList)
def generate_commentary(input: GenerateCommentaryInput) -> TimestampTextList:
    print(f"Generating commentary with items: {input.items} and options: {input.options}")
    commentary = generate_commentary_helper(input.items, input.options)
    return commentary

@app.post("/api/generate_audio", response_model=AudioResponse)
def generate_audio(input: GenerateCommentaryInput, options: AudioOptions):
    print(f"Generating audio for commentary with {len(input.items)} entries")
    generated_files = generate_audio_clips(TimestampTextList(items=input.items), options)
    return generated_files

@app.get("/api/get_audio_clip/{filename}", response_class=FileResponse)
async def get_audio(filename: str):
    file_path = os.path.join(OUTPUT_DIR, filename)
    if os.path.exists(file_path):
        return FileResponse(file_path, media_type="audio/mpeg")
    raise HTTPException(status_code=404, detail="Audio file not found")