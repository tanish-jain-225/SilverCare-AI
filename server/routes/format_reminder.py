from flask import Blueprint, request, jsonify
from together import Together
from pymongo import MongoClient
from pymongo.errors import PyMongoError
from bson import ObjectId
from datetime import datetime, timedelta
from dateutil.parser import parse as parse_datetime
from dotenv import load_dotenv

import json as pyjson

import re
import json
import os

# Load environment variables
load_dotenv()


format_reminder_bp = Blueprint('format_reminder', __name__)
# Custom JSON encoder to handle MongoDB ObjectId


class MongoJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        elif isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

# Helper function to convert MongoDB documents to JSON-friendly format


def convert_to_json_friendly(document):
    if document is None:
        return None
    if isinstance(document, list):
        return [convert_to_json_friendly(item) for item in document]

    result = {}
    for key, value in document.items():
        if key == '_id' and isinstance(value, ObjectId):
            result['id'] = str(value)
        elif isinstance(value, ObjectId):
            result[key] = str(value)
        elif isinstance(value, datetime):
            result[key] = value.isoformat()
        elif isinstance(value, dict):
            result[key] = convert_to_json_friendly(value)
        elif isinstance(value, list):
            result[key] = [convert_to_json_friendly(item) if isinstance(
                item, dict) else item for item in value]
        else:
            result[key] = value
    return result


# Initialize MongoDB connection settings
mongo_url = os.environ.get('MONGO_URI')
db_name = os.environ.get('DB_NAME')
reminders_collection_name = os.environ.get('REMINDERS_COLLECTION')

# Initialize Together AI client
together_api_key = os.environ.get('TOGETHER_API_KEY')
client = Together(api_key=together_api_key)

# Initialize MongoDB client
if mongo_url and db_name and reminders_collection_name:
    mongo_client = MongoClient(mongo_url)
    db = mongo_client[db_name]
    reminders_collection = db[reminders_collection_name]
else:
    mongo_client = None
    db = None
    reminders_collection = None


def get_dynamic_date_context_for_reminder():
    """
    Generate dynamic date and time context for the AI reminder system
    """
    now = datetime.now()
    today = now.strftime("%Y-%m-%d")
    tomorrow = (now + timedelta(days=1)).strftime("%Y-%m-%d")
    yesterday = (now - timedelta(days=1)).strftime("%Y-%m-%d")

    # Get day names for the next 7 days
    days_ahead = {}
    for i in range(7):
        future_date = now + timedelta(days=i)
        day_name = future_date.strftime("%A").lower()
        date_str = future_date.strftime("%Y-%m-%d")
        days_ahead[day_name] = date_str

    # Get current time info
    current_time = now.strftime("%H:%M")
    current_hour = now.hour

    # Determine time of day
    if 5 <= current_hour < 12:
        time_of_day = "morning"
        suggested_time = "9:00 AM"
    elif 12 <= current_hour < 17:
        time_of_day = "afternoon"
        suggested_time = "3:00 PM"
    elif 17 <= current_hour < 21:
        time_of_day = "evening"
        suggested_time = "7:00 PM"
    else:
        time_of_day = "night"
        suggested_time = "8:00 PM"

    context = f"""
CURRENT DATE & TIME CONTEXT (Use this for intelligent date/time inference):

Current Information:
- Today is: {today} ({now.strftime("%A")})
- Tomorrow is: {tomorrow} ({(now + timedelta(days=1)).strftime("%A")})
- Current time: {current_time} ({time_of_day})

Day Name Mappings:
- Today ({now.strftime("%A").lower()}): {today}
- Tomorrow ({(now + timedelta(days=1)).strftime("%A").lower()}): {tomorrow}
""" + "\n".join([f"- {day}: {date}" for day, date in days_ahead.items() if day != now.strftime("%A").lower()]) + f"""

Smart Defaults:
- If no date specified: use tomorrow for medicine/health, today for general tasks
- If no time specified: use {suggested_time} (current {time_of_day}) or 9:00 AM for medicine
- Convert relative dates (today/tomorrow/Monday/etc.) to exact dates using the mapping above
"""

    return context


def get_smart_default_date_for_reminder(title):
    """Get intelligent default date based on reminder title"""
    now = datetime.now()
    title_lower = title.lower() if title else ""

    # Medicine/health reminders - suggest tomorrow
    if any(word in title_lower for word in ['medicine', 'medication', 'pill', 'vitamin', 'drug', 'treatment']):
        return (now + timedelta(days=1)).strftime("%Y-%m-%d")

    # Appointment/meeting - suggest next weekday
    if any(word in title_lower for word in ['appointment', 'meeting', 'doctor', 'dentist', 'visit']):
        days_ahead = 1
        future_date = now + timedelta(days=days_ahead)
        while future_date.weekday() >= 5:  # Skip weekends
            days_ahead += 1
            future_date = now + timedelta(days=days_ahead)
        return future_date.strftime("%Y-%m-%d")

    # Evening tasks - suggest tomorrow
    if now.hour >= 18:
        return (now + timedelta(days=1)).strftime("%Y-%m-%d")

    # Default to today
    return now.strftime("%Y-%m-%d")


def get_smart_default_time_for_reminder(title):
    """Get intelligent default time based on reminder title"""
    now = datetime.now()
    title_lower = title.lower() if title else ""

    # Medicine times
    if any(word in title_lower for word in ['medicine', 'medication', 'pill', 'vitamin']):
        if 'evening' in title_lower or 'night' in title_lower:
            return "8:00 PM"
        return "9:00 AM"

    # Meal times
    if 'breakfast' in title_lower:
        return "8:00 AM"
    elif 'lunch' in title_lower:
        return "12:00 PM"
    elif 'dinner' in title_lower:
        return "7:00 PM"

    # Appointment times
    if any(word in title_lower for word in ['appointment', 'meeting', 'doctor', 'dentist']):
        return "10:00 AM"

    # Exercise/workout
    if any(word in title_lower for word in ['workout', 'exercise', 'gym', 'walk', 'run']):
        return "7:00 AM"

    # Based on current time of day
    current_hour = now.hour
    if 5 <= current_hour < 12:
        return "9:00 AM"
    elif 12 <= current_hour < 17:
        return "3:00 PM"
    elif 17 <= current_hour < 21:
        return "7:00 PM"
    else:
        return "8:00 PM"


def process_reminders(reminders_list, user_id):
    """Process multiple reminders and save them to MongoDB with intelligent defaults"""
    results = []
    errors = []
    for reminder in reminders_list:
        try:
            # Get title first for smart defaults
            title = reminder.get('title') or "New Reminder"

            # Apply intelligent defaults
            date = reminder.get(
                'date') or get_smart_default_date_for_reminder(title)
            time = reminder.get(
                'time') or get_smart_default_time_for_reminder(title)

            # Validate and format
            if not date or str(date).lower() in ['null', 'none', '']:
                date = get_smart_default_date_for_reminder(title)
            if not time or str(time).lower() in ['null', 'none', '']:
                time = get_smart_default_time_for_reminder(title)

            reminder_data = {"userId": user_id,
                             "title": title, "date": date, "time": time}
            saved_reminder = save_to_mongodb(reminder_data)
            results.append(saved_reminder)
        except Exception as e:
            error_msg = f"Error processing reminder: {str(e)}"
            
            errors.append(error_msg)
    if not results:
        return jsonify({"error": "No valid reminders found", "details": errors}), 400
    return jsonify({
        "success": True,
        "reminders": results,
        "count": len(results),
        "errors": errors if errors else None
    })


@format_reminder_bp.route('/format-reminder', methods=['POST', 'OPTIONS'])
def format_reminder():
    # Handle preflight OPTIONS request
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'success'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST')
        return response

    
    

    # Important - ensure we have a JSON body with 'input' field and userId
    if not request.json:
        return jsonify({"error": "No input provided. Please send JSON with 'input' and 'userId' fields."}), 400
    user_input = request.json.get('input', '')
    user_id = request.json.get('userId')
    # Ensure we have input to process
    if not user_input:
        return jsonify({"error": "No input provided. Please send JSON with 'input' field."}), 400
    if not user_id:
        return jsonify({"error": "No userId provided. Please send JSON with 'userId' field."}), 400
    if reminders_collection is None:
        return jsonify({"error": "Reminders collection is not initialized due to missing environment variables."}), 500

    # Instruct the LLM to format the input as a reminder with intelligent date/time handling
    date_context = get_dynamic_date_context_for_reminder()

    enhanced_system_prompt = f"""You are an expert reminder creation assistant. Parse user input into structured reminders with intelligent date/time inference.

{date_context}

INSTRUCTIONS:
1. Extract title, date, and time from user input
2. Use the current date/time context above to convert relative dates accurately
3. If date is missing, apply intelligent defaults based on reminder type
4. If time is missing, suggest appropriate default times based on context
5. Always return a valid JSON array with proper date formats (YYYY-MM-DD) and time formats in 12-hour format (H:MM AM/PM)

Return format: [{{"title": "task description", "date": "YYYY-MM-DD", "time": "H:MM AM/PM"}}]

Examples using context:
- "remind me medicine" → [{{"title": "take medicine", "date": "{(datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')}", "time": "9:00 AM"}}]
- "appointment tomorrow" → [{{"title": "appointment", "date": "{(datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')}", "time": "10:00 AM"}}]
"""

    response = client.chat.completions.create(
        model="deepseek-ai/DeepSeek-V3",
        messages=[
            {
                "role": "system",
                "content": enhanced_system_prompt
            },
            {
                "role": "user",
                "content": f'Parse this into reminders with intelligent date/time inference: {user_input}'
            }
        ]
    )
    # Robustly extract content from LLM response
    content = None
    # If response is an iterator, convert to list and extract first element
    if hasattr(response, '__iter__') and not hasattr(response, 'choices') and not isinstance(response, (str, bytes, dict)):
        response = list(response)
        if response:
            response = response[0]
    # If response is a tuple, extract first element
    if isinstance(response, tuple):
        response = response[0]
    # Now, try to get content safely
    choices = getattr(response, 'choices', None)
    if choices and isinstance(choices, list) and len(choices) > 0:
        first_choice = choices[0]
        message = getattr(first_choice, 'message', None)
        if message and hasattr(message, 'content'):
            content = message.content
    if not isinstance(content, str):
        return jsonify({"error": "No valid content returned from LLM."}), 500
    

    # Try to extract an array first - handle markdown code blocks.
    try:
        # Look for JSON array in markdown code block or regular text
        array_match = re.search(
            r'```(?:json)?\s*(\[[\s\S]*?\])\s*```|(\[[\s\S]*?\])', content) if isinstance(content, str) else None
        if array_match:
            # Get the first matching group that's not None
            array_text = next(
                group for group in array_match.groups() if group is not None)
            reminders_array = pyjson.loads(array_text)
            if isinstance(reminders_array, list) and len(reminders_array) > 0:
                # Apply intelligent defaults to all reminders in array
                for r in reminders_array:
                    title = r.get('title') or "New Reminder"
                    if not r.get('date') or str(r.get('date')).lower() in ['null', 'none', '']:
                        r['date'] = get_smart_default_date_for_reminder(title)
                    if not r.get('time') or str(r.get('time')).lower() in ['null', 'none', '']:
                        r['time'] = get_smart_default_time_for_reminder(title)
                    if not r.get('title'):
                        r['title'] = title
                return process_reminders(reminders_array, user_id)
    except Exception as e:
        return jsonify({"error": "Failed to process reminders", "details": str(e), "raw": content}), 400

    # If not an array, extract a single JSON object - handle markdown code blocks
    match = re.search(r'```(?:json)?\s*(\{[\s\S]*?\})\s*```|(\{[\s\S]*?\})',
                      content) if isinstance(content, str) else None
    if match:
        try:
            # Get the first matching group that's not None
            json_text = next(group for group in match.groups()
                             if group is not None)
            reminder_json = pyjson.loads(json_text)
            # Apply intelligent defaults for single reminder
            title = reminder_json.get('title') or "New Reminder"
            date = reminder_json.get('date')
            time = reminder_json.get('time')

            # Use smart defaults if missing or null
            if not date or str(date).lower() in ['null', 'none', '']:
                date = get_smart_default_date_for_reminder(title)
            if not time or str(time).lower() in ['null', 'none', '']:
                time = get_smart_default_time_for_reminder(title)

            post_data = {"userId": user_id,
                         "title": title, "date": date, "time": time}
            saved_reminder = save_to_mongodb(post_data)
            return jsonify({"success": True, "reminder": saved_reminder})
        except Exception as e:
            return jsonify({"error": "Failed to parse or post JSON", "details": str(e), "raw": content}), 400
    return jsonify({"error": "No JSON found in LLM response", "raw": content}), 400


def save_to_mongodb(reminder):
    """Save a reminder to MongoDB"""
    if reminders_collection is None:
        raise RuntimeError("Reminders collection is not initialized.")
    reminder_to_save = reminder.copy()
    now = datetime.now()
    reminder_to_save['created_at'] = now
    reminder_to_save['updated_at'] = now
    result = reminders_collection.insert_one(reminder_to_save)
    inserted_id = result.inserted_id
    
    json_safe_reminder = convert_to_json_friendly(reminder_to_save)
    if isinstance(json_safe_reminder, dict):
        json_safe_reminder['id'] = str(inserted_id)
    return json_safe_reminder


@format_reminder_bp.route('/reminders', methods=['GET'])
def get_reminders():
    user_id = request.args.get("userId")
    if not user_id:
        return jsonify({"error": "userId is required"}), 400
    if reminders_collection is None:
        return jsonify({"error": "Reminders collection is not initialized due to missing environment variables."}), 500
    try:
        cursor = reminders_collection.find({"userId": user_id})
        reminders_list = list(cursor)
        

        # Convert ObjectId to string and ensure all fields are properly formatted
        formatted_reminders = []
        for reminder in reminders_list:
            formatted_reminder = {
                "id": str(reminder.get("_id", reminder.get("id", ""))),
                "title": reminder.get("title", ""),
                "date": reminder.get("date", ""),
                "time": reminder.get("time", ""),
                "userId": reminder.get("userId", ""),
                "created_at": reminder.get("created_at", datetime.now()).isoformat(),
                "updated_at": reminder.get("updated_at", datetime.now()).isoformat()
            }
            formatted_reminders.append(formatted_reminder)

        
        return jsonify({
            "success": True,
            "reminders": formatted_reminders,
            "count": len(formatted_reminders)
        })
    except Exception as e:
        
        return jsonify({"error": str(e)}), 500


@format_reminder_bp.route('/reminders/<reminder_id>', methods=['GET'])
def get_reminder_by_id(reminder_id):
    if reminders_collection is None:
        return jsonify({"error": "Reminders collection is not initialized due to missing environment variables."}), 500
    try:
        reminder = None
        if ObjectId.is_valid(reminder_id):
            reminder = reminders_collection.find_one(
                {"_id": ObjectId(reminder_id)})
        if not reminder:
            return jsonify({"error": f"Reminder with ID {reminder_id} not found"}), 404
        reminder = convert_to_json_friendly(reminder)
        return jsonify({"success": True, "reminder": reminder})
    except Exception as e:
        
        return jsonify({"error": str(e)}), 500


@format_reminder_bp.route('/reminder-data', methods=['POST', 'OPTIONS'])
def save_reminder_data():
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'success'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST')
        return response
    
    reminder_data = request.json
    if not reminder_data:
        return jsonify({"error": "No reminder data provided"}), 400
    try:
        
        if isinstance(reminder_data, list):
            results = []
            for reminder in reminder_data:
                saved = save_to_mongodb(reminder)
                if saved:
                    results.append(saved)
            response = jsonify({
                "success": True,
                "reminders": results,
                "count": len(results)
            })
        else:
            saved_reminder = save_to_mongodb(reminder_data)
            response = jsonify({"success": True, "reminder": saved_reminder})
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
    except Exception as e:
        
        return jsonify({
            "error": f"Failed to save reminder data: {str(e)}"
        }), 500


@format_reminder_bp.route('/delete-reminder', methods=['POST'])
def delete_reminder():
    try:
        data = request.json
        reminder_id = data.get("id") if data else None
        user_id = data.get("userId") if data else None
        if not reminder_id or not user_id:
            return jsonify({"error": "Both id and userId are required"}), 400
        if reminders_collection is None:
            return jsonify({"error": "Reminders collection is not initialized due to missing environment variables."}), 500
        result = reminders_collection.delete_one(
            {"_id": ObjectId(reminder_id), "userId": user_id})
        if result.deleted_count == 0:
            return jsonify({"error": f"Reminder with ID {reminder_id} and userId {user_id} not found"}), 404
        return jsonify({"success": True, "message": f"Reminder with ID {reminder_id} deleted"})
    except Exception as e:
        
        return jsonify({"error": str(e)}), 500
