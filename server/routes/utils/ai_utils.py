# ================== AI Utils for Intent Analysis ==================
import os
import re
import json as pyjson

from together import Together
from dotenv import load_dotenv

# Load environment variables (for local dev and consistency)
load_dotenv()

# LLM API key setup (single client instance for efficiency)
api_key = os.getenv("TOGETHER_API_KEY")
llm_client = Together(api_key=api_key)

# ================== REMINDER INTENT (Dedicated) ==================
def analyze_reminder_intent(text):
    """
    Dedicated cloud-based reminder intent detection using Together AI.
    Returns: (is_reminder: bool, confidence: float, components: dict)
    """
    # Use global llm_client
    system_prompt = (
        "You are a reminder intent classification and extraction assistant. "
        "Given a user message, classify if it is a reminder request. "
        "If yes, extract the task, date, and time if present. "
        "Always return a JSON object with: "
        "{is_reminder: true|false, confidence: float (0-1), details: object} "
        "If is_reminder is true, details should include: task, date, time (if found). "
        "If not, details can be empty or null. "
        "Be concise and accurate."
    )
    user_prompt = f"Classify and extract reminder intent from this message: {text}"
    response = llm_client.chat.completions.create(
        model="deepseek-ai/DeepSeek-V3",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
    )
    def extract_content(resp):
        try:
            if hasattr(resp, 'choices') and resp.choices:
                if hasattr(resp.choices[0], 'message') and hasattr(resp.choices[0].message, 'content'):
                    return resp.choices[0].message.content
            if isinstance(resp, dict) and 'choices' in resp:
                choices = resp['choices']
                if isinstance(choices, list) and choices:
                    msg = choices[0].get('message')
                    if isinstance(msg, dict):
                        return msg.get('content', '')
                    elif isinstance(msg, str):
                        return msg
            if isinstance(resp, str):
                return resp
            if hasattr(resp, '__iter__') and not isinstance(resp, dict) and not isinstance(resp, str):
                try:
                    return ''.join([getattr(chunk, 'content', str(chunk)) for chunk in resp if chunk])
                except Exception:
                    return str(list(resp))
            return str(resp)
        except Exception as e:
            return ""
    content = extract_content(response)
    match = re.search(r'```(?:json)?\s*(\{[\s\S]*?\})\s*```|(\{[\s\S]*?\})', content)
    if match:
        json_text = next(group for group in match.groups() if group is not None)
        try:
            intent_json = pyjson.loads(json_text)
        except Exception:
            intent_json = {}
    else:
        try:
            intent_json = pyjson.loads(content)
        except Exception:
            intent_json = {}
    is_reminder = bool(intent_json.get('is_reminder', False))
    confidence = float(intent_json.get('confidence', 0))
    details = intent_json.get('details', {})
    return is_reminder, confidence, details

# ================== EMERGENCY INTENT (Dedicated) ==================
def analyze_emergency_intent(text):
    """
    Dedicated cloud-based emergency intent detection using Together AI.
    Returns: (is_emergency: bool, confidence: float, analysis: dict)
    """
    # Use global llm_client
    system_prompt = (
        "You are an emergency intent classification and extraction assistant. "
        "Given a user message, classify if it is an emergency (medical, safety, or emotional). "
        "If yes, extract the type (medical, safety, emotional), urgency, and any relevant details. "
        "Always return a JSON object with: "
        "{is_emergency: true|false, confidence: float (0-1), details: object} "
        "If is_emergency is true, details should include: type, urgency, reason, and any extracted info. "
        "If not, details can be empty or null. "
        "Be concise and accurate."
    )
    user_prompt = f"Classify and extract emergency intent from this message: {text}"
    response = llm_client.chat.completions.create(
        model="deepseek-ai/DeepSeek-V3",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
    )
    def extract_content(resp):
        try:
            if hasattr(resp, 'choices') and resp.choices:
                if hasattr(resp.choices[0], 'message') and hasattr(resp.choices[0].message, 'content'):
                    return resp.choices[0].message.content
            if isinstance(resp, dict) and 'choices' in resp:
                choices = resp['choices']
                if isinstance(choices, list) and choices:
                    msg = choices[0].get('message')
                    if isinstance(msg, dict):
                        return msg.get('content', '')
                    elif isinstance(msg, str):
                        return msg
            if isinstance(resp, str):
                return resp
            if hasattr(resp, '__iter__') and not isinstance(resp, dict) and not isinstance(resp, str):
                try:
                    return ''.join([getattr(chunk, 'content', str(chunk)) for chunk in resp if chunk])
                except Exception:
                    return str(list(resp))
            return str(resp)
        except Exception as e:
            return ""
    content = extract_content(response)
    match = re.search(r'```(?:json)?\s*(\{[\s\S]*?\})\s*```|(\{[\s\S]*?\})', content)
    if match:
        json_text = next(group for group in match.groups() if group is not None)
        try:
            intent_json = pyjson.loads(json_text)
        except Exception:
            intent_json = {}
    else:
        try:
            intent_json = pyjson.loads(content)
        except Exception:
            intent_json = {}
    is_emergency = bool(intent_json.get('is_emergency', False))
    confidence = float(intent_json.get('confidence', 0))
    details = intent_json.get('details', {})
    return is_emergency, confidence, details
