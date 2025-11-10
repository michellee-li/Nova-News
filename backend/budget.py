# backend/budget.py
import os, json, logging, traceback, requests
from typing import List, Literal, Optional
from urllib.parse import quote
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, constr
from dotenv import load_dotenv, find_dotenv
from collections import defaultdict
from openai import OpenAI

# LangChain (simple chat LLM use)
# from langchain_openai import ChatOpenAI
# from langchain.prompts import ChatPromptTemplate

print(f"*** in budget.py***")

log = logging.getLogger("backend")

# loaded = load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
loaded = load_dotenv(dotenv_path=env_path)

SUPABASE_URL            = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE   = os.getenv("SUPABASE_SERVICE_ROLE_KEY")  # service role key for DB & admin lookups
OPENAI_API_KEY          = os.getenv("OPENAI_API_KEY")
MODEL_CHATGPT           = os.getenv("MODEL_CHATGPT")


if not (SUPABASE_URL and SUPABASE_SERVICE_ROLE):
    raise RuntimeError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env")
if not OPENAI_API_KEY:
    log.warning("[WARN] OPENAI_API_KEY missing; will fall back to a simple heuristic plan")

def _admin_headers():
    if not SUPABASE_SERVICE_ROLE or not SUPABASE_SERVICE_ROLE.startswith("eyJ"):
        raise RuntimeError("SUPABASE_SERVICE_ROLE_KEY must be the eyJ… service role JWT")
    return {
        "apikey": SUPABASE_SERVICE_ROLE,                     # service role
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE}",  # service role
        "Content-Type": "application/json",
    }

router = APIRouter()

class Entry(BaseModel):
    type: Literal["Income", "Expense"]
    amount: float = Field(..., gt=0, description="Must be a positive number")
    category: str = Field(..., min_length=1, description="Category is required")

class BudgetIn(BaseModel):
    email: str                                  # we’ll resolve user_id via Admin API
    us_state: Optional[str] = None
    goal: Optional[str] = None
    entries: List[Entry] = Field(default_factory=list)

# ---------- Supabase helpers ----------

def admin_get_user_id_by_email(email: str) -> str:
    url = f"{SUPABASE_URL}/rest/v1/rpc/get_user_id_by_email"  # RPC endpoint
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE,
        "Content-Type": "application/json",  # Required for RPC payload
        # No Authorization header for secret keys
    }
    payload = {"p_email": email}  # Parameter for the function
    try:
        r = requests.post(url, headers=_admin_headers(), json={"p_email": email}, timeout=15)
        r.raise_for_status()  # Raises HTTPError for 4xx/5xx
        data = r.json()
        # RPC returns a single value (UUID string), not an array
        if not data or data[0] is None:
            raise HTTPException(status_code=404, detail=f"User not found for email: {email}")
        return data  # The UUID as string
    except requests.exceptions.HTTPError as e:
        if r.status_code == 404 or "User not found" in r.text:
            raise HTTPException(status_code=404, detail=f"User not found for email: {email}")
        log.error(f"[ADMIN RPC ERROR] Status: {r.status_code}, Response: {r.text}")
        raise HTTPException(status_code=500, detail=f"Admin users lookup failed: {r.text}")
    except Exception as e:
        log.error(f"[ADMIN RPC EXCEPTION] {str(e)}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

def db_get_budget(user_id: str):
    url = f"{SUPABASE_URL}/rest/v1/budgets?user_id=eq.{user_id}&select=*"
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE,
    }
    r = requests.get(url, headers=_admin_headers(), timeout=15)
    if r.status_code != 200:
        raise HTTPException(status_code=500, detail=f"Select failed: {r.text}")
    rows = r.json()
    return rows[0] if rows else None

def db_upsert_budget(user_id: str, us_state: str, goal: str,
                     monthly_income: float, monthly_expenses: float,
                     entries_dicts: list, plan_text: str):
    url = f"{SUPABASE_URL}/rest/v1/budgets"
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE,															 
        "Content-Type": "application/json",
        "Prefer": "return=representation",  # Removed resolution=merge-duplicates
    }
													  
    payload = {
        "user_id": user_id,
        "us_state": us_state,
        "goal": goal,
        "monthly_income": monthly_income,
        "monthly_expenses": monthly_expenses,
        "entries": entries_dicts,
        "plan": plan_text,
    }
    # Check if a row exists for the user_id
    existing = db_get_budget(user_id)
    if existing:
        # Update existing row using PATCH
        update_url = f"{SUPABASE_URL}/rest/v1/budgets?user_id=eq.{user_id}"
        r = requests.patch(update_url, headers=headers, data=json.dumps(payload), timeout=20)
        if r.status_code not in (200, 201):
            raise HTTPException(status_code=500, detail=f"Update failed: {r.text}")
    else:
        # Insert new row using POST
        r = requests.post(url, headers=headers, data=json.dumps([payload]), timeout=20)
        if r.status_code not in (200, 201):
            raise HTTPException(status_code=500, detail=f"Insert failed: {r.text}")
    return r.json()[0]

# ---------- LangChain plan generation ----------

def make_prompt(income: float, expenses: float, us_state: Optional[str], goal: Optional[str]) -> str:
    print("*** in budget.py - make_prompt() ***")
    baseline = f"Monthly income: ${income:,.2f}\nMonthly expenses: ${expenses:,.2f}\n"
    if us_state:
        baseline += f"State: {us_state}\n"
    if goal:
        baseline += f"Goal: {goal}\n"
    return (
        "You are a financial coach creating a safe, judgment-free, trauma-informed budget plan "
        "for a woman currently staying in a shelter. Keep it empathetic, practical, and specific. "
        "The plan must be short, scannable, and actionable. "
        "Tailor the budget split and steps to align with the user's goal if provided, such as allocating savings or providing goal-specific advice.\n\n"
        f"{baseline}\n"
        "Return:\n"
        "1) A monthly budget split (housing/food/transportation/health/phone/child needs/savings/debt/other) with amounts.\n"
        "2) 3–5 concrete, low-barrier steps she can take this week.\n"
        "3) 3–5 concrete, low-barrier steps she can take to achieve her goal.\n"
        "4) State-aware tips (benefits, hotline or 211, legal aid pointers) if relevant.\n"
        "Keep the total within income, and note any deficit with guidance.\n"
    )

def generate_fallback_text(us_state: Optional[str], goal: Optional[str], entries: list[dict]) -> str:
    """A safe, local fallback if ChatGPT fails. Uses entries to compute totals."""
    s = summarize_budget(entries)
    income = s["income_total"]
    expenses = s["expense_total"]

    housing    = max(0, income * 0.30)
    essentials = max(0, income * 0.20)
    savings    = max(0, (income - expenses) * 0.20) if income > expenses else 0

    fallback = (
        "Recommended monthly plan (fallback):\n"
        f"- Housing/utilities: ~${housing:,.0f}\n"
        f"- Food/transport/phone/health/child needs: ~${essentials:,.0f}\n"
        f"- Savings or emergency buffer: ~${savings:,.0f}\n"
        f"- Other / flexible: rest within ${income:,.0f} income.\n\n"
        "This is a starter guide while we fetch more tailored resources. "
        "If expenses exceed income, focus on essentials first and contact 211 for local support."
    )

    if goal:
        fallback += (
            f"\n\nToward your goal ({goal}):\n"
            "- Research low-cost options or assistance programs related to your goal.\n"
            "- Set aside a small amount from savings each month toward it.\n"
            "- Track progress weekly to stay motivated.\n"
            "- Seek free advice from local resources or online communities.\n"
            "- Adjust your budget as needed to prioritize this."
        )
    return fallback

def summarize_budget(entries: list[dict]):
    inc_total = exp_total = 0.0
    inc_by_cat, exp_by_cat = defaultdict(float), defaultdict(float)

    for e in entries or []:
        if isinstance(e, dict):
            t = (e.get("type") or "").strip()
            a = float(e.get("amount") or 0)
            c = e.get("category") or ("Income" if t == "Income" else "Expense")
        else:
            # Pydantic Entry
            t = (getattr(e, "type", "") or "").strip()
            a = float(getattr(e, "amount", 0) or 0)
            c = getattr(e, "category", None) or ("Income" if t == "Income" else "Expense")

        if t == "Income":
            inc_total += a
            inc_by_cat[c] += a
        elif t == "Expense":
            exp_total += a
            exp_by_cat[c] += a

    net = inc_total - exp_total

    # top categories (helps keep prompt concise)
    def top_k(d: dict, k: int = 6):
        return sorted(d.items(), key=lambda x: x[1], reverse=True)[:k]

    return {
        "income_total": round(inc_total, 2),
        "expense_total": round(exp_total, 2),
        "net": round(net, 2),
        "income_top": top_k(inc_by_cat),
        "expense_top": top_k(exp_by_cat),
    }

def build_chat_prompt(us_state: str, goal: str, entries: list[dict]):
    summary = summarize_budget(entries)
    state = (us_state or "").strip()
    goal_text = (goal or "").strip()

    # compact category strings for the prompt
    def fmt_pairs(pairs):
        return "; ".join([f"{name}: ${amt:.2f}" for name, amt in pairs]) or "(none)"

    income_lines = fmt_pairs(summary["income_top"])
    expense_lines = fmt_pairs(summary["expense_top"])

    user_payload = f"""
					User profile (sanitized):
					- US State: {state or "(unknown)"}
					- Goal: {goal_text or "(none provided)"}

					Numbers:
					- Income total: ${summary["income_total"]:.2f}
					- Expense total: ${summary["expense_total"]:.2f}
					- Net (income - expense): ${summary["net"]:.2f}

					Income by category (top):
					{income_lines}

					Expenses by category (top):
					{expense_lines}
					""".strip()

    system_instructions = (
        "You are a trauma-informed, practical financial counselor for survivors of domestic "
        "violence. Provide concise, concrete guidance. Avoid judgmental language. "
        "Assume the user needs privacy-sensitive help. Use plain language. "
        "Tailor advice to the user's US state and stated goal. "
        "If recommending programs, prefer US-wide programs and the user's state programs; "
        "name the program but do not include URLs (app links can be opened in-app). "
        "Budget suggestions should be realistic given the provided numbers."
    )

    # Output format keeps it readable in your app
    content_requirements = (
        "FORMAT:\n"
        "1) A one-paragraph overview grounded in the numbers (income, expenses, net).\n"
        "2) A short monthly allocation plan with dollar amounts (not just percents).\n"
        "3) 4–6 state-aware, goal-specific action steps (bullet list). "
        "Tie each step to the user’s goal where possible.\n"
        "4) A discreet safety tip (one line).\n"
        "Keep to ~180–260 words total. No links."
    )

    return system_instructions, f"{user_payload}\n\n{content_requirements}"


def generate_plan_text(us_state: str, goal: str, entries: list[dict]) -> str:
    """
    Always tries OpenAI first (non-generic, state + goal aware).
    Falls back to simple plan if the API fails.
    """
    system, user = build_chat_prompt(us_state, goal, entries)

    api_key = os.getenv("OPENAI_API_KEY")
    model = os.getenv("MODEL_CHATGPT") or "gpt-4o-mini"
    if not api_key:
        # No key: use your existing fallback
        return generate_fallback_text(us_state, goal, entries)

    client = OpenAI(api_key=api_key)

    try:
        resp = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            temperature=0.6,    # balanced: specific but not robotic
            max_tokens=500,
        )
        content = (resp.choices[0].message.content or "").strip()
        if not content:
            raise ValueError("Empty completion.")
        return content
    except Exception as e:
        # Log and fall back—never block the app
        print("[generate_plan_text] OpenAI error:", e)
        return generate_fallback_text(us_state, goal, entries)

# ---------- Routes ----------

@router.get("/plan")
def get_saved_plan(email: str):
    """Return saved plan for a user (if any)."""
    try:
        user_id = admin_get_user_id_by_email(email)
        row = db_get_budget(user_id)
        return {"exists": bool(row), "data": row}
    except Exception:
        log.error(f"[BUDGET GET][EXC]\n{traceback.format_exc()}")
        raise

@router.post("/plan")
def create_or_update_plan(payload: BudgetIn):
    """Create or update the single budget plan row for this user."""
    try:
        if not payload.entries:
            raise HTTPException(status_code=400, detail="Please add at least one income or expense.")

        # 1) Resolve user_id from email (admin)
        user_id = admin_get_user_id_by_email(payload.email)

        # 2) Sum entries (optional, for logging or validation)
        income = sum(e.amount for e in payload.entries if e.type == "Income")
        expenses = sum(e.amount for e in payload.entries if e.type == "Expense")

        # 3) Generate plan via LLM (fallback if needed)
        entries_dicts = [e.model_dump() for e in payload.entries]
        plan_text = generate_plan_text(payload.us_state or "", payload.goal or "", entries_dicts)

        # 4) Upsert to budgets
        saved = db_upsert_budget(
            user_id=user_id,
            us_state=payload.us_state or "",
            goal=payload.goal or "",
            monthly_income=income,
            monthly_expenses=expenses,
            entries_dicts=entries_dicts,
            plan_text=plan_text,
        )
        return {"message": "ok", "data": saved}
    except HTTPException:
        raise
    except Exception:
        log.error(f"[BUDGET POST][EXC]\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Internal error while generating plan")
