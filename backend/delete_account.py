# server/delete_account.py
import os
from fastapi import APIRouter, Depends, HTTPException, Request
import httpx
from supabase import create_client, Client

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_ROLE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

router = APIRouter()

def get_admin() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async def get_bearer(request: Request) -> str:
    auth = request.headers.get("Authorization", "")
    # Expect "Bearer <token>"
    if not auth.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = auth.split(" ", 1)[1].strip()
    # quick sanity: must be 3 segments
    if token.count(".") != 2:
        raise HTTPException(status_code=401, detail="Malformed JWT")
    return token

@router.post("/api/delete-account")
async def delete_account(
    token: str = Depends(get_bearer),
    admin: Client = Depends(get_admin),
):
    # 1) Ask Supabase Auth who this token belongs to
    auth_user_url = f"{SUPABASE_URL}/auth/v1/user"
    headers = {
        "Authorization": f"Bearer {token}",   # user's token
        "apikey": SUPABASE_SERVICE_ROLE_KEY,  # or anon key also works for /user
    }
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(auth_user_url, headers=headers)
    if r.status_code != 200:
        # surface what Supabase said
        raise HTTPException(status_code=401, detail={"auth_error": r.text})

    user = r.json()
    user_id = user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="No user id in token")

    # 2) Delete the user (requires SERVICE ROLE key)
    try:
        admin.auth.admin.delete_user(user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Delete failed: {e}")

    # 3) Delete any app data tied to this user_id in your tables here...
    # e.g. admin.table("budgets").delete().eq("user_id", user_id).execute()

    return {"ok": True}
