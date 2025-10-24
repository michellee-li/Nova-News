# === backend/gpt_advice.py ===
import os
from openai import OpenAI
from fastapi import APIRouter, HTTPException
from backend.models import PromptRequest
from dotenv import load_dotenv

# Load environment variables
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
load_dotenv(dotenv_path=env_path)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
MODEL_CHATGPT = os.getenv("MODEL_CHATGPT", "gpt-4o-mini")

client = OpenAI(api_key=OPENAI_API_KEY)
router = APIRouter()

@router.post("/prompt")
def ask_openai(req: PromptRequest):
    """
    Chat endpoint for the Nova News assistant.
    No chat history is saved; returns only the AI response.
    """
    try:
        response = client.chat.completions.create(
            model=MODEL_CHATGPT,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are Emily, a trauma-informed financial planning assistant. "
                        "Offer concise, practical steps and US-based financial resources "
                        "when appropriate. Be kind, calm, and easy to understand."
                    ),
                },
                {"role": "user", "content": req.prompt},
            ],
        )

        answer = response.choices[0].message.content
        return {"response": answer}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
