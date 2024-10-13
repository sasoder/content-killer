from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class UrlInput(BaseModel):
    url: str

class DescriptionOptions(BaseModel):
    # Define your description-related options here
    example_option: Optional[str] = None

class CommentaryOptions(BaseModel):
    intro: bool = True
    outro: bool = True
    temperature: float = 0.7

class AudioOptions(BaseModel):
    speed: float = 1.0

class GenerateDescriptionInput(BaseModel):
    url: str
    options: Optional[DescriptionOptions] = None

class TimestampText(BaseModel):
    timestamp: str
    text: str

class TimestampTextList(BaseModel):
    items: List[TimestampText]

class GenerateCommentaryInput(BaseModel):
    description: TimestampTextList
    options: Optional[CommentaryOptions] = None

class GenerateAudioInput(BaseModel):
    commentary: TimestampTextList
    options: Optional[AudioOptions] = None


class AudioFile(BaseModel):
    timestamp: str
    filename: str
