/**
 * Chat Storage Service
 * 
 * This service provides an abstraction layer for chat history storage operations.
 * Currently implements localStorage but can be easily replaced with database API calls.
 * 
 * To switch to database storage:
 * 1. Replace localStorage operations with API calls
 * 2. Add authentication headers for API requests
 * 3. Handle async operations appropriately
 * 4. Add proper error handling for network requests
 */

// ================== STORAGE CONFIGURATION ==================

const STORAGE_KEYS = {
  CHAT_SESSIONS: 'chatSessions',
  CURRENT_SESSION: 'currentSessionId',
  SESSION_COUNTER: 'sessionCounter'
};


// For future database implementation:
// const API_ENDPOINTS = {
//   GET_SESSIONS: '/api/chat/sessions',
//   CREATE_SESSION: '/api/chat/sessions',
//   UPDATE_SESSION: '/api/chat/sessions',
//   DELETE_SESSION: '/api/chat/sessions',
//   GET_MESSAGES: '/api/chat/messages'
// };

// ================== VALIDATION UTILITIES ==================

/**
 * Validate session data structure
 * @param {Object} session - Session object to validate
 * @returns {boolean} - True if valid
 */
const isValidSession = (session) => {
  return session && 
         typeof session.id === 'string' && 
         typeof session.name === 'string' && 
         Array.isArray(session.messages) &&
         session.createdAt &&
         session.lastActivity !== undefined;
};

/**
 * Sanitize and validate sessions array
 * @param {Array} sessions - Array of sessions to validate
 * @returns {Array} - Filtered valid sessions
 */
const validateSessions = (sessions) => {
  if (!Array.isArray(sessions)) return [];
  return sessions.filter(isValidSession);
};

// ================== CURRENT STORAGE IMPLEMENTATION (localStorage) ==================

/**
 * Load all chat sessions from storage
 * @param {string} userId - User ID (for future database implementation)
 * @returns {Promise<Object>} - Returns sessions, currentSessionId, and sessionCounter
 */
export const loadChatSessions = async (userId = null) => {
  try {
    // For future database implementation:
    // const response = await fetch(`${API_ENDPOINTS.GET_SESSIONS}?userId=${userId}`, {
    //   headers: { 'Authorization': `Bearer ${getAuthToken()}` }
    // });
    // const data = await response.json();
    // return data;

    const savedSessions = localStorage.getItem(STORAGE_KEYS.CHAT_SESSIONS);
    const savedCounter = localStorage.getItem(STORAGE_KEYS.SESSION_COUNTER);
    const savedCurrentSession = localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION);
    
    let validSessions = [];
    let loadedSessionCounter = 1;
    let loadedCurrentSessionId = null;

    if (savedSessions) {
      const parsedSessions = JSON.parse(savedSessions);
      validSessions = validateSessions(parsedSessions);
    }

    if (savedCounter) {
      loadedSessionCounter = Math.max(1, parseInt(savedCounter) || 1);
    }

    if (validSessions.length > 0 && savedCurrentSession) {
      const currentSession = validSessions.find(s => s.id === savedCurrentSession);
      if (currentSession) {
        loadedCurrentSessionId = savedCurrentSession;
      }
    }

    return {
      success: true,
      sessions: validSessions,
      currentSessionId: loadedCurrentSessionId,
      sessionCounter: loadedSessionCounter
    };
  } catch (error) {
    console.error('Error loading chat sessions:', error);
    
    // Clear corrupted data
    await clearChatStorage();
    
    return {
      success: false,
      error: error.message,
      sessions: [],
      currentSessionId: null,
      sessionCounter: 1
    };
  }
};

/**
 * Save all chat sessions to storage
 * @param {Array} sessions - Array of chat sessions
 * @param {string|null} currentSessionId - Current session ID
 * @param {number} sessionCounter - Session counter
 * @param {string} userId - User ID (for future database implementation)
 * @returns {Promise<boolean>} - Success status
 */
export const saveChatSessions = async (sessions, currentSessionId, sessionCounter, userId = null) => {
  try {
    // For future database implementation:
    // const response = await fetch(API_ENDPOINTS.UPDATE_SESSION, {
    //   method: 'PUT',
    //   headers: { 
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${getAuthToken()}`
    //   },
    //   body: JSON.stringify({ sessions, currentSessionId, sessionCounter, userId })
    // });
    // return response.ok;

    const validSessions = validateSessions(sessions);
    
    if (validSessions.length > 0) {
      localStorage.setItem(STORAGE_KEYS.CHAT_SESSIONS, JSON.stringify(validSessions));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CHAT_SESSIONS);
    }
    
    localStorage.setItem(STORAGE_KEYS.SESSION_COUNTER, sessionCounter.toString());
    
    if (currentSessionId) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, currentSessionId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
    }

    return true;
  } catch (error) {
    console.error('Error saving chat sessions:', error);
    return false;
  }
};

/**
 * Create a new chat session
 * @param {string} sessionName - Name for the new session
 * @param {string} userId - User ID (for future database implementation)
 * @returns {Promise<Object>} - New session object with success status
 */
export const createChatSession = async (sessionName, userId = null) => {
  try {
    const newSession = {
      id: `session_${Date.now()}`,
      name: sessionName,
      messages: [],
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      messageCount: 0,
      userId: userId // For future database implementation
    };

    // For future database implementation:
    // const response = await fetch(API_ENDPOINTS.CREATE_SESSION, {
    //   method: 'POST',
    //   headers: { 
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${getAuthToken()}`
    //   },
    //   body: JSON.stringify(newSession)
    // });
    // const createdSession = await response.json();
    // return { success: true, session: createdSession };

    return {
      success: true,
      session: newSession
    };
  } catch (error) {
    console.error('Error creating chat session:', error);
    return {
      success: false,
      error: error.message,
      session: null
    };
  }
};

/**
 * Update session messages and metadata
 * @param {string} sessionId - Session ID to update
 * @param {Array} messages - Updated messages array
 * @param {string} userId - User ID (for future database implementation)
 * @returns {Promise<boolean>} - Success status
 */
export const updateSessionMessages = async (sessionId, messages, userId = null) => {
  try {
    // For future database implementation:
    // const response = await fetch(`${API_ENDPOINTS.UPDATE_SESSION}/${sessionId}/messages`, {
    //   method: 'PUT',
    //   headers: { 
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${getAuthToken()}`
    //   },
    //   body: JSON.stringify({ messages, lastActivity: new Date().toISOString() })
    // });
    // return response.ok;

    const savedSessions = localStorage.getItem(STORAGE_KEYS.CHAT_SESSIONS);
    if (!savedSessions) return false;

    const sessions = JSON.parse(savedSessions);
    const updatedSessions = sessions.map(session => 
      session.id === sessionId 
        ? { 
            ...session, 
            messages, 
            lastActivity: new Date().toISOString(),
            messageCount: messages.length
          }
        : session
    );

    localStorage.setItem(STORAGE_KEYS.CHAT_SESSIONS, JSON.stringify(updatedSessions));
    return true;
  } catch (error) {
    console.error('Error updating session messages:', error);
    return false;
  }
};

/**
 * Delete a chat session
 * @param {string} sessionId - Session ID to delete
 * @param {string} userId - User ID (for future database implementation)
 * @returns {Promise<Object>} - Result with success status and remaining sessions
 */
export const deleteChatSession = async (sessionId, userId = null) => {
  try {
    // For future database implementation:
    // const response = await fetch(`${API_ENDPOINTS.DELETE_SESSION}/${sessionId}`, {
    //   method: 'DELETE',
    //   headers: { 'Authorization': `Bearer ${getAuthToken()}` }
    // });
    // const result = await response.json();
    // return result;

    const savedSessions = localStorage.getItem(STORAGE_KEYS.CHAT_SESSIONS);
    if (!savedSessions) {
      return { success: true, remainingSessions: [] };
    }

    const sessions = JSON.parse(savedSessions);
    const remainingSessions = sessions.filter(session => session.id !== sessionId);
    
    if (remainingSessions.length > 0) {
      localStorage.setItem(STORAGE_KEYS.CHAT_SESSIONS, JSON.stringify(remainingSessions));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CHAT_SESSIONS);
    }

    return {
      success: true,
      remainingSessions: validateSessions(remainingSessions)
    };
  } catch (error) {
    console.error('Error deleting chat session:', error);
    return {
      success: false,
      error: error.message,
      remainingSessions: []
    };
  }
};

/**
 * Update session activity timestamp
 * @param {string} sessionId - Session ID to update
 * @param {string} userId - User ID (for future database implementation)
 * @returns {Promise<boolean>} - Success status
 */
export const updateSessionActivity = async (sessionId, userId = null) => {
  try {
    // For future database implementation:
    // const response = await fetch(`${API_ENDPOINTS.UPDATE_SESSION}/${sessionId}/activity`, {
    //   method: 'PATCH',
    //   headers: { 
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${getAuthToken()}`
    //   },
    //   body: JSON.stringify({ lastActivity: new Date().toISOString() })
    // });
    // return response.ok;

    const savedSessions = localStorage.getItem(STORAGE_KEYS.CHAT_SESSIONS);
    if (!savedSessions) return false;

    const sessions = JSON.parse(savedSessions);
    const updatedSessions = sessions.map(session => 
      session.id === sessionId 
        ? { ...session, lastActivity: new Date().toISOString() }
        : session
    );

    localStorage.setItem(STORAGE_KEYS.CHAT_SESSIONS, JSON.stringify(updatedSessions));
    return true;
  } catch (error) {
    console.error('Error updating session activity:', error);
    return false;
  }
};

/**
 * Clear all chat storage data
 * @param {string} userId - User ID (for future database implementation)
 * @returns {Promise<boolean>} - Success status
 */
export const clearChatStorage = async (userId = null) => {
  try {
    // For future database implementation:
    // const response = await fetch(`${API_ENDPOINTS.DELETE_SESSION}/all`, {
    //   method: 'DELETE',
    //   headers: { 'Authorization': `Bearer ${getAuthToken()}` }
    // });
    // return response.ok;

    localStorage.removeItem(STORAGE_KEYS.CHAT_SESSIONS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
    localStorage.removeItem(STORAGE_KEYS.SESSION_COUNTER);
    return true;
  } catch (error) {
    console.error('Error clearing chat storage:', error);
    return false;
  }
};

// ================== UTILITY FUNCTIONS ==================

/**
 * Format relative time for display
 * @param {string} dateString - ISO date string
 * @returns {string} - Formatted relative time
 */
export const formatRelativeTime = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

/**
 * Find most recent session from array
 * @param {Array} sessions - Array of sessions
 * @returns {Object|null} - Most recent session or null
 */
export const getMostRecentSession = (sessions) => {
  if (!Array.isArray(sessions) || sessions.length === 0) return null;
  
  return sessions.sort((a, b) => 
    new Date(b.lastActivity || b.createdAt) - new Date(a.lastActivity || a.createdAt)
  )[0];
};

// ================== FUTURE DATABASE HELPERS ==================

// For future database implementation, uncomment and implement these:

// const getAuthToken = () => {
//   // Return user authentication token
//   return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
// };

// const handleApiError = (error) => {
//   // Handle API errors consistently
//   if (error.status === 401) {
//     // Handle unauthorized access
//     window.location.href = '/login';
//   }
//   throw error;
// };
