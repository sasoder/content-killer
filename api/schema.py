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
    sample: Optional[bool] = False

class DescriptionRequest(BaseModel):
    url: str
    options: DescriptionOptions

# Commentary
class CommentaryOptions(BaseModel):
    intro: bool
    outro: bool
    temperature: float

class CommentaryRequest(BaseModel):
    items: TimestampTextList
    options: CommentaryOptions

# Audio
class AudioOptions(BaseModel):
    stability: float

class AudioResponse(BaseModel):
    items: List[str]

class AudioRequest(BaseModel):
    items: TimestampTextList
    options: AudioOptions

class VideoOptions(BaseModel):
    bw: bool
    playSound: bool
    subtitlesEnabled: bool
    subtitlesSize: int

class VideoRequest(BaseModel):
    options: VideoOptions

class VideoResponse(BaseModel):
    filename: str
