from fastapi import FastAPI
from api.commentary import generate_commentary_helper
from api.description import generate_description_helper
from api.schema import CommentaryList, DescriptionList
from api.audio import generate_audio_clips
from pydantic import BaseModel

### Create FastAPI instance with custom docs and openapi url
app = FastAPI(docs_url="/api/py/docs", openapi_url="/api/py/openapi.json")

class UrlInput(BaseModel):
    url: str

@app.post("/api/py/generate_commentary")
def generate_commentary(description: str) -> CommentaryList:
    print(f"Generating commentary for {description}")
    commentary = generate_commentary_helper(description)
    return commentary

@app.post("/api/py/generate_description")
async def generate_description(input: UrlInput) -> DescriptionList:
    print(f"Generating description for {input.url}")
    description = generate_description_helper(input.url)
    return description

@app.post("/api/py/generate_audio")
def generate_audio(commentary: CommentaryList):
    print(f"Generating audio for {commentary}")
    generate_audio_clips(commentary)
    return {"message": "Audio clips generated successfully"}