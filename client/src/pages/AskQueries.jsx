import React, { useState, useEffect, useRef } from "react";
import { Send, Pause, User } from "lucide-react";
import { VoiceButton } from "../components/voice/VoiceButton";
import { MessageBubble } from "../components/chat/MessageBubble";
import { LoadingIndicator } from "../components/chat/LoadingIndicator";
import { useApp } from "../context/AppContext";
import { route_endpoint } from "../utils/helper.js";
import TrueFocus from "../components/ask-queries/TrueFocus";
import { motion } from "framer-motion";
import { useVoice } from "../hooks/useVoice";
import { useLocation } from "../hooks/useLocation";
import { BottomNavigation } from "../components/layout/BottomNavigation";
import { LucidePanelLeftOpen, History } from "lucide-react";

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
  const [showStartOverlay, setShowStartOverlay] = useState(true); // Show start overlay initially
  const [isInitialWelcomePlaying, setIsInitialWelcomePlaying] = useState(false); // Track initial welcome

  // This useEffect was removed to prevent duplicate welcome messages
  // Welcome message is now handled only in handleStartChat function

  // Speak page welcome message when component loads
  useEffect(() => {
    if (user?.id && showStartOverlay && !isInitialWelcomePlaying) {
      setIsInitialWelcomePlaying(true);
      // Speak welcome message when page loads
      speak("Welcome to AI Assistance section. Click start conversation to begin.", {
        onended: () => {
          setIsInitialWelcomePlaying(false);
          // Keep inputs disabled until user starts conversation
        },
      });
    }
  }, [user, showStartOverlay]);

  // Handle start button click
  const handleStartChat = () => {
    // Always stop any ongoing speech first
    stop();
    setIsInitialWelcomePlaying(false);
    setShowStartOverlay(false);
    
    if (user?.id) {
      // Get user's name from signin info (fullName, firstName, or email)
      const userName = user?.name || user.firstName || user.displayName || user.email?.split('@')[0] || 'there';
      const welcomeMessage = {
        id: "welcome",
        message: `Welcome ${userName}, How can I assist you today?`,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, welcomeMessage]);
      setInputDisabled(true); // Disable input and voice button while speaking welcome
      
      // Small delay to ensure stop() has taken effect before starting new speech
      setTimeout(() => {
        speak(welcomeMessage.message, {
          onended: () => {
            setInputDisabled(false); // Enable input after welcome speech ends or if stopped
          },
        });
      }, 100);
    }
  };

  // Handle emergency response based on server analysis
  const handleEmergencyResponse = async (isEmergency, emergencyData, originalMessage) => {
    if (isEmergency && user?.emergencyContacts?.length > 0) {
      try {
        // Create emergency message with location
        const locationText =
          location?.lat && location?.lng
            ? `https://www.google.com/maps?q=${location.lat},${location.lng}`
            : "Location not available";

        const analysis = emergencyData.emergency_analysis;
        const sentimentLevel = analysis?.sentiment_polarity < -0.4 
          ? 'Severely Distressed' 
          : analysis?.sentiment_polarity < -0.2 
          ? 'Highly Distressed' 
          : 'Distressed';

        const emergencyMessage = `EMERGENCY SOS ALERT \n\n- Message: "${originalMessage}" \n- Location: ${locationText} \n- Confidence: ${Math.round(emergencyData.confidence * 100)}% \n- Sentiment: ${sentimentLevel} \n- Immediate Danger: ${analysis?.has_immediate_danger ? 'YES' : 'NO'} \n- Medical Emergency: ${analysis?.has_medical_distress ? 'YES' : 'NO'} \n- Please contact them immediately or call emergency services \n\nSent from SilverCare AI Emergency Detection System`;

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
        
        if (analysisDetails?.immediate_danger > 0) detectionReasons.push('immediate danger');
        if (analysisDetails?.medical_emergency > 0) detectionReasons.push('medical emergency');
        if (analysisDetails?.safety_threats > 0) detectionReasons.push('safety threat');
        if (analysis?.sentiment_polarity < -0.3) detectionReasons.push('severe emotional distress');

        const emergencyNotification = {
          id: `emergency-${Date.now()}`,
          message: `Emergency situation detected with ${Math.round(emergencyData.confidence * 100)}% confidence based on: ${detectionReasons.join(', ')}. I've opened WhatsApp for your emergency contacts: ${user.emergencyContacts
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
          `Emergency situation detected with ${Math.round(emergencyData.confidence * 100)} percent confidence. I've opened WhatsApp for your emergency contacts with a detailed emergency message.`,
          {
            onended: () => {
              setInputDisabled(false); // Re-enable inputs after speech ends
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
          "Emergency detected but failed to open WhatsApp contacts. Please manually call your emergency contacts or emergency services immediately.",
          {
            onended: () => {
              setInputDisabled(false); // Re-enable inputs after speech ends
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
        message:
          `Emergency situation detected with ${Math.round(emergencyData.confidence * 100)}% confidence (Emergency Score: ${analysis?.emergency_score || 'N/A'}). However, you don't have any emergency contacts configured. Please go to your Profile settings to add emergency contacts, or call emergency services directly at 911.`,
        isUser: false,
        timestamp: new Date(),
        isEmergency: true,
      };

      setMessages((prev) => [...prev, noContactsNotification]);
      
      // Disable inputs while speaking but keep pause button available
      setInputDisabled(true);
      speak(
        "Emergency situation detected with high confidence, but you don't have emergency contacts configured. Please call 911 or emergency services directly.",
        {
          onended: () => {
            setInputDisabled(false); // Re-enable inputs after speech ends
          },
        }
      );
      return true;
    }

    return false;
  };

  // Send a message
  const handleSendMessage = async (message) => {
    const messageToSend = message || inputMessage;
    if (!messageToSend.trim() || !user?.id) return;
    setError(null);

    const userMessage = {
      id: Date.now().toString(),
      message: messageToSend,
      isUser: true,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      let response, data;
      response = await fetch(`${route_endpoint}/chat/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: messageToSend,
          userId: user.id,
        }),
      });
      data = await response.json();

      // Check for emergency detection from server
      const emergencyHandled = data.emergency_detected 
        ? await handleEmergencyResponse(
            data.emergency_detected, 
            { 
              confidence: data.emergency_confidence,
              emergency_analysis: data.emergency_analysis 
            }, 
            messageToSend
          )
        : false;

      // Check for reminder detection and handle it
      const reminderHandled = data.reminder_detected && data.reminder_result?.success;
      
      if (reminderHandled) {
        // Add a visual indicator for successful reminder creation
        const reminderData = data.reminder_result.reminder || data.reminder_result.reminders?.[0];
        
        const reminderNotification = {
          id: `reminder-success-${Date.now()}`,
          message: `Reminder Created Successfully!\n\nTitle: ${reminderData?.title || 'New Reminder'}\nDate: ${reminderData?.date || 'Not specified'}\nTime: ${reminderData?.time || 'Not specified'}`,
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
        data.message || "Sorry, I could not understand that.";

      // If emergency was detected, modify AI response to acknowledge it
      if (emergencyHandled) {
        aiResponseMessage = `I understand this may be an emergency situation based on advanced sentiment analysis. I've already notified your emergency contacts. ${aiResponseMessage} Is there anything else I can help you with right now?`;
      }

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        message: aiResponseMessage,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => {
        const updated = [...prev, aiMessage];
        return updated;
      });

      // Only speak the AI response if no emergency was handled (emergency has its own speech)
      if (!emergencyHandled) {
        // Disable inputs while speaking but keep pause button available
        setInputDisabled(true);
        speak(aiMessage.message, {
          onended: () => {
            setInputDisabled(false); // Re-enable inputs after speech ends
          },
        });
      } else {
        // If emergency was handled, inputs are already managed by emergency handler
        // Just ensure they're re-enabled after any ongoing speech
        setTimeout(() => {
          if (!isSpeaking) {
            setInputDisabled(false);
          }
        }, 100);
      }
    } catch (error) {
      setError("Unable to connect to the server. Please try again.");
      const errorMessage = {
        id: (Date.now() + 2).toString(),
        message:
          error.message || "Unable to connect to the server. Please try again.",
        isUser: false,
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = (text) => {
    // Set the input message to the recognized text
    if (isSpeaking) {
      stop();
    }
    setInputMessage(text);
  };

  useEffect(() => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div className="relative min-h-screen pb-20">
      {/* Main chat UI */}
      <div className="bg-gradient-to-br from-primary-100/90 via-primary-200/90 to-accent-yellow/40 dark:from-dark-100/90 dark:via-dark-200/90 dark:to-accent-yellow/30 flex items-center justify-center p-4 h-[90vh]">
        <motion.div
          layout
          transition={{ layout: { duration: 0.3, ease: "easeInOut" } }}
          className="relative flex flex-col w-full max-w-4xl bg-white/95 dark:bg-dark-200/90 rounded-2xl shadow-lg border border-primary-100/30 dark:border-primary-200/40 overflow-hidden h-[80vh] mx-auto"
        >
          <div className="flex items-center justify-center gap-2 p-2">
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

          <div className="relative flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 custom-scrollbar">
            {/* Start Overlay - positioned only over the messages area */}
            {showStartOverlay && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-30 bg-black/30 backdrop-blur-sm flex items-center justify-center overflow-y-auto p-4"
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, type: "spring", damping: 25, stiffness: 200 }}
                  className="bg-white/95 dark:bg-dark-200/95 rounded-3xl shadow-2xl border border-primary-100/30 dark:border-primary-200/40 w-full flex m-2 p-2 justify-center items-center"
                >
                  
                  <button
                    onClick={handleStartChat}
                    className={`bg-gradient-to-r from-primary-200 to-primary-300 hover:from-primary-300 hover:to-primary-200 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-semibold text-sm sm:text-base md:text-lg shadow-lg transition-all duration-300 hover:shadow-xl dark:from-primary-200 dark:to-blue-600 dark:hover:from-blue-600 dark:hover:to-primary-200 flex-shrink-0 w-full break-words z-40`}
                  >
                    Start Conversation
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
              <div className="flex justify-center animate-fade-in">
                <div className="bg-accent-yellow/20 border border-primary-100/30 rounded-lg px-4 py-3 max-w-md dark:bg-white dark:text-accent-yellow dark:border-blue-700/40">
                  <p className="text-red-700 font-semibold text-sm text-center">
                    {error}
                  </p>
                </div>
              </div>
            )}
            <div ref={endOfMessagesRef} />
          </div>
          <div className="border-t border-primary-100/30 dark:border-blue-800/40 p-3 sm:p-4 lg:p-6 bg-white/95 dark:bg-dark-200/90 shadow-xl rounded-2xl mx-2 sm:mx-4 mb-2">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap lg:flex-nowrap">
              <VoiceButton
                onResult={handleVoiceInput}
                size="lg"
                className="!w-10 !h-10 sm:!w-12 sm:!h-12 rounded-full bg-primary-200 dark:bg-primary-200/80 shadow-md flex items-center justify-center dark:hover:bg-blue-700 [&>svg]:scale-75 sm:[&>svg]:scale-100"
                disabled={isLoading || inputDisabled || showStartOverlay}
              />
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                className="flex-1 min-w-0 px-4 py-3 sm:px-5 sm:py-4 rounded-xl border-2 border-primary-100/30 dark:border-blue-800/40 bg-primary-50/80 dark:bg-dark-100/80 text-primary-300 dark:text-white placeholder:text-primary-200 dark:placeholder:text-blue-200/60 text-sm sm:text-base shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Type your message..."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={isLoading || inputDisabled || showStartOverlay}
              />
              {isSpeaking && !showStartOverlay ? (
                <button
                  onClick={() => {
                    stop();
                    setInputDisabled(false); // Re-enable inputs when user stops speech
                  }}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-red-500 hover:bg-red-600 dark:bg-red-500 dark:hover:bg-red-600 text-white dark:text-white border border-red-400 dark:border-red-400 shadow-md flex items-center justify-center transition-all duration-200 hover:scale-105"
                  aria-label="Stop AI Voice"
                  type="button"
                >
                  <Pause size={20} />
                </button>
              ) : (
                <button
                  onClick={() => handleSendMessage()}
                  disabled={isLoading || inputDisabled || showStartOverlay}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-primary-200 hover:bg-primary-300 dark:bg-primary-200 dark:hover:bg-blue-700 text-white dark:text-white border border-primary-100/30 dark:border-blue-700/40 shadow-md flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
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
      {/* Bottom Navigation Bar */}
      <BottomNavigation />
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
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 163, 175, 0.7);
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(75, 85, 99, 0.5);
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(75, 85, 99, 0.7);
        }
      `}</style>
    </div>
  );
}
