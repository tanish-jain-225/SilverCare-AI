from textblob import TextBlob

import re

# ================== REMINDER DETECTION ==================
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
