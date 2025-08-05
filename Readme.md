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

- **React 18 + Vite**: Fast, modern, and modular UI development with hot module replacement.
- **Tailwind CSS**: Utility-first, accessible, and responsive styling framework.
- **Framer Motion**: Smooth animations and micro-interactions for enhanced UX.
- **React Router DOM**: Client-side routing for SPA navigation.
- **React Context & Custom Hooks**: State management and reusable logic.
- **Web Speech API**: Native browser voice recognition and synthesis.
- **Firebase Auth**: Secure authentication and user management.
- **Lucide React**: Beautiful, customizable icon library.

### Backend

- **Python 3.9+ (Flask)**: Lightweight REST API framework for microservices.
- **Together AI**: Advanced AI/LLM integration for intelligent responses.
- **TextBlob**: Natural language processing for sentiment analysis.
- **MongoDB**: Document database for emergency contacts and user data.
- **Firebase Firestore**: Real-time database for user profiles and reminders.
- **Flask-CORS**: Cross-origin resource sharing for frontend-backend communication.
- **Vercel**: Serverless deployment platform for both frontend and backend.

---

## Features

### 🎙️ Voice-First Experience

- **Universal Voice Input**: Every form field and chat interface supports voice input
- **Intelligent Voice Assistant**: Natural conversation with AI-powered responses
- **Text-to-Speech**: All AI responses are spoken aloud for accessibility
- **Voice Commands**: Navigate and control the app hands-free

### 🛡️ Emergency & Safety

- **Smart Emergency Detection**: AI analyzes messages for emergency situations
- **Instant WhatsApp Alerts**: Automatically sends emergency messages to contacts
- **Location Sharing**: GPS coordinates included in emergency alerts
- **Emergency Contacts Management**: Store and manage trusted contacts

### ⏰ Smart Reminders

- **Natural Language Processing**: Create reminders using conversational language
- **Intelligent Scheduling**: AI understands dates, times, and recurring patterns
- **Audio Notifications**: Voice alerts for all reminders
- **No Duplicates**: Smart detection prevents duplicate reminders

### 👥 User Management

- **Secure Authentication**: Firebase-powered login and registration
- **Profile Customization**: Personal information and preferences
- **Chat History**: Persistent conversation sessions with context
- **Contact Management**: Save and organize important contacts

### 📰 Stay Informed

- **News & Health Articles**: Curated content from World News API
- **Health Tips**: Relevant articles for senior wellness
- **Easy Reading**: Large fonts and high contrast for accessibility

### ♿ Accessibility Features

- **Mobile-First Design**: Optimized for touch interactions
- **High Contrast UI**: Easy-to-read interface with clear visual hierarchy
- **Large Touch Targets**: Senior-friendly button and link sizes
- **Screen Reader Support**: Semantic HTML and ARIA labels
- **Voice Feedback**: Audio confirmation for all actions

---

## Accessibility & Onboarding

- **Accessible by Design**: Every page and component is built for seniors—clear labels, voice feedback, and easy navigation.
- **Voice Input Everywhere**: All forms and chat fields support voice input, with clear buttons and feedback.
- **Step Progress**: Onboarding shows clear progress and prevents skipping required steps.
- **Screen Reader Friendly**: Uses semantic HTML and ARIA where needed.

---

## Security & Best Practices

### Data Protection

- 🔐 **No Hardcoded Secrets**: All API keys and credentials stored in environment variables
- 🛡️ **Firebase Security Rules**: Restrict data access to authenticated users only
- 🔑 **Authentication**: Secure Firebase Auth with no password storage
- 🌐 **CORS Configuration**: Proper cross-origin request handling

### Development Standards

- ✅ **Environment Variables**: All sensitive data in `.env` files
- 📝 **Error Handling**: Comprehensive error catching and user feedback
- 🎯 **SEO Optimization**: Proper meta tags and semantic HTML
- ♿ **Accessibility**: WCAG 2.1 compliance with ARIA labels and screen reader support
- 📱 **Responsive Design**: Mobile-first approach with touch-friendly interfaces

### Performance

- ⚡ **Fast Loading**: Vite build optimization and code splitting
- 🗜️ **Asset Optimization**: Compressed images and minimal bundle size
- 💾 **Efficient Caching**: Smart caching strategies for better performance
- 🔄 **Real-time Updates**: Efficient state management and API calls

---

## Project Structure

```
SilverCare-AI/
├── client/                    # Frontend React application
│   ├── public/               # Static assets
│   │   ├── screenshots/      # App screenshots
│   │   ├── bot-image.png     # Logo and branding
│   │   ├── alarm.mp3         # Audio files
│   │   └── _redirects        # Netlify/Vercel redirects
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── ask-queries/  # Chat-specific components
│   │   │   ├── chat/         # Message bubbles, loading
│   │   │   ├── layout/       # Navigation, headers
│   │   │   ├── ui/           # Button, card, input components
│   │   │   └── voice/        # Voice input components
│   │   ├── pages/            # Main application pages
│   │   ├── hooks/            # Custom React hooks
│   │   ├── context/          # React context providers
│   │   ├── firebase/         # Firebase configuration
│   │   ├── utils/            # Helper functions & API services
│   │   └── styles/           # Custom CSS and themes
│   ├── package.json          # Dependencies and scripts
│   ├── vite.config.js        # Vite configuration
│   ├── tailwind.config.js    # Tailwind CSS configuration
│   └── vercel.json           # Deployment configuration
│
├── server/                   # Backend Python API
│   ├── routes/               # API endpoint handlers
│   │   ├── ask_query.py      # AI chat endpoint
│   │   ├── blog_fetch.py     # News fetching
│   │   ├── format_reminder.py # Reminder processing
│   │   └── saved_contacts.py # Emergency contacts
│   ├── api/
│   │   └── index.py          # API entry point
│   ├── app.py                # Main Flask application
│   ├── requirements.txt      # Python dependencies
│   └── vercel.json           # Serverless configuration
│
└── README.md                 # Project documentation
```

---

## Getting Started

### Prerequisites

- **Node.js** (v18+) - [Download here](https://nodejs.org/)
- **npm** or **yarn** - Package manager (comes with Node.js)
- **Python 3.9+** - [Download here](https://python.org/)
- **pip** - Python package manager (comes with Python)
- **Git** - Version control system

### Installation

1. **Clone the Repository**

   ```bash
   git clone https://github.com/tanish-jain-225/SilverCare-AI.git
   cd SilverCare-AI
   ```

2. **Install Frontend Dependencies**

   ```bash
   cd client
   npm install
   # or if you prefer yarn
   yarn install
   ```

3. **Install Backend Dependencies**
   ```bash
   cd ../server
   pip install -r requirements.txt
   # or use virtual environment (recommended)
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

### Environment Configuration

Create `.env` files in both directories with the required variables:

#### Client Environment Variables (`client/.env`)

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_WORLD_NEWS_API_KEY=your_world_news_api_key
VITE_SERVER_URL=http://localhost:5000
```

#### Server Environment Variables (`server/.env`)

```env
TOGETHER_API_KEY=your_together_ai_api_key
MONGODB_URI=your_mongodb_connection_string
FIREBASE_PROJECT_ID=your_firebase_project_id
FLASK_ENV=development
PORT=5000
```

> **Note**: Never commit `.env` files to version control. Add them to `.gitignore`.

---

## Running the Application

### Development Mode

1. **Start the Backend Server**

   ```bash
   cd server
   python app.py
   # Server will run on http://localhost:5000
   ```

2. **Start the Frontend Development Server**

   ```bash
   cd client
   npm run dev
   # Frontend will run on http://localhost:5173
   ```

3. **Access the Application**
   - Open your browser to [http://localhost:5173](http://localhost:5173)
   - The frontend will automatically proxy API calls to the backend

### Production Build

1. **Build the Frontend**

   ```bash
   cd client
   npm run build
   ```

2. **Preview Production Build**
   ```bash
   npm run preview
   ```

### Available Scripts

#### Frontend (`client/`)

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

#### Backend (`server/`)

- `python app.py` - Start Flask server
- `flask run` - Alternative way to start server

---

## Deployment

### Vercel Deployment (Recommended)

Both frontend and backend are configured for seamless Vercel deployment.

#### Frontend Deployment

1. **Connect Repository to Vercel**

   - Import your project on [Vercel Dashboard](https://vercel.com/dashboard)
   - Set the root directory to `client/`
   - Framework preset: Vite
   - Build command: `npm run build`
   - Output directory: `dist`

2. **Configure Environment Variables**

   - Add all `VITE_*` variables from your `client/.env` file
   - Ensure production URLs are used for API endpoints

3. **Deploy**
   - Vercel will automatically deploy on every git push
   - The `client/vercel.json` ensures proper SPA routing

#### Backend Deployment

1. **Create Separate Vercel Project**

   - Import the same repository
   - Set the root directory to `server/`
   - Framework preset: Other
   - Build command: `pip install -r requirements.txt`

2. **Configure Environment Variables**

   - Add all variables from your `server/.env` file
   - Use production MongoDB URI and API keys

3. **Deploy**
   - The `server/vercel.json` configures serverless functions
   - API endpoints will be available at `https://your-backend.vercel.app/api/`

#### Update Frontend API URL

After backend deployment, update your frontend environment:

```env
VITE_SERVER_URL=https://your-backend.vercel.app
```

### Alternative Deployment Options

- **Frontend**: Netlify, GitHub Pages, Firebase Hosting
- **Backend**: Railway, Render, DigitalOcean, AWS Lambda
- **Database**: MongoDB Atlas, Firebase Firestore

### Environment Variables for Production

Ensure all production environment variables are properly configured:

- **API Keys**: Use production keys for all external services
- **Database URLs**: Point to production databases
- **CORS Settings**: Configure for your production domain
- **Security**: Enable HTTPS and proper authentication

---

## API Endpoints

### Core Functionality

| Endpoint               | Method              | Description                            |
| ---------------------- | ------------------- | -------------------------------------- |
| `/api/ask-query`       | POST                | AI-powered chat and question answering |
| `/api/format-reminder` | POST                | Natural language reminder processing   |
| `/api/saved-contacts`  | GET/POST/PUT/DELETE | Emergency contacts management          |
| `/api/blog-fetch`      | GET                 | Fetch news and health articles         |

### Request/Response Examples

#### Chat with AI Assistant

```bash
POST /api/ask-query
{
  "input": "How can I manage my blood pressure?",
  "userId": "user123",
  "chatHistory": [...],
  "sessionId": "session456"
}
```

#### Create Reminder

```bash
POST /api/format-reminder
{
  "input": "Remind me to take my medicine at 8 AM tomorrow",
  "userId": "user123"
}
```

#### Manage Emergency Contacts

```bash
POST /api/saved-contacts
{
  "name": "Dr. Smith",
  "number": "+1234567890",
  "relationship": "Doctor",
  "userId": "user123"
}
```

### Error Handling

All endpoints return standardized error responses:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

---

## Contributors

| [![](https://github.com/parthnarkar.png?size=100)](https://github.com/parthnarkar) | [![](https://github.com/tanish-jain-225.png?size=100)](https://github.com/tanish-jain-225) | [![](https://github.com/pankaj0695.png?size=100)](https://github.com/pankaj0695) | [![](https://github.com/Chief-Ayush.png?size=100)](https://github.com/Chief-Ayush) |
| :--------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------------: | :------------------------------------------------------------------------------: | :--------------------------------------------------------------------------------: |
|                 [**Parth Narkar**](https://github.com/parthnarkar)                 |                  [**Tanish Sanghvi**](https://github.com/tanish-jain-225)                  |                [**Pankaj Gupta**](https://github.com/pankaj0695)                 |                [**Ayush Attarde**](https://github.com/Chief-Ayush)                 |

---

## Contributing

We welcome contributions! Here's how you can help:

### Getting Started

1. **Fork the Repository**

   ```bash
   git fork https://github.com/tanish-jain-225/SilverCare-AI.git
   ```

2. **Create a Feature Branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Your Changes**

   - Follow the existing code style
   - Add tests if applicable
   - Update documentation

4. **Commit Your Changes**

   ```bash
   git commit -m "feat: add your feature description"
   ```

5. **Push and Create Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```

### Development Guidelines

- **Code Style**: Follow ESLint rules for frontend, PEP 8 for backend
- **Commits**: Use conventional commit messages
- **Testing**: Add tests for new features
- **Documentation**: Update README and comments

### Areas for Contribution

- 🎨 **UI/UX Improvements**: Enhanced accessibility features
- 🔧 **Backend Features**: New API endpoints and integrations
- 📱 **Mobile Optimization**: Better mobile experience
- 🔒 **Security**: Enhanced authentication and data protection
- 📊 **Analytics**: Usage tracking and insights

### Future Roadmap

- **📱 Mobile App**: Native iOS/Android applications
- **🏠 Smart Home Integration**: Voice control for IoT devices
- **💊 Health Monitoring**: Vital signs tracking and health insights
- **👥 Community Features**: Social engagement for seniors
- **🤖 Advanced AI**: More sophisticated conversation abilities
- **📞 Telemedicine**: Integration with healthcare providers

---

## Troubleshooting

### Common Issues

#### Frontend Issues

- **Build Failures**: Check Node.js version (requires v18+)
- **Environment Variables**: Ensure all `VITE_*` variables are set
- **API Connection**: Verify backend URL in environment configuration
- **Firebase Errors**: Check Firebase project configuration and API keys

#### Backend Issues

- **Python Dependencies**: Use virtual environment and Python 3.9+
- **MongoDB Connection**: Verify connection string and network access
- **API Key Errors**: Check Together AI and other service API keys
- **CORS Errors**: Ensure frontend domain is allowed in CORS settings

#### Voice Features

- **Microphone Access**: Allow browser microphone permissions
- **Speech Recognition**: Requires HTTPS in production
- **Browser Support**: Use Chrome/Edge for best Web Speech API support

#### Deployment Issues

- **Vercel Build Errors**: Check build commands and environment variables
- **API Endpoints**: Ensure correct base URLs in production
- **Environment Variables**: Verify all secrets are set in deployment platform

### Getting Help

1. **Check Documentation**: Review client and server README files
2. **Issues**: Search existing [GitHub Issues](https://github.com/tanish-jain-225/SilverCare-AI/issues)
3. **Discussions**: Join project discussions for community support
4. **Contact**: Reach out to maintainers for critical issues

### Performance Optimization

- **Bundle Size**: Use `npm run build` and analyze bundle size
- **Image Optimization**: Compress images in `public/` directory
- **API Caching**: Implement caching for frequently requested data
- **Database Indexing**: Optimize MongoDB queries with proper indexing

---

## Why SilverCare-AI?

SilverCare-AI is more than just an application—it's a comprehensive solution designed to bridge the digital divide for senior citizens. Our mission is to empower older adults with technology that truly understands and supports their unique needs.

### Our Impact

- 🎯 **Accessibility First**: Every feature designed with seniors in mind
- 🗣️ **Voice-Centric**: Reduces barriers to technology adoption
- 🚨 **Safety Focused**: Advanced emergency detection saves lives
- 👥 **Community Driven**: Open-source project with active development
- 🌟 **Real-World Solutions**: Addresses genuine daily challenges

### What Sets Us Apart

- **Senior-Centric Design**: Large fonts, high contrast, intuitive navigation
- **Advanced AI Integration**: Intelligent conversation and emergency detection
- **Comprehensive Feature Set**: Chat, reminders, emergency alerts, and news
- **Privacy Focused**: Secure authentication with no data exploitation
- **Continuous Innovation**: Regular updates based on user feedback

We believe every senior deserves a digital companion that is friendly, reliable, and empowering. SilverCare-AI makes technology human—for everyone.

---

<p align="center">
  <b>🤝 Making Technology Human—For Everyone 🤝</b><br>
  <i>Empowering seniors through accessible, voice-first AI technology</i>
</p>
