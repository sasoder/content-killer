from pydantic import BaseModel
from typing import List

class UrlInput(BaseModel):
    url: str
class TimestampDescription(BaseModel):
    timestamp: str
    description: str

class TimestampTextList(BaseModel):
    items: List[TimestampDescription]

