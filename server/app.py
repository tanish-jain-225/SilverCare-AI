from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from routes.format_reminder import format_reminder_bp
from routes.ask_query import chat_bp
from routes.saved_contacts import saved_contacts_bp
from routes.blog_fetch import blog_fetch_bp

import traceback
import os

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
# Enable CORS to allow all origins
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# Port configuration - Backend will run on port 5000
PORT = os.getenv('PORT')

# Serve empty favicon to avoid 500 errors
@app.route('/favicon.ico')
def favicon():
    return ('', 204)

# Register blueprints at root paths
app.register_blueprint(format_reminder_bp)
app.register_blueprint(chat_bp)
app.register_blueprint(saved_contacts_bp)
app.register_blueprint(blog_fetch_bp)

@app.route('/', methods=['GET'])
def index():
    return "Welcome to the AI Assistant API!"

@app.route('/health', methods=['GET'])
def health_check():
    return "API is running smoothly!", 200

# Error handler for 404 Not Found
@app.errorhandler(404)
def not_found(error):
    return {"error": "Resource not found"}, 404
@app.errorhandler(Exception)
def handle_exception(error):
    app.logger.error('Unhandled Exception:\n' + traceback.format_exc())
    return jsonify({"error": "Internal Server Error"}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)
