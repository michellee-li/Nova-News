# user.py
import os, requests, logging, traceback
from urllib.parse import quote
from fastapi import APIRouter, HTTPException, Body
from backend.models import RegisterRequest, LoginRequest
from dotenv import load_dotenv
from fastapi import Depends, Header
from typing import Optional


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
SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    log.error("[ENV] Missing SUPABASE_URL or SUPABASE_ANON_KEY. url=%r key_set=%s", SUPABASE_URL, bool(SUPABASE_ANON_KEY))
    raise RuntimeError("Set SUPABASE_URL and SUPABASE_ANON_KEY in your .env")

if not SERVICE_KEY:
    log.warning("[ENV] SUPABASE_SERVICE_ROLE_KEY not set; delete-account will fail for admin ops")

def _sb_headers_admin():
    return {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "application/json",
    }

def _sb_headers_user(token: str):
    return {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

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
        redirect = (EMAIL_REDIRECT_TO_RESET or "").strip()
        url = f"{SUPABASE_URL}/auth/v1/recover"
        if redirect:
            url += f"?redirect_to={quote(redirect, safe='')}"  # query
        headers = {"apikey": SUPABASE_ANON_KEY, "Content-Type": "application/json"}
        payload = {"email": email}
        if redirect:
            payload["redirect_to"] = redirect  # body (some setups expect both)

        log.info("[FORGOT] url=%s payload=%s", url, payload)
        resp = requests.post(url, headers=headers, json=payload, timeout=15)
        log.info("[FORGOT->SUPABASE] status=%s text=%s", resp.status_code, resp.text[:500])

        if resp.status_code not in (200, 204):
            try:
                detail = resp.json()
            except Exception:
                detail = {"error": resp.text}
            raise HTTPException(status_code=400, detail=detail)

        return {"message": "Reset email sent if the address exists."}
    except Exception:
        log.error("[FORGOT_PASSWORD][EXC]\n%s", traceback.format_exc())
        raise


@router.post("/delete-account")
def delete_account(
    authorization: Optional[str] = Header(None, convert_underscores=False),
):
    """
    Permanently delete the caller's account and all associated data.
    - Requires Authorization: Bearer <access_token> (Supabase user token).
    - Uses SERVICE ROLE to delete the auth user.
    """
    try:
        if not authorization or not authorization.lower().startswith("bearer "):
            raise HTTPException(status_code=401, detail="Missing bearer token")

        user_token = authorization.split(" ", 1)[1].strip()

        # 1) Resolve user from token
        me_url = f"{SUPABASE_URL}/auth/v1/user"
        me_resp = requests.get(me_url, headers=_sb_headers_user(user_token), timeout=15)
        if me_resp.status_code != 200:
            try:
                detail = me_resp.json()
            except Exception:
                detail = {"error": me_resp.text}
            raise HTTPException(status_code=401, detail=detail)
        me = me_resp.json()
        user_id = me.get("id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")

        # 2) Delete app data in your tables (add/adjust tables as needed)
        # Example using Supabase REST (PostgREST) deletes:
        # NOTE: if you prefer, switch these to Postgres SQL via a secured RPC.
        for table in ["budgets", "user_profiles", "entries", "plans"]:
            url = f"{SUPABASE_URL}/rest/v1/{table}?user_id=eq.{user_id}"
            resp = requests.delete(url, headers=_sb_headers_admin(), timeout=15)
            if resp.status_code not in (200, 204):
                log.warning("[DELETE DATA] %s -> %s %s", table, resp.status_code, resp.text[:300])

        # 3) Delete the Supabase Auth user (Admin)
        del_url = f"{SUPABASE_URL}/auth/v1/admin/users/{user_id}"
        del_resp = requests.delete(del_url, headers=_sb_headers_admin(), timeout=15)
        if del_resp.status_code not in (200, 204):
            try:
                detail = del_resp.json()
            except Exception:
                detail = {"error": del_resp.text}
            raise HTTPException(status_code=400, detail=detail)

        return {"message": "Account permanently deleted."}
    except HTTPException:
        raise
    except Exception:
        log.error("[DELETE_ACCOUNT][EXC]\n%s", traceback.format_exc())
        raise HTTPException(status_code=500, detail="Failed to delete account. Please try again.")

