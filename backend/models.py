from pydantic import BaseModel, EmailStr, Field
from typing import Optional

print(f"*** in models.py***")

class RegisterRequest(BaseModel):
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class PromptRequest(BaseModel):
    email: Optional[str] = None
    prompt: str = Field(..., min_length=5)