# ================== AI Utils for Intent Analysis ==================
import os
import re
import json as pyjson
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("MODEL_NAME", "gemini-2.0-flash")

# Import new Gemini SDK
try:
    import google.genai as genai
except ImportError:
    raise ImportError("Please install the new SDK with: pip install -U google-genai")

# Initialize underlying genai client
genai_client = genai.Client(api_key=GEMINI_API_KEY)


# ================== Helper Functions ==================
def _coerce_to_string(x):
    if x is None:
        return None
    if isinstance(x, str):
        return x
    if hasattr(x, "text"):
        return _coerce_to_string(getattr(x, "text"))
    if hasattr(x, "content"):
        return _coerce_to_string(getattr(x, "content"))
    if isinstance(x, (list, tuple)):
        return "\n".join([_coerce_to_string(i) for i in x if i])
    return str(x)


def _extract_text(resp):
    """Extracts plain text from Gemini responses."""
    if hasattr(resp, "text"):
        return resp.text
    if hasattr(resp, "candidates") and resp.candidates:
        cand = resp.candidates[0]
        if hasattr(cand, "content"):
            return _coerce_to_string(cand.content)
    if isinstance(resp, dict):
        if "candidates" in resp:
            cand = resp["candidates"][0]
            return cand.get("content", "")
        if "text" in resp:
            return resp["text"]
    return str(resp)


def _clean_text(s: str):
    if not s:
        return s
    s = re.sub(r'parts\s*\{.*?text:\s*"(.*?)".*?\}', r"\1", s, flags=re.DOTALL)
    s = re.sub(r'\n?role:\s*".*?"\n?', "\n", s)
    s = s.strip().replace("\\n", "\n").replace('\\"', '"')
    return s


# ================== Core Adapter ==================
class GeminiChatAdapter:
    """Provides an OpenAI-style chat.completions.create() API."""

    class _Completions:
        def __init__(self, adapter):
            self._adapter = adapter

        def create(self, model=None, messages=None):
            model_to_use = model or GEMINI_MODEL
            # Build prompt
            if isinstance(messages, (list, tuple)):
                prompt = "\n\n".join(
                    [f"{m.get('role', 'user').upper()}: {m.get('content', '')}" for m in messages]
                )
            else:
                prompt = str(messages)

            try:
                client = getattr(self._adapter, '_raw_client', None) or genai_client
                resp = client.models.generate_content(model=model_to_use, contents=prompt)
                text = _clean_text(_extract_text(resp))

                class _Msg:
                    def __init__(self, content):
                        self.content = content

                class _Choice:
                    def __init__(self, msg):
                        self.message = msg

                Resp = type("Resp", (), {"choices": [_Choice(_Msg(text))]})
                return Resp()

            except Exception as e:
                err = f"GENAI_ERROR: {e}"

                class _Msg:
                    def __init__(self, content):
                        self.content = content

                class _Choice:
                    def __init__(self, msg):
                        self.message = msg

                Resp = type("Resp", (), {"choices": [_Choice(_Msg(err))]})
                return Resp()

    def __init__(self, raw_client=None):
        # store underlying client used to call model APIs
        self._raw_client = raw_client
        self.chat = type("Chat", (), {"completions": self._Completions(self)})()


# Instantiate adapter using the real genai client
llm_client = GeminiChatAdapter(raw_client=genai_client)


# ================== REMINDER INTENT ==================
def analyze_reminder_intent(text):
    """
    Detect reminder intent using Gemini.
    Returns: (is_reminder: bool, confidence: float, details: dict)
    """
    system_prompt = (
        "You are a reminder intent classification assistant. "
        "Given a user message, detect if it is a reminder request. "
        "If yes, extract the task, date, and time if present. "
        "Return JSON: {is_reminder: bool, confidence: float, details: {task, date, time}}"
    )
    user_prompt = f"Classify and extract reminder intent from this message: {text}"

    response = llm_client.chat.completions.create(
        model=GEMINI_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    )

    content = getattr(response.choices[0].message, "content", "")
    match = re.search(r"```(?:json)?\s*(\{[\s\S]*?\})\s*```|(\{[\s\S]*?\})", content)
    json_text = next((g for g in (match.groups() if match else []) if g), content)

    try:
        data = pyjson.loads(json_text)
    except Exception:
        data = {}

    return (
        bool(data.get("is_reminder", False)),
        float(data.get("confidence", 0.0)),
        data.get("details", {}),
    )


# ================== REMINDER PARSER ==================
def parse_reminder_from_text(user_input, date_context=None):
    """
    Parse free-form reminder text into structured JSON.
    Returns: raw Gemini response text.
    """
    system_prompt = f"""
You are an expert reminder creation assistant. 
Parse user input into structured reminders with intelligent date/time inference.

{date_context or ''}

INSTRUCTIONS:
- Extract title, date, and time from user input
- Convert relative dates using the date context
- Use sensible defaults for missing fields
- Output strictly valid JSON array:
  [{{"title": "...", "date": "YYYY-MM-DD", "time": "H:MM AM/PM"}}]
"""

    response = llm_client.chat.completions.create(
        model=GEMINI_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Parse this: {user_input}"},
        ],
    )

    return getattr(response.choices[0].message, "content", None)


# ================== EMERGENCY INTENT ==================
def analyze_emergency_intent(text):
    """
    Detect emergency intent (medical, safety, emotional).
    Returns: (is_emergency: bool, confidence: float, details: dict)
    """
    system_prompt = (
        "You are an emergency detection assistant. "
        "Classify if the user's message indicates an emergency (medical, safety, emotional). "
        "If yes, extract type, urgency, and key details. "
        "Return JSON: {is_emergency: bool, confidence: float, details: {type, urgency, reason}}"
    )
    user_prompt = f"Classify and extract emergency intent from this message: {text}"

    response = llm_client.chat.completions.create(
        model=GEMINI_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    )

    content = getattr(response.choices[0].message, "content", "")
    match = re.search(r"```(?:json)?\s*(\{[\s\S]*?\})\s*```|(\{[\s\S]*?\})", content)
    json_text = next((g for g in (match.groups() if match else []) if g), content)

    try:
        data = pyjson.loads(json_text)
    except Exception:
        data = {}

    return (
        bool(data.get("is_emergency", False)),
        float(data.get("confidence", 0.0)),
        data.get("details", {}),
    )
