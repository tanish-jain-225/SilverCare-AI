# SilverCare-AI Client

This folder contains the frontend (client) code for SilverCare-AI.

## Overview
- **Framework:** React (Vite)
- **Styling:** Tailwind CSS, custom CSS
- **Features:**
  - Responsive, modern UI for senior citizens
  - Voice assistant and chat with AI (Gemini LLM)
  - Emergency alerts and reminders
  - Blog/news section (World News API)
  - Saved contacts management (Message Feature)
  - User authentication and Profile Data Management (Firebase Auth)

## Structure
- `src/` — Main source code
  - `components/` — Reusable UI and layout components
  - `pages/` — Main app pages (Home, Profile, Reminders, etc.)
  - `hooks/` — Custom React hooks (voice, location, etc.)
  - `firebase/` — Firebase config and auth logic
  - `utils/` — Utility functions and API services
  - `styles/` — Custom CSS (theme, etc.)
- `public/` — Static assets (images, audio, etc.)
- `index.html` — Main HTML entry point (SEO/meta tags)
- `vite.config.js` — Vite configuration
- `tailwind.config.js` — Tailwind CSS configuration

## Environment Variables
All API keys and credentials must be set in `.env` (never hardcoded).

## Running Locally
1. Install dependencies:
   ```sh
   npm install
   ```
2. Create a `.env` file in the `client/` directory with all required variables.
3. Start the development server:
   ```sh
   npm run dev
   ```

## Build for Production
```sh
npm run build
```

## Linting
```sh
npm run lint
```

## Features & Best Practices
- All navigation and UI are responsive and accessible.
- No secrets or API keys are hardcoded; all are in `.env`.
- All focus ring and focus state CSS have been removed for a cleaner UI.
- Margins and layout are standardized to prevent extra scroll.
- SEO meta tags are included in `index.html`.
- Error handling and user feedback are improved throughout the app.

## Troubleshooting
- **World News API 402 error:** Your API key is invalid, exhausted, or not paid. Update your `.env` with a valid key.
- **Firestore errors:** Check your Firebase project settings and Firestore rules.
- **Voice/AI issues:** Ensure browser supports Web Speech API and microphone access is allowed.

## Support
For backend setup, see the `server/Readme.md`. For further help, see the main project README or contact the maintainer.