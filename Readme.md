# <img src="client/public/bot-image.png" alt="SilverCare AI Logo" width="60" style="vertical-align:middle;"> SilverCare-AI

---

<p align="center">
  <img src="client/public/voice-search.png" alt="SilverCare AI" width="120" />
</p>

<p align="center">
  <b>Empowering Seniors with a Voice-First, Accessible AI Assistant.</b><br>
  <i>Chat, Reminders, Emergency Alerts and Accessibility—All in One Place.</i>
</p>

---

## Overview

SilverCare-AI is a full-stack, voice-first AI assistant designed for senior citizens. It bridges the digital divide by making technology accessible, intuitive, and empowering for older adults. With step-by-step onboarding, voice-enabled chat, smart reminders, emergency alerts, and a beautiful, accessible UI, SilverCare-AI is more than a tool—it's a companion for independent living.

---

## Screenshots

<p align="center">
  <img src="client/public/screenshots/home-page.png" alt="Home Page - Mobile" width="220" />
  <img src="client/public/screenshots/voice-assistant-page.png" alt="Voice Assistant - Mobile" width="220" />
  <img src="client/public/screenshots/reminders-page.png" alt="Reminders - Mobile" width="220" />
  <img src="client/public/screenshots/blog-page-1.jpg" alt="Blog - Mobile" width="220" />
  <img src="client/public/screenshots/blog-page-2.jpg" alt="Blog - Mobile" width="220" />
  <img src="client/public/screenshots/profile-page.png" alt="Profile - Mobile" width="220" />
  <img src="client/public/screenshots/emergency-page.png" alt="Emergency - Mobile" width="220" />
</p>

> **Note:** All screenshots showcase the mobile-first, accessible design of SilverCare-AI. For best results, view on a mobile device or resize your browser window.

---

## Tech Stack

### Frontend

- **React + Vite**: Fast, modern, and modular UI development.
- **Tailwind CSS**: Utility-first, accessible, and responsive styling.
- **React Context & Hooks**: State management and custom logic.
- **Speech Recognition & Synthesis APIs**: Voice input/output everywhere.
- **Firebase Auth**: Secure authentication and user management.

### Backend

- **Python (Flask)**: REST API for chat, reminders, onboarding, and emergency features.
- **Firebase Firestore**: User data, reminders, and profile storage.
- **MongoDB**: Emergency contacts storage and reminders.
- **Vercel**: Serverless deployment for both frontend and backend.

---

## Features

- **Step-by-Step Onboarding**: Voice-enabled, mobile-friendly form with validation and accessibility.
- **Voice-First Chat**: Ask anything, set reminders, or get help—just speak!
- **Smart Reminders**: Create, view, and get notified about reminders. Unique alarms, no duplicates, and reliable scheduling.
- **Emergency Alerts**: Instantly send emergency alerts and manage emergency contacts.
- **Blog/News Section**: Fetches news using World News API (API key required).
- **Accessibility**: High-contrast, large touch targets, voice feedback, and screen reader support.
- **Mobile-First Design**: Fully responsive and touch-friendly.
- **Personalization**: Learns and adapts to user interests and needs.

---

## Accessibility & Onboarding

- **Accessible by Design**: Every page and component is built for seniors—clear labels, voice feedback, and easy navigation.
- **Voice Input Everywhere**: All forms and chat fields support voice input, with clear buttons and feedback.
- **Step Progress**: Onboarding shows clear progress and prevents skipping required steps.
- **Screen Reader Friendly**: Uses semantic HTML and ARIA where needed.

---

## Security & Best Practices

- All API keys and credentials are stored in `.env` files (never hardcoded).
- Firestore rules restrict access to authenticated users where appropriate.
- No user passwords are stored—uses Firebase Auth only.
- SEO meta tags are included in `index.html`.
- Error handling and user feedback are improved throughout the app.

---

## Project Structure

```
SilverCare-AI/
  ├── client/      # Frontend React app (Vite, Tailwind, Firebase)
  ├── server/      # Backend Python API (Flask, MongoDB, Firestore)
  └── Readme.md    # Project documentation
```

- **client/** — Frontend React app ([see client/Readme.md](client/Readme.md))
- **server/** — Backend Python API ([see server/Readme.md](server/Readme.md))

---

## Getting Started

### Prerequisites

- **Node.js** (v16+)
- **npm** or **yarn**
- **Python 3.9+**
- **pip** (Python package manager)

### Installation

1. **Clone the Repository**
   ```sh
   git clone <Repository-Link>
   cd <Repository-Name>
   ```

2. **Install Client Dependencies**
   ```sh
   cd client
   npm install
   # or
   yarn install
   ```

3. **Install Server Dependencies**
   ```sh
   cd ../server
   pip install -r requirements.txt
   ```

### Environment Variables

- All API keys and credentials must be set in `.env` files in both `client/` and `server/` directories.
- See `client/Readme.md` and `server/Readme.md` for example `.env` files and required variables.

---

## Running the Application Locally

1. **Start the Backend (Flask Server)**
   ```sh
   cd server
   python app.py
   # or use flask run
   ```

2. **Start the Frontend (Vite/React)**
   ```sh
   cd client
   npm run dev
   # or
   yarn dev
   ```

3. **Access the App**
   Open your browser at [http://localhost:5173](http://localhost:5173) (default Vite port).

---

## Deployment

### Deploying on Vercel

#### Frontend

- The `client/` directory is ready for Vercel static hosting.
- The `vercel.json` in `client/` ensures SPA routing works:
  ```json
  {
    "version": 2,
    "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
  }
  ```
- Set the project root to `client/` in the Vercel dashboard or use the CLI.

#### Backend

- The `server/` directory is configured for Vercel Python serverless deployment.
- Ensure the entrypoint in `server/vercel.json` matches your main Flask app (see [server/Readme.md](server/Readme.md) for details).
- All dependencies are listed in `requirements.txt`.

#### Environment Variables

- Set all required environment variables in the Vercel dashboard for both frontend and backend.

---

## Future Enhancements

- **Mobile App**: Native iOS/Android support.
- **Smart Home Integration**: Voice control for IoT devices.
- **Health Monitoring**: Track vitals and provide insights.
- **Community & Social**: Connect seniors for social engagement.

---

## Contributors

| [![](https://github.com/parthnarkar.png?size=100)](https://github.com/parthnarkar) | [![](https://github.com/tanish-jain-225.png?size=100)](https://github.com/tanish-jain-225) | [![](https://github.com/pankaj0695.png?size=100)](https://github.com/pankaj0695) | [![](https://github.com/Chief-Ayush.png?size=100)](https://github.com/Chief-Ayush) |
| :--------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------------: | :------------------------------------------------------------------------------: | :--------------------------------------------------------------------------------: |
|                 [**Parth Narkar**](https://github.com/parthnarkar)                 |                  [**Tanish Sanghvi**](https://github.com/tanish-jain-225)                  |                [**Pankaj Gupta**](https://github.com/pankaj0695)                 |                [**Ayush Attarde**](https://github.com/Chief-Ayush)                 |

---

## Contributing

We welcome contributions! To get started:

1. Fork the repo.
2. Create a feature branch.
3. Submit a pull request with a clear description.

---

## Why SilverCare-AI?

SilverCare-AI is more than a hackathon project—it's a mission to empower seniors with technology that truly understands and supports them. Our focus on accessibility, usability, and real-world impact sets us apart. We believe every senior deserves a digital companion that is friendly, reliable, and empowering.

---

<p align="center">
  <b>Making Technology Human—For Everyone.</b>
</p>
