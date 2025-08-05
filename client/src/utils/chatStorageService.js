import route_endpoint from "./helper";

// ================== CURRENT STORAGE IMPLEMENTATION (API/MongoDB) ==================

const API_BASE = route_endpoint; 

/**
 * Load all chat sessions from backend (MongoDB)
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Returns sessions, currentSessionId, and sessionCounter
 */
export const loadChatSessions = async (userId = null) => {
  try {
    const response = await fetch(`${API_BASE}/loadChat?userId=${encodeURIComponent(userId || '')}`);
    if (!response.ok) throw new Error('Failed to load chat sessions');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error loading chat sessions:', error);
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
 * Save all chat sessions to backend (MongoDB)
 * @param {Array} sessions - Array of chat sessions
 * @param {string|null} currentSessionId - Current session ID
 * @param {number} sessionCounter - Session counter
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} - Success status
 */
export const saveChatSessions = async (sessions, currentSessionId, sessionCounter, userId = null) => {
  try {
    const response = await fetch(`${API_BASE}/saveChat`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessions, currentSessionId, sessionCounter, userId })
    });
    return response.ok;
  } catch (error) {
    console.error('Error saving chat sessions:', error);
    return false;
  }
};


/**
 * Create a new chat session in backend (MongoDB)
 * @param {string} sessionName - Name for the new session
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - New session object with success status
 */
export const createChatSession = async (sessionName, userId = null) => {
  try {
    const response = await fetch(`${API_BASE}/createChat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionName, userId })
    });
    const data = await response.json();
    return data;
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
 * Update session messages and metadata in backend (MongoDB)
 * @param {string} sessionId - Session ID to update
 * @param {Array} messages - Updated messages array
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} - Success status
 */
export const updateSessionMessages = async (sessionId, messages, userId = null) => {
  try {
    const response = await fetch(`${API_BASE}/updateMessages/${encodeURIComponent(sessionId)}/messages`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, userId })
    });
    return response.ok;
  } catch (error) {
    console.error('Error updating session messages:', error);
    return false;
  }
};


/**
 * Delete a chat session in backend (MongoDB)
 * @param {string} sessionId - Session ID to delete
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Result with success status and remaining sessions
 */
export const deleteChatSession = async (sessionId, userId = null) => {
  try {
    const response = await fetch(`${API_BASE}/deleteChat/${encodeURIComponent(sessionId)}?userId=${encodeURIComponent(userId || '')}`, {
      method: 'DELETE'
    });
    const data = await response.json();
    return data;
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
 * Update session activity timestamp in backend (MongoDB)
 * @param {string} sessionId - Session ID to update
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} - Success status
 */
export const updateSessionActivity = async (sessionId, userId = null) => {
  try {
    const response = await fetch(`${API_BASE}/updateActivity/${encodeURIComponent(sessionId)}/activity`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    return response.ok;
  } catch (error) {
    console.error('Error updating session activity:', error);
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
