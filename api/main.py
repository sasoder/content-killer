from fastapi import FastAPI
from api.commentary import generate_commentary_helper
from api.description import generate_description_helper
from api.schema import TimestampTextList, UrlInput
from api.audio import generate_audio_clips
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi import HTTPException
import os
from api.audio import OUTPUT_DIR

### Create FastAPI instance with custom docs and openapi url
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


@app.post("/api/generate_commentary")
def generate_commentary(description: TimestampTextList) -> TimestampTextList:
    print(f"Generating commentary for {description}")
    commentary = generate_commentary_helper(description)
    return commentary

@app.post("/api/generate_description")
async def generate_description(input: UrlInput) -> TimestampTextList:
    print(f"Generating description for {input.url}")
    description = generate_description_helper(input.url)
    return description

@app.post("/api/generate_audio")
def generate_audio(commentary: TimestampTextList):
    print(f"Generating audio for {commentary}")
    generated_files = generate_audio_clips(commentary)
    return {"message": "Audio clips generated successfully", "files": generated_files}

@app.get("/api/get_audio_clip/{filename}")
async def get_audio(filename: str):
    file_path = os.path.join(OUTPUT_DIR, filename)
    if os.path.exists(file_path):
        return FileResponse(file_path, media_type="audio/mpeg")
    raise HTTPException(status_code=404, detail="Audio file not found")