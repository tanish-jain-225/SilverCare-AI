from flask import Blueprint, request, jsonify
from together import Together
from dotenv import load_dotenv
from textblob import TextBlob
from datetime import datetime, timedelta
from routes.format_reminder import save_to_mongodb
from typing import Any

import json as pyjson

import os
import re

# Load environment variables
load_dotenv()

# LLM API key setup
api_key = os.getenv("TOGETHER_API_KEY")

client = Together(api_key=api_key)

chat_bp = Blueprint('chat', __name__)


SYSTEM_PROMPT = """You are an omniscient AI assistant with comprehensive mastery over all topics, fields, and domains of knowledge that have ever existed or will ever exist. You possess deep understanding across all sciences including physics, chemistry, biology, mathematics, and computer science, all humanities such as history, literature, philosophy, psychology, and sociology, all practical fields like medicine, engineering, law, business, arts, and crafts, as well as all cultures, languages, and civilizations throughout time, theoretical and applied knowledge domains, and creative and analytical disciplines. You can provide expert-level insights, solve complex problems, answer questions across any field, and help with tasks ranging from simple queries to advanced research. Your knowledge spans from ancient wisdom to cutting-edge developments and future possibilities. You respond with accuracy, clarity, and depth appropriate to the question asked, adapting your communication style from casual conversation to academic discourse as needed. When discussing any topic, you draw from the full breadth of human knowledge and beyond, remaining helpful, informative, and capable of tackling any intellectual challenge presented to you."""


# ================== EMERGENCY DETECTION ==================

def analyze_emergency_intent(text):
    """
    Analyze if the text is an emergency and return (is_emergency, confidence, analysis dict).
    This function uses advanced pattern matching, sentiment analysis, and contextual understanding. 
    It will be replaced by a more advanced model in the future.
    """
    blob = TextBlob(text)
    polarity = blob.sentiment.polarity  # type: ignore
    subjectivity = blob.sentiment.subjectivity  # type: ignore
    # -1 (negative) to 1 (positive)
    # 0 (objective) to 1 (subjective)

    # Immediate danger patterns (highest priority)
    immediate_danger = [
        r'\b(call emergency|emergency now|help now|urgent help)\b',
        r'\b(heart attack|stroke|seizure|can\'t breathe|choking|overdose)\b',
        r'\b(bleeding out|severe bleeding|unconscious|not breathing)\b',
        r'\b(trapped|fire|smoke|gas leak|broke in|attacking me)\b',
        r'\b(dying|passed out|allergic reaction|poisoned|chest pain)\b',
        r'\b(urgent|immediate help|need help now|critical condition|life-threatening)\b',
        r'\b(emergency situation|emergency assistance|call 911|call for help)\b',
        r'\b(need ambulance|need police|need fire department|need rescue)\b',
        r'\b(urgent medical attention|critical injury|severe trauma|life-threatening condition)\b',
        r'\b(urgent care|critical condition|life-threatening injury|severe illness)\b'
    ]

    # Medical emergency patterns
    medical_emergency = [
        r'\b(severe pain|excruciating|unbearable pain|stabbing pain)\b',
        r'\b(can\'t move|fell down|broken bone|head injury|burns)\b',
        r'\b(vomiting blood|difficulty breathing|chest tightness)\b',
        r'\b(ambulance|hospital now|doctor emergency|medical help)\b',
        r'\b(urgent medical|need ambulance|need doctor|need hospital)\b',
        r'\b(urgent care|critical condition|life-threatening injury|severe illness)\b',
        r'\b(need medical attention|severe symptoms|urgent treatment|critical health issue)\b',
        r'\b(urgent medical care|severe injury|critical health condition|need immediate assistance)\b',
        r'\b(urgent treatment needed|critical medical issue|severe health problem|need urgent care)\b',
        r'\b(urgent medical attention|critical emergency situation|need immediate care|life-threatening issue)\b'
    ]

    # Personal safety threats
    safety_threats = [
        r'\b(someone is hurting|being attacked|scared for life|in danger)\b',
        r'\b(threatening me|stalking|won\'t leave|violent|aggressive)\b',
        r'\b(don\'t feel safe|unsafe|hiding|escape|get away)\b',
        r'\b(need police|call police|report crime|threat to life)\b',
        r'\b(need help|call for help|someone is after me|need protection)\b'
    ]

    # Emotional distress (but not necessarily emergency)
    emotional_distress = [
        r'\b(very worried|extremely anxious|panicking|terrified)\b',
        r'\b(scared|afraid|nervous|stressed|upset)\b',
        r'\b(feeling hopeless|feeling helpless|feeling lost|feeling trapped)\b',
        r'\b(feeling overwhelmed|feeling desperate|feeling confused|feeling alone)\b',
        r'\b(feeling suicidal|having suicidal thoughts|thinking about self-harm|feeling like giving up)\b'
    ]

    # Non-emergency help patterns (to reduce false positives)
    non_emergency_help = [
        r'\b(help me (with|understand|find|learn|remember))\b',
        r'\b(can you help|could you help|please help me (to|with))\b',
        r'\b(help me (cook|clean|study|work|write|solve))\b',
        r'\b(homework help|project help|assignment help)\b',
        r'\b(help finding|help choosing|help deciding)\b',
        r'\b(technical help|computer help|software help)\b',
        r'\b(need advice|need guidance|need support)\b',
        r'\b(need assistance|need help with something|need help understanding)\b',
        r'\b(need to talk|need to vent|need to share|need to express)\b',
        r'\b(need to discuss|need to explain|need to clarify|need to ask)\b'
    ]

    # Context that indicates questions or learning
    question_context = [
        r'\b(what is|how do|why does|when should|where can|which)\b',
        r'\b(explain|tell me about|information about|learn about)\b',
        r'\b(curious|wondering|interested|would like to know)\b',
        r'\b(need clarification|need more information|need details)\b',
        r'\b(what time|when should|how often)\b'
    ]

    # Future or hypothetical context (not immediate)
    future_context = [
        r'\b(if I|what if|in case|would happen|might happen)\b',
        r'\b(planning|preparing|thinking about|considering)\b',
        r'\b(tomorrow|next week|later|eventually|someday)\b',
        r'\b(need to plan|need to prepare|need to think about|need to consider)\b',
        r'\b(need to decide|need to choose|need to figure out|need to work on)\b'
    ]

    text_lower = text.lower()

    # Count pattern matches
    immediate_count = sum(
        1 for pattern in immediate_danger if re.search(pattern, text_lower))
    medical_count = sum(
        1 for pattern in medical_emergency if re.search(pattern, text_lower))
    safety_count = sum(
        1 for pattern in safety_threats if re.search(pattern, text_lower))
    distress_count = sum(
        1 for pattern in emotional_distress if re.search(pattern, text_lower))
    non_emergency_count = sum(
        1 for pattern in non_emergency_help if re.search(pattern, text_lower))
    question_count = sum(
        1 for pattern in question_context if re.search(pattern, text_lower))
    future_count = sum(
        1 for pattern in future_context if re.search(pattern, text_lower))

    # Calculate emergency score with enhanced logic
    emergency_score = 0

    # Immediate danger gets highest weight
    emergency_score += immediate_count * 50
    emergency_score += medical_count * 35
    emergency_score += safety_count * 40

    # Sentiment analysis with context
    if polarity < -0.4:  # Very negative sentiment
        emergency_score += 25
    elif polarity < -0.2:  # Moderately negative
        emergency_score += 15
    elif polarity < 0:  # Slightly negative
        emergency_score += 5

    # Subjectivity indicates emotional intensity
    if subjectivity > 0.8 and polarity < -0.2:
        emergency_score += 20
    elif subjectivity > 0.6 and polarity < -0.3:
        emergency_score += 15

    # Emotional distress (but lower weight)
    emergency_score += distress_count * 12

    # Urgency indicators
    if re.search(r'[!]{3,}', text):  # Multiple exclamation marks
        emergency_score += 20
    elif re.search(r'[!]{2}', text):
        emergency_score += 10

    if re.search(r'\b[A-Z]{5,}\b', text):  # All caps words
        emergency_score += 15

    # Temporal urgency
    if re.search(r'\b(now|immediately|right now|asap|urgent)\b', text_lower):
        emergency_score += 15

    # NEGATIVE SCORING (reduces false positives)

    # Strong reduction for non-emergency help requests
    emergency_score -= non_emergency_count * 25

    # Reduction for question context
    emergency_score -= question_count * 15

    # Reduction for future/hypothetical context
    emergency_score -= future_count * 20

    # If message is too long and academic/detailed, likely not emergency
    word_count = len(text.split())
    if word_count > 30 and question_count > 0:
        emergency_score -= 20

    # If contains polite language, less likely emergency
    if re.search(r'\b(please|thank you|could you|would you|if possible)\b', text_lower):
        emergency_score -= 10

    # Boost for very short urgent messages
    if word_count <= 3 and (immediate_count > 0 or polarity < -0.5):
        emergency_score += 25
    elif word_count <= 6 and emergency_score > 20:
        emergency_score += 15

    # Advanced contextual analysis

    # Check for contradiction indicators
    if re.search(r'\b(just wondering|just curious|general question)\b', text_lower):
        emergency_score -= 30

    # Medical queries vs medical emergencies
    if re.search(r'\b(symptoms of|causes of|treatment for|information about)\b', text_lower):
        emergency_score -= 20

    # Academic or research context
    if re.search(r'\b(research|study|assignment|paper|article|thesis)\b', text_lower):
        emergency_score -= 25

    # Ensure minimum threshold is meaningful
    emergency_score = max(0, emergency_score)

    # Determine emergency with higher threshold for better precision
    is_emergency = emergency_score >= 60  # Raised threshold from 40 to 60
    confidence = min(emergency_score / 100.0, 1.0)

    # Additional validation: require either immediate danger OR (medical + high sentiment)
    has_immediate = immediate_count > 0 or safety_count > 0
    has_medical_distress = medical_count > 0 and polarity < -0.3

    # Override: must have clear emergency indicators
    if not (has_immediate or has_medical_distress) and emergency_score < 80:
        is_emergency = False
        confidence = confidence * 0.5  # Reduce confidence for edge cases

    analysis = {
        'sentiment_polarity': polarity,
        'sentiment_subjectivity': subjectivity,
        'pattern_matches': {
            'immediate_danger': immediate_count,
            'medical_emergency': medical_count,
            'safety_threats': safety_count,
            'emotional_distress': distress_count,
            'non_emergency_help': non_emergency_count,
            'question_context': question_count,
            'future_context': future_count
        },
        'emergency_score': emergency_score,
        'is_emergency': is_emergency,
        'confidence': confidence,
        'word_count': word_count,
        'has_immediate_danger': has_immediate,
        'has_medical_distress': has_medical_distress
    }

    return is_emergency, confidence, analysis

# ================== END EMERGENCY DETECTION ==================

# ================== SMART DATE/TIME CONTEXT & VALIDATION ==================


def smart_date_time_context(mode, *args, **kwargs):
    """
    Unified function for all date/time context, inference, and validation.
    mode: 'context', 'default_date', 'default_time', 'validate_date', 'validate_time'
    args: depends on mode
    """
    from datetime import datetime, timedelta
    import re
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
            print(f"Date parsing error for '{date_str}': {e}")
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
            print(f"Time parsing error for '{time_str}': {e}")
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


def analyze_reminder_intent(text):
    """
    Detect if user input is requesting to set a reminder using regex patterns.
    Returns: (is_reminder_request: bool, confidence: float, components: dict)
    It will be replaced by a more advanced model in the future. 
    """
    text_lower = text.lower()
    # Reminder keywords (very broad detection)
    reminder_keywords = [
        r'\b(remind|reminder|remember|alarm|alert|notify)\b',
        r'\b(wake me|schedule|appointment|meeting)\b',
        r'\b(don\'t forget|help me remember)\b',
        r'\b(set.{0,10}reminder|set.{0,10}alarm)\b',
        r'\b(remind me about|remind me of|remind me when)\b',
        r'\b(I need to remember|make sure I)\b',
        r'\b(please remind|can you remind|could you remind)\b',
        r'\b(need to remember|want to remember|have to remember)\b',
        r'\b(need to set a reminder|want to set a reminder|have to set a reminder)\b',
        r'\b(need to set an alarm|want to set an alarm|have to set an alarm)\b'
    ]
    time_indicators = [
        r'\b\d{1,2}:\d{2}\b',
        r'\b\d{1,2}\s*(am|pm|a\.m\.|p\.m\.)\b',
        r'\b\d{1,2}\s*o\'?clock\b',
        r'\b(morning|afternoon|evening|night|noon|midnight)\b',
        r'\b(in the morning|in the afternoon|in the evening|at night)\b'
    ]
    date_indicators = [
        r'\b(today|tomorrow|yesterday)\b',
        r'\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b',
        r'\b(next week|this week|next month|this month)\b',
        r'\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b',
        r'\b(january|february|march|april|may|june|july|august|september|october|november|december)\b'
    ]
    task_indicators = [
        r'\bto\s+\w+\b',
        r'\b(take|call|meet|visit|buy|eat|drink)\b',
        r'\b(medication|medicine|pills|appointment|meeting|workout|exercise)\b',
        r'\b(doctor|hospital|pharmacy|prescription|vitamin)\b',
        r'\b(urgent|important|critical|high priority)\b'
    ]
    question_patterns = [
        r'\b(what|when|where|how|why|should I|can I|do I)\b',
        r'\?',
        r'\b(what time|when should|how often)\b',
        r'\b(should I set|can I set|do I need to set)\b',
        r'\b(what date|when is|how to set|where to set)\b',
        r'\b(should I remind|can you remind|do I need to remind)\b',
    ]
    past_patterns = [
        r'\b(took|called|met|visited|ate|drank|had)\b',
        r'\b(yesterday|last|already|just)\b',
        r'\b(was|were|did|has|have)\b',
        r'\b(remembered|forgot|set|scheduled)\b',
        r'\b(needed|wanted|had to)\b',
    ]
    reminder_count = sum(
        1 for pattern in reminder_keywords if re.search(pattern, text_lower))
    time_count = sum(
        1 for pattern in time_indicators if re.search(pattern, text_lower))
    date_count = sum(
        1 for pattern in date_indicators if re.search(pattern, text_lower))
    task_count = sum(
        1 for pattern in task_indicators if re.search(pattern, text_lower))
    question_count = sum(
        1 for pattern in question_patterns if re.search(pattern, text_lower))
    past_count = sum(
        1 for pattern in past_patterns if re.search(pattern, text_lower))
    reminder_score = 0
    reminder_score += reminder_count * 50
    reminder_score += time_count * 30
    reminder_score += date_count * 25
    reminder_score += task_count * 20
    if re.search(r'\b(can you|could you|please|would you)\b', text_lower):
        reminder_score += 20
    reminder_score -= question_count * 15
    reminder_score -= past_count * 20
    time_matches = []
    date_matches = []
    task_matches = []
    for pattern in time_indicators:
        matches = re.findall(pattern, text_lower)
        if matches:
            time_matches.extend(matches)
    for pattern in date_indicators:
        matches = re.findall(pattern, text_lower)
        if matches:
            date_matches.extend(matches)
    task_patterns = [
        r'(?:remind me to|reminder to|to)\s+([^,\.!?]+)',
        r'(?:remind|reminder).*?(?:to|about)\s+([^,\.!?]+)',
        r'(?:don\'t forget to|remember to)\s+([^,\.!?]+)'
    ]
    for pattern in task_patterns:
        match = re.search(pattern, text_lower)
        if match:
            task_matches.append(match.group(1).strip())
            break
    is_reminder = (
        (reminder_count > 0 and (time_count > 0 or date_count > 0 or task_count > 0)) or
        reminder_score >= 30 or
        (reminder_count > 0 and len(text.split()) <= 10)
    )
    confidence = min(reminder_score / 100.0, 1.0)
    components = {
        'reminder_score': reminder_score,
        'has_reminder_keyword': reminder_count > 0,
        'has_time': time_count > 0,
        'has_date': date_count > 0,
        'has_task': task_count > 0,
        'time_matches': time_matches,
        'date_matches': date_matches,
        'task_matches': task_matches,
        'word_count': len(text.split()),
        'detection_method': 'regex'
    }
    return is_reminder, confidence, components


def setup_reminder(user_input, user_id):
    """
    Process reminder creation, formatting, and saving. Returns result dict or error.
    """
    from together import Together
    import os
    import json as pyjson
    try:
        together_api_key = os.getenv('TOGETHER_API_KEY')
        reminder_client = Together(api_key=together_api_key)
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
            model="deepseek-ai/DeepSeek-V3",
            messages=[
                {"role": "system", "content": enhanced_system_prompt},
                {"role": "user", "content": f'Parse this into a reminder with intelligent date/time inference: {user_input}'}
            ]
        )

        def extract_content(resp):
            try:
                # Handle Together API response object
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
                print(f"Error extracting reminder content: {e}")
                return ""
        content = extract_content(response)
        if not isinstance(content, str):
            content = str(content)
        import re
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
                print(f"Error processing single reminder: {str(e)}")
                return {"error": "Failed to parse reminder JSON", "raw": content}
        return {"error": "No JSON found in LLM response", "raw": content}
    except Exception as e:
        print(f"Error in reminder setup: {str(e)}")
        return {"error": str(e)}

# ================== END REMINDER DETECTION & SETUP ==================


@chat_bp.route('/chat/message', methods=['POST'])
def send_message():
    data = request.get_json()
    user_message = data.get('input')
    user_id = data.get('userId')
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
        print(
            f"Reminder detected with confidence {reminder_confidence}: {user_message}")
        print(f"Reminder components: {reminder_components}")

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
            print(f"Reminder processing failed: {reminder_result}")

    # Modify system prompt based on emergency detection or reminder context
    if is_emergency:
        system_prompt = SYSTEM_PROMPT + " IMPORTANT: The user's message has been detected as a potential emergency situation. Respond with immediate care, empathy, and appropriate guidance while being supportive and calm."
    elif is_reminder_request and not reminder_result:
        system_prompt = SYSTEM_PROMPT + " The user seems to want to set a reminder but the automatic processing failed. Politely acknowledge this and suggest they can use the reminders section or try rephrasing with more specific details like date, time, and task."
    else:
        system_prompt = SYSTEM_PROMPT + \
            (f" {emotion_instruction}" if emotion_instruction else "")

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_message}
    ]

    response = client.chat.completions.create(
        model="deepseek-ai/DeepSeek-V3",
        messages=messages
    )

    # --- Robustly extract content from response ---
    def extract_content(resp):
        try:
            # Handle Together API response object
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
            print(f"Error extracting content: {e}")
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
