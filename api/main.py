from fastapi import FastAPI, HTTPException
from api.commentary import generate_commentary_helper
from api.description import generate_description_helper
from api.schema import (
    GenerateDescriptionInput,
    TimestampTextList,
    GenerateCommentaryInput,
    AudioResponse,
    AudioOptions,
    CommentaryOptions,
    DescriptionOptions
)
from api.audio import generate_audio_clips, OUTPUT_DIR
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import os
import json

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
os.makedirs(DATA_DIR, exist_ok=True)

@app.post("/api/generate_description")
async def generate_description(url: str, options: DescriptionOptions):
    description = generate_description_helper(url, options)
    try:
        with open(os.path.join(DATA_DIR, "description.json"), "w") as f:
            json.dump(description.model_dump(), f)
        return {"status": 200}
    except Exception as e:
        return {"status": 500, "message": str(e)}

@app.get("/api/get_description", response_model=TimestampTextList)
async def get_description() -> TimestampTextList:
    try:
        with open(os.path.join(DATA_DIR, "description.json"), "r") as f:
            return TimestampTextList.model_validate(json.load(f))
    except FileNotFoundError:
        return TimestampTextList(items=[])

@app.post("/api/generate_commentary")
async def generate_commentary(items: TimestampTextList, options: CommentaryOptions):
    commentary = generate_commentary_helper(items, options)
    try:
        with open(os.path.join(DATA_DIR, "commentary.json"), "w") as f:
            json.dump(commentary.model_dump(), f)
        return {"status": 200}
    except Exception as e:
        return {"status": 500, "message": str(e)}

@app.get("/api/get_commentary", response_model=TimestampTextList)
async def get_commentary() -> TimestampTextList:
    try:
        with open(os.path.join(DATA_DIR, "commentary.json"), "r") as f:
            return TimestampTextList.model_validate(json.load(f))
    except FileNotFoundError:
        return TimestampTextList(items=[])
    except Exception as e:
        return {"status": 500, "message": str(e)}

@app.post("/api/generate_audio")
async def generate_audio(items: TimestampTextList, options: AudioOptions):
    print(f"Generating audio with items: {items} and options: {options}")
    try:
        audio_files = generate_audio_clips(items, options)
        with open(os.path.join(DATA_DIR, "audio.json"), "w") as f:
            json.dump(audio_files.model_dump(), f)
        return {"status": 200}
    except Exception as e:
        return {"status": 500, "message": str(e)}

@app.get("/api/get_audio", response_model=AudioResponse)
async def get_audio() -> AudioResponse:
    try:
        with open(os.path.join(DATA_DIR, "audio.json"), "r") as f:
            return AudioResponse.model_validate(json.load(f))
    except FileNotFoundError:
        return AudioResponse(items=[])
    except Exception as e:
        return {"status": 500, "message": str(e)}

@app.get("/api/get_audio_clip/{filename}", response_class=FileResponse)
async def get_audio_clip(filename: str):
    file_path = os.path.join(OUTPUT_DIR, filename)
    if os.path.exists(file_path):
        return FileResponse(file_path, media_type="audio/mpeg")
    raise HTTPException(status_code=404, detail="Audio file not found")
