from pydantic import BaseModel
from typing import List, Optional


# General
class TimestampText(BaseModel):
    timestamp: str
    text: str

class TimestampTextList(BaseModel):
    items: List[TimestampText]

# Description
class DescriptionOptions(BaseModel):
    sample: bool

class GenerateDescriptionInput(BaseModel):
    url: str
    options: Optional[DescriptionOptions] = None

# Commentary
class CommentaryOptions(BaseModel):
    intro: bool
    outro: bool
    temperature: float

class GenerateCommentaryInput(BaseModel):
    items: List[TimestampText]
    options: Optional[CommentaryOptions] = None

# Audio
class AudioFile(BaseModel):
    timestamp: str
    filename: str

class AudioOptions(BaseModel):
    speed: float