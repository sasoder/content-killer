from pydantic import BaseModel
from typing import List

class Commentary(BaseModel):
    timestamp: str
    commentary: str

class CommentaryList(BaseModel):
    comments: List[Commentary]

class Description(BaseModel):
    timestamp: str
    speaker: str
    description: str

class DescriptionList(BaseModel):
    descriptions: List[Description]

class UrlInput(BaseModel):
    url: str