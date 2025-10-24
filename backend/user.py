# user.py
import os, requests, logging, traceback
from urllib.parse import quote
from fastapi import APIRouter, HTTPException, Body
from backend.models import RegisterRequest, LoginRequest
from dotenv import load_dotenv

print("*** in user.py ***")
log = logging.getLogger("backend")

# Load .env
# loaded = load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
loaded = load_dotenv(dotenv_path=env_path)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
EMAIL_REDIRECT_TO_CONFIRM = os.getenv("EMAIL_REDIRECT_TO_CONFIRM")
EMAIL_REDIRECT_TO_RESET = os.getenv("EMAIL_REDIRECT_TO_RESET")

if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    log.error("[ENV] Missing SUPABASE_URL or SUPABASE_ANON_KEY. url=%r key_set=%s", SUPABASE_URL, bool(SUPABASE_ANON_KEY))
    raise RuntimeError("Set SUPABASE_URL and SUPABASE_ANON_KEY in your .env")

# DEBUG: log key envs (non-sensitive)
log.info("[ENV] loaded=%s CONFIRM=%r RESET=%r", loaded, EMAIL_REDIRECT_TO_CONFIRM, EMAIL_REDIRECT_TO_RESET)

router = APIRouter()

@router.post("/register")
def register_user(req: RegisterRequest):
    try:
        log.info("[REGISTER] email=%s", req.email)
        redirect = (EMAIL_REDIRECT_TO_CONFIRM or "").strip()
        signup_url = f"{SUPABASE_URL}/auth/v1/signup"
        if redirect:
            signup_url += f"?redirect_to={quote(redirect, safe='')}"
        headers = {"apikey": SUPABASE_ANON_KEY, "Content-Type": "application/json"}
        payload = {"email": req.email, "password": req.password}

        resp = requests.post(signup_url, headers=headers, json=payload, timeout=15)
        log.info("[REGISTER->SUPABASE] status=%s text=%s", resp.status_code, resp.text[:500])

        if resp.status_code not in (200, 201):
            # DEBUG: bubble exact supabase error up
            try: detail = resp.json()
            except Exception: detail = {"error": resp.text}
            raise HTTPException(status_code=400, detail=detail)

        data = resp.json()
        if data.get("session") is None and data.get("data", {}).get("user"):
            log.info("[REGISTER] Duplicate email detected for %s", req.email)
            raise HTTPException(status_code=409, detail="Email already registered. Please log in instead.")
        return {"message": "User registered", "data": data}
    except Exception:
        log.error("[REGISTER][EXC]\n%s", traceback.format_exc())
        raise

@router.post("/login")
def login_user(req: LoginRequest):
    try:
        log.info("[LOGIN] email=%s", req.email)
        url = f"{SUPABASE_URL}/auth/v1/token?grant_type=password"
        headers = {"apikey": SUPABASE_ANON_KEY, "Content-Type": "application/json"}
        payload = {"email": req.email, "password": req.password}
        resp = requests.post(url, headers=headers, json=payload, timeout=15)
        log.info("[LOGIN->SUPABASE] status=%s text=%s", resp.status_code, resp.text[:500])
        if resp.status_code != 200:
            try: detail = resp.json()
            except Exception: detail = {"error": resp.text}
            raise HTTPException(status_code=400, detail=detail)
        return {"message": "Login successful", "access_token": resp.json().get("access_token")}
    except Exception:
        log.error("[LOGIN][EXC]\n%s", traceback.format_exc())
        raise

@router.post("/forgot-password")
def forgot_password(email: str = Body(..., embed=True)):
    try:
        print(f"***** in user.py - def forgot_password")
        redirect = (EMAIL_REDIRECT_TO_RESET or "").strip()
        url = f"{SUPABASE_URL}/auth/v1/recover"
        if redirect:
            # send in query too (some deployments require this)
            url += f"?redirect_to={quote(redirect, safe='')}"

        headers = {"apikey": SUPABASE_ANON_KEY, "Content-Type": "application/json"}
        payload = {"email": email}
        if redirect:
            payload["redirect_to"] = redirect

        print(f"url: {url}")
        print(f"headers: {headers}")
        print(f"payload: {payload}")

        resp = requests.post(url, headers=headers, json=payload, timeout=15)
        print(f"resp: {resp}")
        print(f"resp.status_code: {resp.status_code}")
        log.info("[FORGOT->SUPABASE] status=%s text=%s", resp.status_code, resp.text[:500])

        if resp.status_code not in (200, 204):
            # DEBUG: bubble supabase message to the client so you see it in app
            try: 
                detail = resp.json()
                print(f"detail: {detail}")
            except Exception: detail = {"error": resp.text}
            raise HTTPException(status_code=400, detail=detail)

        return {"message": "Reset email sent if the address exists."}
    except Exception:
        log.error("[FORGOT_PASSWORD][EXC]\n%s", traceback.format_exc())
        raise

@router.post("/forgot-password")
def forgot_password(email: str = Body(..., embed=True)):
    try:
        redirect = (EMAIL_REDIRECT_TO_RESET or "").strip() 
        url = f"{SUPABASE_URL}/auth/v1/recover"
        if redirect:
            url += f"?redirect_to={quote(redirect, safe='')}"

        headers = {"apikey": SUPABASE_ANON_KEY, "Content-Type": "application/json"}
        payload = {"email": email}
        if redirect:
            payload["redirect_to"] = redirect  # include in body too

        log.info("[FORGOT] url=%s payload=%s", url, payload)
        resp = requests.post(url, headers=headers, json=payload, timeout=15)
        log.info("[FORGOT->SUPABASE] status=%s text=%s", resp.status_code, resp.text[:500])

        if resp.status_code not in (200, 204):
            try: detail = resp.json()
            except Exception: detail = {"error": resp.text}
            raise HTTPException(status_code=400, detail=detail)

        return {"message": "Reset email sent if the address exists."}
    except Exception:
        log.error("[FORGOT_PASSWORD][EXC]\n%s", traceback.format_exc())
        raise
