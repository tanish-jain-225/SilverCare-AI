# SilverCare-AI Server

This folder contains the backend (server) code for SilverCare-AI.

## Overview
- **Framework:** Python (Flask Library)
- **APIs:** Handles queries, reminders and saved contacts endpoints
- **Database:** MongoDB Compass
- **Deployment:** Designed for Vercel serverless deployment

## Structure
- `app.py` — Main server entry point
- `api/` — API index and shared logic
- `routes/` — Individual route handlers (e.g., `ask_query.py`)
- `requirements.txt` — Python dependencies
- `vercel.json` — Vercel serverless configuration

## Environment Variables
All secrets, API keys and collection names must be set in `.env` (not hardcoded).


## Running Locally
1. Install dependencies:
   ```sh
   pip install -r requirements.txt
   ```
2. Create a `.env` file in the `server/` directory with all required variables.
3. Start the server:
   ```sh
   python app.py
   ```

## Deployment
- The server is configured for Vercel serverless deployment via `vercel.json`.
- Ensure all environment variables are set in your Vercel project settings.

## API Endpoints
- `/api/ask-query` — AI Q&A endpoint
- `/api/format-reminder` — Reminder formatting
- `/api/saved-contacts` — Emergency contacts (MongoDB)

## Notes
- Do not commit secrets or API keys to version control.
- All collection names and secrets must be in `.env`.
- For Firestore rules, see the main project README.

## Support
For issues, see the main project README or contact the project maintainer.
