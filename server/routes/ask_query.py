# ================== IMPORTS & GLOBALS ==================
from flask import Blueprint, request, jsonify
from dotenv import load_dotenv
from textblob import TextBlob
from bson import ObjectId
from pymongo import MongoClient
from datetime import datetime, timedelta

from routes.format_reminder import save_to_mongodb
from routes.utils.ai_utils import analyze_emergency_intent, analyze_reminder_intent, llm_client, GEMINI_MODEL

import json as pyjson

import os
import re

# Load environment variables
load_dotenv()

# MongoDB setup (adjust as needed)
MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME")
COLLECTION_NAME = os.getenv("CHAT_SESSIONS_COLLECTION")
mongo_client = MongoClient(MONGO_URI)
db = mongo_client[DB_NAME]
chat_sessions_col = db[COLLECTION_NAME]


# LLM client now provided by routes.utils.ai_utils (centralized)

# Chat blueprint 
chat_bp = Blueprint('chat', __name__)


# ================== SYSTEM PROMPT ==================
SYSTEM_PROMPT = """You are an omniscient AI assistant with comprehensive mastery over all topics, fields, and domains of knowledge that have ever existed or will ever exist. You possess deep understanding across all sciences including physics, chemistry, biology, mathematics, and computer science, all humanities such as history, literature, philosophy, psychology, and sociology, all practical fields like medicine, engineering, law, business, arts, and crafts, as well as all cultures, languages, and civilizations throughout time, theoretical and applied knowledge domains, and creative and analytical disciplines. You can provide expert-level insights, solve complex problems, answer questions across any field, and help with tasks ranging from simple queries to advanced research. Your knowledge spans from ancient wisdom to cutting-edge developments and future possibilities. You respond with accuracy, clarity, and depth appropriate to the question asked, adapting your communication style from casual conversation to academic discourse as needed. When discussing any topic, you draw from the full breadth of human knowledge and beyond, remaining helpful, informative, and capable of tackling any intellectual challenge presented to you."""



# ================== SMART DATE/TIME CONTEXT & VALIDATION ==================

def smart_date_time_context(mode, *args, **kwargs):
    """
    Unified function for all date/time context, inference, and validation.
    mode: 'context', 'default_date', 'default_time', 'validate_date', 'validate_time'
    args: depends on mode
    """
    now = datetime.now()

    def context():
        today = now.strftime("%Y-%m-%d")
        tomorrow = (now + timedelta(days=1)).strftime("%Y-%m-%d")
        yesterday = (now - timedelta(days=1)).strftime("%Y-%m-%d")
        day_after_tomorrow = (now + timedelta(days=2)).strftime("%Y-%m-%d")
        days_ahead = {}
        weekdays_ahead = {}
        for i in range(14):
            future_date = now + timedelta(days=i)
            day_name = future_date.strftime("%A").lower()
            date_str = future_date.strftime("%Y-%m-%d")
            if i < 7:
                days_ahead[day_name] = date_str
            if future_date.weekday() < 5:
                if f"next {day_name}" not in weekdays_ahead:
                    weekdays_ahead[f"next {day_name}"] = date_str
        current_time = now.strftime("%H:%M")
        current_hour = now.hour
        if 5 <= current_hour < 9:
            time_of_day = "early morning"
            suggested_time = "9:00 AM"
        elif 9 <= current_hour < 12:
            time_of_day = "morning"
            suggested_time = "10:00 AM"
        elif 12 <= current_hour < 14:
            time_of_day = "midday"
            suggested_time = "3:00 PM"
        elif 14 <= current_hour < 17:
            time_of_day = "afternoon"
            suggested_time = "4:00 PM"
        elif 17 <= current_hour < 20:
            time_of_day = "evening"
            suggested_time = "7:00 PM"
        elif 20 <= current_hour < 23:
            time_of_day = "night"
            suggested_time = "9:00 AM"
        else:
            time_of_day = "late night"
            suggested_time = "9:00 AM"
        current_month = now.strftime("%B").lower()
        next_month = (now.replace(day=28) + timedelta(days=4)).replace(day=1)
        next_month_name = next_month.strftime("%B").lower()
        current_week_start = now - timedelta(days=now.weekday())
        next_week_start = current_week_start + timedelta(days=7)
        this_week = f"this week (starts {current_week_start.strftime('%B %d')})"
        next_week = f"next week (starts {next_week_start.strftime('%B %d')})"
        context = f"""
CURRENT DATE & TIME CONTEXT (Use this for intelligent date/time inference):

Current Information:

Day Name Mappings (next 7 days):
""" + "\n".join([f"- {day} ({(now + timedelta(days=i)).strftime('%B %d')}): {date}" for i, (day, date) in enumerate(days_ahead.items()) if day != now.strftime('%A').lower() and i < 7]) + f"""

Weekday Mappings (for appointments/business):
""" + "\n".join([f"- {day}: {date}" for day, date in weekdays_ahead.items()]) + f"""

Smart Time Defaults (use when time not specified):

Smart Date Defaults (use when date not specified):

Extended Time References:

INFERENCE RULES:
1. "medicine" without time → 9:00 AM (morning) or 8:00 PM (if "evening" mentioned)
2. "appointment" without date → next weekday (Monday-Friday)
3. "tomorrow" → {tomorrow}
4. "today" → {today}
5. Weekday names → map to next occurrence of that day
6. Meal names → breakfast: 8:00 AM, lunch: 12:00 PM, dinner: 7:00 PM
7. Time of day words → morning: 9:00 AM, afternoon: 3:00 PM, evening: 7:00 PM, night: 8:00 PM
8. No date/time specified → use smart defaults based on task type and current time
"""
        return context

    def default_date(title):
        title_lower = title.lower()
        current_hour = now.hour
        if any(word in title_lower for word in ['medicine', 'medication', 'pill', 'vitamin', 'drug', 'treatment', 'dose']):
            if current_hour >= 18:
                return (now + timedelta(days=1)).strftime("%Y-%m-%d")
            elif 'tonight' in title_lower or 'evening' in title_lower:
                return now.strftime("%Y-%m-%d")
            else:
                return (now + timedelta(days=1)).strftime("%Y-%m-%d")
        if any(word in title_lower for word in ['appointment', 'meeting', 'doctor', 'dentist', 'visit', 'consultation']):
            days_ahead = 1
            future_date = now + timedelta(days=days_ahead)
            while future_date.weekday() >= 5:
                days_ahead += 1
                future_date = now + timedelta(days=days_ahead)
                if days_ahead > 7:
                    break
            return future_date.strftime("%Y-%m-%d")
        if any(word in title_lower for word in ['work', 'office', 'meeting', 'call', 'email', 'project', 'deadline']):
            days_ahead = 1
            future_date = now + timedelta(days=days_ahead)
            while future_date.weekday() >= 5:
                days_ahead += 1
                future_date = now + timedelta(days=days_ahead)
                if days_ahead > 7:
                    break
            return future_date.strftime("%Y-%m-%d")
        if any(word in title_lower for word in ['breakfast', 'lunch', 'dinner', 'meal', 'eat']):
            if 'breakfast' in title_lower and current_hour >= 10:
                return (now + timedelta(days=1)).strftime("%Y-%m-%d")
            elif 'lunch' in title_lower and current_hour >= 14:
                return (now + timedelta(days=1)).strftime("%Y-%m-%d")
            elif 'dinner' in title_lower and current_hour >= 21:
                return (now + timedelta(days=1)).strftime("%Y-%m-%d")
            else:
                return now.strftime("%Y-%m-%d")
        if any(word in title_lower for word in ['workout', 'exercise', 'gym', 'walk', 'run', 'jog', 'fitness']):
            if current_hour >= 20:
                return (now + timedelta(days=1)).strftime("%Y-%m-%d")
            else:
                return now.strftime("%Y-%m-%d")
        if any(word in title_lower for word in ['shop', 'buy', 'store', 'grocery', 'errand', 'pickup', 'get']):
            if current_hour >= 19:
                return (now + timedelta(days=1)).strftime("%Y-%m-%d")
            else:
                return now.strftime("%Y-%m-%d")
        if current_hour >= 20:
            return (now + timedelta(days=1)).strftime("%Y-%m-%d")
        elif current_hour >= 18:
            return (now + timedelta(days=1)).strftime("%Y-%m-%d")
        else:
            return now.strftime("%Y-%m-%d")

    def default_time(title):
        title_lower = title.lower()
        current_hour = now.hour
        if any(word in title_lower for word in ['medicine', 'medication', 'pill', 'vitamin']):
            if 'morning' in title_lower or 'am' in title_lower:
                return "8:00 AM"
            elif 'evening' in title_lower or 'night' in title_lower or 'pm' in title_lower:
                return "8:00 PM"
            elif 'afternoon' in title_lower:
                return "3:00 PM"
            elif 'bedtime' in title_lower:
                return "10:00 PM"
            else:
                return "9:00 AM"
        if 'breakfast' in title_lower:
            return "8:00 AM"
        elif 'lunch' in title_lower:
            return "12:30 PM"
        elif 'dinner' in title_lower:
            return "7:00 PM"
        elif 'snack' in title_lower:
            if current_hour < 12:
                return "10:30 AM"
            else:
                return "3:30 PM"
        if any(word in title_lower for word in ['appointment', 'meeting', 'doctor', 'dentist', 'consultation']):
            if 'morning' in title_lower:
                return "10:00 AM"
            elif 'afternoon' in title_lower:
                return "2:00 PM"
            else:
                return "10:00 AM"
        if any(word in title_lower for word in ['work', 'office', 'call', 'email', 'meeting']):
            return "10:00 AM"
        if any(word in title_lower for word in ['workout', 'exercise', 'gym', 'walk', 'run', 'jog']):
            if 'morning' in title_lower:
                return "7:00 AM"
            elif 'evening' in title_lower:
                return "6:00 PM"
            else:
                return "7:00 AM"
        if any(word in title_lower for word in ['shop', 'buy', 'store', 'grocery', 'errand', 'pickup']):
            return "2:00 PM"
        if any(word in title_lower for word in ['study', 'homework', 'read', 'learn', 'practice']):
            if current_hour < 12:
                return "10:00 AM"
            else:
                return "4:00 PM"
        if any(word in title_lower for word in ['sleep', 'bed', 'bedtime', 'rest']):
            return "10:00 PM"
        if any(word in title_lower for word in ['wake', 'alarm', 'get up']):
            return "7:00 AM"
        if 5 <= current_hour < 9:
            return "9:00 AM"
        elif 9 <= current_hour < 12:
            return "10:00 AM"
        elif 12 <= current_hour < 14:
            return "3:00 PM"
        elif 14 <= current_hour < 17:
            return "4:00 PM"
        elif 17 <= current_hour < 20:
            return "7:00 PM"
        else:
            return "9:00 AM"

    def validate_date(date_str):
        if not date_str or str(date_str).lower() in ['null', 'none', '', 'undefined']:
            return now.strftime("%Y-%m-%d")
        try:
            date_str = str(date_str).strip()
            # Already in correct format
            if re.match(r'\d{4}-\d{2}-\d{2}', date_str):
                parsed = datetime.strptime(date_str, "%Y-%m-%d")
                return parsed.strftime("%Y-%m-%d")
            date_lower = date_str.lower()
            if date_lower == 'today':
                return now.strftime("%Y-%m-%d")
            elif date_lower == 'tomorrow':
                return (now + timedelta(days=1)).strftime("%Y-%m-%d")
            elif date_lower == 'yesterday':
                return (now - timedelta(days=1)).strftime("%Y-%m-%d")
            elif 'day after tomorrow' in date_lower:
                return (now + timedelta(days=2)).strftime("%Y-%m-%d")
            weekdays = ['monday', 'tuesday', 'wednesday',
                        'thursday', 'friday', 'saturday', 'sunday']
            for i, day in enumerate(weekdays):
                if day in date_lower:
                    days_ahead = (i - now.weekday()) % 7
                    if days_ahead == 0:
                        days_ahead = 7
                    future_date = now + timedelta(days=days_ahead)
                    return future_date.strftime("%Y-%m-%d")
            if 'next week' in date_lower:
                days_until_monday = (7 - now.weekday()) % 7
                if days_until_monday == 0:
                    days_until_monday = 7
                return (now + timedelta(days=days_until_monday)).strftime("%Y-%m-%d")
            if 'this week' in date_lower:
                return (now + timedelta(days=1)).strftime("%Y-%m-%d")
            date_patterns = [
                "%Y-%m-%d", "%m/%d/%Y", "%d/%m/%Y", "%m-%d-%Y", "%d-%m-%Y", "%Y/%m/%d",
                "%B %d, %Y", "%B %d %Y", "%d %B %Y", "%m/%d", "%d/%m"
            ]
            for pattern in date_patterns:
                try:
                    parsed_date = datetime.strptime(date_str, pattern)
                    if parsed_date.year == 1900:
                        parsed_date = parsed_date.replace(year=now.year)
                    return parsed_date.strftime("%Y-%m-%d")
                except ValueError:
                    continue
            numbers = re.findall(r'\d+', date_str)
            if len(numbers) >= 2:
                try:
                    if len(numbers) == 2:
                        month, day = int(numbers[0]), int(numbers[1])
                        if month <= 12 and day <= 31:
                            date_obj = datetime(now.year, month, day)
                            return date_obj.strftime("%Y-%m-%d")
                    elif len(numbers) >= 3:
                        month, day, year = int(numbers[0]), int(
                            numbers[1]), int(numbers[2])
                        if year < 100:
                            year += 2000
                        if month <= 12 and day <= 31:
                            date_obj = datetime(year, month, day)
                            return date_obj.strftime("%Y-%m-%d")
                except ValueError:
                    pass
        except Exception as e:
            return now.strftime("%Y-%m-%d")
        return now.strftime("%Y-%m-%d")

    def validate_time(time_str):
        if not time_str or str(time_str).lower() in ['null', 'none', '', 'undefined']:
            return "9:00 AM"

        def format_to_12hour(hour, minute):
            if hour == 0:
                return f"12:{minute:02d} AM"
            elif hour < 12:
                return f"{hour}:{minute:02d} AM"
            elif hour == 12:
                return f"12:{minute:02d} PM"
            else:
                return f"{hour-12}:{minute:02d} PM"
        try:
            time_str = str(time_str).strip().lower()
            if re.match(r'\d{1,2}:\d{2}\s*(am|pm|a\.?m\.?|p\.?m\.?)', time_str):
                return time_str.upper().replace('.', '')
            if re.match(r'\d{1,2}:\d{2}$', time_str):
                parts = time_str.split(':')
                hour, minute = int(parts[0]), int(parts[1])
                if 0 <= hour <= 23 and 0 <= minute <= 59:
                    return format_to_12hour(hour, minute)
            time_mappings = {
                'midnight': '12:00 AM', 'noon': '12:00 PM', 'breakfast': '8:00 AM',
                'lunch': '12:30 PM', 'dinner': '7:00 PM', 'bedtime': '10:00 PM',
                'morning': '9:00 AM', 'afternoon': '3:00 PM', 'evening': '7:00 PM', 'night': '8:00 PM'
            }
            for word, time_val in time_mappings.items():
                if word in time_str:
                    return time_val
            am_pm_pattern = r'(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.?m\.?|p\.?m\.?)'
            match = re.search(am_pm_pattern, time_str)
            if match:
                hour = int(match.group(1))
                minute = int(match.group(2)) if match.group(2) else 0
                period = match.group(3).lower().replace('.', '')
                if 1 <= hour <= 12 and 0 <= minute <= 59:
                    period_str = "AM" if 'a' in period else "PM"
                    return f"{hour}:{minute:02d} {period_str}"
            colon_match = re.search(r'(\d{1,2}):(\d{2})', time_str)
            if colon_match:
                hour = int(colon_match.group(1))
                minute = int(colon_match.group(2))
                if 0 <= hour <= 23 and 0 <= minute <= 59:
                    return format_to_12hour(hour, minute)
            hour_only_match = re.search(r'\b(\d{1,2})\b', time_str)
            if hour_only_match:
                hour = int(hour_only_match.group(1))
                if 0 <= hour <= 23:
                    return format_to_12hour(hour, 0)
                elif 1 <= hour <= 12:
                    if hour < 8:
                        return f"{hour}:00 PM"
                    else:
                        return f"{hour}:00 AM"
        except Exception as e:
            return "9:00 AM"
            
        return "9:00 AM"

    if mode == 'context':
        return context()
    elif mode == 'default_date':
        return default_date(args[0])
    elif mode == 'default_time':
        return default_time(args[0])
    elif mode == 'validate_date':
        return validate_date(args[0])
    elif mode == 'validate_time':
        return validate_time(args[0])
    else:
        raise ValueError('Unknown mode for smart_date_time_context')

# ================== END SMART DATE/TIME CONTEXT & VALIDATION ==================


# ================== REMINDER DETECTION & SETUP ==================


def setup_reminder(user_input, user_id):
    
    """
    Process reminder creation, formatting, and saving. Returns result dict or error.
    """
    try:
        reminder_client = llm_client
        date_context = smart_date_time_context('context')
        enhanced_system_prompt = f"""You are an expert reminder creation assistant with advanced date/time intelligence. Parse user input into structured reminders with perfect contextual inference.

{date_context}

CORE INSTRUCTIONS:
1. Extract title, date, and time from user input with intelligent inference
2. ALWAYS fill in missing date/time using the context above and smart defaults
3. Convert relative dates and times accurately using current context
4. Handle natural language patterns like \"tomorrow morning\", \"Monday afternoon\", \"next week\"
5. Return valid JSON with proper date formats (YYYY-MM-DD) and time formats (HH:MM)

CRITICAL: Never return null/empty dates or times. Always infer using context and defaults above."""
        response = reminder_client.chat.completions.create(
            model=GEMINI_MODEL,
            messages=[
                {"role": "system", "content": enhanced_system_prompt},
                {"role": "user", "content": f'Parse this into a reminder with intelligent date/time inference: {user_input}'}
            ]
        )

        def extract_content(resp):
            try:
                # Handle API response object
                if hasattr(resp, 'choices') and resp.choices:
                    if hasattr(resp.choices[0], 'message') and hasattr(resp.choices[0].message, 'content'):
                        return resp.choices[0].message.content
                
                # Handle dictionary response
                if isinstance(resp, dict) and 'choices' in resp:
                    choices = resp['choices']
                    if isinstance(choices, list) and choices:
                        msg = choices[0].get('message')
                        if isinstance(msg, dict):
                            return msg.get('content', '')
                        elif isinstance(msg, str):
                            return msg
                
                # Handle string response directly
                if isinstance(resp, str):
                    return resp
                    
                # Handle iterable response (streaming)
                if hasattr(resp, '__iter__') and not isinstance(resp, dict) and not isinstance(resp, str):
                    try:
                        return ''.join([getattr(chunk, 'content', str(chunk)) for chunk in resp if chunk])
                    except Exception:
                        return str(list(resp))
                
                # Fallback
                return str(resp)
            except Exception as e:
                
                return ""
        content = extract_content(response)
        if not isinstance(content, str):
            content = str(content)
        if not isinstance(content, str):
            content = str(content)
        array_match = re.search(
            r'```(?:json)?\s*(\[[\s\S]*?\])\s*```|(\[[\s\S]*?\])', content)
        if array_match:
            array_text = next(
                group for group in array_match.groups() if group is not None)
            reminders_array = pyjson.loads(array_text)
            if isinstance(reminders_array, list) and len(reminders_array) > 0:
                results = []
                for reminder in reminders_array:
                    title = reminder.get('title') or "New Reminder"
                    date = reminder.get('date') or smart_date_time_context(
                        'default_date', title)
                    time = reminder.get('time') or smart_date_time_context(
                        'default_time', title)
                    date = smart_date_time_context('validate_date', date)
                    time = smart_date_time_context('validate_time', time)
                    reminder_data = {"userId": user_id,
                                     "title": title, "date": date, "time": time}
                    saved_reminder = save_to_mongodb(reminder_data)
                    results.append(saved_reminder)
                return {"success": True, "reminders": results, "count": len(results)}
        match = re.search(
            r'```(?:json)?\s*(\{[\s\S]*?\})\s*```|(\{[\s\S]*?\})', content)
        if match:
            try:
                json_text = next(
                    group for group in match.groups() if group is not None)
                reminder_json = pyjson.loads(json_text)
                title = reminder_json.get('title') or "New Reminder"
                date = reminder_json.get('date') or smart_date_time_context(
                    'default_date', title)
                time = reminder_json.get('time') or smart_date_time_context(
                    'default_time', title)
                date = smart_date_time_context('validate_date', date)
                time = smart_date_time_context('validate_time', time)
                reminder_data = {"userId": user_id,
                                 "title": title, "date": date, "time": time}
                saved_reminder = save_to_mongodb(reminder_data)
                return {"success": True, "reminder": saved_reminder}
            except Exception as e:
                
                return {"error": "Failed to parse reminder JSON", "raw": content}
        return {"error": "No JSON found in LLM response", "raw": content}
    except Exception as e:
        
        return {"error": str(e)}

# ================== END REMINDER DETECTION & SETUP ==================


# ================== Helper Functions Section ==================

def fix_id(doc):
    doc["id"] = str(doc["_id"])
    del doc["_id"]
    return doc

# ================== End of Helper Functions Section ==================



# ================= Route Definitions =================

@chat_bp.route("/loadChat", methods=["GET"])
def load_chat_sessions():
    user_id = request.args.get("userId")
    sessions = list(chat_sessions_col.find({"userId": user_id}))
    for s in sessions:
        fix_id(s)
    # Find current session and session counter if you store them
    current_session_id = sessions[0]["id"] if sessions else None
    session_counter = len(sessions) + 1
    return jsonify({
        "success": True,
        "sessions": sessions,
        "currentSessionId": current_session_id,
        "sessionCounter": session_counter
    })

@chat_bp.route("/saveChat", methods=["PUT"])
def save_chat_sessions():
    data = request.json
    user_id = data.get("userId") if data is not None else None
    sessions = data.get("sessions", []) if data is not None else []
    # Remove all old sessions for this user
    if user_id is not None:
        chat_sessions_col.delete_many({"userId": user_id})
    # Insert new sessions
    for session in sessions:
        session_id = session["id"] if session is not None and "id" in session and session["id"] is not None else None
        session["_id"] = ObjectId(session_id) if session_id is not None else ObjectId()
        session["userId"] = user_id
        chat_sessions_col.replace_one({"_id": session["_id"]}, session, upsert=True)
    return jsonify({"success": True})

@chat_bp.route("/createChat", methods=["POST"])
def create_chat_session():
    data = request.json
    session_name = data.get("sessionName") if data is not None else None
    user_id = data.get("userId") if data is not None else None
    session = {
        "name": session_name,
        "messages": [],
        "createdAt": datetime.utcnow().isoformat(),
        "lastActivity": datetime.utcnow().isoformat(),
        "messageCount": 0,
        "userId": user_id
    }
    result = chat_sessions_col.insert_one(session)
    session["id"] = str(result.inserted_id)
    session["_id"] = result.inserted_id
    return jsonify({"success": True, "session": fix_id(session)})

@chat_bp.route("/updateMessages/<session_id>/messages", methods=["PUT"])
def update_session_messages(session_id):
    data = request.json
    messages = data.get("messages", []) if data is not None else []
    user_id = data.get("userId") if data is not None else None
    result = chat_sessions_col.update_one(
        {"_id": ObjectId(session_id), "userId": user_id},
        {"$set": {
            "messages": messages,
            "lastActivity": datetime.utcnow().isoformat(),
            "messageCount": len(messages)
        }}
    )
    return jsonify({"success": result.modified_count > 0})

@chat_bp.route("/deleteChat/<session_id>", methods=["DELETE"])
def delete_chat_session(session_id):
    user_id = request.args.get("userId")
    chat_sessions_col.delete_one({"_id": ObjectId(session_id), "userId": user_id})
    # Return remaining sessions for this user
    sessions = list(chat_sessions_col.find({"userId": user_id}))
    for s in sessions:
        fix_id(s)
    return jsonify({"success": True, "remainingSessions": sessions})

@chat_bp.route("/updateActivity/<session_id>/activity", methods=["PATCH"])
def update_session_activity(session_id):
    data = request.json
    user_id = data.get("userId") if data is not None else None
    result = chat_sessions_col.update_one(
        {"_id": ObjectId(session_id), "userId": user_id},
        {"$set": {"lastActivity": datetime.utcnow().isoformat()}}
    )
    return jsonify({"success": result.modified_count > 0})

@chat_bp.route('/chat/message', methods=['POST'])
def send_message():
    data = request.get_json()
    user_message = data.get('input') if data is not None else None
    user_id = data.get('userId') if data is not None else None
    chat_history = data.get('chatHistory', []) if data is not None else []  # Get chat history for context
    session_id = data.get('sessionId', None) if data is not None else None  # Get session ID for context
    
    if not user_message or not user_id:
        return jsonify({"error": "No message provided"}), 400
        
    
    # Emergency sentiment analysis
    is_emergency, emergency_confidence, emergency_analysis = analyze_emergency_intent(
        user_message)

    # Reminder intent analysis
    is_reminder_request, reminder_confidence, reminder_components = analyze_reminder_intent(
        user_message)

    # Regular sentiment analysis for response tone
    blob = TextBlob(user_message)
    polarity = blob.sentiment.polarity  # type: ignore
    if polarity > 0.1:
        emotion_instruction = "The user seems happy or positive. You can reply in an encouraging and friendly tone."
    elif polarity < -0.1:
        emotion_instruction = "The user seems upset or worried. Please reply with extra empathy and reassurance."
    else:
        emotion_instruction = ""

    # Handle reminder requests first (before emergency, as reminders are specific intent)
    reminder_result = None
    # Lowered from 0.4 to 0.2 for more lenient detection
    if is_reminder_request and reminder_confidence > 0.2:
        # Call format reminder API
        reminder_result = setup_reminder(user_message, user_id)

        if reminder_result and reminder_result.get('success'):
            # Successful reminder creation
            reminder_data = reminder_result.get(
                'reminder') or reminder_result.get('reminders', [])
            # If it's a list, take the first dict
            if isinstance(reminder_data, list) and len(reminder_data) > 0:
                first = reminder_data[0]
                if isinstance(first, dict):
                    title = first.get('title', 'your reminder')
                    date = first.get('date', '')
                    time = first.get('time', '')
                else:
                    title, date, time = 'your reminder', '', ''
            elif isinstance(reminder_data, dict):
                title = reminder_data.get('title', 'your reminder')
                date = reminder_data.get('date', '')
                time = reminder_data.get('time', '')
            else:
                title, date, time = 'your reminder', '', ''

            if date and time:
                confirmation_msg = f"Perfect! I've set a reminder for '{title}' on {date} at {time}. I'll make sure to notify you when it's time."
            elif date:
                confirmation_msg = f"Great! I've set a reminder for '{title}' on {date}. I'll remind you about this."
            elif time:
                confirmation_msg = f"Done! I've set a reminder for '{title}' at {time}. You'll get notified when it's time."
            else:
                confirmation_msg = f"I've created a reminder for '{title}'. You can view and edit it in your reminders section."

            return jsonify({
                "success": True,
                "message": confirmation_msg,
                "emergency_detected": False,
                "emergency_confidence": 0,
                "emergency_analysis": None,
                "reminder_detected": True,
                "reminder_confidence": reminder_confidence,
                "reminder_components": reminder_components,
                "reminder_result": reminder_result
            })
        else:
            # Reminder processing failed, continue with normal AI response but mention the attempt
            return jsonify({
                "success": False,
                "message": "Failed to process reminder.",
                "emergency_detected": False,
                "emergency_confidence": 0,
                "emergency_analysis": None,
                "reminder_detected": True,
                "reminder_confidence": reminder_confidence,
                "reminder_components": reminder_components,
                "reminder_result": reminder_result
            })

    # Modify system prompt based on emergency detection or reminder context
    base_context = ""
    if chat_history and len(chat_history) > 0:
        base_context = f" You are in an ongoing conversation with the user. Remember the context from previous messages in this session to provide more personalized and coherent responses. This is message #{len(chat_history) + 1} in the current session."
    
    if is_emergency:
        system_prompt = SYSTEM_PROMPT + base_context + " IMPORTANT: The user's message has been detected as a potential emergency situation. Respond with immediate care, empathy, and appropriate guidance while being supportive and calm."
    elif is_reminder_request and not reminder_result:
        system_prompt = SYSTEM_PROMPT + base_context + " The user seems to want to set a reminder but the automatic processing failed. Politely acknowledge this and suggest they can use the reminders section or try rephrasing with more specific details like date, time, and task."
    else:
        system_prompt = SYSTEM_PROMPT + base_context + \
            (f" {emotion_instruction}" if emotion_instruction else "")

    # Build messages array with chat history for context
    messages = [{"role": "system", "content": system_prompt}]
    
    # Add chat history for context (limit to last 10 messages to avoid token limits)
    if chat_history and len(chat_history) > 0:
        # Take the last 10 messages to maintain recent context while staying within token limits
        recent_history = chat_history[-10:] if len(chat_history) > 10 else chat_history
        
        for msg in recent_history:
            # Ensure the message has proper role and content
            if msg is not None and isinstance(msg, dict) and msg.get('role') in ['user', 'assistant'] and msg.get('content'):
                messages.append({
                    "role": msg['role'],
                    "content": msg['content']
                })
    
    # Add the current user message
    messages.append({"role": "user", "content": user_message})

    response = llm_client.chat.completions.create(
        model=GEMINI_MODEL,
        messages=messages
    )

    # --- Robustly extract content from response ---
    def extract_content(resp):
        try:
            # Handle API response object
            if hasattr(resp, 'choices') and resp.choices:
                if hasattr(resp.choices[0], 'message') and hasattr(resp.choices[0].message, 'content'):
                    return resp.choices[0].message.content
            
            # Handle dictionary response
            if isinstance(resp, dict) and 'choices' in resp:
                choices = resp['choices']
                if isinstance(choices, list) and choices:
                    msg = choices[0].get('message')
                    if isinstance(msg, dict):
                        return msg.get('content', '')
                    elif isinstance(msg, str):
                        return msg
            
            # Handle string response directly
            if isinstance(resp, str):
                return resp
                
            # Handle iterable response (streaming)
            if hasattr(resp, '__iter__') and not isinstance(resp, dict) and not isinstance(resp, str):
                try:
                    return ''.join([getattr(chunk, 'content', str(chunk)) for chunk in resp if chunk])
                except Exception:
                    return str(list(resp))
            
            # Fallback
            return str(resp)
        except Exception as e:
            
            return "I apologize, but I encountered an error processing your request. Please try again."

    reply = extract_content(response)
    if not isinstance(reply, str):
        reply = str(reply)
    reply = reply.strip()
    
    # Ensure we have a valid response
    if not reply:
        reply = "I apologize, but I didn't receive a proper response. Please try again."

    # Add reminder context to response if reminder was attempted but failed
    if is_reminder_request and not reminder_result:
        reply += "\n\nI noticed you wanted to set a reminder. You can also use the Reminders section in the app to create reminders manually, or try rephrasing with specific details like 'Remind me to take medicine at 9 AM tomorrow'."

    return jsonify({
        "success": True,
        "message": reply,
        "emergency_detected": is_emergency,
        "emergency_confidence": emergency_confidence,
        "emergency_analysis": emergency_analysis,
        "reminder_detected": is_reminder_request,
        "reminder_confidence": reminder_confidence,
        "reminder_components": reminder_components,
        "reminder_result": reminder_result
    })
