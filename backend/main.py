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
from fastapi.responses import HTMLResponse, Response
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
import requests

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("backend")

app = FastAPI()

# --- Load .env from project root (same folder as this file) ---
ROOT_DIR = Path(__file__).resolve().parent
PUBLIC_DIR = ROOT_DIR / "public"  
load_dotenv(dotenv_path=str(ROOT_DIR / ".env"))

SUPABASE_URL = os.getenv("SUPABASE_URL") or ""
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY") or ""
NEWS_API_KEY = os.getenv("NEWS_API_KEY") or ""

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

@app.get("/", response_class=HTMLResponse)
def root():
    return """
    <!doctype html>
    <html>
      <head>
        <title>Nova News – Email Confirmed</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                 background: #f7f2ea; margin: 0; display: flex; align-items: center;
                 justify-content: center; min-height: 100vh; }
          .card { background: #fff; padding: 24px 28px; border-radius: 16px;
                  box-shadow: 0 8px 24px rgba(0,0,0,0.06); max-width: 420px; text-align: center; }
          h1 { margin: 0 0 12px; font-size: 24px; }
          p  { margin: 0 0 4px; color: #444; }
          .sub { font-size: 14px; color: #777; margin-top: 8px; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Email confirmed 🎉</h1>
          <p>Your Nova News account is now verified.</p>
          <p class="sub">You can return to the app and sign in.</p>
        </div>
      </body>
    </html>
    """

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
def reset_password_page():
    path = PUBLIC_DIR / "reset_password.html"
    if not path.exists():
        raise HTTPException(status_code=404, detail="reset_password.html not found")
    return FileResponse(str(path), media_type="text/html")

@app.get("/support", response_class=HTMLResponse)
async def support():
    html = """
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nova News Support</title>
        <style>
          :root {
            --accent: #4b6cb7;
            --accent-light: #182848;
            --bg: #f5f7fa;
            --text: #333;
          }
          body {
            margin: 0;
            padding: 0;
            background-color: var(--bg);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
          }
          .card {
            background: white;
            padding: 2rem;
            border-radius: 16px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            max-width: 400px;
            width: 90%;
            text-align: center;
            animation: fadeIn 0.8s ease;
          }
          h2 {
            color: var(--accent-light);
            font-weight: 600;
            margin-bottom: 1rem;
          }
          p {
            color: var(--text);
            line-height: 1.5;
            margin: 0.5rem 0;
          }
          a.email-link {
            color: var(--accent);
            text-decoration: none;
            font-weight: 500;
          }
          a.email-link:hover {
            text-decoration: underline;
          }
          .button {
            display: inline-block;
            margin-top: 1.5rem;
            padding: 0.6rem 1.2rem;
            background: linear-gradient(135deg, var(--accent), var(--accent-light));
            color: white;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 500;
            transition: opacity 0.2s ease;
          }
          .button:hover {
            opacity: 0.9;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>Nova News Support</h2>
          <p>Need help or have questions?</p>
          <p>
            Contact us anytime at 
            <a class="email-link" href="mailto:nova.news.app@gmail.com">
              nova.news.app@gmail.com
            </a>.
          </p>
          <p>We’ll get back to you as soon as possible.</p>
        </div>
      </body>
    </html>
    """
    return HTMLResponse(content=html, status_code=200)

# Mount only if the directory exists (avoid import-time crash on Render)
if PUBLIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(PUBLIC_DIR)), name="static")
else:
    import logging
    logging.warning("Public dir missing: %s", PUBLIC_DIR)

# Serve privacy page at a clean URL Apple can access
@app.get("/privacy")
def privacy():
    path = PUBLIC_DIR / "privacy.html"
    if not path.exists():
        raise HTTPException(status_code=404, detail="privacy.html not found")
    return FileResponse(str(path), media_type="text/html")

@app.get("/confirm")
def confirm():
    path = PUBLIC_DIR / "confirm.html"
    if not path.exists():
        raise HTTPException(status_code=404, detail="confirm.html not found")
    return FileResponse(str(path), media_type="text/html")
