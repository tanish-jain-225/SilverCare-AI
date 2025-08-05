import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Pause,
  User,
  History,
  Plus,
  X,
  Trash2,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { VoiceButton } from "../components/voice/VoiceButton";
import { MessageBubble } from "../components/chat/MessageBubble";
import { LoadingIndicator } from "../components/chat/LoadingIndicator";
import { useApp } from "../context/AppContext";
import { route_endpoint } from "../utils/helper.js";
import TrueFocus from "../components/ask-queries/TrueFocus";
import { motion, AnimatePresence } from "framer-motion";
import { useVoice } from "../hooks/useVoice";
import { useLocation } from "../hooks/useLocation";
import { BottomNavigation } from "../components/layout/BottomNavigation";
import {
  loadChatSessions,
  saveChatSessions,
  createChatSession,
  updateSessionMessages,
  deleteChatSession as deleteChatSessionFromStorage,
  updateSessionActivity,
  formatRelativeTime,
  getMostRecentSession,
} from "../utils/chatStorageService";

export function AskQueries() {
  const { user } = useApp();
  const endOfMessagesRef = useRef(null);
  const { location } = useLocation();

  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { speak, listen, stop, isSpeaking } = useVoice();
  const [inputDisabled, setInputDisabled] = useState(true); // Start disabled on initial load
  const [isInitialWelcomePlaying, setIsInitialWelcomePlaying] = useState(false); // Track initial welcome
  const [isTransitioning, setIsTransitioning] = useState(false); // Track session transitions
  const [lastUserActivity, setLastUserActivity] = useState(Date.now()); // Track user activity

  // Chat History States
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [chatSessions, setChatSessions] = useState([]);
  const [chatSessionsLoaded, setChatSessionsLoaded] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [sessionCounter, setSessionCounter] = useState(1);

  // ================== CHAT HISTORY MANAGEMENT ==================
  // These functions use the storage service abstraction for easy database migration

  /**
   * Initialize chat history from storage
   */
  const initializeChatHistory = async () => {
    try {
      const result = await loadChatSessions(user?.id);
      if (result.success) {
        setChatSessions(result.sessions);
        setSessionCounter(result.sessionCounter);
        if (result.sessions.length > 0 && result.currentSessionId) {
          const currentSession = result.sessions.find(
            (s) => s.id === result.currentSessionId
          );
          if (currentSession) {
            setCurrentSessionId(result.currentSessionId);
            setMessages(currentSession.messages || []);
            if (currentSession.messages.length > 0) {
              setInputDisabled(false);
            }
          } else {
            setCurrentSessionId(result.sessions[0].id);
            setMessages(result.sessions[0].messages || []);
            if (result.sessions[0].messages.length > 0) {
              setInputDisabled(false);
            }
          }
        }
      } else {
        console.error("Failed to load chat sessions:", result.error);
        setChatSessions([]);
        setCurrentSessionId(null);
        setSessionCounter(1);
      }
    } catch (error) {
      console.error("Error initializing chat history:", error);
      setChatSessions([]);
      setCurrentSessionId(null);
      setSessionCounter(1);
    } finally {
      setChatSessionsLoaded(true);
    }
  };

  /**
   * Save current chat state to storage
   */
  const saveCurrentChatState = async () => {
    try {
      await saveChatSessions(
        chatSessions,
        currentSessionId,
        sessionCounter,
        user?.id
      );
    } catch (error) {
      console.error("Error saving chat state:", error);
    }
  };

  /**
   * Create a new chat session
   * @param {string} sessionName - Name for the new session
   * @returns {Object} - New session object
   */
  const createNewChatSession = async (sessionName) => {
    try {
      const result = await createChatSession(sessionName, user?.id);

      if (result.success) {
        setChatSessions((prev) => [result.session, ...prev]);
        setCurrentSessionId(result.session.id);
        setSessionCounter((prev) => prev + 1);
        return result.session;
      } else {
        throw new Error(result.error || "Failed to create session");
      }
    } catch (error) {
      console.error("Error creating new chat session:", error);
      throw error;
    }
  };

  /**
   * Delete a chat session from storage
   * @param {string} sessionId - ID of session to delete
   * @returns {Object|null} - Most recent remaining session or null
   */
  const deleteChatSessionLocal = async (sessionId) => {
    try {
      const result = await deleteChatSessionFromStorage(sessionId, user?.id);

      if (result.success) {
        setChatSessions(result.remainingSessions);
        return getMostRecentSession(result.remainingSessions);
      } else {
        throw new Error(result.error || "Failed to delete session");
      }
    } catch (error) {
      console.error("Error deleting chat session:", error);
      throw error;
    }
  };

  /**
   * Get a specific session by ID
   * @param {string} sessionId - Session ID to retrieve
   * @returns {Object|null} - Session object or null
   */
  const getChatSession = (sessionId) => {
    return chatSessions.find((s) => s.id === sessionId) || null;
  };

  /**
   * Update session's last activity timestamp
   * @param {string} sessionId - Session ID to update
   */
  const updateSessionActivityLocal = async (sessionId) => {
    try {
      const success = await updateSessionActivity(sessionId, user?.id);

      if (success) {
        setChatSessions((prev) =>
          prev.map((s) =>
            s.id === sessionId
              ? { ...s, lastActivity: new Date().toISOString() }
              : s
          )
        );
      }
    } catch (error) {
      console.error("Error updating session activity:", error);
    }
  };

  /**
   * Update session messages in storage
   * @param {string} sessionId - Session ID to update
   * @param {Array} messages - Updated messages array
   */
  const updateSessionMessagesLocal = async (sessionId, messages) => {
    if (!sessionId || !messages.length) return;

    try {
      const success = await updateSessionMessages(
        sessionId,
        messages,
        user?.id
      );

      if (success) {
        setChatSessions((prev) =>
          prev.map((session) =>
            session.id === sessionId
              ? {
                  ...session,
                  messages,
                  lastActivity: new Date().toISOString(),
                  messageCount: messages.length,
                }
              : session
          )
        );
      }
    } catch (error) {
      console.error("Error updating session messages:", error);
    }
  };

  // ================== END CHAT HISTORY MANAGEMENT ==================

  // Load chat sessions from storage on component mount
  useEffect(() => {
    // Stop any ongoing speech on component mount/refresh
    stop();

    if (user?.id) {
      initializeChatHistory();
    }
  }, [user?.id, stop]);

  // Auto-save sessions whenever they change
  useEffect(() => {
    if (chatSessions.length > 0 || currentSessionId || sessionCounter > 1) {
      saveCurrentChatState();
    }
  }, [chatSessions, currentSessionId, sessionCounter]);

  // Update current session messages whenever messages change
  useEffect(() => {
    if (currentSessionId && messages.length > 0) {
      updateSessionMessagesLocal(currentSessionId, messages);
    }
  }, [messages, currentSessionId]);

  // Track user activity for auto-save and session management
  useEffect(() => {
    const updateActivity = () => setLastUserActivity(Date.now());

    // Listen for user interactions
    const events = ["click", "keypress", "mousemove", "touchstart"];
    events.forEach((event) => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, updateActivity);
      });
    };
  }, []);

  // Speak page welcome message only when component first loads (not on session switches)
  useEffect(() => {
    if (
      user?.id &&
      !isInitialWelcomePlaying &&
      messages.length === 0 &&
      !currentSessionId &&
      chatSessions.length === 0
    ) {
      setIsInitialWelcomePlaying(true);
      setInputDisabled(true); // Disable inputs before speaking
      // Speak welcome message only when page loads with no existing session and no saved sessions
      speak(cleanTextForSpeech("Welcome to AI Assistant"), {
        onended: () => {
          setIsInitialWelcomePlaying(false);
          // Keep inputs disabled until user starts conversation
        },
        onerror: () => {
          console.warn("Speech synthesis failed for initial welcome message");
          setIsInitialWelcomePlaying(false);
        },
      });
    }
  }, [user, messages.length, currentSessionId, chatSessions.length]);

  // Chat Session Management Functions
  const createNewSession = async () => {
    if (isTransitioning) return; // Prevent multiple rapid session creations

    setIsTransitioning(true);

    try {
      // Stop any ongoing speech and prevent welcome message
      stop();
      setIsInitialWelcomePlaying(false);
      setError(null); // Clear any previous errors

      // Create new session using abstracted function
      const newSession = await createNewChatSession(`Chat ${sessionCounter}`);

      setMessages([]);
      setIsHistoryOpen(false);

      // Start the new session immediately with welcome message
      if (user?.id) {
        // Get user's name from signin info (fullName, firstName, or email)
        const userName =
          user?.name ||
          user.firstName ||
          user.displayName ||
          user.email?.split("@")[0] ||
          "there";
        const welcomeMessageText = `Welcome, How can I assist you today?`;
        const welcomeMessage = {
          id: `welcome_${Date.now()}`,
          message: welcomeMessageText,
          isUser: false,
          timestamp: new Date(),
        };

        // Small delay to ensure UI updates before message appears
        setTimeout(() => {
          setMessages([welcomeMessage]);
          setInputDisabled(true); // Disable inputs before speaking

          // Start speaking the welcome message
          speak(cleanTextForSpeech(welcomeMessageText), {
            onended: () => {
              setInputDisabled(false);
            },
            onerror: () => {
              console.warn("Speech synthesis failed for welcome message");
              setInputDisabled(false);
            },
          });
        }, 100);
      }
    } catch (error) {
      console.error("Error creating new session:", error);
      setError("Failed to create new session. Please try again.");
    } finally {
      setTimeout(() => setIsTransitioning(false), 300);
    }
  };

  const deleteSession = async (sessionId) => {
    if (!sessionId || isTransitioning) return;

    setIsTransitioning(true);

    try {
      // Stop any ongoing speech
      stop();

      // Delete session using abstracted function
      const mostRecentSession = await deleteChatSessionLocal(sessionId);

      if (currentSessionId === sessionId) {
        if (mostRecentSession) {
          // Switch to the most recently active session
          await switchToSession(mostRecentSession.id);
        } else {
          // No sessions left, reset to start chat state
          setCurrentSessionId(null);
          setMessages([]);
          setInputDisabled(true);
          setError(null);
        }
      }
    } catch (error) {
      console.error("Error deleting session:", error);
      setError("Failed to delete session. Please try again.");
    } finally {
      setTimeout(() => setIsTransitioning(false), 300);
    }
  };

  const switchToSession = async (sessionId) => {
    if (!sessionId || isTransitioning || sessionId === currentSessionId) return;

    setIsTransitioning(true);

    try {
      // Get session using abstracted function
      const session = getChatSession(sessionId);

      if (session) {
        // Stop any ongoing speech when switching sessions
        stop();
        setIsInitialWelcomePlaying(false);
        setError(null); // Clear any previous errors

        setCurrentSessionId(sessionId);
        setMessages(session.messages || []);

        // Enable inputs if the session has messages, disable if it's a new session
        setInputDisabled(session.messages.length === 0);
        setIsHistoryOpen(false);

        // Update last activity for this session
        await updateSessionActivityLocal(sessionId);
      } else {
        console.warn(`Session ${sessionId} not found`);
        setError("Session not found. Please try again.");
      }
    } catch (error) {
      console.error("Error switching session:", error);
      setError("Failed to switch session. Please try again.");
    } finally {
      setTimeout(() => setIsTransitioning(false), 300);
    }
  };

  const toggleHistory = () => {
    setIsHistoryOpen((prev) => !prev);
  };

  // Remove the formatRelativeTime function since it's now imported from the service

  // Handle start button click
  const handleStartChat = async () => {
    if (isTransitioning) return;

    setIsTransitioning(true);

    try {
      // Always stop any ongoing speech first (including welcome speech)
      stop();
      setIsInitialWelcomePlaying(false);
      setError(null); // Clear any previous errors

      // Create a new session if none exists
      if (!currentSessionId) {
        await createNewChatSession(`Chat ${sessionCounter}`);
      }

      if (user?.id) {
        // Get user's name from signin info (fullName, firstName, or email)
        const userName =
          user?.name ||
          user.firstName ||
          user.displayName ||
          user.email?.split("@")[0] ||
          "there";
        const welcomeMessageText = `Welcome, How can I assist you today?`;
        const welcomeMessage = {
          id: `welcome_${Date.now()}`,
          message: welcomeMessageText,
          isUser: false,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, welcomeMessage]);
        setInputDisabled(true); // Disable inputs before speaking

        // Start speaking the welcome message with error handling
        speak(cleanTextForSpeech(welcomeMessageText), {
          onended: () => {
            setInputDisabled(false);
          },
          onerror: () => {
            console.warn("Speech synthesis failed for welcome message");
            setInputDisabled(false);
          },
        });
      }
    } catch (error) {
      console.error("Error starting chat:", error);
      setError("Failed to start chat. Please try again.");
    } finally {
      setTimeout(() => setIsTransitioning(false), 300);
    }
  };

  // Handle emergency response based on server analysis
  const handleEmergencyResponse = async (
    isEmergency,
    emergencyData,
    originalMessage
  ) => {
    if (isEmergency && user?.emergencyContacts?.length > 0) {
      try {
        // Create emergency message with location
        const locationText =
          location?.lat && location?.lng
            ? `https://www.google.com/maps?q=${location.lat},${location.lng}`
            : "Location not available";

        const analysis = emergencyData.emergency_analysis;
        const sentimentLevel =
          analysis?.sentiment_polarity < -0.4
            ? "Severely Distressed"
            : analysis?.sentiment_polarity < -0.2
            ? "Highly Distressed"
            : "Distressed";

        const emergencyMessage = `EMERGENCY SOS ALERT \n\n- Message: "${originalMessage}" \n- Location: ${locationText} \n- Confidence: ${Math.round(
          emergencyData.confidence * 100
        )}% \n- Sentiment: ${sentimentLevel} \n- Immediate Danger: ${
          analysis?.has_immediate_danger ? "YES" : "NO"
        } \n- Medical Emergency: ${
          analysis?.has_medical_distress ? "YES" : "NO"
        } \n- Please contact them immediately or call emergency services \n\nSent from SilverCare AI Emergency Detection System`;

        // Open WhatsApp Web for each emergency contact
        user.emergencyContacts.forEach((contact) => {
          const cleanNumber = contact.number.replace(/[^0-9]/g, "");
          const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(
            emergencyMessage
          )}`;
          window.open(whatsappUrl, "_blank");
        });

        // Create detailed emergency notification
        const analysisDetails = analysis?.pattern_matches;
        const detectionReasons = [];

        if (analysisDetails?.immediate_danger > 0)
          detectionReasons.push("immediate danger");
        if (analysisDetails?.medical_emergency > 0)
          detectionReasons.push("medical emergency");
        if (analysisDetails?.safety_threats > 0)
          detectionReasons.push("safety threat");
        if (analysis?.sentiment_polarity < -0.3)
          detectionReasons.push("severe emotional distress");

        const emergencyNotification = {
          id: `emergency-${Date.now()}`,
          message: `Emergency situation detected with ${Math.round(
            emergencyData.confidence * 100
          )}% confidence based on: ${detectionReasons.join(
            ", "
          )}. I've opened WhatsApp for your emergency contacts: ${user.emergencyContacts
            .map((c) => c.name)
            .join(
              ", "
            )}. Please send the pre-filled emergency message to notify them immediately.`,
          isUser: false,
          timestamp: new Date(),
          isEmergency: true,
        };

        setMessages((prev) => [...prev, emergencyNotification]);

        // Disable inputs while speaking but keep pause button available
        setInputDisabled(true);
        speak(
          cleanTextForSpeech(
            `Emergency situation detected with ${Math.round(
              emergencyData.confidence * 100
            )} percent confidence. I've opened WhatsApp for your emergency contacts with a detailed emergency message.`
          ),
          {
            onended: () => {
              setInputDisabled(false); // Re-enable inputs after speech ends
            },
            onerror: () => {
              console.warn("Speech synthesis failed for emergency message");
              setInputDisabled(false);
            },
          }
        );

        return true;
      } catch (error) {
        console.error("Failed to handle emergency:", error);
        const errorNotification = {
          id: `emergency-error-${Date.now()}`,
          message:
            "Emergency situation detected but failed to open WhatsApp contacts. Please manually call your emergency contacts or emergency services immediately.",
          isUser: false,
          timestamp: new Date(),
          isError: true,
        };
        setMessages((prev) => [...prev, errorNotification]);

        // Provide voice feedback for emergency error with input control
        setInputDisabled(true);
        speak(
          cleanTextForSpeech(
            "Emergency detected but failed to open WhatsApp contacts. Please manually call your emergency contacts or emergency services immediately."
          ),
          {
            onended: () => {
              setInputDisabled(false); // Re-enable inputs after speech ends
            },
            onerror: () => {
              console.warn(
                "Speech synthesis failed for emergency error message"
              );
              setInputDisabled(false);
            },
          }
        );

        return false;
      }
    } else if (
      isEmergency &&
      (!user?.emergencyContacts || user.emergencyContacts.length === 0)
    ) {
      // Emergency detected but no contacts configured
      const analysis = emergencyData.emergency_analysis;
      const noContactsNotification = {
        id: `emergency-no-contacts-${Date.now()}`,
        message: `Emergency situation detected with ${Math.round(
          emergencyData.confidence * 100
        )}% confidence (Emergency Score: ${
          analysis?.emergency_score || "N/A"
        }). However, you don't have any emergency contacts configured. Please go to your Profile settings to add emergency contacts, or call emergency services directly at 911.`,
        isUser: false,
        timestamp: new Date(),
        isEmergency: true,
      };

      setMessages((prev) => [...prev, noContactsNotification]);

      // Disable inputs while speaking but keep pause button available
      setInputDisabled(true);
      speak(
        cleanTextForSpeech(
          "Emergency situation detected with high confidence, but you don't have emergency contacts configured. Please call 911 or emergency services directly."
        ),
        {
          onended: () => {
            setInputDisabled(false); // Re-enable inputs after speech ends
          },
          onerror: () => {
            console.warn(
              "Speech synthesis failed for no contacts emergency message"
            );
            setInputDisabled(false);
          },
        }
      );
      return true;
    }

    return false;
  };

  // Send a message
  const handleSendMessage = async (message) => {
    const messageToSend = message || inputMessage.trim();
    if (!messageToSend || !user?.id || isLoading || isTransitioning) return;

    // Don't send message if AI is speaking
    if (isSpeaking || inputDisabled) {
      return;
    }

    setError(null);
    setLastUserActivity(Date.now());

    const userMessage = {
      id: `user_${Date.now()}`,
      message: messageToSend,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      // Prepare chat history for context (excluding system messages like welcome, emergency, reminder notifications)
      const chatHistory = messages
        .filter((msg) => !msg.isEmergency && !msg.isReminder && !msg.isError) // Only include regular chat messages
        .map((msg) => ({
          role: msg.isUser ? "user" : "assistant",
          content: msg.message,
          timestamp: msg.timestamp,
        }));

      const response = await fetch(`${route_endpoint}/chat/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: messageToSend,
          userId: user.id,
          chatHistory: chatHistory, // Send chat history for context
          sessionId: currentSessionId, // Include session ID for context
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Server error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      // Check for emergency detection from server
      const emergencyHandled = data.emergency_detected
        ? await handleEmergencyResponse(
            data.emergency_detected,
            {
              confidence: data.emergency_confidence,
              emergency_analysis: data.emergency_analysis,
            },
            messageToSend
          )
        : false;

      // Check for reminder detection and handle it
      const reminderHandled =
        data.reminder_detected && data.reminder_result?.success;

      if (reminderHandled) {
        // Add a visual indicator for successful reminder creation
        const reminderData =
          data.reminder_result.reminder || data.reminder_result.reminders?.[0];

        const reminderNotification = {
          id: `reminder-success-${Date.now()}`,
          message: `Reminder Created Successfully!\n\nTitle: ${
            reminderData?.title || "New Reminder"
          }\nDate: ${reminderData?.date || "Not specified"}\nTime: ${
            reminderData?.time || "Not specified"
          }`,
          isUser: false,
          timestamp: new Date(),
          isReminder: true,
        };
        setMessages((prev) => [...prev, reminderNotification]);
      } else if (data.reminder_detected && !data.reminder_result?.success) {
        // Reminder was detected but failed to process
        const reminderFailNotification = {
          id: `reminder-fail-${Date.now()}`,
          message: `Reminder Processing Failed\n\nI detected you wanted to set a reminder, but couldn't process it automatically. Please try the Reminders section or be more specific with your request.`,
          isUser: false,
          timestamp: new Date(),
          isError: true,
        };
        setMessages((prev) => [...prev, reminderFailNotification]);
      }

      let aiResponseMessage =
        data.message ||
        "I apologize, but I couldn't process your request. Please try again.";

      // If emergency was detected, modify AI response to acknowledge it
      if (emergencyHandled) {
        aiResponseMessage = `I understand this may be an emergency situation based on advanced sentiment analysis. I've already notified your emergency contacts. ${aiResponseMessage} Is there anything else I can help you with right now?`;
      }

      const aiMessage = {
        id: `ai_${Date.now()}`,
        message: aiResponseMessage,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);

      // Only speak the AI response if no emergency was handled (emergency has its own speech)
      if (!emergencyHandled) {
        // If the backend ever returns a raw LLM object, extract the assistant's reply content
        if (
          typeof aiResponseMessage === "object" &&
          aiResponseMessage !== null
        ) {
          // Try to extract from choices[0].message.content
          if (
            aiResponseMessage.choices &&
            Array.isArray(aiResponseMessage.choices) &&
            aiResponseMessage.choices.length > 0
          ) {
            const msgObj = aiResponseMessage.choices[0].message;
            if (msgObj && typeof msgObj.content === "string") {
              aiResponseMessage = msgObj.content;
            }
          }
        }
        setInputDisabled(true);
        speak(cleanTextForSpeech(aiResponseMessage), {
          onended: () => {
            setInputDisabled(false); // Re-enable inputs after speech ends
          },
          onerror: () => {
            console.warn("Speech synthesis failed for AI response");
            setInputDisabled(false);
          },
        });
      } else {
        // If emergency was handled, inputs are already managed by emergency handler
        setTimeout(() => {
          if (!isSpeaking) {
            setInputDisabled(false);
          }
        }, 100);
      }
    } catch (error) {
      console.error("Error sending message:", error);

      let errorMessage =
        "Unable to connect to the server. Please check your internet connection and try again.";

      if (error.message && error.message.includes("Server error: 5")) {
        errorMessage =
          "Server is temporarily unavailable. Please try again in a moment.";
      } else if (error.message && error.message.includes("Failed to fetch")) {
        errorMessage = "Network error. Please check your internet connection.";
      } else if (error.message && error.message.includes("NetworkError")) {
        errorMessage =
          "Network connection failed. Please check your internet and try again.";
      }

      setError(errorMessage);

      const errorMessageObj = {
        id: `error_${Date.now()}`,
        message: errorMessage,
        isUser: false,
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessageObj]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = (text) => {
    if (!text || !text.trim()) return;

    // Don't process voice input if AI is speaking
    if (isSpeaking || inputDisabled) {
      return;
    }

    setLastUserActivity(Date.now());

    // Set the input message to the recognized text
    if (isSpeaking) {
      stop();
    }

    setInputMessage(text.trim());

    // Auto-focus the input field after voice input
    setTimeout(() => {
      const inputElement = document.querySelector('input[type="text"]');
      if (inputElement) {
        inputElement.focus();
      }
    }, 100);
  };

  // Enhanced error clearing function
  const clearError = () => {
    setError(null);
  };

  // Utility function to clean text for speech synthesis
  const cleanTextForSpeech = (text) => {
    if (!text || typeof text !== "string") return "";
    return (
      text
        // Remove markdown formatting
        .replace(/\*\*(.*?)\*\*/g, "$1") // Bold
        .replace(/\*(.*?)\*/g, "$1") // Italic
        .replace(/__(.*?)__/g, "$1") // Underline
        .replace(/~~(.*?)~~/g, "$1") // Strikethrough
        .replace(/`(.*?)`/g, "$1") // Inline code
        .replace(/```[\s\S]*?```/g, "") // Code blocks
        .replace(/#{1,6}\s*(.*)/g, "$1") // Headers
        .replace(/>\s*(.*)/g, "$1") // Blockquotes
        .replace(/\[(.*?)\]\(.*?\)/g, "$1") // Links
        // Remove HTML tags
        .replace(/<[^>]*>/g, "")
        .trim()
    );
  };

  // Auto-close history panel if chatSessions becomes empty
  useEffect(() => {
    if (chatSessions.length === 0) {
      setSessionCounter(1);
      if (isHistoryOpen) {
        setIsHistoryOpen(false);
      }
    }
  }, [chatSessions.length, isHistoryOpen]);

  // Auto-clear errors after 10 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div>
      {/* Main chat UI */}
      <div
        className={`p-4 pb-40 w-full max-w-7xl mx-auto ${
          isHistoryOpen ? "pointer-events-none" : ""
        }`}
      >
        <motion.div
          layout
          transition={{ layout: { duration: 0.3, ease: "easeInOut" } }}
          className={`relative flex flex-col w-full max-w-4xl bg-white/95 dark:bg-dark-200/90 rounded-2xl shadow-lg border border-primary-100/30 dark:border-primary-200/40 overflow-hidden h-[80vh] mx-auto ${
            isHistoryOpen ? "opacity-50" : ""
          }`}
        >
          <div className="flex items-center justify-between gap-2 p-2">
            <button
              onClick={toggleHistory}
              className={`flex items-center justify-center p-2 rounded-lg bg-primary-100/20 hover:bg-primary-100/30 dark:bg-primary-200/20 dark:hover:bg-primary-200/30 transition-colors duration-200 group
                ${
                  isHistoryOpen || chatSessions.length === 0
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              title="Chat History"
              disabled={isHistoryOpen || chatSessions.length === 0}
            >
              <History className="w-5 h-5 text-primary-200 dark:text-primary-100 group-hover:scale-110 transition-transform duration-200" />
            </button>

            <motion.div
              layout
              transition={{ layout: { duration: 0.3, ease: "easeInOut" } }}
              className="flex items-center justify-center p-4"
            >
              <motion.h1
                layout
                transition={{ layout: { duration: 0.3, ease: "easeInOut" } }}
                className="text-2xl sm:text-3xl font-semibold text-black dark:text-white font-['Poppins']"
              >
                Ask
              </motion.h1>
              <motion.div
                layout
                transition={{ layout: { duration: 0.4, ease: "easeInOut" } }}
                className="inline-flex items-center justify-center ml-3"
              >
                <TrueFocus
                  texts={[
                    "Health",
                    "Medicines",
                    "Sleep",
                    "Diet",
                    "Pain",
                    "Anxiety",
                  ]}
                  mainClassName="text-2xl sm:text-3xl font-semibold text-white px-2 sm:px-2 md:px-3 py-0.5 sm:py-1 md:py-2 bg-primary-200 overflow-hidden justify-center rounded-lg font-['Poppins'] transition-all duration-500 ease-in-out"
                  staggerFrom="last"
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "-120%" }}
                  staggerDuration={0.025}
                  splitLevelClassName="overflow-hidden"
                  transition={{ type: "spring", damping: 30, stiffness: 400 }}
                  rotationInterval={2000}
                />
              </motion.div>
            </motion.div>
          </div>

          <div className="relative flex-1 overflow-y-auto p-4 space-y-2 sm:space-y-4 custom-scrollbar">
            {/* Start Overlay - positioned only over the messages area */}
            {chatSessionsLoaded &&
              !error &&
              !isLoading &&
              !isTransitioning &&
              messages.length === 0 &&
              chatSessions.length === 0 &&
              !currentSessionId && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-30 bg-black/30 backdrop-blur-sm flex items-center justify-center overflow-y-auto py-10"
                >
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      delay: 0.2,
                      type: "spring",
                      damping: 25,
                      stiffness: 200,
                    }}
                    className="bg-white/95 dark:bg-dark-200/95 rounded-3xl shadow-2xl border border-primary-100/30 dark:border-primary-200/40 w-full flex m-2 p-2 justify-center items-center"
                  >
                    <button
                      onClick={handleStartChat}
                      disabled={isHistoryOpen || isTransitioning}
                      className={`bg-gradient-to-r from-primary-200 to-primary-300 hover:from-primary-300 hover:to-primary-200 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-semibold text-sm sm:text-base md:text-lg shadow-lg transition-all duration-300 hover:shadow-xl dark:from-primary-200 dark:to-blue-600 dark:hover:from-blue-600 dark:hover:to-primary-200 flex-shrink-0 w-full break-words z-40 disabled:opacity-50 disabled:cursor-not-allowed ${
                        isTransitioning ? "animate-pulse" : ""
                      }`}
                    >
                      {isTransitioning ? "Starting..." : "Start Conversation"}
                    </button>
                  </motion.div>
                </motion.div>
              )}
            {messages.map((msg, index) => (
              <MessageBubble
                key={msg.id}
                message={msg.message}
                isUser={msg.isUser}
                isError={msg.isError}
                timestamp={msg.timestamp}
                index={index}
                className={
                  msg.isEmergency
                    ? "bg-red-100 text-red-800 border-2 border-red-300 dark:bg-red-900/40 dark:text-red-200 dark:border-red-600/60 shadow-lg"
                    : msg.isReminder
                    ? "bg-green-100 text-green-800 border-2 border-green-300 dark:bg-green-900/40 dark:text-green-200 dark:border-green-600/60 shadow-lg"
                    : msg.isUser
                    ? "bg-accent-yellow/20 text-primary-300 border border-primary-100/30 dark:bg-primary-900/40 dark:text-white dark:border-primary-800/40"
                    : "bg-primary-100/80 text-primary-200 border border-primary-100/30 dark:bg-primary-900/40 dark:text-primary-100 dark:border-primary-700/40"
                }
              />
            ))}
            {isLoading && <LoadingIndicator />}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex justify-center animate-fade-in"
              >
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 max-w-md dark:bg-red-900/20 dark:border-red-700/40 relative">
                  <div className="flex items-center justify-between">
                    <p className="text-red-700 dark:text-red-300 font-medium text-sm text-center flex-1">
                      {error}
                    </p>
                    <button
                      onClick={clearError}
                      className="ml-2 text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-300 transition-colors"
                      aria-label="Close error"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={endOfMessagesRef} />
          </div>
          <div className="border-t border-primary-100/30 dark:border-blue-800/40 p-3 sm:p-4 lg:p-6 bg-white/95 dark:bg-dark-200/90 shadow-xl rounded-2xl mx-2 sm:mx-4 mb-2">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap lg:flex-nowrap">
              <VoiceButton
                onResult={handleVoiceInput}
                size="lg"
                className="!w-10 !h-10 sm:!w-12 sm:!h-12 rounded-full bg-primary-200 dark:bg-primary-200/80 shadow-md flex items-center justify-center dark:hover:bg-blue-700 [&>svg]:scale-75 sm:[&>svg]:scale-100 disabled:opacity-50 transition-all duration-200"
                disabled={
                  isLoading ||
                  inputDisabled ||
                  isSpeaking ||
                  (messages.length === 0 && chatSessions.length === 0) ||
                  isHistoryOpen ||
                  isTransitioning
                }
              />
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => {
                  setInputMessage(e.target.value);
                  setLastUserActivity(Date.now());
                }}
                className="flex-1 min-w-0 px-4 py-3 sm:px-5 sm:py-4 rounded-xl border-2 border-primary-100/30 dark:border-blue-800/40 bg-primary-50/80 dark:bg-dark-100/80 text-primary-300 dark:text-white placeholder:text-primary-200 dark:placeholder:text-blue-200/60 text-sm sm:text-base shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:border-primary-200 dark:focus:border-blue-600 focus:ring-2 focus:ring-primary-200/20 dark:focus:ring-blue-600/20 focus:outline-none"
                placeholder={
                  isTransitioning ? "Loading..." : "Type your message..."
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                  if (e.key === "Escape") {
                    setInputMessage("");
                  }
                }}
                disabled={
                  isLoading ||
                  inputDisabled ||
                  isSpeaking ||
                  (messages.length === 0 && chatSessions.length === 0) ||
                  isHistoryOpen ||
                  isTransitioning
                }
                maxLength={1000}
                autoComplete="off"
                spellCheck="true"
              />
              {isSpeaking ? (
                <button
                  onClick={() => {
                    stop();
                    setInputDisabled(false); // Re-enable inputs when user stops speech
                  }}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-red-500 hover:bg-red-600 dark:bg-red-500 dark:hover:bg-red-600 text-white dark:text-white border-none shadow-md flex items-center justify-center transition-all duration-200 hover:scale-105"
                  aria-label="Stop AI Voice"
                  type="button"
                >
                  <Pause size={20} />
                </button>
              ) : (
                <button
                  onClick={() => handleSendMessage()}
                  disabled={
                    isLoading ||
                    inputDisabled ||
                    isSpeaking ||
                    (messages.length === 0 && chatSessions.length === 0) ||
                    isHistoryOpen ||
                    isTransitioning ||
                    !inputMessage.trim()
                  }
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-primary-200 hover:bg-primary-300 dark:bg-primary-200 dark:hover:bg-blue-700 text-white dark:text-white border border-primary-100/30 dark:border-blue-700/40 shadow-md flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 ${
                    isLoading ? "animate-pulse" : ""
                  }`}
                  aria-label="Send Message"
                  type="button"
                >
                  <Send size={20} />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Chat History Sliding Panel */}
      <AnimatePresence>
        {isHistoryOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
            />

            {/* Sliding Panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-full w-80 bg-white dark:bg-dark-200 shadow-2xl z-50 flex flex-col"
            >
              {/* Panel Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-primary-200" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Chat History
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={createNewSession}
                    disabled={isTransitioning}
                    className="p-2 rounded-lg bg-primary-200 hover:bg-primary-300 text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="New Chat"
                  >
                    <Plus
                      className={`w-4 h-4 ${
                        isTransitioning ? "animate-spin" : ""
                      }`}
                    />
                  </button>
                  <button
                    onClick={toggleHistory}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Sessions List */}
              <div className="flex-1 overflow-y-auto p-2">
                {chatSessions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                    <MessageCircle className="w-12 h-12 mb-2 opacity-50" />
                    <p className="text-sm text-center">No chat sessions yet</p>
                    <p className="text-xs text-center mt-1">
                      Start a conversation to create your first session
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {chatSessions.map((session) => (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-3 rounded-lg border transition-all duration-200 cursor-pointer group ${
                          currentSessionId === session.id
                            ? "bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-700"
                            : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                        onClick={() => switchToSession(session.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <MessageCircle className="w-4 h-4 text-primary-200 flex-shrink-0" />
                              <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {session.name}
                              </h3>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatRelativeTime(session.lastActivity)}
                            </p>
                            {session.messages.length > 0 && (
                              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 truncate">
                                <span
                                  className="block"
                                  style={{ maxWidth: "100%" }}
                                  dangerouslySetInnerHTML={{
                                    __html:
                                      (
                                        session.messages[
                                          session.messages.length - 1
                                        ]?.message || ""
                                      ).length > 50
                                        ? session.messages[
                                            session.messages.length - 1
                                          ]?.message.slice(0, 50) + "..."
                                        : session.messages[
                                            session.messages.length - 1
                                          ]?.message || "",
                                  }}
                                />
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">
                                {session.messages.length} messages
                              </span>
                              {session.id === currentSessionId && (
                                <span className="text-xs bg-primary-200 text-white px-2 py-1 rounded">
                                  Active
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isTransitioning) {
                                deleteSession(session.id);
                              }
                            }}
                            disabled={isTransitioning}
                            className="p-1 rounded group-hover:opacity-100 bg-red-100 dark:bg-red-900/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete Session"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Navigation Bar */}
      <div className={isHistoryOpen ? "pointer-events-none opacity-50" : ""}>
        <BottomNavigation />
      </div>
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
