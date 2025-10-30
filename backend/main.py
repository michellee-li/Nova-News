# main.py
import os
import logging, traceback
from pathlib import Path
from dotenv import load_dotenv
from fastapi.templating import Jinja2Templates
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from backend.user import router as user_router
from backend.gpt_advice import router as gpt_router
from backend.budget import router as budget_router
from fastapi.middleware.cors import CORSMiddleware
import requests

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("backend")

# --- Load .env from project root (same folder as this file) ---
ROOT_DIR = Path(__file__).resolve().parent
load_dotenv(dotenv_path=str(ROOT_DIR / ".env"))

SUPABASE_URL = os.getenv("SUPABASE_URL") or ""
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY") or ""
NEWS_API_KEY = os.getenv("NEWS_API_KEY") or ""


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

templates = Jinja2Templates(directory=str(ROOT_DIR / "templates"))

@app.middleware("http")
async def log_requests(request: Request, call_next):
    try:
        body = await request.body()
        log.info(f"[REQ] {request.method} {request.url.path} body={body.decode(errors='ignore')[:500]}")
        resp = await call_next(request)
        log.info(f"[RESP] {request.method} {request.url.path} status={resp.status_code}")
        return resp
    except Exception:
        log.error(f"[EXC] {request.method} {request.url.path}\n{traceback.format_exc()}")
        return JSONResponse({"detail": "Internal server error"}, status_code=500)

# Routers
app.include_router(user_router, prefix="/api")
app.include_router(gpt_router, prefix="/api")
app.include_router(budget_router, prefix="/api/budget", tags=["budget"])

@app.get("/")
def root():
    return {"message": "NovaNews API is running"}

# Simple health check
@app.get("/api/health")
def health():
    return {"ok": True}

@app.get("/api/news")
def get_news(country: str = "us", pageSize: int = 50):
    """
    Minimal proxy endpoint to fetch top headlines from NewsAPI.
    Keeps NEWS_API_KEY private (not exposed to client).
    """
    if not NEWS_API_KEY:
        raise HTTPException(status_code=500, detail="NEWS_API_KEY not configured")

    try:
        res = requests.get(
            "https://newsapi.org/v2/top-headlines",
            params={"country": country, "pageSize": pageSize, "apiKey": NEWS_API_KEY},
            timeout=10,
        )
        res.raise_for_status()
        return res.json()
    except requests.RequestException as e:
        raise HTTPException(status_code=502, detail=f"Upstream error: {e}")

# ---- Password reset landing page (for Safari from Supabase email) ----
# Accept multiple token parameter names: token, token_hash, or code.
@app.get("/reset-password")
async def reset_password(
    request: Request,
    token: str | None = None,
    token_hash: str | None = None,
    code: str | None = None,
    type: str | None = None,  # not required, but useful for debugging ("recovery")
):
    supplied = token or token_hash or code
    if not supplied:
        # Don’t render the page without a token—prevents confusion
        raise HTTPException(status_code=400, detail="Missing token")

    # Render template that runs Supabase JS:
    #  - exchangeCodeForSession(window.location.href)
    #  - updateUser({ password })
    return templates.TemplateResponse(
        "reset_password.html",
        {
            "request": request,
            "SUPABASE_URL": SUPABASE_URL,
            "SUPABASE_ANON_KEY": SUPABASE_ANON_KEY,
            "token": supplied,
        },
    )

@app.get("/support")
async def support():
    return """
<html>
      <head>
        <title>Nova News Support</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #fafafa;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            text-align: center;
            color: #333;
          }
          .container {
            max-width: 90%;
            padding: 20px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          h2 {
            color: #2a6cdf;
            margin-bottom: 10px;
          }
          p {
            font-size: 16px;
            line-height: 1.5;
          }
          b {
            color: #000;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Nova News Support</h2>
          <p>Need help or have questions?</p>
          <p>Email us at <b>nova.news.app@gmail.com</b> or visit this page for updates.</p>
          <p>Thank you for using Nova News.</p>
        </div>
      </body>
    </html>
    """

