from fastapi import FastAPI, HTTPException, Body
from api.commentary import generate_commentary_helper
from api.description import generate_description_helper
from api.schema import (
    TimestampTextList,
    AudioResponse,
    DescriptionRequest,
    CommentaryRequest,
    AudioRequest,
    VideoRequest,
    VideoResponse,
)
from api.audio import generate_audio_clips, OUTPUT_DIR
from api.video import generate_video_helper
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import os
import json
from pydantic import BaseModel

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

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "output")
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)


@app.post("/api/generate_description")
async def generate_description(request: DescriptionRequest = Body(...)):
    description = generate_description_helper(request.url, request.options)
    try:
        with open(os.path.join(DATA_DIR, "description.json"), "w") as f:
            json.dump(description.model_dump(), f)
        return description
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/get_description", response_model=TimestampTextList)
async def get_description() -> TimestampTextList:
    try:
        with open(os.path.join(DATA_DIR, "description.json"), "r") as f:
            return TimestampTextList.model_validate(json.load(f))
    except FileNotFoundError:
        return TimestampTextList(items=[])

@app.post("/api/generate_commentary")
async def generate_commentary(request: CommentaryRequest = Body(...)):
    commentary = generate_commentary_helper(request.items, request.options)
    try:
        with open(os.path.join(DATA_DIR, "commentary.json"), "w") as f:
            json.dump(commentary.model_dump(), f)
        return commentary
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/get_commentary", response_model=TimestampTextList)
async def get_commentary() -> TimestampTextList:
    try:
        with open(os.path.join(DATA_DIR, "commentary.json"), "r") as f:
            return TimestampTextList.model_validate(json.load(f))
    except FileNotFoundError:
        return TimestampTextList(items=[])

@app.post("/api/generate_audio")
async def generate_audio(request: AudioRequest = Body(...)):
    print(f"Generating audio with items: {request.items} and options: {request.options}")
    try:
        audio_files = generate_audio_clips(request.items, request.options)
        with open(os.path.join(DATA_DIR, "audio.json"), "w") as f:
            json.dump(audio_files.model_dump(), f)
        return audio_files
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/get_audio", response_model=AudioResponse)
async def get_audio() -> AudioResponse:
    try:
        with open(os.path.join(DATA_DIR, "audio.json"), "r") as f:
            return AudioResponse.model_validate(json.load(f))
    except FileNotFoundError:
        return AudioResponse(items=[])

@app.get("/api/get_file/{filename}", response_class=FileResponse)
async def get_file(filename: str):
    file_path = os.path.join(OUTPUT_DIR, filename)
    if os.path.exists(file_path):
        return FileResponse(file_path)
    raise HTTPException(status_code=404, detail="File not found")

# Video Endpoints
@app.post("/api/generate_video")
async def generate_video(request: VideoRequest = Body(...)) -> VideoResponse:
    print(f"Generating video with options: {request.options}")
    video = generate_video_helper(request.options)
    try:
        with open(os.path.join(DATA_DIR, "video.json"), "w") as f:
            json.dump(video.model_dump(), f)
        return video
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/get_video", response_model=VideoResponse)
async def get_video() -> VideoResponse:
    try:
        with open(os.path.join(DATA_DIR, "video.json"), "r") as f:
            return VideoResponse.model_validate(json.load(f))
    except FileNotFoundError:
        return VideoResponse(items=[])