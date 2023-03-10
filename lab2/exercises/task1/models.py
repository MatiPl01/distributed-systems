from typing import List, Dict, Optional
from uuid import UUID, uuid4
from enum import Enum
from pydantic import BaseModel

class Answer(BaseModel):
  id: Optional[UUID] = uuid4()
  answer: str
  votes: int = 0

class Question(BaseModel):
  id: Optional[UUID] = uuid4()
  question: str
  answers: List[Answer]

class Poll(BaseModel):
  id: Optional[UUID] = uuid4()
  name: str
  questions: List[Question]
  created_at: Optional[str] = None
  updated_at: Optional[str] = None
  